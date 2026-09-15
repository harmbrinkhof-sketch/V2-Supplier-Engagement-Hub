# The Corporate Supplier Sustainability Portal 2026

## Identity
A public portal that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme, routing each supplier to EcoVadis, a guided in-tool questionnaire (Door 1), or a download/upload questionnaire (Door 2) — no login required. All three paths now open with a contact-capture step and persist to Supabase, including a new intake step for the EcoVadis path.
Tier: 2 — public form, no login required, submissions persist to Supabase (D3+A1)
Spec version governed: v3.2 — the version of docs/product-spec.md these rules were derived from.
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
1. Create docs/ if it does not already exist. Move product-spec.md (v3.2) into it, replacing the v3.1 copy.
2. Install the brand skill at .claude/skills/the-corporate-brand/SKILL.md if not already present (installed during the v2.0 build).
3. Announce what moved, then commit and push before building anything.

PROGRESS.md structure: status header (Session / Last updated / Live URL), Current state, Last session, Remaining work, Build decisions, Known issues, Notes for next session.

## Commands
```
npx serve .
```

## Tech Stack
HTML · CSS · JavaScript · Netlify · Supabase · Resend
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is active — create the site, set environment variables, and deploy via MCP.

## Arms
Export — browser only, no server function — downloads The_Corporate_Supplier_Questionnaire_2026.xlsx from /public/assets/; second step of Door 2, after the Contact Step. Workbook covers S2–S7 plus a closing Declaration; no S1 section.
Email — user-triggered — Netlify Function — fires when the supplier clicks Submit on Door 1 Review, Door 2 Review, or the EcoVadis Contact & Scorecard step → sends a short confirmation ("We've received your submission.") to that path's contact_email. No attachment, no answer summary, same content on all three paths. The database write and the email are independent — an email failure must never block or roll back the write.

## Environment Variables
SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / publishable key — Netlify env var — insert-only per RLS, safe to expose client-side
SUPABASE_SERVICE_ROLE_KEY — Supabase: Project Settings → API → service role key — Netlify env var — no stated use case in this build, stays unused. Never in code, never in the frontend.
RESEND_API_KEY — resend.com — Netlify env var, read by the Email Netlify Function — needs creating; see PROGRESS.md

This tool has no Supabase Edge Functions, so every key above is a Netlify environment variable. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "the-corporate-esg" — already exists. Project URL: https://wrylehuacuhwdvxajtdc.supabase.co
docs/supabase-setup.md is the schema source of truth. Read it before any database work. Never recreate tables or policies that already exist. Update it at every save point that touches the database.
Plan: Free — pauses after ~1 week without traffic; accepted.

Tables this tool uses:
submissions: id, tracking_id (unique, assigned by the existing assign_tracking_id trigger), company_name, contact_name, contact_email, contact_phone, contact_job_title, submission_door (CHECK Door 1/Door 2), questionnaire_answers (jsonb), authorised_signatory_name, declaration_confirmed (CHECK = true), created_at
RLS: anon — insert-only, no read/update/delete, not even on the row it just inserted. service_role — all.

New tables to create for this tool this session (then document in docs/supabase-setup.md):
ecovadis_submissions: tracking_id (unique, same shared sequence as submissions), company_name, contact_name, contact_email, contact_phone, contact_job_title, department, ecovadis_link, created_at
RLS: anon — insert-only, no read/update/delete. service_role — all.

Schema changes to make on the existing submissions table: add department (text, NOT NULL) — now a required Contact Step field on all three paths, not only EcoVadis.
tracking_id is one sequence shared across both tables: extend the existing assign_tracking_id trigger (or add an equivalent BEFORE INSERT trigger) so ecovadis_submissions draws from the same submission_counters per-year row as submissions — never a separate counter per table.

## Hard Rules
- API keys never in any frontend file or GitHub commit. Always called through the values above — never hardcoded.
- Netlify Identity: never. Supabase Auth is not in use in this version, and no other auth system is introduced.
- RLS: never disabled on any table, including the new ecovadis_submissions table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- declaration_confirmed must carry the existing database-level CHECK (declaration_confirmed = true) constraint on submissions, enforced in addition to, not instead of, client-side gating. ecovadis_submissions has no declaration field and needs no equivalent constraint.
- GDPR: the consent checkbox and the exact data statement (product-spec.md Section 7, verbatim) are required on all three paths — Door 1, Door 2, and EcoVadis — before any data is submitted. Personal data collected, per the spec: company_name, contact_name, contact_email, contact_phone, contact_job_title, department. Deletion requests go to sustainability@thecorporate.com — The Corporate's team removes the row manually from the Supabase dashboard; no self-service deletion flow.
- Supabase region is EU (Frankfurt) on the existing project — this cannot change.

