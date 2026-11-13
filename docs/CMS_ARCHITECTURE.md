# CMS + Admin architecture (2026-11-13)

Goal: the owner manages the whole public site from `/admin` — pages, sections, navigation, media, every portfolio collection, homepage, messages — without touching code. Published changes appear on the live site without a redeploy.

## 1. Existing architecture audit

| Area | State before this phase |
|---|---|
| Public site | Next.js 16 App Router, Server Components, next-intl (en/bn). All content read through `lib/content/repository.ts` from `content/fallback.json`. |
| Database | 4 migrations in `supabase/migrations` (never applied): enums, 25 tables (media library, sections, pages + blocks, portfolio collections, messages, stories, rate limits, preview tokens), RLS on every table, public views, rate-limited `submit_message` / `submit_story` RPCs, storage buckets + policies, media usage view. |
| Auth / admin | None. `/admin` was a placeholder. `@supabase/ssr` + `supabase-js` installed but unused. |
| Storage | Buckets defined (`media-private`, `media-public`, `story-uploads`); no upload code. |
| Email | `RESEND_API_KEY` documented; no code. Contact form opens mailto/WhatsApp. |
| AI | `/api/assistant` (Anthropic SDK, server-side key) + offline guide mode. |
| Infra | No Supabase project, no Docker / Supabase CLI on this machine. GitHub remote configured. |

## 2. Database schema (reuse first)

Requested entity → table:

| Requested | Table | Change |
|---|---|---|
| admin_users | `admin_profiles` | exists (owner / editor); + `email`, `last_sign_in_at` |
| site_settings | `site_settings` | exists; + `home`, `assistant`, `nav_primary` (0004) |
| pages | `pages` | exists; + `description`, `deleted_at`, `section_id` optional |
| sections | `site_sections` | exists; + `page_id`, `icon`, `station_name`, `station_text`, `is_featured`, `deleted_at` |
| navigation_items | **`navigation_items`** (new) | label, icon, href \| section_id \| page_id, parent_id (submenu), show_desktop / show_mobile, enabled, sort |
| content_blocks | `page_blocks` | exists; block types widened, data validated with zod (`lib/cms/blocks.ts`) |
| content_items | **`content_items`** (new) | repeatable structured items for custom sections |
| media_assets / media_folders | exist | + `deleted_at` |
| content_media | **`content_media`** (new) | media references inside blocks / items (usage tracking, safe replace + delete warnings) |
| projects, experiences, education, research_items (`research`), videos, skills, achievements, memories, hobbies | exist | + `deleted_at` |
| travel_locations / travel_media (`travel_photos`) | exist | + `kind` (photo/video), related memories / videos (0004) |
| contact_messages (`messages`) | exists | + `starred`; status + `spam` |
| message_replies | **`message_replies`** (new) | outbound replies, delivery status |
| email_logs (`notification_logs`) | exists | kind + `reply` |
| ai_settings | `site_settings.assistant` | mode, provider, enabled |
| audit_logs | **`audit_logs`** (new) | actor, action, entity, before/after summary |

Publication: `status` = `private | draft | published | archived` (+ `visibility` public/unlisted/private, kept for unlisted pages). Public RLS: `status = 'published' AND visibility <> 'private' AND deleted_at IS NULL AND (published_at IS NULL OR published_at <= now())` — scheduled publishing = a future `published_at`. Soft delete = `deleted_at` (restore clears it).

## 3. Admin routes

`/admin/login` (public) · everything else requires an admin session (server-side check in the admin layout + every server action):
`/admin` (dashboard) · `/admin/pages` · `/admin/sections` · `/admin/navigation` · `/admin/media` · `/admin/homepage` · `/admin/projects` · `/admin/experience` · `/admin/education` · `/admin/research` · `/admin/videos` · `/admin/skills` · `/admin/achievements` · `/admin/travel` · `/admin/memories` · `/admin/hobbies` · `/admin/messages` · `/admin/ai-assistant` · `/admin/settings` · `/admin/users` · `/admin/security` · `/admin/activity-logs`.

## 4. Storage

- Every upload → private bucket `media-private` (uploaded by the admin's session through RLS; never through local disk — works on Vercel).
- **Publish** copies the object to `media-public` and sets `public_path`; unpublish deletes the public copy. Public pages only ever see `media-public` URLs (or site-bundled `static_src`).
- Private previews in admin use short-lived **signed URLs**.
- Replace keeps the same `media_assets.id` (version +1) so every reference updates at once.
- Delete is blocked while `media_usage` shows published references (warning lists them).
- Allowed: jpg/png/webp/avif/gif, svg (sanitised: scripts/handlers/foreignObject stripped server-side), mp4/webm/mov, pdf, doc(x)/ppt(x). 50 MB limit.

## 5. Security

- Supabase Auth (email + password, no sign-up from the site). The first owner is created by `scripts/create-admin.mjs` (reads email/password from the terminal, never stored in code).
- `is_admin()` / `is_owner()` SECURITY DEFINER helpers; RLS on every table; admin writes go through the **user's session** (RLS applies). Service role is used only in `lib/supabase/admin.ts` (`server-only`) for the contact pipeline and seeding.
- Admin layout + every server action call `requireAdmin()`; `/admin` is `noindex`, `no-store`, `X-Frame-Options: DENY`.
- Rate limits: contact form RPC, login attempts (Supabase), assistant API.
- Every admin mutation writes an `audit_logs` row.
- No arbitrary HTML/JS: blocks are typed JSON validated with zod and rendered by fixed components.

## 6. Implementation phases

| # | Scope | Status |
|---|---|---|
| A | Migration 0005 (CMS extensions), SQL verified on Postgres (PGlite) | this phase |
| B | Supabase clients, env validation, admin auth (login/logout/guard), admin shell, real-data dashboard | this phase |
| C | Repository reads Supabase when configured (fallback JSON otherwise); seed script imports the current verified content + bundled images | this phase |
| D | Deployment docs: DEPLOYMENT_GUIDE, ENVIRONMENT_VARIABLES, DATABASE_SETUP, STORAGE_SETUP, PRODUCTION_CHECKLIST | this phase |
| E | Media Library (upload, folders, publish/unpublish, replace, usage, delete guard) | next |
| F | Generic collection editor + managers (projects, travel, experience, education, research, videos, skills, achievements, memories, hobbies) | next |
| G | Pages / Sections / Blocks / Navigation / Homepage managers + preview | next |
| H | Messages inbox + `/api/contact` + Resend notify + replies; AI settings; users / security / activity logs | next |
| I | End-to-end tests against the real Supabase project (the 20-step workflow) + Vercel preview + production | needs the owner's Supabase/Vercel/Resend accounts |
