# Dog Sports Competition Tracker — Project Plan

## 1. Overview

A web application for tracking dog sport competitions, primarily **NoseWork** and **Rally Obedience**, with an extensible design for adding more sports later.

Two trusted users share all data. The app centralizes competition details, sign-up/payment deadlines, the dogs being entered, and an auto-generated calendar so nothing slips past a deadline.

See `STACK.md` for technology choices and `EPICS.md` for the work breakdown.

## 2. Goals

- Track competitions with sport-specific detail (NoseWork type/class/status, Rally number of starts).
- Manage dogs and their competition entries.
- Surface upcoming deadlines (sign-up opens/closes, payment, event day) on a dashboard + calendar.
- Keep entry rules correct per sport.

## 3. Non-Goals (for v1)

- Public/anonymous access or sharing.
- Per-user data isolation (both users intentionally see everything).
- Results/scoring, titles/qualifications tracking.
- Payments/integrations, notifications/email reminders.
- Mobile native apps (responsive web only).

## 4. Database Schema (Supabase / PostgreSQL)

### `profiles` (extends `auth.users`)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, references `auth.users(id)` on delete cascade |
| `email` | text | not null |
| `full_name` | text | nullable |
| `role` | enum `user_role` | `admin`, `user`; default `user` |

> Populated by a trigger on `auth.users` insert.

### `dogs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `name` | text | not null |
| `breed` | text | nullable |
| `date_of_birth` | date | nullable |
| `notes` | text | nullable |
| `created_by` | uuid | references `profiles(id)` |
| `created_at` | timestamptz | default `now()` |

### `competitions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `name` | text | not null |
| `sport` | enum `sport` | `nosework`, `rally_obedience` (extensible) |
| `location` | text | competition address/place (destination) |
| `location_lat` | double precision | nullable; geocoded from `location` |
| `location_lng` | double precision | nullable; geocoded from `location` |
| `origin_location` | text | nullable; the "from" address set at create time |
| `drive_distance_meters` | integer | nullable; cached once |
| `drive_distance_text` | text | nullable; e.g. `"142 km"` |
| `drive_duration_seconds` | integer | nullable; cached once |
| `drive_duration_text` | text | nullable; e.g. `"1 h 38 min"` |
| `drive_computed_at` | timestamptz | nullable; when distance/time was fetched |
| `sign_up_opens` | date | not null |
| `sign_up_closes` | date | not null |
| `payment_deadline` | date | not null |
| `event_date` | date | not null |
| `url` | text | nullable |
| `notes` | text | nullable |
| `created_by` | uuid | references `profiles(id)` |
| `created_at` | timestamptz | default `now()` |

> **Date ordering** validated in app + a CHECK/trigger: `sign_up_opens <= sign_up_closes <= payment_deadline` and all `<= event_date` (payment-before-event recommended, not hard-enforced if real life differs — confirm; see Open Questions).

> **Maps/driving fields**: `location_lat`/`location_lng` geocoded from `location` (for the map pin). `drive_*` fields hold the driving distance/time from `origin_location` to the competition `location`, **computed once** (server-side via Google Maps) and cached. Recompute only if `origin_location` or `location` changes (track with `drive_computed_at`). See §6 and `STACK.md`.

### `nosework_details` (1:1 with `competitions` where `sport = 'nosework'`)

| Column | Type | Constraints |
|--------|------|-------------|
| `competition_id` | uuid | PK, references `competitions(id)` on delete cascade |
| `type` | enum `nosework_type` | `tsm`, `tem_behallare`, `tem_inomhus`, `tem_fordon`, `tem_utomhus` |
| `class` | enum `nosework_class` | `class_1`, `class_2`, `class_3`, `elit` |
| `official_status` | enum `nosework_official_status` | `official`, `unofficial`, `summit` |

### `rally_details` (1:1 with `competitions` where `sport = 'rally_obedience'`)

| Column | Type | Constraints |
|--------|------|-------------|
| `competition_id` | uuid | PK, references `competitions(id)` on delete cascade |
| `number_of_starts` | enum `rally_starts` | `single`, `double`, `triple` |

### `entries`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `competition_id` | uuid | references `competitions(id)` on delete cascade |
| `dog_id` | uuid | references `dogs(id)` on delete restrict |
| `handler_id` | uuid | references `profiles(id)` |
| `status` | enum `entry_status` | `interested`, `signed_up`, `slot_assigned`, `reserve_slot`, `paid` |
| `created_at` | timestamptz | default `now()` |

Uniqueness (enforced via partial unique indexes, since the rule differs per sport):

- **NoseWork** — a dog and a handler may each appear only once per competition:
  - unique `(competition_id, dog_id)`  → one dog competes once per competition.
  - unique `(competition_id, handler_id)`  → one handler competes once per competition.
  - (Two handlers can enter the same competition as long as they use different dogs.)
- **Rally** — only the dog is limited:
  - unique `(competition_id, dog_id)`  → one dog competes once per competition.
  - A handler may enter multiple times (multiple dogs); two handlers may both enter.

### `calendar_events` (auto-generated)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `competition_id` | uuid | references `competitions(id)` on delete cascade |
| `event_type` | enum `calendar_event_type` | `sign_up_open`, `sign_up_close`, `payment`, `event_day` |
| `event_date` | date | not null |
| `title` | text | auto-generated |
| `created_at` | timestamptz | default `now()` |

## 5. Business Rules

- **Auth**: Email + password via Supabase Auth. Both users see all data; no per-user isolation.
- **RLS**: Enabled on every table. Policy: authenticated users may read all and write all; anonymous denied.
- **Entry constraints** (enforced by partial unique indexes + server-side validation):
  - **NoseWork**: a dog competes only once per competition (`competition_id, dog_id` unique) **and** a handler competes only once per competition (`competition_id, handler_id` unique). Two handlers may enter the same competition with different dogs.
  - **Rally**: a dog competes only once per competition (`competition_id, dog_id` unique). One handler may enter multiple times (different dogs); two handlers may both enter.
