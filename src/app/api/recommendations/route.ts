import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';
import { calculateHotspotScore, rankHotspots, getRecommendationStats } from '@/lib/scoring';
import { filterByDistance } from '@/lib/scoring';
import { RecommendationsResponse, HotspotRecommendation } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      lat,
      lng,
      maxDistance = 50,
      daysBack = 14,
      userSpecies = [],
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    const client = createEBirdClient(apiKey);
    const userSpeciesSet = new Set<string>(userSpecies);

    // Step 1: Get nearby hotspots (eBird API max is 50km)
    const searchRadius = Math.min(maxDistance, 50);
    const hotspots = await client.getNearbyHotspots(latitude, longitude, searchRadius);

    if (hotspots.length === 0) {
      return NextResponse.json({
        recommendations: [],
        totalHotspotsAnalyzed: 0,
        generatedAt: new Date().toISOString(),
        message: 'No hotspots found in this area',
      });
    }

    // Step 2: For each hotspot, get recent observations and calculate scores
    // Note: We batch requests to avoid hitting rate limits
    const recommendations: HotspotRecommendation[] = [];
    const batchSize = 5; // Process 5 hotspots at a time

    for (let i = 0; i < hotspots.length; i += batchSize) {
      const batch = hotspots.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (hotspot) => {
          try {
            const observations = await client.getHotspotObservations(
              hotspot.locId,
              Math.min(daysBack, 30)
            );

            return calculateHotspotScore(
              hotspot,
              observations,
              userSpeciesSet,
              latitude,
              longitude
            );
          } catch (error) {
            console.error(`Error fetching observations for ${hotspot.locId}:`, error);
            // Return null for failed requests, we'll filter them out
            return null;
          }
        })
      );

      // Filter out failed requests and add to recommendations
      for (const result of batchResults) {
        if (result !== null) {
          recommendations.push(result);
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < hotspots.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Step 3: Filter by distance and rank
    const filteredRecommendations = filterByDistance(recommendations, maxDistance);
    const rankedRecommendations = rankHotspots(filteredRecommendations, 1);

    // Step 4: Get stats
    const stats = getRecommendationStats(rankedRecommendations);

    const response: RecommendationsResponse & { stats: typeof stats } = {
      recommendations: rankedRecommendations,
      totalHotspotsAnalyzed: hotspots.length,
      generatedAt: new Date().toISOString(),
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating recommendations:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Invalid eBird API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
