# Demo script & runbook

A ~5 minute end-to-end demo covering every acceptance-checklist item.

## Prep (once)

1. Apply schema + seed (see [setup.md](setup.md)).
2. Run the web app and sign in with Google once to create your profile.
3. Make yourself admin (SQL in setup.md).
4. Have a second Google account (or incognito) ready to play the "civilian".
5. Optional: set `GEMINI_API_KEY` to show AI triage live.

## Seeding demo reports

Sign in as a civilian and file 4-6 reports across categories/zones using the
`/reports/new` form (drop pins in different seeded zones). This gives the map,
list, dashboard, and AI chat real data. Reports created here carry a real
`civilian_user_id`, which is why they are not in `seed.sql`.

## Walkthrough

1. **Civilian auth** — Sign in with Google/Gmail. On `/account`, enroll TOTP MFA
   (scan QR in an authenticator app, enter the code). Account shows "Verified".
2. **File a report (web)** — `/reports/new`: title, category, description, photo,
   drop a pin (or "Use my location"). Submit. Show the detail page with the AI
   triage suggestion and the assigned institution.
3. **Routing** — File one report in a category/zone no institution covers; show it
   is marked `unassigned`.
4. **Support/verify** — As another civilian, open a report and click Support; count
   increments; second click removes it. One support per user.
5. **Map + legend** — `/map`: markers colored by category with a legend.
6. **Institution application** — New user applies at `/institution/apply` with an
   official-domain email. Show it cannot access `/institution/dashboard` yet.
7. **Admin approval** — As admin at `/admin`, approve the application. The applicant
   is upgraded to the institution role.
8. **Institution dashboard** — Sign in as the approved institution user. Show only
   assigned reports, change a status, filter by status.
9. **AI chat** — In the dashboard, ask "Show open high-priority reports" and a
   specific report question. Answers cite report ids and are scoped to the
   institution's reports only.
10. **Mobile (Flutter)** — Run the app, sign in, file a report with photo + location,
    pull-to-refresh the list, support a report, and open the WebView map with legend.
11. **Deployment** — Show the app running on Vercel (free tier) against Supabase free
    tier (DB + storage + auth).

## Acceptance checklist

- [ ] Civilian signs in with Google/Gmail.
- [ ] Civilian completes TOTP MFA.
- [ ] Civilian creates a report (category, location, image) on web.
- [ ] Civilian creates a report on Flutter mobile.
- [ ] Uploaded image triggers AI category + priority analysis.
- [ ] Report is assigned by category/location or marked unassigned.
- [ ] Reports can be supported/verified once (web + mobile).
- [ ] Web map shows category icons + legend.
- [ ] Mobile map (WebView Leaflet) shows category icons + legend.
- [ ] Institution applicant cannot access the dashboard before approval.
- [ ] Approved institution sees only assigned reports.
- [ ] Institution AI answers questions about assigned + specific reports.
- [ ] Deployed on free-tier hosting + free-tier DB/storage.
- [ ] Flutter app runs against the same backend.

## Fallbacks if something breaks

- Gemini quota/API issue: reports still submit; show `ai_status = failed` and the
  manual re-run endpoint. Emphasize graceful degradation.
- Mobile OAuth callback not configured: use the seeded email/password civilian.
- Geolocation blocked: drop a pin on the map instead.
