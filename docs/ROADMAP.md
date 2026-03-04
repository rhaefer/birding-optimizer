# Product Roadmap

## Version 1 — Current (March 2026)

**Theme: Core Tools for the Serious Big Year Birder**

### Delivered
- [x] Hotspot Optimizer — ranked hotspots by potential new species
- [x] Bird Search — find any species near any location
- [x] Rare Bird Alerts — real-time notable sightings from eBird
- [x] Big Year Planner — month-by-month plan to hit a species target
- [x] Business Trip Mode — optimize birding around travel
- [x] Dashboard — stats overview with pace tracking
- [x] App-wide navigation with year progress indicator
- [x] Shared state across pages (API key, location, species list)
- [x] eBird CSV import for year list
- [x] Interactive maps for all features

---

## Version 2 — Next (Q3 2026)

**Theme: Social + Accounts + Monetization**

### User Accounts
- [ ] Google OAuth login
- [ ] Email/password login
- [ ] User profiles with Big Year stats
- [ ] eBird account linking (sync year list automatically)

### Social Features ("Strava for Birding")
- [ ] Follow / be followed by other birders
- [ ] Activity feed — see friends' recent sightings
- [ ] Regional leaderboards for Big Year participants
- [ ] Share a sighting (species + photo + location + note)
- [ ] "Find birding partners near me" — connect with local birders
- [ ] Community ID help — post unknown bird for ID from community

### Notifications
- [ ] Push notifications for rare bird alerts matching your needs list
- [ ] Daily "Today's top hotspot" digest email
- [ ] Weekly progress report vs. your Big Year plan

### Enhanced Optimizer
- [ ] Multi-stop route optimization — plan a full day trip with optimal stop sequence
- [ ] Migration timing — show eBird Status & Trends peak weeks per species
- [ ] "Is it worth chasing?" — distance vs. list-value rarity calculator
- [ ] Trip report integration — post trip notes + photos

### Monetization Infrastructure
- [ ] Free tier with display ads (birding optics / nature brands)
- [ ] Premium tier ($6/month): ad-free, advanced analytics, multi-year tracking
- [ ] Affiliate optics store links (Swarovski, Zeiss, Vortex, Kowa, Nikon)
- [ ] Sponsored trips / birding tour operator partnerships
- [ ] ABA Big Year event integration (formal tracking + badges)

### Data / Infrastructure
- [ ] PostgreSQL database for user data and social content
- [ ] Redis caching for eBird API responses (reduces latency + respects rate limits)
- [ ] Vercel deployment with custom domain

---

## Version 3 — Future (2027)

**Theme: Mobile-First + AI Optimization**

### Mobile App
- [ ] React Native iOS + Android app
- [ ] Background rare alert notifications
- [ ] Offline hotspot data (download for a region)
- [ ] eBird checklist submission built-in
- [ ] Real-time GPS tracking during birding sessions
- [ ] Audio ID integration (connect to BirdNET or Merlin)

### AI / Smart Features
- [ ] AI trip planner — describe your constraints in plain English ("I have a free Saturday in May and want to see shorebirds") and get a full plan
- [ ] Species rarity triage — given a rarity alert, estimate probability it stays, best time window to chase, and what else you'd see on the drive
- [ ] Personal analytics — compare your pace to top birders in your region and identify your "missing" habitat types
- [ ] Seasonal timing recommendations — "based on eBird Status & Trends, the best week to visit Point Reyes for your needs is Oct 8–14"

### Expansion
- [ ] International coverage (currently North America focused)
- [ ] Country-specific Big Year challenges (UK, Australia, South Africa, India)
- [ ] Global Big Year tracking (ABA-style but worldwide)
- [ ] Partnership with ABA for official Big Year integration

---

## Business Model

### Revenue Streams

| Stream | Tier | Estimated Margin |
|---|---|---|
| Display advertising | Free users | Low (~$3 CPM) |
| Premium subscription | $6/month | High (85%+ margin) |
| Optics affiliate links | All users | Medium (5–8% commission) |
| Birding tour sponsorships | Featured placement | High |
| Corporate birding programs | Enterprise | Very high |

### Target Users

**Primary:** North American birders pursuing a Big Year (ABA area or state level). Estimated ~10,000–50,000 people annually attempt meaningful Big Year counts.

**Secondary:** Casual listers who want to improve their county/state lists with optimized local trips.

**Tertiary:** International birders — largest potential market, requires localization.

### Competitive Advantages
1. **Only app with proactive optimization** — no competitor tells you where to go next
2. **eBird data** — same data source as the dominant platform, so no adoption friction
3. **Business trip mode** — unique feature that competitors haven't considered
4. **Annual planning** — no competitor has a month-by-month Big Year plan generator
5. **First mover** — the gap in the market has been clearly validated by research

---

## Technical Debt & Known Limitations

### Current Limitations (v1)
- eBird API max radius is 50 km — can't search farther than ~31 miles in one call
- Taxonomy search fetches full ~10,000-species dataset on every query — needs caching
- No database — all state is lost when localStorage is cleared
- Planner uses hardcoded North American seasonal patterns — not accurate for Southern Hemisphere
- Social features are UI-only stubs (noted as "coming soon")
- Business Trip Mode requires manual lat/lng entry (no geocoding/address search)

### Planned Fixes
- [ ] Add geocoding (Nominatim free API or Mapbox) for address-to-coordinates
- [ ] Cache eBird taxonomy response in memory / Redis
- [ ] Add server-side Redis caching for hotspot data
- [ ] Build a regional data model for Southern Hemisphere seasonal patterns
