# The Corporate Supplier Sustainability Portal 2026

## Identity
A public portal that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme, routing each supplier to EcoVadis submission or an in-tool questionnaire (guided form or file upload) — no login required. Submissions now write to a database so The Corporate can retain and review them.
Tier: 2 — public form, no login required, but submissions now persist to Supabase instead of disappearing when the tab closes (D3+A1)
Spec version governed: v3.1 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone (a future internal review dashboard may join the same Supabase project as a second tool later — not part of this build)

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP and tell the builder to re-run the Project Governor first. Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md — it is the current state. If missing, recreate it with the structure below, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content, repeat it back, treat it as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder: "Save point committed: [what changed]."
Never end a session without a save point.

First Session Setup (session 1 only — this repo already passed session 1 during the v2.0 build; skip if docs/ and the brand skill are already in place):
1. Create docs/ if it does not already exist. Move product-spec.md (v3.1) into it, replacing the v2.0 copy.
2. Install the brand skill at .claude/skills/the-corporate-brand/SKILL.md if not already present (installed during the v2.0 build).
3. Announce what moved, then commit and push before building anything.

PROGRESS.md structure: status header (Session / Last updated / Live URL), Current state, Last session, Remaining work, Build decisions, Known issues, Notes for next session.

## Commands
```
npx serve .
```

## Tech Stack
HTML · CSS · JavaScript · Netlify · Supabase
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is active — create the site, set environment variables, and deploy via MCP.

## Arms
Export — browser only, no server function — downloads The_Corporate_Supplier_Questionnaire_2026.xlsx from /public/assets/; sits as the second step of Door 2, after the Contact Step. The workbook now covers S2–S7 plus a closing Declaration section — its S1 section (legal name, primary contact, EcoVadis bypass question) has been removed entirely; that information is now captured by the Contact Step and by EcoVadis routing on the landing page.
Email — user-triggered — Netlify Function — fires when the supplier clicks Submit on either door's Review screen → sends a short confirmation ("We've received your submission.") to the contact_email captured in that door's Contact Step. No attachment, no answer summary. The database write and the email are independent — an email failure must never block or roll back the write.

## Environment Variables
SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var — insert-only per RLS, safe to expose client-side
SUPABASE_SERVICE_ROLE_KEY — Supabase: Project Settings → API → service role key — Netlify env var — created alongside the project; no stated use case in this build, so it stays unused. Never in code, never in the frontend.
RESEND_API_KEY — resend.com — Netlify env var, read by the Email Netlify Function — needs creating; see PROGRESS.md

This tool has no Supabase Edge Functions, so every key above is a Netlify environment variable — the Email Function and the frontend's direct Supabase insert both read from the same store. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "the-corporate-esg" — does not exist yet. At the start of the next session, confirm this name with the builder, then create the project via Supabase MCP before building anything. Region: EU (Frankfurt) — GDPR applies. Plan: Free — pauses after ~1 week without traffic; confirmed acceptable for now.

Build this schema — authoritative until docs/supabase-setup.md exists:
submissions: tracking_id (text, unique — TCS-YYYY-NNNN, database-level atomic sequence, never client-side), company_name, contact_name, contact_email, contact_phone, contact_job_title, submission_door (text: "Door 1" / "Door 2"), questionnaire_answers (jsonb), authorised_signatory_name (text), declaration_confirmed (boolean, CHECK constraint: declaration_confirmed = true), created_at (timestamp, default now())

RLS — build these policies, never skip:
submissions: anon — insert-only. No read, update, or delete access to any row, including the row it just inserted. service role — full access.

After setup, write docs/supabase-setup.md and update it at every save point that touches the database. It must contain: project name, project ID, project URL, plan, the table with field names and types (including the CHECK constraint), the RLS policy, and a last-updated line with date and session number. From the moment it exists, that file is the schema source of truth.

## Hard Rules
- API keys never in any frontend file or GitHub commit. Always called through the values above — never hardcoded.
- Netlify Identity: never. Supabase Auth is not in use in this version, and no other auth system is introduced.
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- declaration_confirmed must carry a database-level CHECK (declaration_confirmed = true) constraint on submissions. This is enforced in addition to, not instead of, the client-side Continue-button gating — a row must never be insertable without it even if the frontend check is bypassed.
- GDPR: the consent checkbox and the exact data statement (product-spec.md Section 7) are required on both Contact Steps before any data is submitted. Personal data collected, per the spec: company_name, contact_name, contact_email, contact_phone, contact_job_title. Deletion requests go to sustainability@thecorporate.com — The Corporate's team removes the row manually from the Supabase dashboard; no self-service deletion flow in this version.

