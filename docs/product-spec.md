# Product Spec — The Corporate Supplier Sustainability Portal 2026

**Version:** 3.2
**Date:** 15 September 2026
**Author:** Harm
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Sustainability Portal 2026

**What it does:** A public landing page that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme and routes each supplier to the correct submission path — an EcoVadis scorecard, or the ESRS-aligned questionnaire completed and submitted directly inside the tool. Submissions are now written to a database so The Corporate can retain and review them. All three paths — EcoVadis, Door 1, and Door 2 — now open with a company/contact capture step (including a new EcoVadis Scorecard Link field on the EcoVadis path) before anything else happens.

**Who uses it:** Tier 1 supplier contacts — sustainability managers, EHS leads, and procurement representatives at supplier organisations — who receive the URL directly from The Corporate's procurement or EHS team.

**Why it exists:** To formally launch The Corporate's 2026 supplier sustainability assessment without requiring direct explanation from the internal team, to let suppliers submit the questionnaire through the portal itself instead of an email exchange, and — as of this version — to let The Corporate actually retain what suppliers submit, across all three submission paths, instead of it disappearing when the tab closes (or, for EcoVadis, not being captured at all).

**Build status:** Iteration — v2.0 offered two in-tool submission doors (a guided form and a download/upload flow) but data was session-only and lost on tab close; the EcoVadis path was a plain outbound link with no data capture. v3.0/v3.1 added a database, Contact Step, and Declaration step to Door 1 and Door 2. This version (v3.2) extends contact capture to the EcoVadis path as well — it is no longer a bare link, but its own short intake form that saves to the database before redirecting to EcoVadis.

---

## Section 2 — Classification

This section defines the architecture of the tool. Every downstream decision follows from this.

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** The Corporate needs to actually retain and review supplier submissions after the tab closes, so the data must be written to a database rather than discarded at the end of the session.

**D3 is triggered — checked:**
- [x] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another — the supplier's submission must be visible to The Corporate
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later — unchanged from v2.0: the Door 2 upload is still parsed client-side and discarded, not stored

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** Unchanged from v2.0 — the portal is distributed to Tier 1 suppliers as a direct link. No login is introduced in this version. The database schema must be built so a login layer (for an internal review interface) can be added in a future version without a rebuild — see Section 12.

> **Promotion rule:** does not apply here — A1 is unchanged; D3 is triggered directly by the persistence requirement (Section 2, Data Model), not by an auth upgrade.

---

### Tier

**Tier:** 2

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

D3+A1 → Tier 2. This is a change from v2.0's Tier 1 classification — the tool now requires a Supabase database, but still no authentication.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool today. Note for the future: an internal review dashboard (deferred, see Section 12) would likely share this same Supabase project (`the-corporate-esg`) as a second tool in a stack, at which point this classification should be revisited.

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
| What is exported | A pre-formatted Excel workbook, The Corporate Supplier Questionnaire 2026, covering S2–S7 mapped to ESRS plus a closing Declaration section. Served as a static asset, no server-side population. **Change from v2.0:** the download button now sits after the new Contact Step, as the second step of Door 2 (Contact Step → Download → Upload). The workbook's S1 section (legal name, primary contact, EcoVadis bypass question) has been removed entirely — that information is now captured by the Contact Step, and EcoVadis routing happens on the landing page before a supplier ever reaches a door. |
| PDF design intent | N/A — format is XLSX only |

---

### Email Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Trigger event | Supplier clicks Submit on either door's Review screen, or Submit on the EcoVadis intake form |
| Recipient | The supplier's own contact email, as captured in that path's Contact Step |
| Email content | Short confirmation only — "We've received your submission." No summary of submitted answers, no attachment. Same content on all three paths. |
| File attachment in transit | No |
| Function placement | Netlify Function — user-triggered |

