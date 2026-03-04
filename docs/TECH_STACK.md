# Tech Stack

## Current Stack (v1)

### Frontend Framework
- **Next.js 14** (App Router) — React framework with server-side rendering, file-based routing, and API routes in one package
- **React 18** — UI component library
- **TypeScript 5** — Type safety throughout

### Styling
- **Tailwind CSS 3** — Utility-first CSS. All styling done inline via class names; no separate CSS files needed for components.

### Maps
- **Leaflet 1.9** + **react-leaflet 4** — Open-source interactive maps. Used for hotspot visualization, bird search results, and rare alert locations.
- **OpenStreetMap** tiles — Free map tiles (no API key required)

### External APIs
- **eBird API v2** (Cornell Lab of Ornithology) — Free with registration. Powers all bird data:
  - `GET /ref/hotspot/geo` — Nearby hotspots
  - `GET /data/obs/{locId}/recent` — Hotspot observations
  - `GET /data/obs/geo/recent/notable` — Rare bird alerts
  - `GET /data/obs/geo/recent/{speciesCode}` — Species-specific observations
  - `GET /ref/taxonomy/ebird` — Full species taxonomy for search
- **OpenStreetMap** — Map tiles (no key needed)
- **Google Maps** (links only) — Used for "Get Directions" links; no API key needed

### State Management
- **React Context + localStorage** — `AppProvider` (see [ARCHITECTURE.md](./ARCHITECTURE.md)) stores API key, user location, species list, and Big Year goal in browser localStorage, synced via Context across all pages.

### Hosting / Deployment Options
- **Vercel** — Native Next.js hosting, free tier, zero configuration
- **Netlify** — Alternative with Next.js support
- **Self-hosted** — Node.js server with `npm start`

### Development Tools
- **ESLint** — Code linting
- **npm** — Package manager

---

## Planned Stack Additions (v2)

### Backend / Database
- **PostgreSQL** + **Prisma ORM** — For user accounts, saved lists, social features, and plan storage
- **NextAuth.js** — Authentication (Google OAuth + email/password)
- **Redis** — Caching for eBird API responses (rate limit management)

### Social Features Infrastructure
- **Pusher** or **Ably** — Real-time notifications for rare bird alerts and friend activity
- **Cloudinary** — Photo storage and optimization for sighting photos

### Monetization Infrastructure
- **Stripe** — Premium subscription billing
- **Google AdSense** or **Carbon Ads** — For free tier advertising (bird-friendly nature advertisers)
- **Affiliate partnerships** — Links to Zeiss, Swarovski, Kowa, Vortex optics stores

### Mobile App (v3)
- **React Native** + **Expo** — Cross-platform iOS/Android app
- **Reuse** — Shared business logic from the web app (lib/ folder)

---

## Architecture Decisions

### Why Next.js App Router?
- Unified API routes and frontend in one project — no separate backend needed for v1
- Server-side API proxying keeps the eBird API key off the client (security)
- Easy deployment to Vercel

### Why Leaflet over Google Maps?
- No API key / billing required for map tiles
- OpenStreetMap is sufficient for birding hotspot visualization
- Leaflet is highly customizable for custom markers

### Why localStorage instead of a database?
- Zero infrastructure cost for v1
- No user accounts needed to get started
- eBird already stores the authoritative species list; we don't need to replicate it

### Why no external state management library?
- React Context + localStorage is sufficient for the current data shape
- Redux/Zustand would add complexity without benefit at this scale

### Why eBird API as the sole data source?
- eBird is the most comprehensive and authoritative birding database in the world
- Free API with generous rate limits
- Covers global observations, hotspots, taxonomy, and rarity data
- Any serious birder already uses eBird; aligning with it removes friction