## Business Rules
- Door 2 upload is all-or-nothing: any structural mismatch rejects outright with an on-screen explanation — no partial import, no row-by-row flagging. The structural check now validates against the S2–S7 + Declaration template, not the retired v2.0 S1–S7 template.
- S2–S7 fields, dropdowns, and validation rules are extracted from the real workbook in /public/assets/ at build time — never approximated as plain text. The workbook no longer has an S1 section, so Door 1's stepper starts at S2 (Climate & Decarbonisation); S7 Next leads to the Declaration step, not directly to Review.
- Both Contact Steps (Door 1 and Door 2) require all five fields — company_name, contact_name, contact_email, contact_phone, contact_job_title — plus the GDPR consent checkbox, before Continue unlocks. Identical validation on both doors.
- Declaration step (new, both doors): Authorised Signatory Name (required text) plus a required checkbox next to the workbook's declaration statement, standing in for signature/digital auth — no signature pad or file upload. Positioned after S7 (Door 1) / after Upload-Parse (Door 2), before Review. Continue is disabled until both are complete. The workbook's own Declaration row in an uploaded file is never trusted as authorization on Door 2 — the in-tool Declaration step is authoritative on both doors.
- The submission date is not a separate collected field — created_at serves as the Declaration's "Date."
- Submission gating rule (both doors): Submit stays disabled unless every Contact Step field is filled, the GDPR consent checkbox is checked, Authorised Signatory Name is filled, and the Declaration checkbox is checked.
- Both Review screens display the Contact Step and Declaration details as read-only summary blocks above the questionnaire sections (no Edit on either block; the supplier restarts the door to change them). Submit then writes contact fields + declaration fields + questionnaire_answers + auto-generated tracking_id + submission_door to `submissions`, sends the confirmation email, and proceeds to Confirmation — same sequence on both doors.
- tracking_id = "TCS-" + current year + "-" + zero-padded 4-digit sequential number, incrementing per submission within that year. No deduplication or company-matching — every submission gets a fresh ID.
- Both Review screens share one grouped-by-section read-only layout; only Door 1 Review has per-section Edit — Door 2 mismatches are fixed by re-uploading.
- Both doors converge on one shared Confirmation view; no print/save/export. It notes the confirmation email was sent; showing tracking_id there is optional.
- Closing or reloading the tab clears all in-progress questionnaire data (not data already submitted) — a returning supplier starts from the Door Picker.
- "Submit EcoVadis Scorecard" opens https://ecovadis.com in a new tab; copy-only logic — never gates or hides either route.
- "Contact EHS" mailto → sustainability@thecorporate.com, subject "Supplier Portal Help Desk Query".

Out of scope — do not build: login/authentication for suppliers or internal reviewers, an in-tool review dashboard (submissions are reviewed directly in the Supabase dashboard for now), print/save/export of the confirmation screen, automated EcoVadis scorecard validation, partial/flagged-row import on Door 2 mismatch, a submission tracker or response-rate dashboard, a self-service data deletion flow.

## Brand
Governed by .claude/skills/the-corporate-brand/SKILL.md — invoke for any UI work. Applies equally to the new Contact Step and Declaration views on both doors — no new visual patterns for them.
Hard rules that hold even if the skill isn't loaded:
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels)
- Colours: Ink #000000, Stone #B6B09F, Linen #EAE4D5, Chalk #F2F2F2, White #FFFFFF, Acid Lime #C8F135 — Lime max 2 uses/page, always against #000000
- Square corners, no shadows; cards use 0.5px Stone border on Linen or White
- No blue links — underline + Ink only; no exclamation points, no emoji

## Reference Docs
- docs/product-spec.md — Data Architecture (Section 5), RLS (Section 6), GDPR (Section 7), UI Structure (Section 8), Logic and the CHECK constraint (Section 9)
- docs/supabase-setup.md — schema source of truth (created this session)
- .claude/skills/the-corporate-brand/SKILL.md — full brand system
PROGRESS.md is read at every session start per the Session Protocol.
