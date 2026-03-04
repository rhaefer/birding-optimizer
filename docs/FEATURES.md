# Features Documentation

## Current Features (v1)

---

### 1. Dashboard

**Route:** `/`

The central hub of the app. After connecting an eBird API key, shows:

- **Big Year Stats Bar** — Species count vs. goal, days remaining, progress bar, and pace tracking (projected species/year at current rate, and species/day needed to hit goal)
- **Feature Cards** — Quick navigation to Optimizer, Bird Search, Rare Alerts, and Planner
- **Monthly Tips** — Contextual birding tips for the current month
- **Social Teaser** — Preview of upcoming community features (v2)
- **First-Run State** — If no API key exists, shows a landing page explaining the app and prompting API key setup

**State used:** `apiKey`, `userSpecies`, `bigYearGoal`, `bigYearYear`

---

### 2. Hotspot Optimizer

**Route:** `/optimizer`
**API:** `POST /api/recommendations`

Finds and ranks nearby birding hotspots by how many new species you could add to your year list.

**How it works:**
1. Fetches all eBird hotspots within the specified radius (up to 50 km)
2. For each hotspot, fetches recent observations (up to 30 days back)
3. Filters out species already on your year list
4. Scores each hotspot using a multi-factor algorithm:
   - **New species count** (primary factor, 10 pts each)
   - **Recency bonus** (more recent sightings score higher)
   - **Frequency bonus** (species seen often at this location score higher)
   - **Distance penalty** (farther hotspots score lower)
5. Ranks and returns hotspots sorted by score

**Settings:**
- Location: manual coordinates or GPS
- Max distance: 5–30 miles (or km)
- Days back: 1–30
- Minimum new species: 1–10

**Business Trip Mode:**
- Toggle switches search location from home to a travel destination
- Useful for birding around business travel

**Year list import:**
- Upload eBird `MyEBirdData.csv` export
- Paste species names manually
- File upload (.csv/.txt)

**Map:** Color-coded markers (green = high score, yellow = medium, gray = low)

---

### 3. Bird Search

**Route:** `/bird-search`
**API:** `POST /api/bird-search`

Search any bird species by common or scientific name and see where it's been reported near you.

**How it works:**
1. User types a species name (e.g. "Painted Bunting")
2. App searches eBird taxonomy for matches
3. Returns up to 8 alternate matches if multiple species match
4. Fetches all recent observations of the top-matching species within radius
5. Deduplicates by location, sorts by distance
6. Shows results on a map with numbered markers

**Features:**
- Fuzzy search: handles partial names, searches both common and scientific names
- "On your list" vs. "Not on list yet" badge
- Location cards show: hotspot name, date last seen, bird count, distance
- Click a location to expand with eBird hotspot link + Google Maps directions
- Map pans to selected location
- Adjustable radius (10–50 km) and days back (1–30)

---

### 4. Rare Bird Alerts

**Route:** `/alerts`
**API:** `POST /api/rare-alerts`

Real-time feed of notable and rare bird sightings flagged by eBird reviewers near your location.

**How it works:**
1. Calls eBird's `/data/obs/geo/recent/notable` endpoint
2. These are observations that eBird's algorithm + human reviewers have flagged as unusual for the location/time of year
3. Deduplicates by species + location
4. Flags which ones are "new for your list" (not in your year list) vs. already seen
5. Shows on a map with color-coded markers:
   - **Green** = new for your list
   - **Orange** = already seen / not new

**Features:**
- Filter to "New only" — show only species not yet on your year list
- Sort by date (most recent first)
- Card shows: species name, location, days ago, count, distance, whether it was officially reviewed
- Click to expand with checklist link, Google Maps directions, and eBird hotspot link
- Adjustable radius (10–50 km) and days back (1–30)

---

### 5. Big Year Planner

**Route:** `/planner`
**API:** `POST /api/planner`

Generates a personalized month-by-month Big Year plan based on your location, travel availability, and seasonal migration patterns.

**How it works:**
The planning algorithm (`src/lib/planner.ts`) uses:
- **12 hardcoded month models** — Each month has a base species gain, travel boost multiplier, primary habitats, key species types, destination types, and birding tips based on North American seasonal patterns
- **Travel intensity multiplier** — Scales monthly gains based on none/light/moderate/aggressive travel
- **Scale factor** — Adjusts all monthly gains proportionally to make the total projection realistic relative to the user's target
- **Region detection** — Uses lat/lng to identify broad region (CA, Pacific NW, Southwest, Midwest, Great Lakes, Northeast, Southeast, Mid-Atlantic) and suggests region-appropriate hotspots
- **Planned trips** — Pre-scheduled trips add a bonus to the relevant month

**Plan settings:**
- Home location (lat/lng)
- Year (2024–2030)
- Target species count (slider, 100–700)
- Current species count (starting point)
- Travel intensity: None / Light / Moderate / Aggressive
- Pre-planned trips: Add custom trips with month, destination, and duration

**Plan output:**
- **Feasibility summary** — Is your target achievable? If not, how far off is it?
- **Monthly bar chart** — Visual overview of projected gains by month
- **Month detail cards** (expandable):
  - Target gain and cumulative target
  - Key species types (e.g. Warblers, Shorebirds, Raptors)
  - Primary habitats
  - Recommended destinations
  - Region-specific hotspot suggestions
  - Local birding tips

**Monthly gain model (North America, moderate travel):**
| Month | Base Gain | With Travel |
|---|---|---|
| January | 50 | 74 |
| February | 15 | 22 |
| March | 20 | 30 |
| April | 25 | 37 |
| May | 35 | 48 |
| June | 20 | 30 |
| July | 15 | 22 |
| August | 18 | 27 |
| September | 20 | 30 |
| October | 15 | 22 |
| November | 10 | 15 |
| December | 8 | 12 |
| **Total** | **251** | **369** |

---

## Upcoming Features (v2)

### Social / Community
- User accounts (Google OAuth + email)
- Follow other birders
- Activity feed (see what friends are finding)
- Regional leaderboards for Big Year
- Share sightings with photos
- Find local birding partners

### Enhanced Optimization
- Multi-stop route optimization (TSP solver for day trips)
- Migration-timing integration (eBird Status & Trends peak weeks)
- "Should I chase this rarity?" calculator — distance vs. list value analysis
- Push notifications for rare alerts matching your needs list

### Monetization
- Free tier with display advertising (birding optics brands)
- Premium tier ($5–8/month): ad-free, multi-year tracking, advanced analytics, offline access
- Affiliate partnerships with optics brands (Swarovski, Zeiss, Vortex, Kowa)
- Partner sponsorships with birding tour operators

### Mobile App (v3)
- Native iOS + Android via React Native
- Offline hotspot data
- Background rare alert notifications
- GPS integration for automatic location
- eBird checklist submission from within the app
