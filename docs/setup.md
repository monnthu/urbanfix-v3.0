# Setup

End-to-end setup for Urbanfix v3.0 (web + Supabase + Flutter mobile).

## 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql), then [`../supabase/seed.sql`](../supabase/seed.sql).
3. Grab **Project URL**, **anon key**, and **service_role key** from Project Settings > API.

### Google OAuth (civilian sign-in)

1. In Google Cloud Console, create OAuth credentials (Web application).
2. Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
3. In Supabase > Authentication > Providers > Google, paste the client id/secret and enable it.
4. Add `http://localhost:3000` and your deployed URL to Supabase > Authentication > URL Configuration (redirect URLs).

### TOTP MFA

Enabled by default via Supabase Auth. Civilians enroll on the web `/account` page.

### Storage

The migration creates a public `report-images` bucket with authenticated upload. No extra steps.

## 2. Web app

```bash
cd apps/web
npm install
cp .env.example .env.local
```

Fill `.env.local`:

| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API settings (server only) |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | e.g. `gemini-1.5-flash` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally |
| `N8N_WEBHOOK_URL` | optional; see [n8n-automation.md](n8n-automation.md) |

```bash
npm run dev   # http://localhost:3000
```

### Making yourself an admin

Sign in once, then in Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_ID';
```

Find your id under Authentication > Users.

### Gemini API key

Create a key at [Google AI Studio](https://aistudio.google.com/app/apikey). Free tier is
enough for the demo. If quota is exhausted, reports still submit — AI status is marked
`failed` and can be re-run from `/api/ai/analyze`.

## 3. Approving an institution

1. A user signs in and submits the form at `/institution/apply` (must use a non-consumer email domain).
2. As an admin, open `/admin`, review the pending application, and click **Approve**.
3. Approval creates an `institutions` row and upgrades the applicant to the `institution`
   role linked to that institution. They can now access `/institution/dashboard`.

## 4. Flutter mobile

See [../apps/mobile/README.md](../apps/mobile/README.md). Point it at the same Supabase
project and your deployed web app URL via `--dart-define`.

## 5. Deploy (web) to Vercel

1. Push the repo to GitHub.
2. Import into Vercel; set the project root to `apps/web`.
3. Add all env vars from `.env.example` (except leave secrets out of `NEXT_PUBLIC_*`).
4. Add the Vercel URL to Supabase Auth redirect URLs and Google OAuth authorized origins.
