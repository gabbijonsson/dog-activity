# Epics & Tasks

Work breakdown for the Dog Sports Competition Tracker. Epics are ordered to match the implementation order in `PROJECT_PLAN.md`. Each task is sized to be a small, shippable unit.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Epic 0 — Project Bootstrap

- [x] Create TanStack Start app (React + TypeScript, strict mode).
- [x] Add Tailwind CSS + base config.
- [x] Run `shadcn` init; set up custom theme tokens (colors, radius, fonts).
- [x] Add core shadcn components: Button, Card, Input, Label, Textarea, Select, Sheet, Popover, AlertDialog, Calendar, Toast/Sonner.
- [x] Add Zod; create `src/lib/schemas.ts` placeholder.
- [x] Set up `.env` handling and document required vars (see `STACK.md`).
- [x] Biome + TypeScript config.

**Acceptance**: `npm run dev` serves a themed blank shell with routing.

---

## Epic 1 — Supabase Backend

- [x] Create Supabase project; capture URL + keys.
- [x] Define enums: `user_role`, `sport`, `nosework_type`, `nosework_class`, `nosework_official_status`, `rally_starts`, `entry_status`, `calendar_event_type`.
- [x] Migration: `profiles` + trigger to create profile on `auth.users` insert.
- [x] Migration: `dogs`, `competitions`, `nosework_details`, `rally_details`, `entries`, `calendar_events`.
- [x] Partial unique indexes for entry constraints:
  - NoseWork: unique `(competition_id, dog_id)` **and** unique `(competition_id, handler_id)`.
  - Rally: unique `(competition_id, dog_id)`.
- [x] Add competition map/drive columns: `location_lat`, `location_lng`, `origin_location`, `drive_distance_meters`, `drive_distance_text`, `drive_duration_seconds`, `drive_duration_text`, `drive_computed_at`.
- [x] CHECK/trigger for competition date ordering.
- [x] Trigger: auto-generate + sync 4 `calendar_events` per competition on insert/update; cascade on delete.
- [x] Enable RLS on all tables; policies (authenticated read-all/write-all, anon denied).
- [x] `seed.sql`: 1 user, 2 dogs, 2 competitions (NoseWork + Rally) with details, entries, calendar events.
- [x] Generate TypeScript types → `src/lib/database.types.ts`.

**Acceptance**: migrations apply cleanly; seed loads; types generate; RLS verified (anon blocked, authed allowed).

---

## Epic 2 — App Foundations

- [x] `src/lib/supabase.ts` typed client (browser + server variants).
- [x] `src/lib/queryKeys.ts` centralized query keys.
- [x] TanStack Query provider wired into root.
- [x] Auth context/provider reading Supabase session.
- [x] App shell layout: nav (Dashboard / Competitions / Dogs), user menu, logout.

**Acceptance**: session state available app-wide; nav renders; queries cache.

---

## Epic 3 — Authentication

- [x] `/login` page: email/password form (TanStack Form + Zod), shadcn Card.
- [x] Sign-in action + error handling (toast on failure).
- [x] Route guards: redirect unauthenticated to `/login`, authenticated away from `/login`.
- [x] Logout action clears session + redirects.

**Acceptance**: can log in/out; protected routes enforce auth.

---

## Epic 4 — Dashboard

- [x] Data loaders: upcoming sign-ups opening, closing, competitions, and next ~20 calendar events.
- [x] Month grid calendar component (month/year navigation).
- [x] Day Popover listing that day's events, color-coded by type.
- [x] Cards row: "Next 5 Sign-ups Opening", "Next 3 Sign-ups Closing", "Next 5 Competitions".
- [x] Upcoming dates list (Table); row click opens competition detail drawer.
- [x] Loading + empty states for each section.

**Acceptance**: dashboard shows seeded data correctly; calendar navigation works; colors match spec.

---

## Epic 5 — Dogs