## Business Rules
- Door 2 upload is all-or-nothing: any structural mismatch rejects outright with an on-screen explanation — no partial import, no row-by-row flagging. The structural check validates against the S2–S7 + Declaration template.
- S2–S7 fields, dropdowns, and validation rules are extracted from the real workbook in /public/assets/ at build time — never approximated as plain text. Door 1's stepper starts at S2 (Climate & Decarbonisation); S7 Next leads to the Declaration step, not directly to Review.
- All three Contact Steps (Door 1, Door 2, EcoVadis) require company_name, contact_name, contact_email, contact_phone, contact_job_title, and department, plus the GDPR consent checkbox, before Continue/Submit unlocks. Identical validation and copy across all three; the EcoVadis step adds one more required field, ecovadis_link (URL).
- Declaration step (Door 1 and Door 2 only — no equivalent on EcoVadis): Authorised Signatory Name (required text) plus a required checkbox next to the workbook's declaration statement, standing in for signature/digital auth. Positioned after S7 (Door 1) / after Upload-Parse (Door 2), before Review. The uploaded file's own Declaration row is never trusted as authorization on Door 2 — the in-tool step is authoritative on both doors.
- The submission date is not a separate collected field — created_at serves as the Declaration's "Date."
- Submission gating: Door 1/Door 2 Submit stays disabled unless every Contact Step field (including department) is filled, GDPR consent is checked, Authorised Signatory Name is filled, and the Declaration checkbox is checked. EcoVadis Submit stays disabled unless every Contact Step field (including department and ecovadis_link) is filled and GDPR consent is checked — there is no Declaration step on this path.
- Both Door Review screens display the Contact Step and Declaration details as read-only summary blocks above the questionnaire sections (no Edit on those blocks). Submit writes contact fields + declaration fields + questionnaire_answers + tracking_id + submission_door to submissions, sends the confirmation email, and proceeds to Confirmation.
- tracking_id = "TCS-" + current year + "-" + zero-padded 4-digit sequential number, one sequence shared across submissions and ecovadis_submissions — no deduplication or company-matching.
- Door 1 and Door 2 converge on one shared Confirmation view; no print/save/export. The EcoVadis path has no confirmation screen: on Submit it writes the row, sends the email, then redirects immediately to https://ecovadis.com in a new tab.
- Closing or reloading the tab clears all in-progress questionnaire data (not data already submitted) — a returning supplier starts from the Door Picker or landing page.
- "Submit EcoVadis Scorecard" on the landing page now opens the EcoVadis Contact & Scorecard step, not ecovadis.com directly. That step's own Submit is what performs the redirect, after the write and the email.
- "Contact EHS" mailto → sustainability@thecorporate.com, subject "Supplier Portal Help Desk Query".

Out of scope — do not build: login/authentication for suppliers or internal reviewers, an in-tool review dashboard, print/save/export of the confirmation screen, automated EcoVadis scorecard validation, partial/flagged-row import on Door 2 mismatch, a submission tracker or response-rate dashboard, a self-service data deletion flow.

## Brand
Governed by .claude/skills/the-corporate-brand/SKILL.md — invoke for any UI work. Applies equally to the EcoVadis Contact & Scorecard view — no new visual patterns for it.
Hard rules that hold even if the skill isn't loaded:
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels)
- Colours: Ink #000000, Stone #B6B09F, Linen #EAE4D5, Chalk #F2F2F2, White #FFFFFF, Acid Lime #C8F135 — Lime max 2 uses/page, always against #000000
- Square corners, no shadows; cards use 0.5px Stone border on Linen or White
- No blue links — underline + Ink only; no exclamation points, no emoji

## Reference Docs
- docs/product-spec.md — Data Architecture (Section 5), RLS (Section 6), GDPR (Section 7), UI Structure (Section 8), Logic (Section 9)
- docs/supabase-setup.md — schema source of truth (existing — read first)
- .claude/skills/the-corporate-brand/SKILL.md — full brand system
PROGRESS.md is read at every session start per the Session Protocol.
