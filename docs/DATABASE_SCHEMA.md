# Database Schema (Supabase Postgres)

Migrations: `supabase/migrations/` (timestamped, version-controlled). Seed: `supabase/seed.sql` (verified and owner-stated data only).

## Conventions
- PK `id uuid default gen_random_uuid()`; `created_at`, `updated_at timestamptz default now()` (trigger `set_updated_at`).
- Content tables share: `slug text unique` (where routed), `status content_status default 'draft'` (`draft|published|archived`), `visibility visibility default 'public'` (`public|unlisted|private`), `sort_order int default 0`, `published_at timestamptz`, `translations jsonb default '{}'` (`{"bn": {...}}`), `search tsvector generated`.
- **Publicly readable** ⇔ `status='published' AND visibility IN ('public','unlisted')` (unlisted = reachable by link, excluded from lists/search/sitemap/AI).
- Media references → `media_assets.id` (FK), never raw URLs, except external video URLs.

## Enums
`content_status`, `visibility`, `message_status ('new','read','replied','archived')`, `message_category ('general','project','job','collaboration','other')`, `story_status ('pending','approved','rejected')`, `video_provider ('youtube','vimeo','storage')`, `admin_role ('owner','editor')`, `notification_kind ('message','story')`, `notification_status ('sent','failed','skipped')`.

## Tables (20 required + 2 support)
| # | Table | Key columns | Notes |
|---|---|---|---|
| 1 | `profiles` | full_name, headline, tagline, roles text[], intro, about_story, values jsonb, location_city, avatar_media_id, about_media_id, cv_media_id | Single row (`singleton bool unique check(singleton)`) |
| 2 | `experiences` | company, role, employment_type, start_date, end_date (null = present), is_current, location, summary, responsibilities text[], achievements text[], logo_media_id, company_url | |
| 3 | `education` | level ('ssc','hsc','bsc',…), institution, degree, department, group_name, start_year, end_year, result_label, result_value, show_result bool default false, summary, activities text[], cover_media_id | GPA hidden until `show_result` |
| 4 | `projects` | slug, title, project_type, summary, role, year, duration, team, tools text[], did text[], live_url, behance_url, prototype_url, is_featured, cover_media_id, is_concept_visual bool | |
| 5 | `project_media` | project_id FK cascade, media_id FK, kind ('screen','wireframe','flow','prototype','gallery'), caption, sort_order | |
| 6 | `project_case_studies` | project_id FK unique, overview, problem, objectives text[], research, user_flow, wireframes_note, ui_design, design_system, prototype_note, challenges, results, extra jsonb | 1:1 with projects |
| 7 | `videos` | slug, title, category ('showreel','editing','motion','2d','3d','promo','commercial','reel'), provider, external_id/url, media_id (storage), poster_media_id, duration_s, year, client, role, tools text[], description, aspect ('16:9','9:16','1:1'), is_featured | |
| 8 | `research` | slug, title, short_title, team jsonb, supervisor, co_supervisor, institution, term, abstract, problem, objectives text[], methodology, architecture jsonb (nodes/edges for the interactive diagram), datasets jsonb, metrics jsonb, results, tags text[], document_media_ids uuid[] | |
| 9 | `skills` | category ('uiux','graphic','data_art','research','video','motion','3d','frontend'), name, description, tools text[], evidence jsonb (links to project/video ids), icon | No percentage column (by design) |
| 10 | `achievements` | kind ('certificate','award','training','milestone'), title, issuer, issued_on, credential_id, credential_url, media_id, description | |
| 11 | `travel_locations` | slug, name, region ('bangladesh','world'), country, district, city, lat, lng (nullable → no marker), visited_from, visited_to, short_memory (≤ 300), story, tags text[], cover_media_id, is_demo bool default false | `is_demo` rows can never be published (CHECK constraint) |
| 12 | `travel_photos` | location_id FK cascade, media_id, caption, sort_order | |
| 13 | `memories` | slug, title, event_date, category ('university','village','friends','family','travel','work','other'), note, story, media_ids uuid[], tags text[] | |
| 14 | `hobbies` | title, description, icon, tags text[], media_id, span (1/2) | |
| 15 | `social_links` | platform, label, url (CHECK https/mailto/tel), handle, is_primary, show_in_footer, show_on_contact | Seeded with the official links |
| 16 | `messages` | name, email, subject, category, body, status default 'new', ip_hash, user_agent, locale, replied_at, archived_at | Insert only through RPC |
| 17 | `story_submissions` | title, visitor_name, email (nullable), body, photo_path (private bucket), status default 'pending', consent bool, reviewed_by, reviewed_at, rejection_reason, ip_hash, published_slug | Public read only when approved |
| 18 | `site_settings` | singleton, site_title, tagline, seo_description, og_media_id, theme_default, features jsonb (assistant/explore/sound toggles), maintenance bool, **home jsonb** (welcome_label, title, subtitle, intro_prefix, featured_project_slugs[] — ordered, show_stations, show_featured, show_globe, environment{nebula,planets,mountains,city,plants,ground}, translations), **assistant jsonb** ({mode: 'local'|'llm', provider}) — migration 0004 | NEXUS homepage is configured here; unpublished/private projects in the featured list are skipped automatically |
| 19 | `admin_profiles` | user_id PK FK auth.users, role admin_role, display_name, created_at | Membership = admin |
| 20 | `notification_logs` | kind, ref_id, channel ('email'), recipient, status, provider_id, error, created_at | Server-only writes |
| S1 | `media_assets` | folder_id FK, kind ('image','video','pdf','document','audio','other'), title, description, tags text[], category, taken_on date, original_filename, mime, size_bytes, width, height, duration_s, alt, caption, translations jsonb, focal_x, focal_y, blurhash, is_original_photo bool, **status** (draft/published/archived, default draft), **visibility** (default **private**), private_path (always), public_path (only while published), external_url (YouTube/Vimeo/large files), version int, replaced_at, uploaded_by | **Private by default.** Admin-only read/write on the table; the public sees a safe view only |
| S2 | `rate_limits` | key (ip_hash+action), window_start, count | Used by RPCs; not readable by anon |
| S3 | `media_folders` | parent_id FK self (nullable), name, slug, path (materialised, e.g. `/travel/2026/sajek`), description, sort_order | Folder tree for the Media Library (admin only) |
| S4 | `site_sections` | key (unique: 'home','about','career','education','projects','video_studio','research','skills','travel','memories','hobbies','contact', or custom), kind ('builtin','custom'), route_slug, title, nav_label, intro, hero_media_id, **icon** (station icon key), **station_text** (≤140 chars hover line), **enabled** bool, **show_in_nav** bool, status, visibility, sort_order, seo_title, seo_description, translations | Controls every section: hide/unpublish, rename, reorder nav. A disabled section returns 404 and is removed from nav, sitemap, search and AI context |
| S5 | `pages` | section_id FK (nullable), slug unique, title, excerpt, cover_media_id, status, visibility, published_at, seo fields, translations | **Admin-created custom pages / new sections** (rendered by the generic page route) |
| S6 | `page_blocks` | page_id FK cascade (or section_id FK for extra blocks on built-in sections), type ('rich_text','media','gallery','video','cards','timeline','quote','cta','stats','embed','divider'), data jsonb (zod-validated per type), status, visibility, sort_order, translations | Block builder: add content to any page without code |
| S7 | `preview_tokens` | token_hash, entity_type, entity_id, expires_at, created_by | Short-lived (30 min) draft preview links, admin-only |