- [x] `/dogs` list (TanStack Table): name, breed, DOB, entries count.
- [x] Add/Edit dog drawer (Sheet) — TanStack Form + Zod (name, breed, DOB DatePicker, notes).
- [x] Create/update mutations + query invalidation + toasts.
- [x] Dog detail drawer: info + competition entries list; entry click → competition detail.
- [x] Delete dog with `restrict` handling: blocked + clear message when entries exist.

**Acceptance**: full dog CRUD; delete correctly blocked when referenced.

---

## Epic 6 — Competitions

- [x] `/competitions` list (TanStack Table): name, sport, event date, location, status, actions; sort/filter.
- [x] Add/Edit competition drawer (Sheet) with common fields, incl. `location` (destination) and `origin_location` ("from") inputs.
- [x] Conditional sport fields: NoseWork (type/class/official status), Rally (number of starts).
- [x] Server function: create/update competition + sport detail in one transaction (calendar events via trigger).
- [x] Validation: Zod schema incl. date ordering; surface server errors.
- [x] Competition detail drawer: all fields + entries + calendar events.
- [x] Delete competition (AlertDialog) → cascades details/entries/calendar events.

**Acceptance**: full competition CRUD; sport fields conditional; 4 calendar events appear/sync; cascade verified.

---

## Epic 6b — Maps & Driving Distance (Google Maps)

- [x] Google Cloud project; enable Geocoding API, Routes API (or Distance Matrix), Maps JavaScript API.
- [x] Create 2 keys: server key (Geocoding + Routes) and browser key (Maps JS, HTTP-referrer restricted); add to env.
- [x] `src/server/maps.ts`: geocode `location` → lat/lng; compute driving distance/time from `origin_location` → `location`.
- [x] Wire into competition create/update server function: run geocode + distance only when `location`/`origin_location` changes; cache to `drive_*` + `location_lat/lng` + `drive_computed_at`.
- [x] `src/components/map/`: Maps JS wrapper rendering a pin at `location_lat/lng`; render on every detail-drawer open.
- [x] Detail drawer: show cached distance/time text + the map; graceful state when geocode failed / coords missing.

**Acceptance**: distance/time fetched once and persisted (no API call on view); map with pin renders every open; editing address recomputes.

---

## Epic 7 — Entries

- [x] Add-entry form inside competition detail drawer: Select dog, Select handler, Select status.
- [x] Server-side constraint validation with friendly errors:
  - NoseWork: reject if dog already entered, or if handler already entered, in this competition.
  - Rally: reject if dog already entered in this competition (handler may repeat with other dogs).
- [x] Update entry status; remove entry.
- [x] Invalidate competition + dog detail queries on change.

**Acceptance**: entries respect per-sport uniqueness; status updates persist; counts update on dog list.

---

## Epic 8 — Polish

- [x] Responsive/mobile layout pass (calendar, tables, drawers).
- [x] Global loading, empty, and error states.
- [x] Toast coverage for all mutations.
- [x] Accessibility pass (labels, focus traps in Sheets/Dialogs, keyboard nav).
- [x] Favicon, page titles, 404 route.

**Acceptance**: usable on mobile; consistent feedback; no dead-end states.

---

## Epic 9 — Deployment

- [ ] Connect repo to Vercel.
- [ ] Configure env vars (Supabase URL + anon key; service role + `GOOGLE_MAPS_SERVER_KEY` as server-only secrets; `VITE_GOOGLE_MAPS_BROWSER_KEY`). Add Vercel prod domain to the browser key's referrer allowlist.
- [ ] Verify production build + SSR.
- [ ] Smoke test auth + CRUD against production Supabase.

**Acceptance**: live URL works end-to-end with seeded data.

---

## Cross-Cutting / Backlog

- [ ] Resolve Open Questions in `PROJECT_PLAN.md` (date enforcement, location required?, competition status derivation, handler list).
- [ ] Define how a competition's aggregate "status" is computed from entries (drives dashboard filters).
- [ ] Consider optimistic updates for status changes.
- [ ] Extensibility check: document the steps to add a third sport.
