# Deployment Guide (draft — finalised in Phase 11)

## 1. Local development
```bash
npm install
cp .env.example .env.local      # fill values (never commit .env.local)
npm run dev                     # http://localhost:3000
```
Without Supabase env vars the public site runs on `content/fallback.json` (read-only), and the admin area shows a setup notice.

## 2. Supabase
1. Create a project at supabase.com (free tier is fine to start). Region: closest to Bangladesh (e.g. Singapore).
2. Install CLI: `npm i -D supabase` → `npx supabase login` → `npx supabase link --project-ref <ref>`.
3. Apply schema + seed: `npx supabase db push --include-seed` (runs `supabase/migrations/*`, then `supabase/seed.sql`). Alternative: paste `seed.sql` into Dashboard → SQL editor. Verify the CLI flags with `npx supabase db push --help` for the installed version.
4. Auth → Providers → Email: enable. **Disable "Allow new users to sign up".** Set Site URL and redirect URLs (`http://localhost:3000`, `https://<your-domain>`).
5. Copy the Project URL + anon key into `NEXT_PUBLIC_SUPABASE_*`, and the service-role key into `SUPABASE_SERVICE_ROLE_KEY` (server only).

## 3. Create the first admin (no hard-coded passwords)
1. Supabase Dashboard → Authentication → Users → **Invite user** → your email (or "Add user" with a strong unique password).
2. Accept the invite / set the password.
3. SQL editor:
   ```sql
   insert into public.admin_profiles (user_id, role, display_name)
   select id, 'owner', 'Sheak Fahad' from auth.users where email = 'fahadsheak222@gmail.com';
   ```
4. Sign in at `/admin/login`. Optional: enable TOTP MFA in Account.

## 4. Email (optional — Resend)
Create an API key → `RESEND_API_KEY`. Until a domain is verified, Resend only sends to your own account email from `onboarding@resend.dev`, which is fine for owner notifications. Set `NOTIFY_EMAIL_TO`. Without a key, messages and stories are still saved and `notification_logs` records `skipped`.

## 5. AI assistant (optional)
Create an Anthropic API key → `ANTHROPIC_API_KEY`. `ASSISTANT_MODEL` defaults to `claude-opus-5-5` (`claude-haiku-5-5` is a much cheaper option). Without a key, the assistant runs in search mode.

## 6. Vercel
1. Push the repo to GitHub.
2. vercel.com → New Project → import the repo (framework auto-detected: Next.js).
3. Add all env vars from `.env.example` (Production + Preview). Deploy.
4. Supabase Auth → add the Vercel URL to the redirect URLs.
5. Smoke test in an incognito window and on mobile data: home loads, a project page loads, the contact form saves (check the admin panel), a story stays pending, admin login works, a draft is not visible publicly.
6. Optional custom domain: Vercel → Domains → follow the DNS records.

## 7. Backup & restore
- Admin → Settings → **Export** downloads JSON of all content tables plus a media manifest.
- Supabase backups (plan-dependent). Manual: `npx supabase db dump -f backup.sql`.
- Restore: create a fresh project → `db push` → `psql < backup.sql` (or import the JSON via the admin import, planned in Phase 8) → re-upload storage from the manifest.

## 8. Free-tier limits to watch (verify current values before launch)
Supabase free: 500 MB database, 1 GB storage, 50 MB max file upload, projects pause after inactivity. Vercel Hobby: personal and non-commercial use only, plus bandwidth and function limits. Videos → prefer YouTube/Vimeo embeds.
