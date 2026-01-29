import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';
import { HotspotsResponse } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('apiKey');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const dist = searchParams.get('dist') || '25';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 400 }
    );
  }

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const distance = Math.min(parseFloat(dist), 50); // eBird API max is 50km

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid latitude or longitude' },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: 'Latitude must be between -90 and 90, longitude between -180 and 180' },
      { status: 400 }
    );
  }

  try {
    const client = createEBirdClient(apiKey);
    const hotspots = await client.getNearbyHotspots(latitude, longitude, distance);

    const response: HotspotsResponse = {
      hotspots,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching hotspots:', error);

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
      { error: 'Failed to fetch hotspots' },
      { status: 500 }
    );
  }
}
