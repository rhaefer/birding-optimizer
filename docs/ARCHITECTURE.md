# Architecture

## Directory Structure

```
birding-optimizer/
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── layout.tsx              # Root layout: AppProvider + Navigation wrapper
│   │   ├── page.tsx                # Dashboard (home page with stats + feature cards)
│   │   ├── globals.css             # Global styles (Tailwind base)
│   │   ├── optimizer/
│   │   │   └── page.tsx            # Hotspot Optimizer (core feature)
│   │   ├── bird-search/
│   │   │   └── page.tsx            # Bird Search feature
│   │   ├── alerts/
│   │   │   └── page.tsx            # Rare Bird Alerts feature
│   │   ├── planner/
│   │   │   └── page.tsx            # Big Year Planner feature
│   │   └── api/
│   │       ├── recommendations/
│   │       │   └── route.ts        # POST: hotspot optimization algorithm
│   │       ├── bird-search/
│   │       │   └── route.ts        # POST: species taxonomy search + nearby observations
│   │       ├── rare-alerts/
│   │       │   └── route.ts        # POST: notable/rare eBird observations
│   │       ├── planner/
│   │       │   └── route.ts        # POST: generate Big Year plan (no eBird call)
│   │       ├── hotspots/
│   │       │   └── route.ts        # POST: raw nearby hotspot list
│   │       ├── validate-key/
│   │       │   └── route.ts        # POST: validate eBird API key
│   │       ├── my-species/
│   │       │   └── route.ts        # POST: get user's eBird year list
│   │       └── import-year-list/
│   │           └── route.ts        # POST: scrape eBird profile for year list
│   ├── components/
│   │   ├── AppProvider.tsx         # React Context: shared state + localStorage persistence
│   │   ├── Navigation.tsx          # Top navigation bar with species progress indicator
│   │   ├── ApiKeyInput.tsx         # eBird API key entry + validation widget
│   │   ├── FilterPanel.tsx         # Optimizer: location + distance + days sliders
│   │   ├── HotspotCard.tsx         # Optimizer: individual hotspot result card
│   │   ├── Map.tsx                 # Optimizer: Leaflet map with hotspot markers
│   │   ├── BirdSearchMap.tsx       # Bird Search: Leaflet map with observation markers
│   │   ├── AlertsMap.tsx           # Rare Alerts: Leaflet map with rarity markers
│   │   ├── SpeciesList.tsx         # Shared: species list display
│   │   └── UserSpeciesInput.tsx    # Shared: year list input (CSV, paste, eBird import)
│   ├── lib/
│   │   ├── ebird.ts                # EBirdClient class: all eBird API methods
│   │   ├── scoring.ts              # Hotspot scoring algorithm
│   │   ├── distance.ts             # Haversine distance, unit conversions
│   │   └── planner.ts              # Big Year plan generation algorithm
│   └── types/
│       └── index.ts                # All TypeScript interfaces and types
├── docs/
│   ├── RESEARCH.md                 # Competitive landscape research
│   ├── TECH_STACK.md               # Technology choices and rationale
│   ├── ARCHITECTURE.md             # This file
│   ├── FEATURES.md                 # Feature documentation
│   └── ROADMAP.md                  # Future roadmap
├── example_big_year_plan.txt       # Sample Big Year plan for reference
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Key Architectural Patterns

### 1. Shared State via AppProvider

`AppProvider.tsx` is a React Context provider that persists state to localStorage. It wraps the entire app in `layout.tsx`.

**State managed:**
- `apiKey` — eBird API key (localStorage key: `ebird-api-key`)
- `userLocation` — Home lat/lng (localStorage key: `big-year-location`)
- `userSpecies` — Year list species names (localStorage key: `big-year-species`)
- `bigYearGoal` — Target species count (localStorage key: `big-year-goal`)
- `bigYearYear` — Year being tracked (localStorage key: `big-year-year`)

**Why this matters:** Pages don't need to independently manage or request the API key or species list. They read from context, and changes propagate automatically.

### 2. Server-Side API Proxying

All eBird API calls happen in Next.js API routes (`src/app/api/`), never directly from the browser. This means:
- The eBird API key is never exposed in client-side JavaScript bundles
- Rate limiting and error handling are centralized on the server
- CORS issues are avoided (eBird API allows server-to-server calls)

### 3. EBirdClient Class

`src/lib/ebird.ts` exports a single `EBirdClient` class that encapsulates all eBird API interactions. All API routes instantiate this class with the user-provided key.

**Methods:**
- `getNearbyHotspots(lat, lng, dist)` — Hotspot list
- `getHotspotObservations(locId, back)` — Observations at a hotspot
- `getNotableNearbyObservations(lat, lng, dist, back)` — Rare bird alerts
- `getSpeciesNearbyObservations(speciesCode, lat, lng, dist, back)` — Bird search
- `searchTaxonomy(query, maxResults)` — Species name search
- `validateApiKey()` — Key validation

### 4. Scoring Algorithm

`src/lib/scoring.ts` contains the hotspot scoring algorithm. Key inputs:
- Number of potential new species (primary factor)
- Recency of sightings (bonus for recent)
- Observation frequency (species seen often = more reliable)
- Distance penalty (farther = lower score)

This is a pure function — no side effects, easy to test and tune.

### 5. Planner Algorithm

`src/lib/planner.ts` generates Big Year plans without any API calls. It uses:
- Hardcoded `NORTH_AMERICA_MONTH_MODELS` — 12 objects with base species gain, travel boost, habitat types, and birding tips for each month
- User inputs: location, target, travel intensity, current count, planned trips
- A `scaleFactor` that adjusts monthly gains to hit the target realistically
- `detectRegion(lat, lng)` — Coarse region detection to surface region-specific site suggestions

---

## Data Flow Diagrams

### Hotspot Optimizer
```
User sets location + species list
    ↓
Click "Find Hotspots"
    ↓
POST /api/recommendations
    ↓
EBirdClient.getNearbyHotspots(lat, lng, dist)  [up to 50km]
    ↓
For each hotspot (batches of 5):
  EBirdClient.getHotspotObservations(locId, daysBack)
    ↓
calculateHotspotScore(hotspot, observations, userSpeciesSet)
    ↓
rankHotspots(recommendations)
    ↓
Return JSON → Render HotspotCard list + Map markers
```

### Bird Search
```
User types species name
    ↓
POST /api/bird-search {query, lat, lng}
    ↓
EBirdClient.searchTaxonomy(query) → matches[]
    ↓
EBirdClient.getSpeciesNearbyObservations(topMatch.speciesCode, lat, lng)
    ↓
Deduplicate by location, sort by distance
    ↓
Return JSON → BirdSearchMap markers + location cards
```

### Rare Alerts
```
User sets location, clicks Fetch
    ↓
POST /api/rare-alerts {lat, lng, dist, daysBack}
    ↓
EBirdClient.getNotableNearbyObservations()
    ↓
Deduplicate, add distance, flag "new for your list" vs. already seen
    ↓
Return JSON → AlertsMap markers + alert cards
```

### Big Year Planner
```
User fills form (location, target, travel intensity)
    ↓
POST /api/planner (no eBird call — pure algorithm)
    ↓
generateBigYearPlan() in lib/planner.ts
    ↓
12 MonthlyPlan objects with targets, habitats, destinations
    ↓
Return BigYearPlan → Month cards + bar chart
```
