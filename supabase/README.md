# Supabase

Schema, RLS policies, storage, and seed data for Urbanfix v3.0.

## Apply the schema

Option A — SQL editor (fastest for the MVP):

1. Open your Supabase project > SQL Editor.
2. Paste and run [`migrations/0001_init.sql`](migrations/0001_init.sql).
3. Paste and run [`seed.sql`](seed.sql).

Option B — Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

## What it creates

- Enums for roles, statuses, and priorities.
- Tables: `categories`, `zones`, `profiles`, `institutions`, `institution_applications`, `reports`, `report_supports`, `ai_interactions`.
- Triggers: auto-create a `profiles` row on signup, keep `support_count` in sync, and touch `updated_at`.
- RLS policies scoping reads/writes by role (civilian / institution / admin).
- A public `report-images` storage bucket with authenticated upload.

## Making yourself an admin

After signing in once, set your role:

```sql
update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_ID';
```

## Approving an institution (manual)

See [../docs/setup.md](../docs/setup.md#approving-an-institution) — approving updates the application status and assigns the `institution` role + `institution_id` to the applicant.
