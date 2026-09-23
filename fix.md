# Bug & Issue Tracker — Club Events App

Audit of the React client, Express server, and serverless/SQL layer. Findings are ordered by severity. Status column: `open` until addressed.

Legend — **DB impact**: `none` = code-only change, `policy/function` = changes Supabase RLS policies or functions (does **not** delete or alter existing rows).

---

## 🔴 Critical / High

### 1. Event creation is completely broken
- **File:** `server/src/controllers/events.js:150-155`
- **Verified:** Yes
- **DB impact:** none
- **Bug:** `pickBody()` returns only whitelisted keys (no `slug`); line 150 adds `body.slug`. `cols` is filtered by `EVENT_FIELDS` (excludes `slug`) but `vals = Object.values(body)` includes it, so `vals.length === cols.length + 1`.
- **Failure:** `.run(...vals)` throws "Too many parameter values were provided" → **every `POST /api/events` returns 500.** Admins cannot create events.
- **Fix direction:** Build `vals` from the same filtered list (`cols.map(k => body[k])`) and add `slug` to `EVENT_FIELDS`.
- **Status:** open

### 2. Open, unauthenticated email relay + HTML injection
- **File:** `api/send-confirmation.js:8-61` (relay), `:110-176` (injection), `:217-224` (client-supplied SMTP creds)
- **Verified:** Agent-reported
- **DB impact:** none
- **Bug:** No auth, no rate limiting, `Access-Control-Allow-Origin: *`, recipient and content are client-supplied. Every user field is interpolated raw into the email HTML. Endpoint also accepts arbitrary SMTP credentials from the request body.
- **Failure:** Anyone can drive the club Gmail account to send arbitrary/phishing mail until it is banned.
- **Fix direction:** Add a shared-secret/auth check, restrict CORS to the site origin, add rate limiting, HTML-escape all interpolated fields, remove `gmailUser`/`gmailAppPassword` body inputs.
- **Status:** open

### 3. Anonymous PII enumeration via ticket-lookup RPC
- **File:** `supabase_migration.sql:198-220`; also server `controllers/events.js:349-407` (`lookupTicket`)
- **Verified:** Agent-reported
- **DB impact:** policy/function
- **Bug:** `lookup_registration_tickets` is `SECURITY DEFINER`, granted to `anon`, and matches on a sequential `BIGINT` id.
- **Failure:** Loop `aif-1-1`, `aif-1-2`, … to dump name/email/phone/department/year for every registrant.
- **Fix direction:** Require an exact code+email match (not id-only), or move lookup behind authenticated access; stop returning full PII to anon.
- **Status:** open

### 4. Homepage live event vanishes instead of showing "LIVE"
- **File:** `client/src/components/NextUpcomingEvent.tsx:28-38` + `client/src/services/supabaseService.ts:76`
- **Verified:** Yes
- **DB impact:** none
- **Bug:** For a timed event with no end date, `endTime` stays equal to `startTime`, so `isEnded` flips true at the start instant and `isStarted` is never reachable. The `scope=upcoming` query (`.gte("date", now)`) also drops the event once it starts.
- **Failure:** The "EVENT IS CURRENTLY LIVE!" card is never shown; the event disappears from the homepage at start time.
- **Fix direction:** Derive `endTime` from start when a timed event lacks an end date (default duration), and include in-progress events in the upcoming query.
- **Status:** open

### 5. All authenticated Supabase users have full write access
- **File:** `supabase_migration.sql:148-194`, `supabase_fix_registrations_rls.sql:21-24`
- **Verified:** Agent-reported (severity depends on Supabase Auth config)
- **DB impact:** policy/function
- **Bug:** Every "manage" policy is `FOR ALL TO authenticated USING (true) WITH CHECK (true)` with no admin/role check.
- **Failure:** If public sign-up is enabled (default), any self-registered user can read/edit/delete all registrations (PII) and every other table.
- **Action needed:** Confirm whether email sign-up is disabled in Supabase Auth. Fix requires knowing the admin auth model (specific user / JWT claim / role) to avoid locking out the admin.
- **Status:** open — needs input

### 6. Insecure default JWT secret can reach production
- **File:** `server/src/middleware/auth.js:6`, `server/src/controllers/auth.js:7`
- **Verified:** Agent-reported
- **DB impact:** none
- **Bug:** Falls back to hardcoded `"dev-only-insecure-secret-change-me"` with only a warning. The production guard that throws lives in the auth controller's `seed()`, but `server.js` imports `seed` from `config/db.js`, so it never runs.
- **Failure:** Deploy without `JWT_SECRET` → anyone can forge a valid admin JWT.
- **Fix direction:** Fail fast at startup if `JWT_SECRET` is unset in production.
- **Status:** open

---

## 🟡 Medium

### 7. Direct anon INSERT bypasses registration RPC validation
- **File:** `supabase_fix_registrations_rls.sql:13-17` / `supabase_migration.sql:181`
- **DB impact:** policy/function
- **Bug:** RPC checks capacity/duplicates/email, but the open `INSERT ... WITH CHECK (true)` policy lets anon clients POST straight to the table via PostgREST, skipping all guards.
- **Status:** open

### 8. TLS certificate verification disabled for SMTP
- **File:** `api/send-confirmation.js:253,283` (`rejectUnauthorized: false`)
- **DB impact:** none
- **Bug:** Disables cert validation on the connection carrying the Gmail app password → MITM can capture credentials.
- **Status:** open

