# Product Spec — The Corporate Supplier Sustainability Portal 2026

**Version:** 2.0
**Date:** 03 September 2026
**Author:** Zyad Hatquai
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Sustainability Portal 2026

**What it does:** A public landing page that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme and routes each supplier to the correct submission path — an EcoVadis scorecard, or the ESRS-aligned questionnaire completed and submitted directly inside the tool.

**Who uses it:** Tier 1 supplier contacts — sustainability managers, EHS leads, and procurement representatives at supplier organisations — who receive the URL directly from The Corporate's procurement or EHS team.

**Why it exists:** To formally launch The Corporate's 2026 supplier sustainability assessment without requiring direct explanation from the internal team, and to let suppliers submit the questionnaire through the portal itself instead of an email exchange.

**Build status:** Iteration — previous version (v1.0, supplier_onboarding.html) offered the questionnaire as a static Excel download returned by email. This build replaces that email exchange with two in-tool submission doors, so supplier data arrives through the tool itself.

---

## Section 2 — Classification

### Data Model

**Decision:** D2

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | Yes |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | No |

**Reason:** This build validates the submission UX and logic, not real data capture. Suppliers type answers (Door 1) or upload a file that is parsed (Door 2) entirely in the browser; nothing is transmitted or written to a database, and everything is lost when the tab closes. No email is sent either — the on-screen confirmation is the entire scope of this build.

**D3 triggers — none apply:**
- [ ] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [ ] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later — **explicitly confirmed not required for this build**; the uploaded workbook is parsed client-side for the review screen and then discarded

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** Unchanged from v1.0 — the portal is distributed to Tier 1 suppliers as a direct link. No account or login is required.

---

### Tier

**Tier:** 1

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

D2+A1 → Tier 1. Unchanged from v1.0 — still Netlify only, no backend, no database.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool.

---

## Section 3 — Arms

Arms are capabilities added to the tool. They do not change the tier.

### AI API Arm

**Active:** No

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | XLSX |
| What is exported | A pre-formatted Excel workbook — The Corporate Supplier Questionnaire 2026. Contains 7 sections mapped to ESRS: S1 General Information and EcoVadis Bypass, S2 Climate and Decarbonisation (E1), S3 Pollution and PFAS (E2), S4 Water and Marine Resources (E3), S5 Circular Economy and Waste (E5), S6 Biodiversity and Ecosystems (E4), S7 Social, Labour and Governance (S2, G1). The file is served as a static asset — no data is populated server-side. **Change from v1.0:** this download button no longer lives directly under the Excel Questionnaire route — it now lives inside Door 2 (see Section 8), as the first step of that door's flow, before the supplier uploads their completed copy back. |
| PDF design intent | N/A — format is XLSX only |

---

### Email Arm

**Active:** No — explicitly removed from this build. No email is sent at any point in either submission door; the on-screen confirmation is the only output.

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | HTML/CSS/JS — single-page, static, with client-side JS state management driving the door picker, the Door 1 stepper, and the Door 2 upload/parse/review flow. No routing, no backend, no framework build step. |
| Deployment target | Netlify |
| Netlify MCP | Carried forward as an open question from v1.0 — confirm before the build session (see Section 15) |

**GitHub — pre-build requirement:**
The builder creates the GitHub repo before the first Claude Code session. product-spec.md, CLAUDE.md, and PROGRESS.md must be uploaded to the repo root before Claude Code opens. Claude Code commits changes regularly and pushes to main. It does not create or configure the repo.

---

## Section 5 — Data Architecture

N/A — Data Model is D2. No database. All questionnaire data (typed via Door 1 or parsed from a Door 2 upload) lives only in browser memory (JS state) for the duration of the session and is discarded when the tab closes or reloads. Nothing is written to disk, a database, or transmitted to any server or third party.

---

## Section 6 — Access and Permissions

N/A — Access Model is A1. No authentication, no roles, no RLS.

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — this tool is D2. Questionnaire answers may include company and contact information (via S1 General Information), but that data is never persisted to a database or transmitted anywhere; it exists only in the browser for the current session and disappears when the tab closes. No form submission reaches any server.

---

## Section 8 — Screen and UI Structure

### Landing Page (single scrolling view — unchanged from v1.0)

**Purpose:** Route Tier 1 suppliers to the correct submission path and communicate The Corporate's sustainability expectations.

**What is visible (top to bottom):** Navigation bar, Hero section, "Why We Are Asking" section, "Two Routes. One Destination." section, "What Happens Next" timeline, "Key Resources" section, Footer. Content and copy are unchanged from v1.0 with one exception: the "Full Questionnaire" card under Two Routes.

