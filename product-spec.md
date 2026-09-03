# Product Spec — The Corporate Supplier Sustainability Portal 2026

**Version:** 1.0
**Date:** 12 June 2026
**Author:** Zyad Hatquai
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Sustainability Portal 2026

**What it does:** A single-page public landing page that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme. It communicates the company's net-zero targets, explains the two submission paths, and routes each supplier to the correct action — EcoVadis scorecard submission or Excel questionnaire download.

**Who uses it:** Tier 1 supplier contacts — sustainability managers, EHS leads, and procurement representatives at supplier organisations — who receive the URL directly from The Corporate's procurement or EHS team.

**Why it exists:** To formally launch The Corporate's 2026 supplier sustainability assessment without requiring direct explanation from the internal team. The page gives every supplier the context, the correct path, the timeline, and the resources to act independently.

**Build status:** Retroactive spec — the tool exists as supplier_onboarding.html. This spec documents the existing build to establish Project Governor and Claude Code session compatibility, and to serve as the reference for any future iteration.

---

## Section 2 — Classification

### Data Model

**Decision:** D1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | Yes |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | No |

**Reason:** All content on the page is fixed and written by the developer. The Excel file is a static asset served for download. No supplier input is collected or stored through this tool.

**D3 triggers — none apply:**
- [ ] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [ ] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. | No |
| A3 — Authorization | Users must log in and have different roles. | No |

**Reason:** The page is distributed to Tier 1 suppliers as a direct link. No account or login is required — any supplier who receives the URL can access it immediately.

---

### Tier

**Tier:** 1

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool.

---

## Section 3 — Arms

### AI API Arm

**Active:** No

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | XLSX |
| What is exported | A pre-formatted Excel workbook — The Corporate Supplier Questionnaire 2026. Contains 7 sections mapped to ESRS: S1 General Information and EcoVadis Bypass, S2 Climate and Decarbonisation (E1), S3 Pollution and PFAS (E2), S4 Water and Marine Resources (E3), S5 Circular Economy and Waste (E5), S6 Biodiversity and Ecosystems (E4), S7 Social, Labour and Governance (S2, G1). The file is served as a static asset — no data is populated server-side. The supplier fills it offline and returns it via email or the process defined by The Corporate's EHS team. |
| PDF design intent | N/A — format is XLSX only |

---

### Email Arm

**Active:** No

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | HTML/CSS/JS — single-page, static, minimal interaction (two action buttons and a mailto link) |
| Deployment target | Netlify |
| Netlify MCP | See Open Questions (Section 15) — confirm before build session |

**GitHub — pre-build requirement:**
The builder creates the GitHub repo before the first Claude Code session. product-spec.md, CLAUDE.md, and PROGRESS.md must be uploaded to the repo root before Claude Code opens. Claude Code commits changes regularly and pushes to main. It does not create or configure the repo.

---

## Section 5 — Data Architecture

N/A — Data Model is D1. No database.

---

## Section 6 — Access and Permissions

N/A — Access Model is A1. No authentication, no roles, no RLS.

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — this tool is D1. No personal data is collected or stored through the tool. The Excel file is downloaded to the supplier's own device. No form submission occurs through this portal.

---

## Section 8 — Screen and UI Structure

### Landing Page (single scrolling view — no additional pages)

**Purpose:** Route Tier 1 suppliers to the correct submission path and communicate The Corporate's sustainability expectations.

**What is visible (top to bottom):**

**Navigation bar**
- The Corporate logo (left): boxed monogram + wordmark per brand spec
- No additional nav items required for v1

