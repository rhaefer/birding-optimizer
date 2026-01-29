import { NextRequest, NextResponse } from 'next/server';
import { createEBirdClient } from '@/lib/ebird';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    const client = createEBirdClient(apiKey);
    const isValid = await client.validateApiKey();

    return NextResponse.json({
      valid: isValid,
      message: isValid ? 'API key is valid' : 'Invalid API key',
    });
  } catch (error) {
    console.error('Error validating API key:', error);

    return NextResponse.json(
      { valid: false, error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}
