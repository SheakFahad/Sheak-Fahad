# Database setup (Supabase)

All schema changes live in `supabase/migrations/` (applied in filename order). They are verified locally with `npm run db:verify` (in-memory Postgres + RLS checks: anon reads only published/live rows, non-admins cannot read the dashboard or messages, unsafe navigation links and unknown block types are rejected, the audit log is append-only).

## 1. Create the project
1. supabase.com → New project. Region: Singapore (closest to Bangladesh). Save the database password in a password manager.
2. Project Settings → API: copy **Project URL**, **anon** key and **service_role** key into your env (see ENVIRONMENT_VARIABLES.md).

## 2. Apply migrations
Option A — SQL editor (no tools needed): open each file in `supabase/migrations/` in order and run it.

Option B — Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## 3. Auth settings
- Authentication → Providers → Email: enabled, **sign-ups disabled**.
- URL configuration: see DEPLOYMENT_GUIDE §3.
- Recommended: enable MFA (TOTP) for the owner account.

## 4. First administrator (no passwords in code)
1. Authentication → Users → **Add user** (email + a strong unique password) or **Invite**.
2. SQL editor:
```sql
insert into public.admin_profiles (user_id, role, display_name, email)
select id, 'owner', 'Sheak Fahad', email from auth.users where email = '<your admin email>';
```
3. Sign in at `/admin/login`. Owners can later add editors from `/admin/users`.

## 5. Seed the current content (script lands with the admin managers — not available yet)
Planned: `npm run db:seed` (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) imports the verified content from `content/fallback.json` — profile, sections, projects, experience, education, research, skills, achievements, memories, hobbies, social links and media records for the bundled images. It is idempotent (upserts by `legacy_key` / `slug` / `key`). Demo travel rows are never imported.

## 6. Backups
Supabase → Database → Backups (daily on paid plans). For the free tier, export regularly: `npx supabase db dump -f backup.sql`.
