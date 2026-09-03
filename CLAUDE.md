# The Corporate Supplier Sustainability Portal 2026

## Identity
A public portal that onboards Tier 1 suppliers into The Corporate's ESRS-aligned sustainability assessment programme, routing each supplier to EcoVadis submission or an in-tool questionnaire completed via a guided form or a file upload — no login required.
Tier: 1 — public page, no login, no database; all questionnaire data lives only in the browser and disappears when the tab closes (D2+A1)
Spec version governed: v2.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version
   governed" line in this file, STOP and tell the builder to re-run the Project
   Governor first. Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md — it is the current state. If missing, recreate it with the
   structure below, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content, repeat it back, treat it as this
   session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. Commit and push to main.
3. Tell the builder: "Save point committed: [what changed]."
Never end a session without a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md into it. A v1.0 landing page
   (supplier_onboarding.html) already exists in the repo — keep it as the starting
   point; do not rebuild it from scratch.
2. Install the brand skill at .claude/skills/the-corporate-brand/SKILL.md (skip if
   already installed from v1.0).
3. Announce what moved, then commit and push before building anything.

PROGRESS.md structure: status header (Session / Last updated / Live URL), Current
state, Last session, Remaining work, Build decisions, Known issues, Notes for next
session.

## Commands
```
npx serve .
```

## Tech Stack
HTML · CSS · JavaScript · Netlify
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is active —
create the site, set environment variables, and deploy via MCP.

## Arms
Export — browser only, no server function — downloads
The_Corporate_Supplier_Questionnaire_2026.xlsx from /public/assets/; lives as the
first step inside Door 2, not as a standalone landing-page button.

## Business Rules
- Door 2 upload is all-or-nothing: any structural mismatch rejects outright with
  an on-screen explanation — no partial import, no row-by-row flagging. A
  structurally valid but partially completed workbook is still accepted.
- S1–S7 fields, dropdowns, and validation rules are extracted from the real
  workbook in /public/assets/ at build time — never approximated as plain text.
- Door 1 steps one section at a time via Back/Next; Next on S7 leads to Door 1
  Review. Both Review screens share one grouped-by-section read-only layout; only
  Door 1 Review has Edit — Door 2 mismatches are fixed by re-uploading.
- Both doors converge on one shared Confirmation view; no print/save/export there.
  Submit is a client-side state transition only — no network calls, no email,
  nothing persisted, ever.
- Closing or reloading the tab at any point clears all in-progress data — a
  returning supplier starts from S1.
- "Submit EcoVadis Scorecard" opens https://ecovadis.com in a new tab; copy-only
  logic — never gates or hides either route.
- "Contact EHS" mailto → sustainability@thecorporate.com, subject "Supplier
  Portal Help Desk Query".

Out of scope — do not build: database persistence, email notifications,
confirmation-screen export, an internal review dashboard, a submission tracker,
supplier login/saved progress, automated EcoVadis validation, or any
partial/flagged-row import on Door 2.

## Brand
Governed by .claude/skills/the-corporate-brand/SKILL.md — invoke for any UI work.
Applies equally to Door Picker, the S1–S7 stepper, both Review screens, and
Confirmation — no new visual patterns for the new flow.
Hard rules even if the skill isn't loaded:
- Fonts: Playfair Display (headlines), DM Sans 300 (body), DM Sans 500 (labels)
- Colours: Ink #000000, Stone #B6B09F, Linen #EAE4D5, Chalk #F2F2F2, White
  #FFFFFF, Acid Lime #C8F135 — Lime max 2 uses/page, always against #000000
- Square corners, no shadows; cards use 0.5px Stone border on Linen or White
- No blue links — underline + Ink only; no exclamation points, no emoji

## Reference Docs
- docs/product-spec.md — UI sections (Section 8), logic/validation (Section 9)
- .claude/skills/the-corporate-brand/SKILL.md — full brand system
PROGRESS.md is read at every session start per the Session Protocol.
