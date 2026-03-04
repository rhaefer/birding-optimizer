import { NextRequest, NextResponse } from 'next/server';
import { generateBigYearPlan } from '@/lib/planner';
import { PlannedTrip } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lat,
      lng,
      targetSpecies = 300,
      year = new Date().getFullYear(),
      travelIntensity = 'moderate',
      plannedTrips = [],
      currentSpeciesCount = 0,
    } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Location (lat/lng) is required' }, { status: 400 });
    }

    const validIntensities = ['none', 'light', 'moderate', 'aggressive'];
    if (!validIntensities.includes(travelIntensity)) {
      return NextResponse.json({ error: 'Invalid travel intensity' }, { status: 400 });
    }

    const plan = generateBigYearPlan({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      targetSpecies: Math.max(50, Math.min(1000, parseInt(targetSpecies))),
      year: parseInt(year),
      travelIntensity,
      plannedTrips: (plannedTrips as PlannedTrip[]).filter(
        (t) => t.month >= 1 && t.month <= 12
      ),
      currentSpeciesCount: Math.max(0, parseInt(currentSpeciesCount) || 0),
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Planner error:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
