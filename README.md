# Urbanfix v3.0

A tightly scoped civic reporting MVP. Civilians report local issues (with photo, category, and location); reports are auto-routed to the responsible institution by category and geographic zone; institutions triage assigned reports and query them with AI.

This repository is a monorepo:

```
urbanfix-v3/
  apps/
    web/          Next.js (App Router, TypeScript, Tailwind CSS) web app  <-- primary
    mobile/       Flutter civilian app (Android + iOS)
  supabase/       Postgres schema, RLS policies, storage, and seed data
  docs/           setup, API contracts, demo script, n8n automation notes
```

## Feature scope (MVP)

- Civilian Google/Gmail sign-in + TOTP MFA (Supabase Auth).
- Report creation: category, description, image upload, location (map pin / geolocation).
- Deterministic routing by category + zone; unmatched reports become `unassigned`.
- Public report list, report detail, and one-per-user support/verify.
- Interactive Leaflet + OpenStreetMap map with category icons and a legend.
- Institution application (official-domain) + manual admin approval.
- Institution dashboard scoped to assigned reports.
- Gemini image analysis (category/priority suggestion) and AI chat scoped to assigned reports.
- Flutter civilian app (Android + iOS) sharing the same Supabase backend and web API.

## Quick start (web)

Prerequisites: Node.js 18.18+ and a free Supabase project.

```bash
cd apps/web
npm install
cp .env.example .env.local   # fill in the values (see docs/setup.md)
npm run dev
```

Then open http://localhost:3000.

## Quick start (mobile)

Prerequisites: Flutter 3.19+.

```bash
cd apps/mobile
flutter pub get
flutter create . --platforms=android,ios   # generate platform runners (once)
flutter run \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=API_BASE_URL=https://your-web-app.vercel.app
```

See [apps/mobile/README.md](apps/mobile/README.md) for permissions and OAuth setup.

## Docs

See [docs/setup.md](docs/setup.md) for the full walkthrough (Supabase, Google OAuth, Gemini, storage), [docs/api-contracts.md](docs/api-contracts.md) for the API surface, and [docs/demo-script.md](docs/demo-script.md) for a demo runbook.

## Free-tier stack

- Next.js on Vercel Hobby.
- Supabase Free (Postgres, Auth, Storage, RLS).
- Google Gemini Flash (multimodal image understanding + text chat).
- Leaflet + OpenStreetMap (no map key).

Production/municipal deployment would require paid, compliant hosting and hardened identity — see the deferred list in the plan.