**Two Routes card — Card 2 (updated):**
- Label: "FULL QUESTIONNAIRE"
- Description: explains that suppliers without an EcoVadis scorecard complete the ESRS-aligned questionnaire and submit it directly through the portal — no email required
- CTA button ("Start Questionnaire") — no longer downloads a file directly; instead navigates to the **Door Picker** view

**User actions on this view:** Click "Submit EcoVadis Scorecard" (opens ecovadis.com in a new tab, unchanged), click "Start Questionnaire" (goes to Door Picker), click resource links, click "Contact EHS" mailto link, scroll.

---

### Door Picker

- **Purpose:** Let the supplier choose how they want to complete the questionnaire.
- **What is visible:** Short explanatory heading (e.g. "How would you like to complete this?"), two option cards side by side (stacks on mobile):
  - Door 1 card — "Fill In The Tool": guided, section-by-section form inside the portal. CTA: "Start Guided Form"
  - Door 2 card — "Download & Upload": download the workbook, complete it offline (including with colleagues), upload it back. CTA: "Download & Upload"
  - A back link/button to return to the landing page
- **User actions:** Click Door 1 CTA → Door 1, Section 1 view. Click Door 2 CTA → Door 2, Download & Upload view. Click back → Landing Page.
- **What happens next:** Selecting a door begins that door's flow. Nothing is saved from this view itself.

---

### Door 1 — Guided Form (S1–S7 stepper)

- **Purpose:** Let the supplier answer the questionnaire section by section directly in the browser, mirroring the structure of the Excel workbook.
- **What is visible:** A progress indicator showing sections S1–S7 and current position; the fields for the current section only, styled and validated to match the source workbook (see Section 9 — exact fields, dropdowns, and validation rules are extracted from the real workbook at build time, not hand-specified here); "Back" and "Next" navigation; on the final section, "Next" leads to the Door 1 Review screen instead of another section.
- **User actions:** Fill in fields for the current section, move forward or back between sections, abandon (return to Door Picker or Landing Page — any progress is lost, consistent with D2).
- **What happens next:** After S7, the supplier reaches the Door 1 Review screen.

### Door 1 — Review

- **Purpose:** Let the supplier check everything they entered before final submission.
- **What is visible:** All S1–S7 answers laid out read-only, grouped by section, with an "Edit" affordance that returns to the relevant section of the stepper; a final "Submit" action.
- **User actions:** Review answers, jump back to edit any section, or submit.
- **What happens next:** Clicking Submit moves to the shared Confirmation view (see below). No data is transmitted — this is a client-side state transition only.

---

### Door 2 — Download & Upload

