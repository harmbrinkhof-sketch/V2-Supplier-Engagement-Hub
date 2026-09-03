# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 0 — build not started
**Last updated:** 3 September 2026 — by Project Governor, pre-build
**Live URL:** none yet

## Current state
v1.0 static landing page (supplier_onboarding.html) already exists in the repo —
built before this workflow existed for this tool. Repo contains CLAUDE.md,
PROGRESS.md, product-spec.md (v2.0), and is not yet connected to Netlify. v2.0
additions — Door Picker, Door 1, Door 2, Confirmation screen — not yet started.

## Last session
None — the first Governor-tracked build session has not happened yet.

## Remaining work
- [ ] First Session Setup: create docs/, move product-spec.md in, install the
      the-corporate-brand skill if not already present, commit (see CLAUDE.md)
- [ ] Update landing page "Full Questionnaire" card: CTA becomes "Start
      Questionnaire", navigates to Door Picker instead of downloading a file
- [ ] Build Door Picker — two option cards (Fill In The Tool / Download & Upload)
      plus a back link to the landing page
- [ ] Build Door 1 — S1–S7 guided stepper, fields/dropdowns/validation extracted
      from The_Corporate_Supplier_Questionnaire_2026.xlsx
- [ ] Build Door 1 Review — grouped read-only answers with per-section Edit
- [ ] Build Door 2 — Download Assessment button (relocated from landing page) +
      upload control (.xlsx or CSV); all-or-nothing rejection on mismatch
- [ ] Build Door 2 Review — grouped read-only parsed answers, no Edit
- [ ] Build shared Confirmation screen — section-by-section summary, door used,
      no print/save/export
- [ ] Local test pass — full walkthrough of every view, including a
      mismatched-file upload to Door 2 to confirm outright rejection
- [ ] Acceptance criteria pass — verify all 15 criteria in product-spec.md
      Section 13 before deploy
- [ ] Deploy to Netlify via MCP, confirm live URL

## Build decisions
None yet.

## Known issues
- "View Document" (Supplier Code of Conduct) and "View Policy" (Global
  Environmental Policy) links carry the placeholder URL "#" from v1.0 until the
  builder supplies real URLs — not a build blocker.
- This is the first Governor-tracked session for this tool even though v1.0 code
  pre-dates CLAUDE.md/PROGRESS.md.

## Notes for next session
None.