### 9. `deleteSubscriberFromFirestore` is undefined
- **File:** `server/src/server.js:183`
- **DB impact:** none
- **Bug:** Function never defined/imported; throws `ReferenceError` after the row is already deleted.
- **Failure:** `DELETE /api/subscribers/:id` deletes the row but returns 500, so the UI reports failure for a successful operation.
- **Status:** open

### 10. JWT accepted via query string
- **File:** `server/src/middleware/auth.js:21`, `server/src/controllers/auth.js:16`
- **DB impact:** none
- **Bug:** Tokens read from the URL query string; export links carry `?token=`, leaking 7-day tokens into server/proxy logs and browser history.
- **Status:** open

### 11. `/api/upload` falls through to a real network fetch
- **File:** `client/src/utils/api.ts:211-219`
- **DB impact:** none
- **Bug:** The Supabase upload branch only returns when body is FormData AND file is truthy; otherwise it falls through to an HTTP fetch against a nonexistent backend.
- **Failure:** Malformed uploads produce a confusing network error/hang instead of a clean JSON error.
- **Status:** open

### 12. PostgREST `.or()` filter injection / breakage
- **File:** `client/src/services/supabaseService.ts:885` (`lookupTicket`), `:1090` (`quickCheckIn`)
- **DB impact:** none
- **Bug:** User-supplied search text interpolated directly into a PostgREST `.or()` filter string with no escaping.
- **Failure:** A name with a comma (e.g. `Rao, Kumar`) breaks the filter or matches wrong rows.
- **Status:** open

### 13. Slug coerced to `NaN`; empty string treated as id 0
- **File:** `client/src/utils/api.ts:54-63` (slug → `NaN` on PUT/DELETE); `client/src/services/supabaseService.ts:128` (`Number("")` → 0)
- **DB impact:** none
- **Bug:** `updateEvent`/`deleteEvent` wrap the identifier in `Number()`, so a slug becomes `NaN` and matches no row; `getEventByIdOrSlug` treats empty/whitespace identifiers as numeric id 0.
- **Failure:** Slug-based update/delete silently affects nothing; empty param queries id 0 and throws instead of returning a clean not-found.
- **Status:** open

---

## 🟢 Low

| # | File | Issue | DB impact |
|---|------|-------|-----------|
| 14 | `server/src/middleware/error.js:17` | SQLite unique-constraint violations return 500 instead of 409 (only Mongo `11000` handled). | none |
| 15 | `server/src/server.js:59` | Overly broad CORS suffix matching with `credentials: true` (e.g. `*.vercel.app`, `evil-localhost:5173`). | none |
| 16 | `server/src/controllers/events.js:549` | Registration delete always returns `success: true` regardless of rows affected. | none |
| 17 | `server/src/controllers/auth.js:46` | `changePassword` 500s when `currentPassword` is missing (unvalidated input to `bcrypt.compareSync`). | none |
| 18 | `client/src/components/InteractiveTerminal.tsx` (~128) | `navigator.clipboard.writeText` called without `.catch` → unhandled rejection on insecure/permission-denied contexts. | none |
| 19 | `supabase_fix_registrations_rls.sql:100` | RPC hardcodes `member2_phone` to `''`, so member 2's phone is never persisted. | policy/function |
| 20 | `vercel.json` (root) vs `client/vercel.json` | Duplicate/conflicting Vercel configs may drop the `/api` function depending on the project's Root Directory setting. | none |
| 21 | `client/src/main.tsx:11-13` + `client/src/App.tsx:39-52` | `AnimatePresence` has no changing key per route → route exit transitions never fire (cosmetic). | none |
| 22 | `client/src/components/RegistrationModal.tsx` (~113-123) | Escape/overflow `useEffect` re-attaches every render due to inline `onClose` dep (no user-visible failure). | none |
| 23 | `client/src/config/supabase.ts:4-6` | Supabase URL + anon key hardcoded as fallbacks in source (public by design, but blocks per-env rotation). | none |

---

## Uncertain / needs confirmation

- **Capacity race** — `server/src/controllers/events.js:222-289`: capacity check and INSERT are not atomic; concurrent registrations can exceed `capacity`. Window is narrow (better-sqlite3 is synchronous per call).
- **`getOne` NaN binding** — `server/src/controllers/events.js:136-137`: `Number(slug)` yields `NaN`; behavior depends on better-sqlite3 `NaN` binding (likely matches no row and falls back to slug branch).
- **Dead Mongoose code** — `server/src/models/*.js`, `routes/*.js`, and the Mongoose path in `middleware/auth.js` are not wired into `server.js` (which is SQLite). Not bugs today, but landmines if imported.
- **`getEvents` count fetch** — `client/src/services/supabaseService.ts:97-106`: pulls all `event_registrations` rows client-side to build a count map; perf concern at scale and silently renders 0 if RLS hides rows.

---

## Dismissed (checked, not bugs)

- **Game toggle clobbering** — `updateGame` (`supabaseService.ts:1280`) uses `.update(payload)`, a PostgREST partial update. Toggling `is_active`/`is_live` leaves other columns intact. Not a bug.
- **Events instant-filter vs debounced fetch** — `client/src/pages/Events.tsx`: intentional (instant local filter, then server refines).

---

## Notes on fixing

- **No data-loss risk** in any fix above. Nothing drops tables or deletes rows.
- **`DB impact: none`** items are pure code changes — safe to apply and verify locally.
- **`DB impact: policy/function`** items (#3, #5, #7, #19) change Supabase RLS policies or functions (who can read/write), not the data. These should be reviewed and run against Supabase manually.
- **#5 needs input** on the admin auth model before tightening RLS, to avoid locking out the admin dashboard.
- Suggested first batch: **#1** and **#4** (contained, high-impact, no DB involvement).
