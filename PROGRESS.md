# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 3 — v3.2 build (EcoVadis intake, department field, shared tracking sequence, verbatim GDPR copy)
**Last updated:** 15 September 2026
**Live URL:** none yet — built and tested locally; deploy pending (env vars + Netlify)

## Current state

v3.2 is built on top of the v3.1 single static page (`index.html`), the questionnaire
logic in `public/app.js`, and two Netlify Functions (`config`, `send-confirmation`).
Tier 2 — D3+A1. Three submission paths now persist to Supabase: Door 1, Door 2, and the
new EcoVadis intake.

New/changed this session:
- **EcoVadis path is now its own intake** (`#view-ecovadis`), not a bare outbound link.
  Company, contact name, email, phone, job title, department (all required) + **EcoVadis
  Scorecard Link** (required, validated as an http/https URL) + the GDPR consent block.
  Submit → writes to `ecovadis_submissions` (direct browser insert, insert-only anon key)
  → fires the confirmation email (fire-and-forget) → opens `https://ecovadis.com` in a new
  tab. **No confirmation screen** on the portal; the portal returns to the landing page.
  The destination tab is opened during the click gesture and navigated after the write, so
  the popup blocker does not block it; on a write failure the tab is closed and the user
  stays on the intake with a retry message.
- **Landing "Submit EcoVadis Scorecard"** now opens the EcoVadis intake (was a direct
  `window.open('https://ecovadis.com')`). Path B blurb corrected: "6 sections (S2–S7)" and
  the false "No email required" line replaced with "You receive a confirmation email once
  submitted."
- **Department** is a new required field on all three Contact Steps (Door 1, Door 2, and
  EcoVadis). Added to the shared Contact Step, the `submissions` insert row, the client-side
  gating, and both Review screens' Contact Details summary.
- **GDPR copy** updated to the product-spec §7 **verbatim** wording (data statement +
  consent checkbox label), applied identically on all three paths. (This replaced the
  shorter v3.1 on-disk copy — §7 is authoritative per CLAUDE.md's hard rule.)
- **Database** (`the-corporate-esg`, `wrylehuacuhwdvxajtdc`, EU Frankfurt):
  - `submissions` gained `department text NOT NULL` (table was empty — no backfill needed).
  - New `ecovadis_submissions` table (id, tracking_id, 5 contact fields, department,
    ecovadis_link, created_at) with anon-insert-only / service-role-all RLS + grants,
    mirroring `submissions`.
  - The existing `assign_tracking_id` trigger is now attached to `ecovadis_submissions`
    too, so **one shared per-year sequence** spans both tables. Verified: back-to-back
    inserts got `TCS-2026-0001` / `TCS-2026-0002`. Test rows deleted, counter reset to 0.
  - See `docs/supabase-setup.md` (updated this session).

## Last session

Session 3 (this one). Placed the v3.2 docs (spec, CLAUDE.md, PROGRESS). Applied two
migrations (`v3_2_add_department_to_submissions`, `v3_2_create_ecovadis_submissions`) via
Supabase MCP. Built the EcoVadis intake view + logic, rewired the landing button, added the
department field and verbatim GDPR copy across all three paths, and generalised the direct
PostgREST insert to serve both tables. Verified with a 45-check jsdom walkthrough (gating on
all three paths, EcoVadis submit sequence incl. new-tab redirect and form reset, insert-
failure handling, email independence on the doors, department in the `submissions` row,
stepper starts at S2, `validUrl`, the S2–S7 + Declaration parser), a live anon-role DB test
(anon insert allowed + trigger assigns id; select/update/delete denied), the shared-sequence
proof, the security advisor (no new findings), and Chromium renders of the EcoVadis and
Contact Step views (brand-compliant). DB left pristine (0 rows both tables, counter 0).

## Remaining work

- [ ] **Deploy to Netlify** and record the live URL here. Netlify MCP is not available in
      this session, so the builder (or a session with Netlify access) sets env vars and
      deploys from `main`.
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable), and `SUPABASE_SERVICE_ROLE_KEY`
      (unused) in Netlify.
- [ ] **Create the Resend API key** (`re_…`) and set `RESEND_API_KEY` in Netlify — the email
      arm is dormant until then (submissions still save on all three paths). Optionally set a
      verified `RESEND_FROM` sender.
- [ ] Run Acceptance Criteria #1–17 (spec v3.2) against the live URL — a full submission on
      each of the three paths, including the email, and the anon read/update/delete denial on
      both tables.
- [ ] Consider rotating the Supabase secret key (shared in chat during the v3.1 build).
- [ ] (Owner's discretion) harden the pre-existing `rls_auto_enable()` event-trigger function
      (revoke EXECUTE from anon/authenticated) — flagged by the Supabase linter; not created
      by this build, negligible risk.
- [ ] Confirm the two resource PDFs are the intended current versions (carried from v2.0).

## Build decisions

- **EcoVadis intake reuses the Contact Step patterns** (contact-grid, field, consent,
  flow-* classes) — no new visual language, per the brand skill. One extra required field,
  `ecovadis_link`, with a `.field-help` hint and http/https URL validation (`new URL`).
- **New-tab redirect without popup-block risk:** the destination tab is opened
  (`window.open("about:blank")`) synchronously inside the Submit click, its `opener` is
  nulled, and it is navigated to ecovadis.com only after the DB write resolves. On failure
  the tab is closed and an inline alert is shown. No confirmation screen, per spec.
- **Shared tracking_id sequence via one trigger, not a new function.** `assign_tracking_id()`
  was already table-agnostic, so the same `trg_assign_tracking_id` trigger was simply
  attached to `ecovadis_submissions`; both tables increment the same `submission_counters`
  row. Avoids a second counter and keeps the atomic `ON CONFLICT` row-lock guarantee.
- **`department NOT NULL` with no default** — safe because `submissions` was empty; the DB
  now rejects any submission missing a department, matching the client-side gate.
- **One generic `insertRow(table, row)`** serves both `submissions` and
  `ecovadis_submissions` writes (single fetch POST, `Prefer: return=minimal`, insert-only
  anon key). `buildRow` (doors) and `buildEcoRow` (EcoVadis) shape each table's columns.
- **GDPR §7 is authoritative.** The spec's §16 version note loosely said the copy "matched
  the already-built copy," but §7's verbatim wording differed from the v3.1 on-disk text;
  CLAUDE.md's hard rule points to §7, so §7 wording was used on all three paths.

## Known issues

- Not yet deployed — no live URL; email arm dormant until `RESEND_API_KEY` is set (all three
  paths still save to the database).
- The key pasted in the v3.1 build session (`sb_secret_…`) is the Supabase **secret** key,
  mapped to the (unused) `SUPABASE_SERVICE_ROLE_KEY`. Rotate it.
- GDPR note (carried): the spec's "Personal data collected" list (§7) names the Contact
  fields but not `authorised_signatory_name`, which is also personal data — worth the spec
  author adding.
- `submission_counters` shows INFO `rls_enabled_no_policy` in the linter — intentional
  (locked to the definer trigger + service role).
- Landing Path A blurb ("Submit your scorecard through EcoVadis…") is still accurate at a
  high level even though the flow now captures details first; left as marketing copy.

## Notes for next session

None.
