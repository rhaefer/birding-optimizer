import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';
import { MySpeciesResponse } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const daysBack = searchParams.get('daysBack') || '365';

  const apiKey = process.env.EBIRD_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    const client = createEBirdClient(apiKey);

    // Get recent observations near the user's location
    // We use a large radius to get a good sample of what the user might have seen
    // Note: This is a simplified approach - ideally we'd use the user's actual checklists
    const observations = await client.getRecentNearbyObservations(
      parseFloat(lat),
      parseFloat(lng),
      50, // 50km radius
      Math.min(parseInt(daysBack), 30) // eBird API limits to 30 days
    );

    // Extract unique species
    const speciesMap = new Map<string, { comName: string; sciName: string }>();

    for (const obs of observations) {
      if (!speciesMap.has(obs.speciesCode)) {
        speciesMap.set(obs.speciesCode, {
          comName: obs.comName,
          sciName: obs.sciName,
        });
      }
    }

    const currentYear = new Date().getFullYear();

    const response: MySpeciesResponse = {
      year: currentYear,
      speciesCount: speciesMap.size,
      species: Array.from(speciesMap.entries()).map(([speciesCode, details]) => ({
        speciesCode,
        ...details,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching species:', error);

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
      { error: 'Failed to fetch species data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST endpoint for submitting user's species list manually
  try {
    const body = await request.json();
    const { species } = body;

    if (!Array.isArray(species)) {
      return NextResponse.json(
        { error: 'Species must be an array' },
        { status: 400 }
      );
    }

    // Validate and return the species list
    const currentYear = new Date().getFullYear();

    return NextResponse.json({
      year: currentYear,
      speciesCount: species.length,
      species: species.map((s: string) => ({
        speciesCode: s,
        comName: s, // User would need to provide names separately
        sciName: '',
      })),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
