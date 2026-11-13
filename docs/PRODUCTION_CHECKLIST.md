# Production checklist

Tick each item on the **production URL** (https://sheak-fahad.vercel.app), in a private window, on desktop and on a real phone. Deployment is not "done" until every critical item passes.

## Before pushing
- [ ] `npm run lint && npm run typecheck && npm run build` pass
- [ ] `npm run db:verify` passes
- [ ] `git status` shows no `.env*` (other than `.env.example`), no private photos, no personal documents of other people
- [ ] `.env.example` contains variable names only

## Vercel
- [ ] Framework preset **Next.js**, Root Directory = repository root (not `sheak-website`)
- [ ] Production env vars set (ENVIRONMENT_VARIABLES.md); Preview env vars set separately
- [ ] Latest `main` deployment is **Ready** and assigned to sheak-fahad.vercel.app

## Public site (critical)
- [ ] Home loads; portrait visible on desktop and phone; no intro screen
- [ ] Every navigation link, More menu, Explore mode, search
- [ ] Each section page loads (About … Contact), project case studies load
- [ ] No email address or phone number visible as text; contact icons open mail / WhatsApp
- [ ] Contact form: with Supabase — message saved (visible in /admin/messages); without — opens email app
- [ ] AI assistant opens; Guide mode or AI mode as configured
- [ ] Bangla (`/bn`) works; light/dark theme toggle
- [ ] No console errors; Lighthouse (mobile) checked

## Database / admin (after Supabase is connected)
- [ ] `/admin` redirects to `/admin/login` when signed out
- [ ] A non-admin account cannot open admin pages
- [ ] Owner can sign in and sees real dashboard numbers
- [ ] Draft content is not visible publicly; publishing makes it appear without a redeploy; unpublishing removes it
- [ ] Private media URLs return an error when opened signed out
- [ ] Supabase Auth URL configuration contains the production and preview URLs

## Email
- [ ] Contact form sends a notification to the owner inbox (Resend dashboard shows "delivered")
- [ ] A failed send still keeps the message and logs the failure
