import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';
import { calculateDistance } from '@/lib/distance';
import { BirdSearchObservation, SpeciesSearchResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, lat, lng, dist = 50, daysBack = 30 } = body;

    const apiKey = process.env.EBIRD_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    if (!query?.trim()) return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    const client = createEBirdClient(apiKey);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Search taxonomy for matching species
    const matches = await client.searchTaxonomy(query.trim(), 8);

    if (matches.length === 0) {
      return NextResponse.json({
        matches: [],
        observations: [],
        message: `No species found matching "${query}". Try a different name.`,
      });
    }

    // Fetch nearby observations for the top match
    const topMatch = matches[0];
    const rawObs = await client.getSpeciesNearbyObservations(
      topMatch.speciesCode,
      latitude,
      longitude,
      Math.min(dist, 50),
      Math.min(daysBack, 30)
    );

    // Deduplicate by location, add distance, sort by distance
    const locMap = new Map<string, BirdSearchObservation>();
    for (const obs of rawObs) {
      const existing = locMap.get(obs.locId);
      if (!existing || new Date(obs.obsDt) > new Date(existing.obsDt)) {
        locMap.set(obs.locId, {
          speciesCode: obs.speciesCode,
          comName: obs.comName,
          sciName: obs.sciName,
          locId: obs.locId,
          locName: obs.locName,
          obsDt: obs.obsDt,
          howMany: obs.howMany,
          lat: obs.lat,
          lng: obs.lng,
          subId: obs.subId,
          distance: calculateDistance(latitude, longitude, obs.lat, obs.lng),
        });
      }
    }

    const observations = Array.from(locMap.values())
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    const speciesResults: SpeciesSearchResult[] = matches.map((m) => ({
      speciesCode: m.speciesCode,
      comName: m.comName,
      sciName: m.sciName,
      order: m.order,
      familyComName: m.familyComName,
      category: m.category,
    }));

    return NextResponse.json({
      matches: speciesResults,
      observations,
      selectedSpecies: speciesResults[0],
      searchedSpeciesCode: topMatch.speciesCode,
      totalLocations: observations.length,
    });
  } catch (error) {
    console.error('Bird search error:', error);
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json({ error: 'Invalid eBird API key' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to search for bird' }, { status: 500 });
  }
}