**Hero section**
- Overline label: "SUPPLIER PROGRAMME 2026" — rendered as a black pill with Acid Lime text (Pattern A per brand spec — black container, lime text, uppercase, tracked)
- H1 (Playfair Display 700, 48px): "We don't just manufacture products. We engineer a sustainable future."
- Body paragraph (DM Sans 300): "Our 2045 Net-Zero goal is a shared journey. This portal is your starting point — understand what we are asking, why it matters, and which submission path applies to you."
- Stats row — 4 items displayed large side by side (tc-grid-4, stacks to 2-col on mobile):
  - 690,000 / tCO₂e Total Footprint (2023, location-based)
  - 71% / Scope 3 — Value Chain (location-based, 2023 base year)
  - 2045 / Net-Zero Target Year
  - 500+ / Tier 1 Suppliers
  - Stat figures: Playfair Display 700 at display size. Labels: DM Sans caption/label style, Stone colour.
  - Reference note (shown beneath the stats and repeated in the footer): "Scope 3 is 71% of the total footprint (location-based, 2023 base year)."

**Section: Why We Are Asking**
- H2: "Why We Are Asking"
- Body copy: drafted by Claude Code following The Corporate brand voice (see Open Questions — builder reviews before deployment)
- Content must cover: ESRS/CSRD regulatory context, The Corporate's supply chain Scope 3 exposure (71%, location-based, 2023 base year), and the shared-responsibility framing of the programme

**Section: Two Routes. One Destination.**
- H2: "Two Routes. One Destination."
- Two cards side by side (tc-grid-2, stacks on mobile):
  - Card 1 — EcoVadis path:
    - Label: "ECOVADIS SCORECARD"
    - Description: explains that suppliers with a valid EcoVadis scorecard (issued within the last 12 months) may submit their scorecard link and skip the full questionnaire
    - Primary CTA button ("Submit EcoVadis Scorecard") — opens ecovadis.com in a new tab
  - Card 2 — Download path:
    - Label: "FULL QUESTIONNAIRE"
    - Description: explains that suppliers without an EcoVadis scorecard must download and complete the ESRS-aligned Excel questionnaire, then return it via email to The Corporate's EHS team
    - Secondary CTA button ("Download Assessment") — triggers download of The_Corporate_Supplier_Questionnaire_2026.xlsx from the project's static assets folder

**Section: What Happens Next**
- H2: "What Happens Next."
- 4-step numbered timeline (horizontal on desktop, vertical on mobile):
  - 01 — Portal Launch — "You receive this link and select your submission path." — April 2026
  - 02 — Data Submission — "Submit scorecard or complete questionnaire. 100% Tier 1 response required." — Deadline: 30 Sep 2026
  - 03 — Review & Scoring — "Our EHS and Procurement teams review submissions and flag gaps." — Q4 2026
  - 04 — Partnership Plans — "Joint decarbonisation and improvement plans agreed with prioritised suppliers." — Q1 2027
  - Step numbers: Acid Lime on black (Pattern A). Dates/labels: Stone caption style. Step title: DM Sans 500. Description: DM Sans 300.

**Section: Key Resources**
- H2: "Key Resources" + subhead: "Everything you need."
- 3 resource cards (tc-grid-3, stacks on mobile):
  - Card 1 — Document:
    - Label: "DOCUMENT"
    - Title: "Supplier Code of Conduct"
    - Body: "The Corporate's standards for ethical business conduct, labour rights, and environmental responsibility. All Tier 1 suppliers must have a signed copy on file."
    - Link: "View Document" — URL is a placeholder at build time; builder provides the real document URL before deployment (see Open Questions)
  - Card 2 — Policy:
    - Label: "POLICY"
    - Title: "Global Environmental Policy"
    - Body: "The Corporate's commitments on climate, water, PFAS, and circular economy — the framework that defines what we expect from our value chain partners."
    - Link: "View Policy" — URL is a placeholder at build time; builder provides the real document URL before deployment (see Open Questions)
  - Card 3 — Support:
    - Label: "SUPPORT"
    - Title: "EHS Help Desk"
    - Body: "Questions about specific ESRS requirements, measurement methodology, or technical aspects of the questionnaire? Contact our Environment, Health & Safety team directly."
    - Link: "Contact EHS" — mailto:sustainability@thecorporate.com?subject=Supplier%20Portal%20Help%20Desk%20Query

