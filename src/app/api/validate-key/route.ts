import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ valid: true, message: 'API key is valid' });
}