> The submission write to the database and the confirmation email are independent: if the email fails to send, the submission is still saved. Email failure must never block or roll back the database write.
>
> Resend is the email service for this framework. **Credential status: not yet available — needs creating.** This is a pre-build blocking item; see Section 11 and Section 15.

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | HTML/CSS/JS — unchanged from v2.0. Single static page with client-side view switching (Landing, Door Picker, each door's Contact Step, stepper/upload flow, Review, Confirmation). No routing, no build step. |
| Deployment target | Netlify |
| Netlify MCP | Active — Claude Code creates the site, sets environment variables, and deploys automatically. |

**GitHub — pre-build requirement:**
The builder creates or reuses the existing GitHub repo before the Claude Code session. product-spec.md, CLAUDE.md, and PROGRESS.md must be uploaded to the repo root before Claude Code opens. Claude Code commits changes regularly and pushes to main; it does not create or configure the repo.

---

### Supabase project

**Supabase project status:** New — Claude Code will create it at the start of the build session.

**Supabase plan:** Free — pauses after roughly one week of no traffic. Confirmed acceptable for now.

| Detail | Answer |
|--------|--------|
| Proposed project name | `the-corporate-esg` |
| Confirmed project name | `the-corporate-esg` — named after the organisational context, not this specific tool, so it can hold future Corporate tools (e.g. a later internal review dashboard) |

> Claude Code will pause at the start of the session, confirm the project name, and create the Supabase project via MCP before building anything. The project ID will be recorded in `docs/supabase-setup.md` once created.

**supabase-setup.md:** Created by Claude Code at the end of the build session; lives in `docs/`; records project name, project ID, all tables and fields, RLS policies, and auth configuration. This is the schema source of truth for any future build session — including a later login layer or review dashboard.

---

## Section 5 — Data Architecture

### Data collected or stored

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| tracking_id | Internal tracking ID | Text | Automatic — generated on submit, format `TCS-2026-0001` (prefix + year + sequential), never shown to or entered by the supplier | Yes |
| company_name | Company name | Text | Supplier — Contact Step | Yes |
| contact_name | Contact name | Text | Supplier — Contact Step | Yes |
| contact_email | Contact email | Text | Supplier — Contact Step | Yes |
| contact_phone | Contact phone | Text | Supplier — Contact Step | Yes |
| contact_job_title | Job title / role | Text | Supplier — Contact Step | Yes |
| department | Department | Text | Supplier — Contact Step | Yes |
| submission_door | Which door was used | Text (Door 1 / Door 2) | Automatic — set by which flow the supplier completed | Yes |
| questionnaire_answers | S2–S7 questionnaire answers | Structured (JSON, keyed to the same field IDs already extracted from the workbook for the front-end field model) | Supplier — via Door 1 stepper or Door 2 upload/parse | Answers are optional per the workbook's own required/conditional rules (unchanged from v2.0); the Contact Step and Declaration fields are the only fields required to proceed |
| authorised_signatory_name | Authorised signatory name | Text | Supplier — Declaration step, final step before Submit on both doors | Yes |
| declaration_confirmed | Declaration acknowledged | Boolean | Supplier — Declaration step checkbox, tied to the workbook's declaration statement ("I confirm that the information provided in this assessment is accurate and complete...") | Yes — must be `true` to submit |
| created_at | Submission timestamp | Timestamp | Automatic | Yes — also serves as the Declaration's "Date," which is not collected as a separate field to avoid it drifting from the actual submission time |

**EcoVadis path — separate field set (own table, see below):**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| tracking_id | Internal tracking ID | Text | Automatic — same format and sequence as the `submissions` table, for consistent tracking across all three paths | Yes |
| company_name | Company name | Text | Supplier — EcoVadis intake form | Yes |
| contact_name | Contact full name | Text | Supplier — EcoVadis intake form | Yes |
| contact_email | Contact email | Text | Supplier — EcoVadis intake form | Yes |
| contact_phone | Contact phone | Text | Supplier — EcoVadis intake form | Yes |
| contact_job_title | Job title | Text | Supplier — EcoVadis intake form | Yes |
| department | Department | Text | Supplier — EcoVadis intake form | Yes |
| ecovadis_link | EcoVadis Scorecard link | Text (URL) | Supplier — EcoVadis intake form | Yes |
| created_at | Submission timestamp | Timestamp | Automatic | Yes |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| submissions | One row per Door 1/Door 2 submission, contact details plus questionnaire and declaration answers | tracking_id, company_name, contact_email, submission_door, questionnaire_answers, declaration_confirmed, created_at |
| ecovadis_submissions | One row per EcoVadis-path submission, contact details plus the scorecard link — no questionnaire or declaration data | tracking_id, company_name, contact_email, ecovadis_link, created_at |

**File storage:** No — unchanged from v2.0. The Door 2 upload is still parsed client-side in the browser; only the parsed answers are written to the database, and the uploaded file itself is not stored.

**Derived or calculated data:** Yes — `tracking_id` is system-generated on insert (not derived from other stored fields): prefix `TCS`, current year, sequential 4-digit number reset per calendar year. Every submission gets a fresh ID; the tool makes no attempt to recognise a repeat submission from the same company.

---

## Section 6 — Access and Permissions

**N/A** — Access Model is A1, no authentication is introduced in this version.

**Mandatory RLS baseline for this D3+A1 tool (Claude Code must enforce even though no login exists):**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|------------|
| submissions | Unauthenticated (anon) | No | Yes | No | No |
| submissions | Service role | All rows | Yes | Yes | Yes |
| ecovadis_submissions | Unauthenticated (anon) | No | Yes | No | No |
| ecovadis_submissions | Service role | All rows | Yes | Yes | Yes |

The anon key (used by the public portal) may only insert new rows into either table — it must never be able to read, update, or delete any row, including the row it just inserted. This prevents one supplier from ever seeing another supplier's data through the public site, and keeps the schema clean for a future login-gated review role (Section 12) to be added as an additional RLS row later, without restructuring either table.

---

## Section 7 — GDPR

**GDPR outcome:** Applies — personal data is collected through the Contact Step on all three paths (Door 1, Door 2, and the EcoVadis intake form).

**Personal data collected:**
Company name, contact name, contact email, contact phone, job title, department.

**Consent checkpoint on the form:** Yes — a checkbox and the data statement below must appear before the supplier can proceed, on all three paths.

**Data statement text shown to users at the point of collection (verbatim, identical wording on all three paths):**
> "Your data will be stored securely and used only to process and review your company's sustainability assessment submission for The Corporate's supplier program. You can request deletion at any time by contacting sustainability@thecorporate.com."

**Consent checkbox label (verbatim, identical wording on all three paths):**
> "I have read the statement above and consent to The Corporate storing and processing these details."

**Deletion mechanism:**
A supplier contacts sustainability@thecorporate.com to request deletion. The Corporate's team processes the request manually by removing the corresponding row from the `submissions` or `ecovadis_submissions` table in the Supabase dashboard. No self-service deletion flow exists in this version.

---

## Section 8 — Screen and UI Structure

### Landing Page
- **Purpose:** Routes suppliers to the EcoVadis path or the questionnaire.
- **What is visible / user actions / what happens next:** "Start Questionnaire" leads to the Door Picker, unchanged. **Change from v2.0:** "Submit EcoVadis Scorecard" no longer opens https://ecovadis.com directly — it now leads to the new EcoVadis Contact & Scorecard step below.

### Door Picker
- **Purpose:** Unchanged from v2.0 — lets the supplier choose Door 1 (fill in the tool) or Door 2 (download and upload).
- **What is visible / user actions / what happens next:** Unchanged, plus a back link to the landing page.

### EcoVadis Path — Contact & Scorecard Capture (new)
- **Purpose:** Capture who the submission is from and their scorecard link before redirecting to EcoVadis, so The Corporate has a record of every supplier who claims EcoVadis coverage — this data previously wasn't captured at all.
- **What is visible:** Intro copy: "We need your company and contact details, and a link to your current EcoVadis Scorecard, before we send you across to EcoVadis. This takes about two minutes." Fields: Company Name, Contact Full Name, Contact Email, Contact Phone, Job Title, Department (all required) — same field set as Door 1/Door 2's Contact Step, plus one additional required field, EcoVadis Scorecard Link (URL, with helper text "Paste the full URL of your current scorecard, issued within the last 12 months."). The GDPR data statement and consent checkbox (Section 7 wording, verbatim) appear below the fields. A Submit button.
- **User actions:** Fill in all six contact fields plus the scorecard link, and check the consent box.
- **What happens next:** Submit is disabled until every field is filled and the consent box is checked. On Submit, the record (contact fields + ecovadis_link + auto-generated tracking_id) is written to the `ecovadis_submissions` table, the confirmation email is sent to contact_email, and the browser is redirected immediately to https://ecovadis.com in a new tab. No confirmation screen is shown on the portal itself before the redirect.

### Door 1 — Contact Step (new)
- **Purpose:** Capture who the submission is from before any questionnaire content is shown.
- **What is visible:** Fields for company name, contact name, contact email, contact phone, job title, department; the GDPR consent checkbox and data statement text (Section 7, verbatim wording); a Continue button.
- **User actions:** Fill in all six fields (all required) and check the consent box.
- **What happens next:** Continue is disabled until all fields are filled and the consent box is checked. On Continue, the supplier proceeds to the S2–S7 stepper. These contact values are held in memory and attached to the submission on final Submit.

### Door 1 — S2–S7 Stepper
- **Purpose:** Guided section-by-section questionnaire matching the real workbook.
- **What is visible / user actions:** Otherwise unchanged from v2.0. Claude Code extracts S2–S7 fields from the updated workbook, which no longer contains an S1 section — the stepper now starts at S2 (Climate & Decarbonisation).
- **What happens next:** S7 Next leads to the Declaration step (see below), not directly to Door 1 Review.

### Door 1 — Declaration (new)
- **Purpose:** Final self-attestation before submission, sourced from the workbook's closing Declaration row.
- **What is visible:** Authorised Signatory Name (text field, required); the declaration statement from the workbook ("I confirm that the information provided in this assessment is accurate and complete to the best of my knowledge") shown as static text; a required checkbox next to it standing in for "Signature / Digital Auth" — no signature pad or file upload. The submission date is not shown as an editable field; it is set automatically from the submission timestamp.
- **User actions:** Enter the signatory name and check the declaration checkbox.
- **What happens next:** Continue is disabled until both the name is filled and the checkbox is checked. On Continue, the supplier proceeds to Door 1 Review.

### Door 1 — Review
- **Purpose:** Unchanged from v2.0 — grouped read-only display of all answers, with per-section Edit.
- **What is visible:** Now also displays the Contact Step details (company, contact name, email, phone, job title, department) and the Declaration details (signatory name, declaration checkbox state) as read-only summary blocks above the questionnaire sections; no Edit is offered on either block (the supplier restarts the door to change it, consistent with v2.0's no-going-back-past-doors behaviour).
- **User actions / what happens next:** Submit writes the full record (contact fields + declaration fields + questionnaire answers + auto-generated tracking_id + submission_door = "Door 1") to the `submissions` table, sends the confirmation email to contact_email, then proceeds to Confirmation.

### Door 2 — Contact Step (new)
- **Purpose:** Same as Door 1's Contact Step, but positioned before the workbook download.
- **What is visible / user actions:** Identical field set, validation, and consent checkbox as Door 1's Contact Step.
- **What happens next:** On Continue, the supplier proceeds to the Download step (workbook download button, unchanged from v2.0 other than its new position after this step).

### Door 2 — Download / Upload / Parse
- **Purpose:** Download blank workbook, then upload the completed .xlsx or CSV export for client-side parsing.
- **What is visible / user actions / what happens next:** Otherwise unchanged from v2.0. All-or-nothing structural rejection on mismatch, unchanged. **Change from v2.0:** the downloaded workbook no longer has an S1 section, so the structural check validates against the updated S2–S7 + Declaration template, not the v2.0 one. The workbook's own Declaration row (Authorised Signatory Name, Date, Signature/Digital Auth) is present in the file and the supplier may fill it in offline as part of completing the workbook, but those cells are not what the tool relies on to authorise submission — see the in-tool Declaration step below, which mirrors Door 1's for consistency.

### Door 2 — Declaration (new)
- **Purpose:** Same self-attestation requirement as Door 1's Declaration step, applied here instead of trusting the free-text cells in the uploaded file — an uploaded "Signature/Digital Auth" cell can contain anything, so it can't be relied on as a real yes/no gate.
- **What is visible / user actions / what happens next:** Identical to Door 1's Declaration step — Authorised Signatory Name field and the required declaration checkbox, positioned after Upload/Parse and before Door 2 Review. Continue is disabled until both are complete.

### Door 2 — Review
- **Purpose:** Unchanged from v2.0 — grouped read-only parsed answers, no Edit.
- **What is visible:** Now also displays the Contact Step and Declaration details as read-only summary blocks, same treatment as Door 1 Review.
- **User actions / what happens next:** Submit writes the full record (contact fields + declaration fields + parsed answers + auto-generated tracking_id + submission_door = "Door 2") to the `submissions` table, sends the confirmation email to contact_email, then proceeds to Confirmation.

### Confirmation
- **Purpose:** Unchanged from v2.0 — shared by both doors, section-by-section summary, no print/save/export.
- **What is visible:** Unchanged, plus a note that a confirmation email has been sent to the contact email provided. Displaying the tracking_id here is optional at Claude Code's discretion for supplier reference, but it is not required.
- **User actions / what happens next:** No further action; this is the terminal view.

---

## Section 9 — Logic and Calculations

**What is calculated or scored:** No scoring or assessment logic. The only generated value is the internal tracking ID.

**Inputs:** None from the supplier — generated automatically on submit.

**Formula or rules:** `tracking_id` = `TCS-` + current calendar year + `-` + zero-padded 4-digit sequential number, incrementing per submission within that year (e.g. `TCS-2026-0001`, `TCS-2026-0002`). The sequence is shared across `submissions` and `ecovadis_submissions` — one continuous count of every submission The Corporate receives regardless of path — not a separate sequence per table. No deduplication or company-matching logic — every submission receives a new ID regardless of whether the same company has submitted before.

**Output:** A unique tracking_id string stored with each row, in either `submissions` or `ecovadis_submissions`.

**Edge cases:** If two submissions arrive concurrently — including one on each table at once — the shared sequence must not produce duplicate IDs. Claude Code should implement this as a single database-level sequence (or equivalent atomic increment) that both tables draw from, not a client-side counter and not two independent per-table sequences.

**Submission gating rule (all three paths):** Submit must remain disabled unless all of the following are true — every Contact Step field filled (including department), GDPR consent checkbox checked, and, for Door 1/Door 2 only, Authorised Signatory Name filled and the Declaration checkbox checked. This is enforced client-side for UX and should also be enforced at the database level via a `CHECK (declaration_confirmed = true)` constraint on the `submissions` table, so a row can never be inserted without it even if the frontend check is bypassed. `ecovadis_submissions` has no declaration field and needs no equivalent constraint.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** the-corporate-brand skill file — unchanged from v2.0, already installed at `.claude/skills/`.

**Visual feel:** Corporate minimalism — restraint over decoration. Precise, direct, composed, authoritative. No gradients, no shadows, no rounded corners.

**Key brand rules Claude Code must enforce (unchanged from v2.0):**
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels/emphasis)
- Colours: Ink (#000000), Stone (#B6B09F), Linen (#EAE4D5), Chalk (#F2F2F2), White (#FFFFFF), Acid Lime (#C8F135) — Lime max 2 uses/page, always against #000000
- Square corners (border-radius: 0), no shadows
- Cards: 0.5px Stone border, Linen or White background
- No blue links — underline + Ink only; no exclamation points, no emoji
- **Applies equally to the new Contact Step views on both doors** — no new visual patterns introduced for them.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database (submissions table) | Anon key (public, browser-safe, insert-only per Section 6) + Service role key (server-side only) | Netlify environment variables |
| Resend | Email arm — confirmation email on submit | API key | Netlify environment variable |

> **Security rule — no exceptions:** No API key, token, password, or credential may appear in any HTML, JavaScript, or file committed to GitHub. Keys used by Netlify Functions and the frontend are stored as Netlify environment variables. Claude Code must enforce this regardless of tier.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase anon key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Supabase service role key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Resend API key | Needs creating — not yet available | resend.com |

> The Resend API key is a pre-build blocking task for the builder — create the Resend account and API key before opening Claude Code for this build session. See Section 15.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Login/authentication for suppliers or internal reviewers | Not needed for this version; schema is built so it can be added later without a rebuild |
| In-tool review dashboard for The Corporate's team | For now, submissions are reviewed directly in the Supabase dashboard; a dedicated internal tool is a likely future addition, probably sharing the `the-corporate-esg` Supabase project as a second tool in a stack |
| Print/save/export of the confirmation screen | Carried over from v2.0 — explicitly out of scope |
| Automated EcoVadis scorecard validation | Carried over from v2.0 — requires EcoVadis API access |
| Partial/flagged-row import on Door 2 mismatch | Carried over from v2.0 — all-or-nothing rejection by design |
| Submission tracker / response-rate dashboard | Now technically more feasible with a database, but not part of this build |
| Self-service data deletion flow | Deletion is handled manually via the Corporate's team per the GDPR deletion mechanism (Section 7); no automated flow in this version |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Landing page and Door Picker render, EcoVadis link now routes to the new intake step | "Start Questionnaire" leads to Door Picker unchanged; "Submit EcoVadis Scorecard" leads to the EcoVadis Contact & Scorecard step, not directly to ecovadis.com | [ ] |
| 2 | Door 1 Contact Step blocks progress until all fields are filled and consent is checked | Continue button stays disabled until company name, contact name, email, phone, job title, department, and the consent checkbox are all complete | [ ] |
| 3 | Door 2 Contact Step behaves identically to Door 1's, and sits before the download button | Same validation; Download button only reachable after Continue on the Contact Step | [ ] |
| 4 | Submitting via Door 1 writes a complete row to Supabase | `submissions` table gets a new row with tracking_id, all contact fields, submission_door = "Door 1", questionnaire_answers, and created_at | [ ] |
| 5 | Submitting via Door 2 writes a complete row to Supabase | Same as above with submission_door = "Door 2" and parsed upload answers | [ ] |
| 6 | tracking_id is unique and correctly formatted on every submission, across both tables | Format `TCS-2026-000N`, no duplicates even under concurrent submissions, shared sequence across `submissions` and `ecovadis_submissions` | [ ] |
| 7 | Confirmation email sends on submit, on all three paths | Supplier's contact_email receives a "We've received your submission" email from Door 1, Door 2, and the EcoVadis path | [ ] |
| 8 | Email failure does not block or roll back the database write | Simulated email failure still results in a saved submission row on any of the three paths | [ ] |
| 9 | Anon key cannot read, update, or delete any row in `submissions` or `ecovadis_submissions` | Attempting a read/update/delete with the anon key from the browser fails on both tables | [ ] |
| 10 | GDPR consent checkbox blocks submission on all three paths | The Continue/Submit button cannot be clicked without the consent checkbox checked, on Door 1, Door 2, and the EcoVadis path | [ ] |
| 11 | Both Review screens display the Contact Step and Declaration details as a read-only summary | Company, contact name, email, phone, job title, department, signatory name, and declaration status all appear correctly on both Door 1 and Door 2 Review | [ ] |
| 12 | Brand identity is applied correctly to the new Contact Step, Declaration, and EcoVadis intake views | Same fonts, colours, square corners, and lime usage rules as the rest of the tool | [ ] |
| 13 | Declaration step blocks progress on both doors | Continue disabled until Authorised Signatory Name is filled and the declaration checkbox is checked, on both Door 1 and Door 2 | [ ] |
| 14 | Database rejects a submission missing the declaration | A direct insert attempt with `declaration_confirmed = false` fails against the `CHECK` constraint | [ ] |
| 15 | Stepper on both doors starts at S2, not S1 | Door 1 stepper's first section is Climate & Decarbonisation (S2); Door 2's structural check validates against the S2–S7 + Declaration template | [ ] |
| 16 | EcoVadis intake writes a complete row and redirects | `ecovadis_submissions` gets a new row with tracking_id, all contact fields, ecovadis_link, and created_at; browser redirects to https://ecovadis.com in a new tab immediately after the write, with no confirmation screen shown first | [ ] |
| 17 | Tool deploys to Netlify with working Supabase and Resend connections | Live URL loads; a full test submission on each of the three paths succeeds end-to-end, including the email | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 2

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo (existing v2.0 repo, reused)
- [ ] product-spec.md uploaded to the GitHub repo root (replacing v2.0)
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] the-corporate-brand skill file present in the repo (unchanged from v2.0)
- [x] **Updated The_Corporate_Supplier_Questionnaire_2026.xlsx uploaded to the assets folder, replacing the v2.0 workbook** — the entire S1 section (legal name, primary contact, EcoVadis bypass question) has been removed; the workbook now runs S2–S7 plus a closing Declaration row. Claude Code must extract S2–S7 fields from this file, not the v2.0 version. **Before this file is committed, the instructions cell (currently row A4) must be corrected** — it still reads "Suppliers with a valid EcoVadis Scorecard (S1, Q1 = YES) must submit scorecard link and proceed directly to STATUS column," which references a question that no longer exists. Recommended replacement: "Complete all sections marked REQUIRED. Suppliers with a valid EcoVadis Scorecard should submit it via the Supplier Sustainability Portal rather than completing this workbook. All others complete Sections S2–S7 and the Declaration below."
- [ ] Netlify connected (already active via Netlify MCP)
- [ ] **Resend account and API key created — blocking. Must exist before this build session opens, since the email arm cannot be tested without it.**

---

### Tier 2 — build session

- [ ] Open Claude Code in the project folder
- [ ] Claude Code runs Session Protocol: pulls latest from main, reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] **Supabase — new project:** Claude Code proposes `the-corporate-esg`, waits for confirmation, then creates the project via Supabase MCP
- [ ] Claude Code builds the `submissions` table and the RLS policies from Section 6 via Supabase MCP
- [ ] Claude Code creates `docs/supabase-setup.md`
- [ ] Claude Code builds the two new Contact Step views (Door 1 and Door 2) and wires the tracking_id generation, the Supabase insert on Submit, and the Resend email call
- [ ] Test locally before deploying — including a concurrent-submission check for tracking_id uniqueness and an email-failure simulation to confirm the database write still succeeds
- [ ] Claude Code sets environment variables (Supabase anon key, Supabase service role key, Resend API key) and deploys automatically via Netlify MCP
- [ ] Optional post-build: run the Supabase QA skill to verify schema and RLS policies

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Resend account and API key not yet created | Builder | Yes — must be created before the build session opens (email arm cannot be built or tested without it) |
| What is the deployed URL for this tool? | Builder | No — confirmed after deployment |
| What are the real URLs for the Supplier Code of Conduct and Global Environmental Policy documents? | Builder | No — carried forward as an open item from v1.0/v2.0 |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 12 June 2026 | Retroactive spec of the existing supplier onboarding landing page. Excel questionnaire offered as a static download, returned by the supplier via email. |
| v2.0 | 03 September 2026 | Questionnaire route upgraded to two in-tool submission doors (guided form / download-upload). No email arm, no persistence — D2+A1, Tier 1. |
| v3.0 | 14 September 2026 | Added a database (D3, Tier 2) so submissions persist and are reviewable by The Corporate. Each door gained a required Contact Step (company name, contact name, email, phone, job title, GDPR consent) as its opening step, ahead of any questionnaire content. Added an auto-generated tracking ID per submission. Added a confirmation email on submit (Email arm activated). No login introduced yet, but schema built to support one later without a rebuild. |
| v3.1 | 15 September 2026 | Workbook's entire S1 section removed (legal name, primary contact, and the EcoVadis bypass question — not just the two fields anticipated in v3.0), so both doors' stepper/upload now run S2–S7. Added a required Declaration step (Authorised Signatory Name + a checkbox standing in for Signature/Digital Auth, submission date taken from `created_at`) as the final step before Review on both doors, sourced from the workbook's closing Declaration row. Added `authorised_signatory_name` and `declaration_confirmed` columns, the latter enforced by a database-level `CHECK` constraint. Flagged the workbook's now-orphaned S1 instructions text for correction before the file is committed. |
| v3.2 | 15 September 2026 | The EcoVadis path is no longer a bare outbound link — it's now its own Contact & Scorecard intake step (matching an already-built screen), capturing company name, contact name, email, phone, job title, department, and the EcoVadis Scorecard Link, with the same GDPR consent pattern as the doors. Saves to a new `ecovadis_submissions` table, sends the same confirmation email, then redirects immediately to ecovadis.com in a new tab. Added `department` as a required field across all three paths (Door 1, Door 2, and EcoVadis), not just this new one. Updated the GDPR data statement and consent checkbox wording to match the already-built copy verbatim, applied consistently across all three paths. tracking_id is now a single sequence shared across both tables. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