**Footer**
- The Corporate logo (monogram or wordmark)
- Copyright line: "© 2026 The Corporate. Confidential — for authorised Tier 1 suppliers only."
- No additional footer links required for v1

**User actions:**
- Click "Submit EcoVadis Scorecard" — opens ecovadis.com in a new tab
- Click "Download Assessment" — triggers browser download of The_Corporate_Supplier_Questionnaire_2026.xlsx
- Click "View Document" — opens Supplier Code of Conduct (URL to be confirmed)
- Click "View Policy" — opens Global Environmental Policy (URL to be confirmed)
- Click "Contact EHS" — opens email client with pre-filled recipient and subject line
- Scroll — single-page experience, no navigation between views

**What happens next:** All actions either open an external link in a new tab, trigger a file download, or open the user's email client. No page navigation occurs.

---

## Section 9 — Logic and Calculations

This tool contains no calculations, no scoring, and no conditional rendering based on user input.

Both submission paths (EcoVadis and Excel download) are visible simultaneously. The EcoVadis logic — "if you have a valid scorecard, you may skip the full questionnaire" — is communicated to the supplier in copy only. The tool does not gate or hide either path based on any user selection. The supplier self-selects and acts.

**The two interactive elements and their behaviour:**

| Element | Behaviour |
|---------|-----------|
| "Submit EcoVadis Scorecard" button | Opens https://ecovadis.com in a new tab (target="_blank", rel="noopener noreferrer") |
| "Download Assessment" button | Triggers download of /assets/The_Corporate_Supplier_Questionnaire_2026.xlsx using an HTML anchor with the download attribute |

---

## Section 10 — Brand and Visual Direction

**Brand reference:** the-corporate-brand skill file — upload flat to the repo root before the build session. Claude Code installs it to .claude/skills/ in First Session Setup.

**Visual feel:** Corporate minimalism — restraint over decoration. Precise, direct, composed, authoritative. No gradients, no shadows, no rounded corners.

