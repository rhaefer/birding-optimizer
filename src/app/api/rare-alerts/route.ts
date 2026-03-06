import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';
import { calculateDistance } from '@/lib/distance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, dist = 50, daysBack = 14, userSpecies = [] } = body;

    const apiKey = process.env.EBIRD_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    const client = createEBirdClient(apiKey);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const alerts = await client.getNotableNearbyObservations(
      latitude,
      longitude,
      Math.min(dist, 50),
      Math.min(daysBack, 30)
    );

    const userSpeciesSet = new Set<string>(userSpecies);

    // Deduplicate by species + location combo, add distance, mark new species
    const seen = new Set<string>();
    const processed = alerts
      .filter((a) => {
        const key = `${a.speciesCode}-${a.locId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((a) => ({
        ...a,
        distance: calculateDistance(latitude, longitude, a.lat, a.lng),
        isNew: !userSpeciesSet.has(a.speciesCode) && !userSpeciesSet.has(a.comName),
      }))
      .sort((a, b) => new Date(b.obsDt).getTime() - new Date(a.obsDt).getTime());

    return NextResponse.json({
      alerts: processed,
      total: processed.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rare alerts error:', error);
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json({ error: 'Invalid eBird API key' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch rare bird alerts' }, { status: 500 });
  }
}
