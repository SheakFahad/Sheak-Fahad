# Deployment guide

Stack: **GitHub** (source) → **Vercel** (hosting, auto-deploys `main`) · **Supabase** (Postgres, Auth, Storage) · **Resend** (email) · **Anthropic** (AI assistant, optional).
Production URL: https://sheak-fahad.vercel.app

Related: [ENVIRONMENT_VARIABLES](ENVIRONMENT_VARIABLES.md) · [DATABASE_SETUP](DATABASE_SETUP.md) · [STORAGE_SETUP](STORAGE_SETUP.md) · [PRODUCTION_CHECKLIST](PRODUCTION_CHECKLIST.md)

## 1. Local development
```bash
npm install
cp .env.example .env.local     # fill values — .env.local is git-ignored
npm run dev                    # http://localhost:3000
npm run lint && npm run typecheck && npm run build
npm run db:verify              # applies every migration to an in-memory Postgres and checks RLS
```
Without Supabase values the public site runs on `content/fallback.json` (read-only) and `/admin` shows a setup notice.

## 2. Switching the existing Vercel project (sheak-fahad) to this app
The old static site lives in `sheak-website/` and the Vercel project was set up for it. After `main` contains this Next.js app:
1. Vercel → project **sheak-fahad** → Settings → **Build & Deployment**:
   - **Framework Preset: Next.js**
   - **Root Directory: `./`** (empty — the repository root, *not* `sheak-website`)
   - Build command / output directory / install command: leave the Next.js defaults (`next build`, `.next`, `npm install`).
   - Node.js version: 20.x or newer.
2. Settings → **Environment Variables**: add the variables from [ENVIRONMENT_VARIABLES](ENVIRONMENT_VARIABLES.md) for *Production* (and *Preview* with preview values). At minimum `NEXT_PUBLIC_SITE_URL=https://sheak-fahad.vercel.app`.
3. Deployments → **Redeploy** the latest `main` deployment (env changes apply only to new builds).
4. Open https://sheak-fahad.vercel.app in a private window and run the checks in [PRODUCTION_CHECKLIST](PRODUCTION_CHECKLIST.md).

The legacy folder `sheak-website/` stays in the repository untouched (it is not served).

## 3. Supabase (database + admin)
Follow [DATABASE_SETUP](DATABASE_SETUP.md) and [STORAGE_SETUP](STORAGE_SETUP.md), then add the Supabase variables in Vercel and redeploy. Auth URL configuration:
- Supabase → Authentication → URL Configuration → **Site URL** `https://sheak-fahad.vercel.app`
- **Redirect URLs**: `https://sheak-fahad.vercel.app/**`, your preview domain pattern as shown in Vercel (e.g. `https://*-<team>.vercel.app/**`), `http://localhost:3000/**`
- Authentication → Providers → Email: enabled; **"Allow new users to sign up" off**.

## 4. Email (Resend)
Create an API key → `RESEND_API_KEY`; `NOTIFY_EMAIL_TO` = the inbox that receives contact notifications. Until a sending domain is verified, Resend sends only to the account's own address from `onboarding@resend.dev`. If Resend fails, messages are still stored and the failure is logged.

## 5. AI assistant (optional)
`ANTHROPIC_API_KEY` (server-only). Without it the assistant runs in clearly labelled Guide mode.

## 6. Preview vs production
- Every pushed branch / PR gets a Vercel **Preview** deployment using the *Preview* environment variables. Use a separate Supabase project (or at least separate keys) for previews if you test destructive admin actions.
- Only `main` deploys to **Production**.

## 7. Security reminders
Never commit `.env*` (only `.env.example`). The service-role key, Resend key and Anthropic key are server-only and must never get a `NEXT_PUBLIC_` prefix.
