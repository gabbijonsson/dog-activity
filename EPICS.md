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

- [ ] Create Supabase project; capture URL + keys.
- [ ] Define enums: `user_role`, `sport`, `nosework_type`, `nosework_class`, `nosework_official_status`, `rally_starts`, `entry_status`, `calendar_event_type`.
- [ ] Migration: `profiles` + trigger to create profile on `auth.users` insert.
- [ ] Migration: `dogs`, `competitions`, `nosework_details`, `rally_details`, `entries`, `calendar_events`.
- [ ] Partial unique indexes for entry constraints:
  - NoseWork: unique `(competition_id, dog_id)` **and** unique `(competition_id, handler_id)`.
  - Rally: unique `(competition_id, dog_id)`.
- [ ] Add competition map/drive columns: `location_lat`, `location_lng`, `origin_location`, `drive_distance_meters`, `drive_distance_text`, `drive_duration_seconds`, `drive_duration_text`, `drive_computed_at`.
- [ ] CHECK/trigger for competition date ordering.
- [ ] Trigger: auto-generate + sync 4 `calendar_events` per competition on insert/update; cascade on delete.
- [ ] Enable RLS on all tables; policies (authenticated read-all/write-all, anon denied).
- [ ] `seed.sql`: 1 user, 2 dogs, 2 competitions (NoseWork + Rally) with details, entries, calendar events.
- [ ] Generate TypeScript types → `src/lib/database.types.ts`.

**Acceptance**: migrations apply cleanly; seed loads; types generate; RLS verified (anon blocked, authed allowed).

---

## Epic 2 — App Foundations

- [ ] `src/lib/supabase.ts` typed client (browser + server variants).
- [ ] `src/lib/queryKeys.ts` centralized query keys.
- [ ] TanStack Query provider wired into root.
- [ ] Auth context/provider reading Supabase session.
- [ ] App shell layout: nav (Dashboard / Competitions / Dogs), user menu, logout.

**Acceptance**: session state available app-wide; nav renders; queries cache.

---

## Epic 3 — Authentication

- [ ] `/login` page: email/password form (TanStack Form + Zod), shadcn Card.
- [ ] Sign-in action + error handling (toast on failure).
- [ ] Route guards: redirect unauthenticated to `/login`, authenticated away from `/login`.
- [ ] Logout action clears session + redirects.

**Acceptance**: can log in/out; protected routes enforce auth.

---

## Epic 4 — Dashboard

- [ ] Data loaders: upcoming sign-ups opening, closing, competitions, and next ~20 calendar events.
- [ ] Month grid calendar component (month/year navigation).
- [ ] Day Popover listing that day's events, color-coded by type.
- [ ] Cards row: "Next 5 Sign-ups Opening", "Next 3 Sign-ups Closing", "Next 5 Competitions".
- [ ] Upcoming dates list (Table); row click opens competition detail drawer.
- [ ] Loading + empty states for each section.

**Acceptance**: dashboard shows seeded data correctly; calendar navigation works; colors match spec.

---

## Epic 5 — Dogs

- [ ] `/dogs` list (TanStack Table): name, breed, DOB, entries count.
- [ ] Add/Edit dog drawer (Sheet) — TanStack Form + Zod (name, breed, DOB DatePicker, notes).
- [ ] Create/update mutations + query invalidation + toasts.
- [ ] Dog detail drawer: info + competition entries list; entry click → competition detail.
- [ ] Delete dog with `restrict` handling: blocked + clear message when entries exist.

**Acceptance**: full dog CRUD; delete correctly blocked when referenced.

---

## Epic 6 — Competitions

- [ ] `/competitions` list (TanStack Table): name, sport, event date, location, status, actions; sort/filter.
- [ ] Add/Edit competition drawer (Sheet) with common fields, incl. `location` (destination) and `origin_location` ("from") inputs.
- [ ] Conditional sport fields: NoseWork (type/class/official status), Rally (number of starts).
- [ ] Server function: create/update competition + sport detail in one transaction (calendar events via trigger).
- [ ] Validation: Zod schema incl. date ordering; surface server errors.
- [ ] Competition detail drawer: all fields + entries + calendar events.
- [ ] Delete competition (AlertDialog) → cascades details/entries/calendar events.

**Acceptance**: full competition CRUD; sport fields conditional; 4 calendar events appear/sync; cascade verified.

---

## Epic 6b — Maps & Driving Distance (Google Maps)

- [ ] Google Cloud project; enable Geocoding API, Routes API (or Distance Matrix), Maps JavaScript API.
- [ ] Create 2 keys: server key (Geocoding + Routes) and browser key (Maps JS, HTTP-referrer restricted); add to env.
- [ ] `src/server/maps.ts`: geocode `location` → lat/lng; compute driving distance/time from `origin_location` → `location`.
- [ ] Wire into competition create/update server function: run geocode + distance only when `location`/`origin_location` changes; cache to `drive_*` + `location_lat/lng` + `drive_computed_at`.
- [ ] `src/components/map/`: Maps JS wrapper rendering a pin at `location_lat/lng`; render on every detail-drawer open.
- [ ] Detail drawer: show cached distance/time text + the map; graceful state when geocode failed / coords missing.

**Acceptance**: distance/time fetched once and persisted (no API call on view); map with pin renders every open; editing address recomputes.

---

## Epic 7 — Entries

- [ ] Add-entry form inside competition detail drawer: Select dog, Select handler, Select status.
- [ ] Server-side constraint validation with friendly errors:
  - NoseWork: reject if dog already entered, or if handler already entered, in this competition.
  - Rally: reject if dog already entered in this competition (handler may repeat with other dogs).
- [ ] Update entry status; remove entry.
- [ ] Invalidate competition + dog detail queries on change.

**Acceptance**: entries respect per-sport uniqueness; status updates persist; counts update on dog list.

---

## Epic 8 — Polish

- [ ] Responsive/mobile layout pass (calendar, tables, drawers).
- [ ] Global loading, empty, and error states.
- [ ] Toast coverage for all mutations.
- [ ] Accessibility pass (labels, focus traps in Sheets/Dialogs, keyboard nav).
- [ ] Favicon, page titles, 404 route.

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