- **Purpose:** Let the supplier download the workbook, complete it offline (including with multiple colleagues contributing), and upload the completed file back into the portal.
- **What is visible:** Explanation of the flow, the "Download Assessment" button (triggers download of The_Corporate_Supplier_Questionnaire_2026.xlsx from the project's static assets — the same file and button behaviour as v1.0's download, relocated here), and a file upload control accepting the completed workbook (.xlsx) or its CSV export.
- **User actions:** Download the blank workbook, or upload a completed file.
- **What happens next:**
  - **On a matching upload:** the tool parses the file client-side and moves to the Door 2 Review screen.
  - **On a non-matching upload** (wrong file, wrong structure, doesn't match the expected template): the tool rejects the file outright with a clear explanation of why, and the supplier stays on this screen to try again. No partial import, no flagged rows — all or nothing.

### Door 2 — Review

- **Purpose:** Let the supplier check what the tool read from their uploaded file before final submission.
- **What is visible:** The parsed S1–S7 answers laid out read-only, grouped by section, in the same format as the Door 1 Review screen; a final "Submit" action. No "Edit" affordance — if something is wrong, the supplier corrects the workbook and re-uploads.
- **User actions:** Review parsed answers, re-upload a different file, or submit.
- **What happens next:** Clicking Submit moves to the shared Confirmation view. No data is transmitted.

---

### Confirmation (shared by both doors)

- **Purpose:** Give the supplier a clear, immediate on-screen record that their submission was received by the tool.
- **What is visible:** A confirmation heading, a summary of what was submitted (section-by-section, same grouped format as the review screens), which door was used, and plain-language copy noting this confirms their submission is complete. No print/save/export affordance on this screen — confirmed out of scope for this build (see Section 12).
- **User actions:** None beyond closing the tab or navigating back to the landing page. There is nothing further to do.
- **What happens next:** Nothing — this is the end state. Closing the tab or reloading clears everything, consistent with D2.

---

## Section 9 — Logic and Calculations

This tool contains no scoring or numeric calculations. Its logic is entirely about form flow, parsing, and validation.

**Door 2 file validation:**
- **Inputs:** an uploaded .xlsx workbook or its CSV export
- **Rules:** the tool checks the uploaded file's structure against the expected S1–S7 template (sheet/column structure for XLSX, header structure for CSV export). If it matches, the tool parses every answer into the same in-memory shape used by Door 1 and proceeds to the Door 2 Review screen. If it does not match, the upload is rejected outright with an on-screen explanation of the mismatch — no partial import, no row-by-row flagging.
- **Output:** either a fully parsed set of S1–S7 answers ready for review, or an outright rejection with explanation.
- **Edge cases:** empty file, wrong file type, a workbook from a different questionnaire version, a partially completed workbook (still accepted structurally — partial completion is a content issue, not a structural one, and is visible to the supplier on the review screen before they submit).

**Field-level rules for S1–S7 (Door 1 and Door 2 parsing):** exact fields, dropdown option lists, and validation rules (required/optional, format, ranges) are extracted from the real Excel workbook at build time by Claude Code, and must be replicated faithfully rather than approximated as plain text inputs. This spec intentionally does not hand-write the field list.

The EcoVadis route's logic — "if you have a valid scorecard, you may skip the full questionnaire" — is unchanged from v1.0 and remains communicated in copy only; the tool does not gate or hide either route.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** the-corporate-brand skill file — upload flat to the repo root before the build session. Claude Code installs it to .claude/skills/ in First Session Setup. Unchanged from v1.0.

**Visual feel:** Corporate minimalism — restraint over decoration. Precise, direct, composed, authoritative. No gradients, no shadows, no rounded corners.

**Key brand rules Claude Code must enforce throughout (unchanged from v1.0):**
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels/emphasis) — import from Google Fonts CDN
- Colours: Ink (#000000), Stone (#B6B09F), Linen (#EAE4D5), Chalk (#F2F2F2), White (#FFFFFF), Acid Lime (#C8F135)
- Acid Lime: maximum 2 uses per page. Always against #000000 (never directly on light backgrounds).
- Buttons: square corners (border-radius: 0), no shadows
- Cards: square corners, 0.5px Stone border, Linen or White background
- No blue links — underline + Ink colour only
- All copy follows The Corporate voice rules: short declarative sentences, active voice, no exclamation points, no emoji
- **Applies equally to the new views:** Door Picker cards, the S1–S7 stepper, both Review screens, and the Confirmation screen must all follow these same rules — no new visual patterns introduced for the new flow.

---

## Section 11 — API and Credentials

This tool requires no external services and no API keys.

| Service | What it does | Key required | Where stored |
|---------|-------------|-------------|-------------|
| None | — | — | — |

The Excel file is served as a static asset in the project's /assets/ folder. The EcoVadis button is a hardcoded URL. The Contact EHS button is a mailto: link. File parsing for Door 2 (XLSX/CSV) happens entirely client-side in the browser — no server-side function, no API call, and no environment variable is required for this tool.

**Credentials readiness:** Nothing to prepare before the build session.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Real submission capture — persisting supplier answers to a database | This build validates the two-door UX and logic only; adding persistence is a deliberate future step (moves to D3, Tier 2) |
| Email notification on submission | Explicitly out of scope for this build — no email arm |
| Print/save/export of the confirmation screen | Explicitly confirmed out of scope — the on-screen confirmation is sufficient for this build |
| Internal review dashboard — procurement/EHS team reviews submissions in a tool | Requires a separate Tier 2 or Tier 3 tool in a stack; not needed to validate the supplier submission flow |
| Submission tracker — shows % of Tier 1 suppliers who have responded | Requires D3 and likely a supplier roster; deferred to a future internal review tool |
| Supplier login and saved progress | Moves the tool to a higher tier; deferred to a future build iteration |
| Automated EcoVadis scorecard validation | Requires EcoVadis API access; deferred pending API availability |
| Partial/flagged-row import on Door 2 mismatch | This build uses all-or-nothing rejection by design, not a limitation to revisit lightly |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Landing page renders unchanged aside from the updated Questionnaire card | All 7 original content sections render correctly; "Start Questionnaire" CTA replaces the old direct download | [ ] |
| 2 | "Submit EcoVadis Scorecard" still opens the correct URL in a new tab | Clicking opens https://ecovadis.com in a new tab; original tab remains on the portal | [ ] |
| 3 | "Start Questionnaire" leads to the Door Picker | Door Picker view renders with both door options and a back path to the landing page | [ ] |
| 4 | Door 1 stepper walks through all 7 sections in order | S1 through S7 render in order with fields, dropdowns, and validation matching the real workbook; Back/Next work correctly | [ ] |
| 5 | Door 1 Review screen shows all entered answers and allows editing | Every answer entered in the stepper appears correctly grouped by section; Edit returns to the correct section | [ ] |
| 6 | Door 2 download button works and matches v1.0 behaviour | Clicking triggers download of The_Corporate_Supplier_Questionnaire_2026.xlsx | [ ] |
| 7 | Door 2 accepts a matching upload and parses it correctly | Uploading a correctly structured .xlsx or CSV export produces a Review screen with accurately parsed answers | [ ] |
| 8 | Door 2 rejects a non-matching upload outright | Uploading a mismatched or unrelated file is rejected with a clear on-screen explanation; no partial data is shown | [ ] |
| 9 | Both doors converge on the same Confirmation screen after Submit | Confirmation shows a section-by-section summary of what was submitted and which door was used; no print/save option present | [ ] |
| 10 | No network calls are made on submission | Submitting via either door triggers no server request, no email, and no data storage — confirmed via browser network inspection | [ ] |
| 11 | Closing or reloading the tab at any point clears all in-progress data | Reopening the portal after a reload starts fresh with no leftover state | [ ] |
| 12 | Brand identity is applied correctly across all views, including the new ones | Playfair Display headlines, DM Sans body, correct colour tokens, square corners, Acid Lime used at most twice per page | [ ] |
| 13 | "Contact EHS" link still opens email client with pre-filled fields | Mailto opens with recipient sustainability@thecorporate.com and subject "Supplier Portal Help Desk Query" | [ ] |
| 14 | Page and all new views are fully responsive on mobile | Door Picker, stepper, review screens, and confirmation all render correctly and remain usable below 768px, no horizontal overflow | [ ] |
| 15 | Tool deploys to Netlify and is accessible at the live URL | Live URL loads correctly on desktop and mobile; no 404 errors; Excel file downloads correctly from the deployed site | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 1

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder (or existing v1.0 repo reused)
- [ ] product-spec.md uploaded to the GitHub repo root (replacing v1.0)
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] the-corporate-brand skill file present in the repo (unchanged from v1.0)
- [ ] The_Corporate_Supplier_Questionnaire_2026.xlsx present in /assets/ (or equivalent static folder) — this is also the source Claude Code reads at build time to extract Door 1/Door 2 field structure, dropdowns, and validation rules
- [ ] Netlify connected to the GitHub repo (skip if Netlify MCP is active)
- [ ] No credentials to prepare for this tool