### Media Library rules
- Upload target is **always** the private bucket (`media-private/<uuid>/<filename>`). Multi-file upload runs in parallel (max 4 concurrent), with progress and resumable uploads (TUS) for files over 6 MB.
- **Publish** (server action, admin only): copies the object to `media-public/<uuid>/<filename>`, sets `public_path`, `status='published'`, `visibility='public'`. **Unpublish/private**: deletes the public copy and clears `public_path`. The public bucket therefore only ever contains files explicitly published.
- Content can be published only if every media it references is published. The admin UI offers "publish attached media too" (explicit checkbox), never silently.
- **Replace file** keeps the same `media_assets.id` (so every assignment keeps working): uploads the new version, bumps `version`, re-publishes the public copy if it was published, and removes the old object.
- **Assign to section:** from the asset detail ("Use in…"), pick a target (project gallery, travel place, memory, certificate, video, page block, section hero…). This writes the existing FK/join rows. The view `media_usage` (union of all FK references) shows where an asset is used and blocks deleting assets that are still in use.
- Large videos (> 50 MB on the free plan) → `external_url` (YouTube/Vimeo unlisted) with an uploaded poster image.
- All Sheba company videos: `visibility='private'` until the owner confirms permission.

## Key functions
- `is_admin() returns bool` — `SECURITY DEFINER`, `STABLE`, `search_path=''`: `exists(select 1 from public.admin_profiles where user_id = auth.uid())`.
- `submit_message(name, email, subject, category, body, ip_hash, ua, locale) returns uuid` — SECURITY DEFINER: validates lengths and formats, honeypot is checked upstream, rate-limits 5/hour per ip_hash, inserts with status `new`.
- `submit_story(title, name, email, body, photo_path, consent, ip_hash) returns uuid` — same pattern, 3/day per ip_hash, status forced to `pending`.
- `search_content(q text, locale text)` — SECURITY INVOKER (RLS applies), returns `type, slug, title, snippet, rank`.
- `publish_guard()` trigger — sets `published_at` on publish; blocks `is_demo=true` rows from being published.

## Indexes
`(status, visibility, sort_order)` on every content table; unique `slug`; GIN on `search`; `messages(status, created_at desc)`; `story_submissions(status, created_at desc)`; `travel_locations(region, visited_from)`; `memories(event_date desc, category)`; FK indexes on all child tables.

## Storage buckets (revised: privacy enforced at the storage layer)
| Bucket | Public read | Write | Limits |
|---|---|---|---|
| `media-private` | ❌ (admin via signed URLs, 10 min) | admin | images, video/mp4|webm|quicktime, application/pdf, office docs; 50 MB (free plan) |
| `media-public` | ✅ | **server action only** (publish/unpublish copies) | mirrors published assets |
| `story-uploads` | ❌ (admin via signed URLs) | server route only, after validation | image/jpeg, png, webp, 5 MB |
Categories (profile, projects, travel, memories, certificates, documents/CV, videos…) are **folders + `category` metadata**, not separate buckets, so files can be reorganised freely without moving storage objects.

## Section & page model (everything CMS-driven)
- Built-in sections are rows in `site_sections` (seeded). Their pages are coded layouts that render **only** DB data: lists from the section's tables, plus optional extra `page_blocks` appended by the admin.
- **New sections** = `site_sections(kind='custom')` + a `pages` row + `page_blocks`. They are served by the generic route `app/[locale]/[section]/page.tsx` and appear in nav when `show_in_nav`.
- Profile/hero texts, roles, socials, contact details, footer text, SEO and feature toggles live in `profiles`, `social_links` and `site_settings`. **No personal content is hard-coded in components.**
- `education.show_result` defaults to **false**. The admin toggles GPA/CGPA visibility per row.
