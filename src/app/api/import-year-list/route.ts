import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'eBird username is required' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();

    // Try multiple eBird endpoints to get the year list
    const urls = [
      `https://ebird.org/lifelist/${encodeURIComponent(username)}?time=year&year=${currentYear}&r=world`,
      `https://ebird.org/lifelist/${encodeURIComponent(username)}?time=year&year=${currentYear}`,
      `https://ebird.org/profile/${encodeURIComponent(username)}/year?yr=${currentYear}&r=world`,
      `https://ebird.org/profile/${encodeURIComponent(username)}`,
    ];

    let html = '';
    let successUrl = '';

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        if (response.ok) {
          html = await response.text();
          successUrl = url;
          break;
        }
      } catch (e) {
        console.error(`Failed to fetch ${url}:`, e);
        continue;
      }
    }

    if (!html) {
      return NextResponse.json(
        { error: `Could not access eBird profile for "${username}". Go to ebird.org → My eBird → Profile and check your URL username (not your display name).` },
        { status: 404 }
      );
    }

    // Check if we got a valid page
    if (html.includes('Page Not Found') || (html.includes('404') && html.length < 5000)) {
      return NextResponse.json(
        { error: `eBird username "${username}" not found. Check your profile URL at ebird.org/profile/${username} — the username in that URL is what you need.` },
        { status: 404 }
      );
    }

    // Extract species from the HTML
    const seenSpecies = new Set<string>();
    const species: string[] = [];

    function addSpecies(name: string) {
      const key = name.toLowerCase().trim();
      if (
        key.length > 2 &&
        name.length < 80 &&
        !seenSpecies.has(key)
      ) {
        seenSpecies.add(key);
        species.push(name.trim());
      }
    }

    // Strategy 1: Parse __NEXT_DATA__ embedded JSON (most reliable for Next.js apps like eBird)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        // Recursively walk the JSON tree finding all "comName" values
        function extractComNames(obj: unknown): void {
          if (obj === null || typeof obj !== 'object') return;
          if (Array.isArray(obj)) {
            for (const item of obj) extractComNames(item);
          } else {
            const record = obj as Record<string, unknown>;
            for (const [key, val] of Object.entries(record)) {
              if (key === 'comName' && typeof val === 'string' && val.length > 2) {
                addSpecies(val);
              } else {
                extractComNames(val);
              }
            }
          }
        }
        extractComNames(nextData);
      } catch {
        // JSON parse failed, continue to other strategies
      }
    }

    // Strategy 2: Any JSON blob in script tags with "comName" fields
    if (species.length === 0) {
      const comNamePattern = /"comName"\s*:\s*"([^"\\]+)"/g;
      let match;
      while ((match = comNamePattern.exec(html)) !== null) {
        addSpecies(match[1]);
      }
    }

    // Strategy 3: Species links <a href="/species/CODE">Common Name</a>
    if (species.length === 0) {
      const speciesLinkPattern = /href="\/species\/[^"]+"\s*[^>]*>([^<]{3,60})<\/a>/gi;
      let match;
      while ((match = speciesLinkPattern.exec(html)) !== null) {
        const name = match[1].trim();
        if (name.match(/^[A-Z]/) && !name.match(/^(View|Map|Media|Details|More|Less|\d)/i)) {
          addSpecies(name);
        }
      }
    }

    // Sort alphabetically
    species.sort((a, b) => a.localeCompare(b));

    console.log(`Found ${species.length} species for ${username} in ${currentYear} from ${successUrl}`);

    if (species.length === 0) {
      return NextResponse.json(
        {
          error: 'eBird username import is unavailable — eBird\'s page structure has changed. Please use the CSV Upload tab instead.',
          hint: 'Go to ebird.org/downloadMyData to download your data, then upload the CSV file.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      username,
      year: currentYear,
      species,
      count: species.length,
      source: successUrl,
    });

  } catch (error) {
    console.error('Error importing year list:', error);

    return NextResponse.json(
      { error: 'Failed to import year list. Please try again or use manual entry.' },
      { status: 500 }
    );
  }
}
