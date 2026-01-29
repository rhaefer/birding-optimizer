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
    // The lifelist page with year filter is most reliable
    const urls = [
      `https://ebird.org/lifelist/${encodeURIComponent(username)}?time=year&year=${currentYear}&r=world`,
      `https://ebird.org/profile/${encodeURIComponent(username)}/year?yr=${currentYear}&r=world`,
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
        { error: 'Could not access eBird profile. Check your username.' },
        { status: 404 }
      );
    }

    // Debug: Check if we got a valid page
    if (html.includes('Page Not Found') || html.includes('404')) {
      return NextResponse.json(
        { error: 'User not found. Check your eBird username.' },
        { status: 404 }
      );
    }

    // Extract species from the HTML
    // eBird uses a specific structure for species lists
    const species: string[] = [];
    const seenSpecies = new Set<string>();

    // Pattern 1: Species in the Observation list with data attributes
    // <a href="/species/amerob" ... >American Robin</a>
    const speciesLinkPattern = /href="\/species\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = speciesLinkPattern.exec(html)) !== null) {
      const name = match[2].trim();
      if (name && !seenSpecies.has(name.toLowerCase())) {
        // Filter out non-species text
        if (
          name.length > 2 &&
          name.length < 60 &&
          !name.match(/^(View|Map|Media|Details|Species|More|Less|\d)/i) &&
          name.match(/^[A-Z]/)
        ) {
          seenSpecies.add(name.toLowerCase());
          species.push(name);
        }
      }
    }

    // Pattern 2: Species names in specific list containers
    // Look for the Observation-species or ResultsStats sections
    const listSectionPattern = /class="[^"]*(?:Observation|Species|Result)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|li)>/gi;
    while ((match = listSectionPattern.exec(html)) !== null) {
      const section = match[0];
      // Extract species names from within this section
      const namePattern = />([A-Z][a-z]+(?:[-'\s][A-Za-z]+){0,4})</g;
      let nameMatch;
      while ((nameMatch = namePattern.exec(section)) !== null) {
        const name = nameMatch[1].trim();
        if (
          name.length > 3 &&
          name.length < 50 &&
          !seenSpecies.has(name.toLowerCase()) &&
          !name.match(/^(View|Map|Media|Details|Species|More|Less|Show|Hide|All|Filter|Sort|Date|Location|Count|Check|Obs)/i)
        ) {
          // Verify it looks like a species name (typically 2+ words for birds)
          const words = name.split(/\s+/);
          if (words.length >= 1 && words.length <= 5) {
            seenSpecies.add(name.toLowerCase());
            species.push(name);
          }
        }
      }
    }

    // Pattern 3: Look for the specific eBird life list format
    // The page often has species in a table or list with specific class names
    const rowPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?href="\/species\/[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?<\/tr>/gi;
    while ((match = rowPattern.exec(html)) !== null) {
      const name = match[1].trim();
      if (name && !seenSpecies.has(name.toLowerCase()) && name.length > 2) {
        seenSpecies.add(name.toLowerCase());
        species.push(name);
      }
    }

    // Pattern 4: JSON data embedded in the page (eBird sometimes includes this)
    const jsonPattern = /\{"speciesCode":"([^"]+)","comName":"([^"]+)"/g;
    while ((match = jsonPattern.exec(html)) !== null) {
      const name = match[2].trim();
      if (name && !seenSpecies.has(name.toLowerCase())) {
        seenSpecies.add(name.toLowerCase());
        species.push(name);
      }
    }

    // Pattern 5: React/Next.js data props (eBird uses React)
    const propsPattern = /"comName"\s*:\s*"([^"]+)"/g;
    while ((match = propsPattern.exec(html)) !== null) {
      const name = match[1].trim();
      if (name && !seenSpecies.has(name.toLowerCase()) && name.length > 2) {
        seenSpecies.add(name.toLowerCase());
        species.push(name);
      }
    }

    // Sort alphabetically
    species.sort((a, b) => a.localeCompare(b));

    console.log(`Found ${species.length} species for ${username} in ${currentYear} from ${successUrl}`);

    if (species.length === 0) {
      // Return helpful debug info
      const hasSpeciesLinks = html.includes('/species/');
      const hasLifeList = html.includes('Life List') || html.includes('Year List');

      return NextResponse.json(
        {
          error: 'Could not parse species from your eBird profile.',
          hint: hasSpeciesLinks
            ? 'Found species links but could not extract names. Your profile may use a different format.'
            : hasLifeList
              ? 'Found list page but no species. You may not have any observations for ' + currentYear + '.'
              : 'Could not find species data. Make sure your profile is public.',
          debug: {
            url: successUrl,
            hasSpeciesLinks,
            hasLifeList,
            htmlLength: html.length,
          }
        },
        { status: 404 }
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