- **Calendar events**: Auto-create exactly 4 rows per competition (`sign_up_open`, `sign_up_close`, `payment`, `event_day`) on insert. On competition update, regenerate/sync the 4 rows. Cascade-delete with the competition. Implemented via a Postgres trigger so it stays consistent regardless of write path.
- **Cascades**:
  - Delete competition → deletes its sport details, entries, and calendar events.
  - Dog deletion blocked (`on delete restrict`) if any entry references it.
- **Maps & driving distance** (Google Maps — see `STACK.md`):
  - On competition create (and when `origin_location` or `location` changes), a server function geocodes `location` → `location_lat/lng`, and computes driving distance + time from `origin_location` to `location`, caching results in the `drive_*` columns + `drive_computed_at`. **Fetched once**, not on every view.
  - When viewing a competition, the detail drawer renders an interactive map with a pin at `location_lat/lng` **on every open** (Maps JavaScript API), and shows the cached driving distance/time as text. No distance API call on view.

## 6. Architecture Notes

- Sport-specific detail uses a **shared `competitions` table + per-sport detail table** (class-table inheritance). Adding a sport = new enum value + new `<sport>_details` table + conditional form section. The dashboard/calendar/entries logic stays sport-agnostic.
- **Writes go through TanStack Start server functions** for multi-step operations (competition + details + calendar events) and for enforcing entry constraints, even though RLS permits client writes. This keeps invariants in one place.
- **Calendar generation** lives in a DB trigger (source of truth) so it can't drift from competition dates.
- **Maps** use Google Maps (see `STACK.md`): geocoding + driving distance/time run **server-side** (server key, results cached in DB, called at most once per address change); the interactive pin map renders **client-side** on each view (browser key restricted by HTTP referrer). Two keys keep the billable distance/geocoding calls off the client.

## 7. Pages & UI

### `/login`
Supabase email/password auth. shadcn Card, Input, Button, Label. Redirect authed users to `/`.

### `/` — Dashboard
- **Calendar section**: full month grid. Click a day → Popover listing that day's events. Month/year navigation. Color-coded by type: `sign_up_open` (blue), `sign_up_close` (orange), `payment` (red), `event_day` (green).
- **Cards row**:
  - "Next 5 Sign-ups Opening" — `sign_up_opens >= today`, excluding competitions already fully `signed_up`/`paid`.
  - "Next 3 Sign-ups Closing" — `sign_up_closes >= today`.
  - "Next 5 Competitions" — `event_date >= today`.
- **Upcoming dates list**: next ~20 `calendar_events` chronologically. Row click → competition detail drawer.

### `/competitions`
TanStack Table (sort/filter). Columns: name, sport, event date, location, status, actions. "Add Competition" → drawer.

### Competition drawer (add/edit)
shadcn Sheet from right. Common fields (incl. `location` destination and `origin_location` "from" address) + conditional sport fields (NoseWork: type/class/official status; Rally: number of starts). TanStack Form + Zod. Submit → server function inserts competition + details (+ trigger makes calendar events) and geocodes `location` + computes/caches driving distance/time from `origin_location` → close + invalidate queries + toast.

### Competition detail drawer
Sheet showing all fields, entries (dog + handler + status), calendar events. **Map**: interactive Google map with a pin at the competition `location_lat/lng`, rendered on every open. Shows cached driving distance + time from `origin_location` as text (no API call on view). Actions: edit, delete (AlertDialog confirm), add entry (Select dog / handler / status, constraints validated server-side per sport rules in §5).

### `/dogs`
TanStack Table. Columns: name, breed, DOB, entries count. "Add Dog" → drawer.

### Dog drawer (add/edit)
Sheet. Fields: name, breed, date of birth (DatePicker), notes. TanStack Form + Zod.

### Dog detail drawer
Sheet. Info + list of competition entries. Entry click → competition detail drawer. Delete blocked with clear message if entries exist.

## 8. Component Strategy

- shadcn/ui for all interactive/non-trivial components: Card, Sheet, Popover, AlertDialog, Select, Calendar/DatePicker, Input, Textarea, Button, Label, Toast.
- TanStack Form bound to shadcn inputs, validated with Zod.
- Pure HTML for non-interactive structural markup.
- Navigation via TanStack Router links, Tailwind-styled.

## 9. Implementation Order

1. Supabase: project, schema migration, enums, RLS, triggers (profile creation, calendar events, date checks), seed data.
2. TanStack Start init, shadcn init + custom theme, Tailwind, Supabase client, generated types, auth context.
3. Auth flow (login/logout, route guards).
4. Dashboard (calendar + cards + upcoming list).
5. Dog drawers (add/edit/detail).
6. Competition drawers (add/edit/detail).
7. Entry management inside competition drawer.
8. Polish: navigation shell, responsive/mobile, loading + empty + error states, toasts.

Detailed task breakdown in `EPICS.md`.

## 10. Seed Data

- 1 user profile (the developer's account).
- 2 dogs.
- 2 competitions (1 NoseWork, 1 Rally) with details, a few entries, and their auto-generated calendar events.

## 11. Open Questions

- Should `payment_deadline <= event_date` be hard-enforced, or can payment fall after the event date in practice?
- Is `location` required or optional? (Schema currently optional; original draft implied required.)
- "Status not signed_up/paid" for the opening-soon card — is this per-competition aggregate or per-entry? Needs a defined rule for how a competition's overall status is derived from its entries.
- Single shared handler list = both users; confirm handlers are always the 2 app users (no external handlers).
