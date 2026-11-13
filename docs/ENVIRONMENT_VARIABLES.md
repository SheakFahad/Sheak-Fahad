# Environment variables

Set locally in `.env.local` (git-ignored) and in Vercel → Settings → Environment Variables (Production and Preview separately). `NEXT_PUBLIC_*` values are embedded in the browser bundle — never put a secret in one.

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | yes (prod) | Canonical URL, e.g. `https://sheak-fahad.vercel.app` (no trailing slash). Used for metadata, sitemap, breadcrumbs JSON-LD. |
| `NEXT_PUBLIC_SUPABASE_URL` | public | for CMS/admin | Supabase project URL. Without it the site uses `content/fallback.json`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | for CMS/admin | Supabase anon key — safe in the browser because RLS limits it to published content and the contact RPC. |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | for contact pipeline / seeding | Bypasses RLS. Used only in `lib/supabase/admin.ts` (`server-only`). Never expose. |
| `RESEND_API_KEY` | **server only** | optional | Email notifications for new messages and admin replies. |
| `NOTIFY_EMAIL_TO` | server only | with Resend | Inbox that receives notifications. Never rendered on the site. |
| `NOTIFY_EMAIL_FROM` | server only | with Resend | Verified sender, e.g. `Portfolio <hello@yourdomain>`; `onboarding@resend.dev` until a domain is verified. |
| `ANTHROPIC_API_KEY` | **server only** | optional | Enables the AI mode of Fahad AI Assistant. Without it: Guide mode. |
| `ASSISTANT_MODEL` | server only | optional | Model id; default `claude-opus-5-5`. |
| `IP_HASH_SALT` | **server only** | for contact form | 32+ random characters; IPs are stored only as salted hashes for rate limiting. |
| `REVALIDATE_SECRET` | **server only** | optional | 32+ random characters for the on-demand revalidation endpoint. |
| `ATLAS_PREVIEW` | server | never in prod | `1` shows DEMO travel rows for layout testing. |

Generate random secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