**Key brand rules Claude Code must enforce throughout:**
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels/emphasis) — import from Google Fonts CDN
- Colours: Ink (#000000), Stone (#B6B09F), Linen (#EAE4D5), Chalk (#F2F2F2), White (#FFFFFF), Acid Lime (#C8F135)
- Acid Lime: maximum 2 uses per page. Always against #000000 (never directly on light backgrounds). Used here for the "Supplier Programme 2026" label and the step number indicators in the timeline.
- Buttons: square corners (border-radius: 0), no shadows
- Cards: square corners, 0.5px Stone border, Linen or White background
- No blue links — underline + Ink colour only
- All copy follows The Corporate voice rules: short declarative sentences, active voice, no exclamation points, no emoji

---

## Section 11 — API and Credentials

This tool requires no external services and no API keys.

| Service | What it does | Key required | Where stored |
|---------|-------------|-------------|-------------|
| None | — | — | — |

The Excel file is served as a static asset in the project's /assets/ folder. The EcoVadis button is a hardcoded URL. The Contact EHS button is a mailto: link. No server-side function, no API call, and no environment variable is required for this tool.

**Credentials readiness:** Nothing to prepare before the build session.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Online form — suppliers fill questionnaire responses in the browser | Adds D3 complexity (database, storage); v1 validates the workflow using the offline Excel |
| Internal review dashboard — procurement/EHS team reviews submissions in a tool | Requires a separate Tier 2 or Tier 3 tool in a stack; not needed to validate the supplier onboarding flow |
| Automated email notification on Excel download | Requires Email arm and server-side function; not required for v1 |
| Submission tracker — shows % of Tier 1 suppliers who have responded | Requires D3 and likely a supplier roster; deferred to the internal review tool |
| Supplier login and saved progress | Moves the tool to Tier 3; deferred to a future build iteration |
| Automated EcoVadis scorecard validation | Requires EcoVadis API access; deferred pending API availability |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Page loads and all 7 content sections render in the correct order | Hero, Why We Are Asking, Two Routes, What Happens Next, Key Resources, Footer — all visible on first load with no layout breaks | [ ] |
| 2 | Brand identity is applied correctly throughout | Playfair Display headlines, DM Sans 300 body, correct colour tokens (Ink, Stone, Linen, Chalk), square corners on all cards and buttons, Acid Lime used at most twice | [ ] |
| 3 | Stats row displays all 4 figures correctly | 690,000 / 71% / 2045 / 500+ render with correct labels and no formatting errors | [ ] |
| 4 | "Supplier Programme 2026" label renders as a black pill with Acid Lime text | Pattern A applied: black background, Acid Lime text, uppercase, tracked — not placed directly on a light background | [ ] |
| 5 | "Submit EcoVadis Scorecard" button opens the correct URL in a new tab | Clicking opens https://ecovadis.com in a new tab; original tab remains on the portal | [ ] |
| 6 | "Download Assessment" button triggers file download | Clicking initiates browser download of The_Corporate_Supplier_Questionnaire_2026.xlsx; file is the correct, complete Excel workbook | [ ] |
| 7 | "Contact EHS" link opens email client with pre-filled fields | Mailto opens with recipient sustainability@thecorporate.com and subject "Supplier Portal Help Desk Query" | [ ] |
| 8 | Timeline section displays all 4 steps with correct dates and copy | Steps 01–04 render with correct titles, descriptions, and date labels in the correct order | [ ] |
| 9 | Page is fully responsive on mobile | All grid sections (stats, routes, timeline, resources) collapse to single-column or 2-column layout on viewports below 768px; no horizontal overflow; buttons are full-width and tappable | [ ] |
| 10 | Tool deploys to Netlify and is accessible at the live URL | Live URL loads correctly on desktop and mobile; no 404 errors; Excel file downloads correctly from the deployed site | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 1

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] the-corporate-brand skill file uploaded to the GitHub repo root
- [ ] The_Corporate_Supplier_Questionnaire_2026.xlsx placed in /assets/ (or equivalent static folder) in the repo
- [ ] Netlify connected to the GitHub repo (skip if Netlify MCP is active)
- [ ] No credentials to prepare for this tool

---

### Tier 1 — build session

- [ ] Open Claude Code in the project folder (GitHub repo connected to Netlify)
- [ ] Claude Code runs First Session Setup: creates docs/, moves reference files, installs the-corporate-brand skill to .claude/skills/
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] Claude Code drafts the "Why We Are Asking" section body copy following The Corporate brand voice; builder reviews before deployment
- [ ] Claude Code confirms document URLs for "View Document" and "View Policy" with the builder, or leaves as # if not yet available
- [ ] Claude Code builds the tool
- [ ] Test locally before deploying
- [ ] **If Netlify MCP active:** Claude Code deploys automatically
- [ ] **If Netlify MCP not active:** push to main → Netlify deploys automatically

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Is Netlify MCP active — is Netlify connected via Claude Desktop Connectors for this project? | Builder — confirm before opening Claude Code | No — can deploy manually if not active |
| What is the deployed URL for this tool? | Builder | No — can be confirmed after first deployment |
| What is the real URL for the Supplier Code of Conduct document? | Builder — provide before or during the build session | No — Claude Code will leave as # and flag for builder to update |
| What is the real URL for the Global Environmental Policy document? | Builder — provide before or during the build session | No — Claude Code will leave as # and flag for builder to update |
| "Why We Are Asking" section — body copy not provided in the interview | Claude Code drafts during the build session following The Corporate brand voice; builder reviews before deployment | No — Claude Code resolves during build |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 12 June 2026 | Retroactive spec of the existing supplier onboarding landing page (supplier_onboarding.html). Spec created to establish Project Governor and Claude Code session compatibility. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
