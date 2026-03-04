# Market Research: Competitive Landscape for Big Year Birding App

*Research conducted: March 2026*

---

## Summary Finding

**No existing app combines proactive trip optimization, real-time rare bird alerts, species search, and month-by-month Big Year planning in a single product.** The market is fragmented — the best apps each solve one piece of the problem but leave significant gaps.

---

## Apps Analyzed

### 1. eBird (Cornell Lab of Ornithology) — Free

**What it does:** World's largest birding database with ~1 billion observations globally.

**Key features:**
- Life list, year list, month list, and regional list tracking
- Hundreds of thousands of mapped hotspots
- Rare Bird Alerts via email (county/state/country level)
- eBird Status & Trends: machine-learning abundance maps updated weekly
- Free API (used as the data backbone of this app)

**Big Year planning:** *Indirect.* Tracks your lists and sends needs alerts, but does not proactively suggest "chase this bird now" or plan optimized routes.

**Social features:** Minimal — you can view other birders' checklists but no friend feed, following, or leaderboards.

**Route optimization:** None. eBird shows where birds have been seen; it does not help sequence or optimize a trip.

**Gap it leaves:** Reactive, not proactive. Rich data, no optimization layer.

---

### 2. Merlin Bird ID (Cornell Lab) — Free

**What it does:** Best-in-class bird identification app.

**Key features:**
- Sound ID: real-time audio identification for 3,000+ species
- Photo ID: 98% accuracy
- Life list integration with eBird (blue checkmarks)

**Big Year planning:** None.
**Social features:** None.
**Route optimization:** None.

**Gap it leaves:** Pure ID tool. No planning, no optimization, no alerts.

---

### 3. Birda — Freemium ("Strava for birding")

**What it does:** The most socially-developed birding app currently on the market.

**Key features:**
- Log sightings, sync from eBird
- AI Photo ID and Text ID
- Community ID help
- Social feed: see what others are finding globally and locally
- Badges, well-being charts, life list automation
- **Big Year challenges with leaderboards:** ABA Area Big Year, Global Big Year, European Big Year, India Big Year — each with its own competitive leaderboard

**Big Year planning:** Birda runs Big Year *challenges* but does not actively help you plan where to go to increase your year count. It tracks and competes; it does not optimize.

**Social features:** Strong — best in market.

**Route optimization:** None.

**Gap it leaves:** All social, no optimization. You know your rank but not how to improve it.

---

### 4. Big Year Birding ABA App — Paid

**What it does:** Dedicated app for ABA-area Big Year sighting tracking.

**Key features:**
- Every ABA-recognized North American species in the database
- GPS-tagged sightings with photos on map
- eBird nearby sightings view + turn-by-turn directions to a single recent sighting
- Works offline
- Apple Watch integration, eBird export

**Big Year planning:** The one-tap directions to a recent sighting is the closest to optimization, but it's point-to-point only — no multi-stop routing, no seasonal planning.

**Social features:** Share via text/email/Facebook. No in-app social community.

**Route optimization:** None beyond single-point directions.

**Gap it leaves:** Good tracking, no optimization engine, no community.

---

### 5. Traveling Birder v8.0 — Web-based, Free

**What it does:** Route-based birding trip planner built on eBird data.

**Key features:**
- Enter origin + destination; see target species along your entire driving route
- Filter by life list, year list, or regional lists (shows only birds you still need)
- Hotspot ranking by recent species counts
- Send directions to hotspots; near real-time eBird data

**Big Year planning:** Most directly useful planning tool currently available for a trip — explicitly surfaces which species you still need along a route. However:
- Web tool only (no mobile app)
- No migration-timing optimization ("is now the right time to go?")
- No multi-stop itinerary builder
- No annual/monthly planning view

**Social features:** None.
**Route optimization:** Partial — targets along a route, but no optimal multi-stop sequence.

**Gap it leaves:** Great for planning a specific trip route. Zero help for planning an entire year.

---

### 6. BirdPlan.app — Web-based

**What it does:** Collaborative birding trip notepad.

**Key features:**
- Save hotspots, add custom markers, find target species, view recent reports
- Auto-imports target species from eBird
- Multi-editor collaborative trips

