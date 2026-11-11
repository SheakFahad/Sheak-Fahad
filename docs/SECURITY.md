# Security Plan

## Principles
1. Authorization is enforced in **Postgres RLS and Storage policies**. Middleware and UI checks are convenience only. Hiding `/admin` is not security.
2. The **service-role key is server-only** (`lib/supabase/admin.ts` imports `server-only`). It never appears in a `NEXT_PUBLIC_*` var or client bundle. A build check greps `.next/static` for the key prefix.
3. **No hard-coded admin credentials.** Public sign-up is disabled in Supabase Auth. The first admin is invited from the dashboard and added to `admin_profiles` by SQL (see DEPLOYMENT_GUIDE §3).
4. **Least data:** public endpoints accept only what they need. IPs are stored as salted SHA-256 hashes. Emails of story submitters are optional and never public.

## RLS matrix (`anon` = visitors, `authenticated` non-admin = treated like anon, admin = `is_admin()`)
| Table group | anon SELECT | anon INSERT | admin ALL |
|---|---|---|---|
| Content tables (profiles…social_links, media_assets) | only published + public/unlisted rows | ✗ | ✓ |
| `messages` | ✗ | ✗ (only via `submit_message` RPC) | ✓ |
| `story_submissions` | only `status='approved'`, and only safe columns (via view `public_stories`: title, visitor_name, body, approved photo, date) | ✗ (only via `submit_story` RPC) | ✓ |
| `site_settings` | ✓ (non-secret fields only) | ✗ | ✓ |
| `admin_profiles` | ✗ (an admin can read own row) | ✗ | owner only |
| `notification_logs`, `rate_limits` | ✗ | ✗ | read only (writes by server/RPC) |
Every table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. A migration test asserts that no table lacks RLS.

## Storage policies
- Public buckets: `select` for everyone; `insert/update/delete` only `is_admin()`.
- `story-uploads`: no public select. Insert happens only from `/api/stories` after server-side validation (magic-byte check, ≤ 5 MB, jpeg/png/webp, re-encoded with `sharp` to strip EXIF/GPS). The server uses the service role for this single write into a random path. Admin reads via 60-second signed URLs.

## Forms & abuse
- zod validation on client **and** server (same schema).
- Honeypot field + minimum fill time (3 s) + optional Cloudflare Turnstile.
- Rate limits in RPCs: messages 5/h/IP, stories 3/day/IP, assistant 20/h/IP, search 60/min/IP.
- Output encoding: React escapes by default. Rich text (case studies) is stored as Markdown and rendered with a sanitising renderer (no raw HTML).
- Stories are **never auto-published**: status starts `pending`, and only an admin can approve.

## Web hardening
- Security headers in `next.config.ts`: CSP (self + Supabase + YouTube/Vimeo + fonts + Anthropic is server-side only), `X-Frame-Options: DENY` (admin), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic off), HSTS (Vercel).
- `/admin/*` sends `X-Robots-Tag: noindex` and is excluded from the sitemap.
- Supabase Auth: email + password with a strong password, optional TOTP MFA (recommended), session cookies via `@supabase/ssr`, middleware refreshes them.
- Server actions verify `is_admin()` again server-side before any mutation (defence in depth).

## AI assistant safety
Context = published public content only. The system prompt forbids inventing personal facts. The visitor's text is treated as a question, never as instructions that change the rules. No tool use and no browsing. Rate limited.

## Privacy rules for content
- Never publish: student IDs (visible on the thesis cover), home address, family details, other people's documents.
- Friends' faces: publish only with consent, or keep them `private`.
- Original photos (`media_assets.is_original_photo = true`): the UI may crop or frame them but **never** filters or regenerates the face. The upload pipeline only resizes and re-encodes them.

## Backups
Supabase daily backups (plan-dependent), plus an admin **Export** button (JSON of all content tables) and documented restore (`DEPLOYMENT_GUIDE §7`).

## Verification checklist (Phase 10)
anon cannot read draft/private rows · anon cannot select messages · anon cannot update anything · a non-admin authenticated user cannot write · a story stays hidden until approved · service key absent from client bundle · storage private bucket denies public GET · rate limits trigger.