---

### Tier 1 — build session

- [ ] Open Claude Code in the project folder (GitHub repo connected to Netlify)
- [ ] Claude Code runs First Session Setup: creates docs/, moves reference files, installs the-corporate-brand skill to .claude/skills/ (if not already installed from v1.0)
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] Claude Code reads The_Corporate_Supplier_Questionnaire_2026.xlsx and extracts the exact S1–S7 fields, dropdowns, and validation rules for the guided form and the Door 2 parser
- [ ] Claude Code builds the Door Picker, Door 1 stepper + review, Door 2 upload/parse + review, and the shared Confirmation view, all as client-side state on the existing single page
- [ ] Claude Code confirms document URLs for "View Document" and "View Policy" carry forward from v1.0 (or leaves as # if still unresolved)
- [ ] Claude Code builds the tool
- [ ] Test locally before deploying — including a mismatched-file upload to Door 2 to confirm outright rejection behaviour
- [ ] **If Netlify MCP active:** Claude Code deploys automatically
- [ ] **If Netlify MCP not active:** push to main → Netlify deploys automatically

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Is Netlify MCP active — is Netlify connected via Claude Desktop Connectors for this project? | Builder — confirm before opening Claude Code | No — can deploy manually if not active |
| What is the deployed URL for this tool? | Builder | No — can be confirmed after first deployment |
| What is the real URL for the Supplier Code of Conduct document? | Builder — carried forward from v1.0 | No — Claude Code will leave as # and flag for builder to update |
| What is the real URL for the Global Environmental Policy document? | Builder — carried forward from v1.0 | No — Claude Code will leave as # and flag for builder to update |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 12 June 2026 | Retroactive spec of the existing supplier onboarding landing page (supplier_onboarding.html). Excel questionnaire offered as a static download, returned by the supplier via email. |
| v2.0 | 03 September 2026 | Questionnaire route upgraded from download-and-email to two in-tool submission doors: Door 1 (guided S1–S7 form) and Door 2 (download, complete offline, upload back as XLSX or CSV export, parsed client-side). Both doors converge on a review screen and a shared on-screen confirmation. No email arm, no persistence — stays D2+A1, Tier 1. EcoVadis route (Route 1) unchanged. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