**Big Year planning:** Good for pre-trip notes; no real-time optimization or alerts.
**Route optimization:** None.

---

### 7. BirdsEye Bird Finding Guide — Freemium

**What it does:** Species-finding app synced with eBird lists.

**Key features:**
- Syncs life list and year list from eBird
- Shows species you still need that have been reported near you
- **"Needs Alert" push notifications** when a needed species appears nearby
- Hotspot maps with recent species counts

**Big Year planning:** The "Needs Alert" is highly relevant — it's essentially a proximity trigger for your missing species. Closest thing to proactive optimization currently available.

**Social features:** None.
**Route optimization:** None — it shows where a species was seen, but not how to efficiently visit multiple sites.

---

### 8. BirdNET — Free

**What it does:** Audio identification only. No listing, social, or planning.

---

### 9. BirdWeather + PUC Hardware — Hardware + App

**What it does:** Passive 24/7 birding monitoring station for home/yard. No Big Year features.

---

## Rare Bird Alert Infrastructure

| Service | Format | Coverage |
|---|---|---|
| eBird Rare Bird Alerts | Email subscription | US/Canada/global |
| ABA NARBA | Email to ABA members | ABA area (US/Canada) |
| State/Regional listservs | Email listservs | State/regional |
| eBird API `/notable` endpoint | Programmatic JSON | Global (what this app uses) |

---

## The Competitive Gap: What Does Not Exist

After analyzing the full landscape, **the market gap is clear and significant**:

| Capability | eBird | Birda | Big Year ABA | BirdsEye | Traveling Birder | **Big Year App** |
|---|---|---|---|---|---|---|
| Species list tracking | ✅ | ✅ | ✅ | Via eBird | Via eBird | ✅ |
| Hotspot optimization (multi-site ranking) | ❌ | ❌ | ❌ | ❌ | Partial | ✅ |
| Rare bird alerts (real-time) | Email only | ❌ | ❌ | Push (needs) | ❌ | ✅ |
| Species search → nearest location | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Annual month-by-month planning | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Business trip mode | ❌ | ❌ | ❌ | ❌ | Partial | ✅ |
| Social community | Minimal | ✅ | Minimal | ❌ | ❌ | Planned (v2) |
| Migration-aware seasonal planning | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Specific gaps this app fills:

1. **Proactive optimization** — "Given your current year list, here are the 5 most efficient moves this week." No existing app reasons across your list gaps, migration timing, hotspot proximity, and travel cost simultaneously.

2. **Bird Search** — No app answers "where can I find a Painted Bunting near me right now?" with a map of recent sightings. You have to manually check eBird with multiple clicks.

3. **Month-by-month annual planning** — No app generates a 12-month roadmap to a species target, considering your home location, travel availability, and seasonal migration patterns.

4. **Business trip mode** — No app says "you have a 3-day work trip to Chicago next week — here are the top hotspots to hit with your spare time."

5. **Integrated rare alert + route response** — BirdsEye alerts you to a rarity. But no app then computes "here's how to get there, what else you could pick up on the way, and whether it's worth the drive given your current list position."

---

## Sources

- [eBird API 2.0 Documentation](https://documenter.getpostman.com/view/664302/S1ENwy59)
- [Birda - Birdwatching Challenges](https://birda.org/features/challenges/)
- [Big Year Birding App](https://www.bigyearbirding.com/big-year-birding-app/)
- [Traveling Birder v8.0](https://www.travelingbirder.com/)
- [BirdPlan.app](https://birdplan.app/)
- [BirdsEye Bird Finding Guide](https://apps.apple.com/us/app/birdseye-bird-finding-guide/id324168850)
- [ABA NARBA](https://aba.org/narba/)
- [eBird Status and Trends](https://science.ebird.org/en/status-and-trends)
- [Cornell Lab: Birding with Technology 2025](https://www.allaboutbirds.org/news/birding-with-technology-in-the-year-2025-our-predictions/)
- [Rare bird alert - Wikipedia](https://en.wikipedia.org/wiki/Rare_bird_alert)
