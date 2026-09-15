# Supabase Setup — The Corporate Supplier Sustainability Portal 2026

> Schema source of truth. From the moment this file exists it takes precedence
> over the schema sketch in CLAUDE.md. Update it at every save point that touches
> the database (table, policy, function, or auth change).

**Last updated:** 15 September 2026 · Session 2 (v3.1 build)

## Project

| Field | Value |
|-------|-------|
| Project name | `the-corporate-esg` |
| Project ID / ref | `wrylehuacuhwdvxajtdc` |
| Project URL | `https://wrylehuacuhwdvxajtdc.supabase.co` |
| Region | `eu-central-1` (EU — Frankfurt; GDPR applies) |
| Plan | Free (pauses after ~1 week without traffic — accepted) |
| Postgres | 17 |

> The project already existed at the start of this session (created 15 Sep 2026);
> it was confirmed as the correct target and the schema below was built into it.
> Keys are **not** stored in this repo. Retrieve them from the Supabase dashboard
> → Project Settings → API, and set them as Netlify environment variables
> (see `docs/netlify-deployment.md`).

## Table: `public.submissions`

One row per supplier submission (contact details + questionnaire answers +
declaration). Written by the public site with the anon/publishable key.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | NO | Primary key, default `gen_random_uuid()` |
| `tracking_id` | text | (set by trigger) | **UNIQUE**. Format `TCS-YYYY-NNNN`. Assigned by the `assign_tracking_id` BEFORE INSERT trigger — never supplied by the client. |
| `company_name` | text | NO | Contact Step |
| `contact_name` | text | NO | Contact Step |
| `contact_email` | text | NO | Contact Step — also the confirmation-email recipient |
| `contact_phone` | text | NO | Contact Step |
| `contact_job_title` | text | NO | Contact Step |
| `submission_door` | text | NO | **CHECK** `submission_door IN ('Door 1','Door 2')` |
| `questionnaire_answers` | jsonb | NO | Default `'{}'`. Keyed by workbook response-cell id (`E6`…`E36`), each `{ "response": "...", "notes": "..." }` |
| `authorised_signatory_name` | text | NO | Declaration step |
| `declaration_confirmed` | boolean | NO | **CHECK `declaration_confirmed = true`** — a row can never be inserted with it false, even if the frontend gate is bypassed |
| `created_at` | timestamptz | NO | Default `now()`. Also serves as the Declaration's "Date" |

Index: `submissions_created_at_idx` on `(created_at desc)` (for future review).

### Constraints (verified)
- `submissions_pkey` — PRIMARY KEY (`id`)
- `submissions_tracking_id_key` — UNIQUE (`tracking_id`)
- `submissions_submission_door_check` — CHECK (`submission_door` in Door 1 / Door 2)
- `submissions_declaration_confirmed_check` — CHECK (`declaration_confirmed = true`)

## Table: `public.submission_counters`

Internal helper for the per-calendar-year atomic `tracking_id` sequence.

| Column | Type | Notes |
|--------|------|-------|
| `year` | integer | PRIMARY KEY |
| `last_value` | integer | NOT NULL, default 0 — last sequence number issued for that year |

RLS enabled, **no policies**, and all privileges revoked from `anon`/`authenticated`.
It is written **only** by the `assign_tracking_id` SECURITY DEFINER trigger (which
runs as the table owner and bypasses RLS) and by the service role. The Supabase
linter flags this as INFO `rls_enabled_no_policy` — that is intentional and correct
(the table must be unreachable by the public API).

## Function + trigger: `tracking_id` generation

`public.assign_tracking_id()` — `plpgsql`, `SECURITY DEFINER`, `search_path = public`,
`EXECUTE` revoked from `public`/`anon`/`authenticated` (trigger-only; not callable via
the REST RPC endpoint). Fired `BEFORE INSERT ... FOR EACH ROW` on `submissions` by
trigger `trg_assign_tracking_id`.

Logic (atomic, concurrency-safe):
```sql
insert into public.submission_counters as c (year, last_value)
  values (yr, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into seq;
new.tracking_id := 'TCS-' || yr || '-' || lpad(seq::text, 4, '0');
```
The `ON CONFLICT DO UPDATE ... RETURNING` takes a row lock, serialising concurrent
inserts so no two rows get the same number within a year. The `UNIQUE(tracking_id)`
constraint is the ultimate backstop. The counter resets automatically each calendar
year (a new year inserts a fresh counter row starting at 1). A failed insert (e.g. the
CHECK constraint) rolls the counter increment back in the same transaction, so failed
attempts leave no gap.

## RLS policies on `public.submissions` (verified)

RLS is **enabled**. Table privileges: `anon` has `INSERT` only; `service_role` has all.

| Policy | Command | Role | Using | With check |
|--------|---------|------|-------|-----------|
| `submissions_anon_insert` | INSERT | `anon` | — | `true` |
| `submissions_service_all` | ALL | `service_role` | `true` | `true` |

The anon/publishable key (used by the public browser) can therefore **only insert**
new rows — it cannot read, update, or delete any row, including the row it just
inserted. This was verified this session as the `anon` role:

| Action as `anon` | Result |
|------------------|--------|
| `select` | permission denied ✓ |
| `update` | permission denied ✓ |
| `delete` | permission denied ✓ |
| `insert` (valid row) | succeeds ✓ |
| `insert` with `declaration_confirmed = false` | rejected by CHECK ✓ |

`service_role` bypasses RLS (used only from the Supabase dashboard / server side in a
future build; the service-role key has no use in the current frontend or functions).

## Environment variables (set in Netlify, never in code)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | `https://wrylehuacuhwdvxajtdc.supabase.co` — served to the browser by the `config` function |
| `SUPABASE_ANON_KEY` | anon / **publishable** key (`sb_publishable_…`) — insert-only per RLS, served to the browser by the `config` function |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key — **unused** in this build; do not expose. Set only for future use |
| `RESEND_API_KEY` | read by the `send-confirmation` function; email arm is dormant until set |

## Pre-existing project object (not created by this build)

`public.rls_auto_enable()` is a pre-existing **event-trigger** function that
auto-enables RLS on any new table created in the `public` schema (a good enforcement
of the "RLS never disabled" rule — it is why RLS was already on). It was **not**
created or modified in this build. The Supabase linter flags it as a
public-executable SECURITY DEFINER function; because it is an event-trigger function
it does nothing useful if called via RPC, so the risk is negligible. Hardening it
(revoking EXECUTE from `anon`/`authenticated`) is left to the project owner's
discretion since it is outside this tool's schema.

## Deletion (GDPR)

No self-service deletion. A supplier emails `sustainability@thecorporate.com`; The
Corporate's team deletes the corresponding `submissions` row in the Supabase
dashboard (service role bypasses RLS).
