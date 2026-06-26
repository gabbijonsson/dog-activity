# Tech Stack

## Overview

Single-page-feel web app for tracking dog sport competitions (NoseWork, Rally Obedience, extensible). Two trusted users sharing all data, authenticated via Supabase.

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | TanStack Start (React + TypeScript) | SSR-capable full-stack React framework, file-based routing |
| Routing | TanStack Router | Type-safe routes, search-param state, loaders |
| Data fetching | TanStack Query | Caching, invalidation, optimistic updates |
| Tables | TanStack Table | Sorting, filtering, pagination for list views |
| Forms | TanStack Form | Validation, field state, type-safe submit |
| Database | Supabase (PostgreSQL) | Schema, RLS, generated types |
| Auth | Supabase Auth | Email + password |
| Styling | Tailwind CSS | Utility-first |
| UI components | shadcn/ui | Customized theme; Card, Sheet, Popover, AlertDialog, Select, Calendar, Toast, etc. |
| Validation | Zod | Shared client/server schemas, drives TanStack Form validators |
| Maps | Google Maps Platform | Geocoding + driving distance/time (server, cached once); interactive pin map (client, per view) |
| Deployment | Vercel | Env vars in project settings |

## Decisions & Rationale

- **TanStack Start over Next.js**: requested; lets us use the full TanStack ecosystem cohesively (Router/Query/Table/Form share patterns and types).
- **Supabase**: managed Postgres + auth + RLS + auto-generated TS types removes most backend boilerplate.
- **shadcn/ui**: copy-in components, fully themeable, no runtime lock-in. Pure HTML for non-interactive structural markup.
- **Zod**: one schema source for form validation and for guarding server mutations (entry constraints, date ordering).
- **Google Maps Platform**: covers all three needs in one billing account with one project:
  - **Geocoding API (v4)** — `location` text → lat/lng (for the pin). Server-side, once per address change.
  - **Routes API** (or legacy **Distance Matrix API**) — driving distance + time from `origin_location` to `location`. Server-side, result cached in DB; **never recomputed on view**.
  - **Maps JavaScript API** — interactive map + marker in the competition detail drawer. Client-side, renders every open.
  - Use **two API keys**: a server key (no referrer restriction, restricted to Geocoding + Routes, used only in server functions) and a browser key (HTTP-referrer-restricted, restricted to Maps JavaScript API). Keeps billable geocoding/routing calls off the client and limits key abuse.

## Project Conventions

- TypeScript strict mode on.
- Supabase types generated via `supabase gen types typescript` into `src/lib/database.types.ts`.
- All DB access through a typed Supabase client wrapper in `src/lib/supabase.ts`.
- Server-side mutations (insert competition + details + calendar events, entry constraint checks) live in TanStack Start server functions, not the client, so RLS-permitted writes still get validated.
- Query keys centralized in `src/lib/queryKeys.ts` for consistent invalidation.
- Geocoding + driving distance/time happen only inside server functions (`src/server/maps.ts`) using `GOOGLE_MAPS_SERVER_KEY`; results are written to the competition row and reused. The client only loads the Maps JS map.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, server-only, for trusted server functions (never exposed to client) |
| `GOOGLE_MAPS_SERVER_KEY` | Server-only key for Geocoding + Routes/Distance Matrix (geocode + driving distance/time). No `VITE_` prefix |
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | Browser key for Maps JavaScript API (pin map). HTTP-referrer restricted |

> Note: `VITE_`-prefixed vars are exposed to the browser. The service role key and `GOOGLE_MAPS_SERVER_KEY` must NOT use the `VITE_` prefix and must only be read inside server functions. Restrict the browser maps key by HTTP referrer in the Google Cloud console.

## Local Setup

```bash
npm install
# create .env with the variables above
npm run dev
```

## Deployment

Deploy to Vercel. Configure all environment variables in project settings. Set the service role key as a server-only secret.

## Folder Sketch

```
src/
  routes/            # TanStack Router file-based routes
    __root.tsx
    login.tsx
    index.tsx        # dashboard
    competitions.tsx
    dogs.tsx
  components/
    ui/              # shadcn/ui components
    calendar/        # month grid + day popover
    competitions/    # drawers, table, entry form
    dogs/            # drawers, table
    map/             # Google Maps JS pin map wrapper
  lib/
    supabase.ts
    database.types.ts
    queryKeys.ts
    schemas.ts       # Zod schemas
  server/            # server functions (mutations, constraint checks)
    maps.ts          # geocode + driving distance/time (server key, cached)
supabase/
  migrations/        # SQL schema, RLS, triggers
  seed.sql
```
