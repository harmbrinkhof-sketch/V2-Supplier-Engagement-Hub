# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 2 — v3.1 build (Supabase persistence, Contact + Declaration steps, email arm)
**Last updated:** 15 September 2026
**Live URL:** none yet — built and tested locally; deploy pending (env vars + Netlify)

## Current state

v3.1 is built on top of the v2.0 single static page (`index.html`), now with the
questionnaire logic in `public/app.js` and two Netlify Functions. Tier 2 — D3+A1.

Flow implemented and tested end-to-end (jsdom walkthrough, 51/51 checks):
- **Landing page / Door Picker** — routing unchanged from v2.0. Door Picker intro
  copy corrected (data now persists; the old "nothing leaves your browser" line was
  removed as it contradicted the new GDPR notice).
- **Contact Step (new, shared by both doors)** — company, contact name, job title,
  email, phone (all required) + GDPR consent checkbox with the exact spec statement.
  Continue is disabled until all fields are valid and consent is ticked. Door 1 →
  stepper; Door 2 → download.
- **Door 1 stepper** — now S2–S7 (S1 removed), extracted from the updated workbook.
  S7 "Next" → Declaration.
- **Declaration Step (new, shared)** — Authorised Signatory Name + required checkbox
  standing in for Signature/Digital Auth. Continue disabled until both complete.
  Date is taken from `created_at`, not collected.
- **Door 2** — Contact Step → Download → Upload/Parse (all-or-nothing structural check,
  now validating the S2–S7 **+ Declaration** template) → Declaration → Review.
- **Both Review screens** — Contact Details and Declaration read-only summary blocks
  above the questionnaire sections (no Edit on those blocks). Door 1 keeps per-section
  Edit; Door 2 does not.
- **Submit** — writes the full record to Supabase `submissions` via a direct browser
  insert (insert-only anon key from the `config` function), fires the confirmation
  email (Netlify Function, independent of the write), then shows Confirmation. Insert
  failure keeps the user on Review with a retry message; email failure never blocks.
- **Confirmation** — persistence-accurate copy + a note that a confirmation email was
  sent to the contact email. No print/save/export.

Database (`the-corporate-esg`, `wrylehuacuhwdvxajtdc`, EU Frankfurt) built and verified
— see `docs/supabase-setup.md`.

## Last session

Session 2 (this one). Placed the v3.1 docs; corrected the workbook's orphaned S1
instruction cell (A4) and replaced the asset; built the `submissions` table, the
per-year atomic `tracking_id` (counter table + SECURITY DEFINER trigger), the
`CHECK(declaration_confirmed = true)` constraint, and insert-only anon RLS; rebuilt
the field model to S2–S7; added the Contact + Declaration steps and rewired both door
flows; moved the questionnaire logic to `public/app.js`; added the `config` and
`send-confirmation` Netlify Functions. Verified with a 51-check jsdom walkthrough
(flow, gating, submit wiring, email independence, parser against the real workbook),
DB tests (tracking_id uniqueness + format, CHECK rejects `false`, anon read/update/
delete denied + insert allowed), a static-serve smoke test, and Chromium screenshots
of the new views (brand-compliant).

## Remaining work

- [ ] **Deploy to Netlify** and record the live URL here — see `docs/netlify-deployment.md`.
      Netlify MCP was not available this session, so the builder (or a session with
      Netlify access) sets the env vars and deploys.
- [ ] **Create the Resend API key** (`re_…`) and set `RESEND_API_KEY` in Netlify — the
      email arm is dormant until then (submissions still save). Optionally set a
      verified `RESEND_FROM` sender.
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable), and
      `SUPABASE_SERVICE_ROLE_KEY` (unused) in Netlify.
- [ ] Run Acceptance Criteria #16 against the live URL (full submission on each door,
      including the email).
- [ ] Consider rotating the Supabase secret key (shared in chat during the build).
- [ ] (Owner's discretion) harden the pre-existing `rls_auto_enable()` event-trigger
      function (revoke EXECUTE from anon/authenticated) — flagged by the Supabase
      linter; not created by this build, negligible risk.
- [ ] Confirm the two resource PDFs are the intended current versions (carried from v2.0).

## Build decisions

- **Questionnaire logic externalised** to `public/app.js` (was inline in `index.html`).
  Cleaner for a large v3 rewrite; keeps zero build step. Landing-page decision-tree
  script stays inline; SheetJS stays vendored under `public/vendor/`.
- **Runtime config endpoint for DB keys.** Per the Hard Rule (no keys in committed
  files), the browser fetches `{ url, anonKey }` from `/.netlify/functions/config` at
  load, then does the direct insert with the insert-only anon key. This keeps the
  spec's RLS model (anon insert-only, used from the browser — acceptance #9 stays
  meaningful) while nothing is hardcoded.
- **Direct PostgREST insert, no supabase-js.** The insert is a single `fetch` POST to
  `/rest/v1/submissions` with `Prefer: return=minimal` (anon has no read policy, so we
  never read back). Avoids vendoring another library.
- **tracking_id via counter table + SECURITY DEFINER trigger**, not a raw sequence, so
  it resets per calendar year and stays atomic/concurrency-safe (`ON CONFLICT` row
  lock), with `UNIQUE(tracking_id)` as backstop.
- **Contact/Declaration are shared views** (one `#view-contact`, one
  `#view-declaration`) reused by both doors and routed by `state.door` — guarantees the
  spec's "identical on both doors".
- **Email is fire-and-forget** after the insert resolves, so a Resend failure can never
  block or roll back the write.
- **All S2–S7 answers optional.** With S1 removed, there are no required questionnaire
  fields; only the Contact Step and Declaration gate submission (client-side + the DB
  CHECK/RLS as backstop).
- **Door 2 structural check** now also requires the closing Declaration row, matching
  the S2–S7 + Declaration template.

## Known issues

- Not yet deployed — no live URL; email arm dormant until `RESEND_API_KEY` is set.
- The key pasted in the build session (`sb_secret_…`) is the Supabase **secret** key,
  not a Resend key — mapped to the (unused) `SUPABASE_SERVICE_ROLE_KEY`. Rotate it.
- Landing page left unchanged per spec (criterion #1); the Path B blurb still says
  "7 sections" / "No email required" — factually loose now (6 sections; a confirmation
  email is sent) but low-risk marketing copy. Only the Door Picker + Confirmation copy
  that made false data-handling claims was corrected.
- GDPR note carried from v3.1: the spec's "Personal data collected" list (Section 7)
  names the five Contact fields but not `authorised_signatory_name`, which is also
  personal data. Built per spec; worth the spec author adding it to Section 7.
- `submission_counters` shows as INFO `rls_enabled_no_policy` in the Supabase linter —
  intentional (locked to the definer trigger + service role).

## Notes for next session

None.
