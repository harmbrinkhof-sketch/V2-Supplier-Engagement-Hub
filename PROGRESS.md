# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1 — v2.0 two-door flow built
**Last updated:** 3 September 2026
**Live URL:** none yet — ready to deploy (see Remaining work)

## Current state
v2.0 is built as a single static page (`index.html`) that serves the landing
page plus the full questionnaire flow via client-side view switching. No backend,
no database, no network calls — D2+A1, Tier 1. All deployment files are in place.

Flow implemented and tested end-to-end:
- **Landing page** — carried over from v1.0. The "Two Routes" section now routes
  Path A ("Submit EcoVadis Scorecard") to https://ecovadis.com in a new tab, and
  Path B ("Start Questionnaire") to the Door Picker. Neither route is gated/hidden.
- **Door Picker** — two cards (Fill In The Tool / Download & Upload) + back link.
- **Door 1** — S1–S7 guided stepper with a clickable progress indicator; fields,
  dropdowns, and validation extracted from the real workbook; Back/Next; S7 Next →
  Door 1 Review.
- **Door 1 Review** — grouped read-only answers with per-section Edit.
- **Door 2** — Download Assessment button + drag/drop or click upload (.xlsx or
  CSV export), parsed client-side with SheetJS. All-or-nothing rejection with an
  on-screen explanation on any structural mismatch.
- **Door 2 Review** — grouped read-only parsed answers, no Edit.
- **Confirmation** — shared by both doors; section-by-section summary, door used,
  no print/save/export. Submit is a client-side state transition only.

## Last session
Session 1 (this one). First Session Setup completed: moved `product-spec.md` into
`docs/`, created `public/assets/` (workbook + the two linked PDFs) and
`public/vendor/` (vendored SheetJS), installed the-corporate-brand skill to
`.claude/skills/`, renamed the v1.0 landing page to `index.html` and built the
v2.0 flow on top of it. Verified with a parser test suite (12 checks), a full
jsdom walkthrough (24 checks), a static-serve smoke test, and Chromium screenshots
(desktop + mobile).

## Remaining work
- [ ] Deploy to Netlify and record the live URL here. Netlify MCP was not active
      in this session (no Netlify tools available) — deploy via GitHub → Netlify:
      connect the repo, set publish directory to the repo root (already declared in
      `netlify.toml`), no build command. Then run Acceptance Criteria #15 against
      the live URL (Excel + PDFs download; no 404s; mobile).
- [ ] Confirm the two resource PDFs are the correct/current documents (they were
      wired from the PDFs already in the repo — see Build decisions).

## Build decisions
- **One page, JS view switching.** `index.html` holds all views; only one is shown
  at a time. No routing, no framework, no build step — matches spec Section 4.
- **Deployment layout.** Downloadable/linked static assets live in
  `public/assets/` (matches CLAUDE.md's `/public/assets/` path); vendored JS in
  `public/vendor/`. `netlify.toml` publishes from the repo root, so those literal
  paths resolve. Reference PDFs moved to `docs/`.
- **SheetJS vendored, not CDN.** cdnjs is blocked by egress policy and a runtime
  CDN dependency is a reliability risk for a deployed portal, so `xlsx.full.min.js`
  (v0.18.5) is committed under `public/vendor/` and parsing works offline.
- **Field model faithful to the workbook.** The 30 S1–S7 questions, their input
  types, and dropdown option lists are extracted verbatim from
  `The_Corporate_Supplier_Questionnaire_2026.xlsx` (column D questions, column E
  data-validation lists). Each question also captures a Notes / Evidence field
  (workbook column F). Note quirk carried faithfully: the S2 Scope 2 response cell
  (E12) is a verification-method dropdown in the source file, so it renders as one.
- **Validation.** Only the workbook's REQUIRED/Conditional fields are enforced:
  S1 legal name, S1 primary contact, and the EcoVadis bypass answer are required;
  the EcoVadis link is required only when bypass = "Yes — Scorecard Attached".
  Everything else is optional, so a partially completed workbook is accepted (both
  doors), per the business rules.
- **Door 2 rejection is structural + all-or-nothing.** The parser locates the
  header row, checks all seven column headers, then confirms every question row
  matches the template before extracting. Any mismatch rejects the whole file with
  a specific message; nothing is partially imported.
- **Resource links resolved.** "View Document" and "View Policy" now point at the
  Supplier Code of Conduct and Global Environmental Policy PDFs in
  `public/assets/` (they were already in the repo), replacing v1.0's `#`
  placeholders.
- **Landing kept, EcoVadis de-gated.** The v1.0 qualification decision tree is kept
  but no longer disables either path (removed `pointer-events:none`), honouring the
  "never gates or hides either route" rule.

## Known issues
- Not yet deployed — no live URL. Netlify MCP was not available this session.
- The two resource PDFs are wired from files already present in the repo; confirm
  they are the intended current versions (low risk).

## Notes for next session
None.
