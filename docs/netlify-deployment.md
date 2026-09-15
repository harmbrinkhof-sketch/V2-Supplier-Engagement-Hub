# Netlify Deployment Handoff — v3.1 (Tier 2)

This build adds Supabase persistence + two Netlify Functions, so deployment now
needs **environment variables**. Netlify MCP was not available in the build
session, so the steps below are done in the Netlify dashboard (or CLI). Nothing
here contains a key — set the values from the sources listed.

## What ships

- Static site published from the repository root (`publish = "."`).
- Two functions in `netlify/functions/` (auto-detected via `netlify.toml`):
  - `config` → `GET /.netlify/functions/config` — returns `{ url, anonKey }` for the
    browser's direct Supabase insert. No secret is exposed (anon key is insert-only).
  - `send-confirmation` → `POST /.netlify/functions/send-confirmation` — sends the
    confirmation email via Resend. Dormant (returns `{ sent:false }`) until
    `RESEND_API_KEY` is set. Independent of the DB write.

## 1. Connect the repo (if not already)

Netlify → Add new site → Import from GitHub → `harmbrinkhof-sketch/v2-supplier-engagement-hub`.
- Build command: **none**
- Publish directory: **`.`** (repo root — already in `netlify.toml`)
- Functions directory: **`netlify/functions`** (already in `netlify.toml`)
- Branch to deploy: this build is on `claude/beautiful-mccarthy-9mq9qn`. Either set the
  production branch to it, or merge to `main` and deploy from `main`.

## 2. Set environment variables

Netlify → Site configuration → Environment variables. Add:

| Key | Value / where to get it |
|-----|-------------------------|
| `SUPABASE_URL` | `https://wrylehuacuhwdvxajtdc.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → **publishable/anon** key (`sb_publishable_…`). Insert-only per RLS; browser-safe. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → **secret/service_role** key. **Unused by this build** — set only for future use, never exposed. |
| `RESEND_API_KEY` | resend.com → API Keys (`re_…`). **Still needs creating** — until then the email arm is dormant (the DB write and confirmation still work). |
| `RESEND_FROM` | *(optional)* Verified sender, e.g. `The Corporate Sustainability <sustainability@yourdomain>`. Defaults to `onboarding@resend.dev` (Resend's shared test sender — only reliably delivers to the Resend account owner until a domain is verified). |

> ⚠️ The `sb_secret_…` value shared during the build session is the Supabase **secret
> key**, not a Resend key. It maps to `SUPABASE_SERVICE_ROLE_KEY` (unused here). Because
> it was shared in chat, consider rotating it in the Supabase dashboard.

## 3. Deploy

Trigger a deploy (push to the deployed branch, or "Trigger deploy" in Netlify).
Node 20 is pinned in `netlify.toml` for the functions' global `fetch`.

## 4. Verify (acceptance #16)

1. Load the live URL — landing page renders; "Start Questionnaire" → Door Picker.
2. `GET /.netlify/functions/config` returns JSON with `url` + `anonKey`.
3. Door 1: complete Contact Step → S2–S7 → Declaration → Review → Submit.
   - A new row appears in Supabase `submissions` (Door 1) with a `TCS-2026-000N`
     `tracking_id`.
   - If `RESEND_API_KEY` is set, the contact email receives "We've received your
     submission."
4. Door 2: same, submitting the downloaded workbook → row with `submission_door = Door 2`.
5. Break email on purpose (e.g. bad `RESEND_API_KEY`) → the submission row is still
   written (email failure never blocks the write).

## Notes

- The Resend "from" address must belong to a domain verified in Resend to deliver to
  arbitrary suppliers. Verify `thecorporate.com` (or your sending domain) in Resend,
  then set `RESEND_FROM` accordingly.
- Free Supabase plan pauses after ~1 week of no traffic; the first request after a
  pause may be slow while it resumes.
