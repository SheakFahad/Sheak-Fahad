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
| 18 | `site_settings` | singleton, site_title, tagline, seo_description, og_media_id, theme_default, features jsonb (assistant/explore/sound toggles), maintenance bool | |
| 19 | `admin_profiles` | user_id PK FK auth.users, role admin_role, display_name, created_at | Membership = admin |
| 20 | `notification_logs` | kind, ref_id, channel ('email'), recipient, status, provider_id, error, created_at | Server-only writes |
| S1 | `media_assets` | bucket, path, mime, size_bytes, width, height, alt, alt_bn, caption, focal_x, focal_y, is_original_photo bool, blurhash, uploaded_by | Admin-only write |
| S2 | `rate_limits` | key (ip_hash+action), window_start, count | Used by RPCs; not readable by anon |

## Key functions
- `is_admin() returns bool` — `SECURITY DEFINER`, `STABLE`, `search_path=''`: `exists(select 1 from public.admin_profiles where user_id = auth.uid())`.
- `submit_message(name, email, subject, category, body, ip_hash, ua, locale) returns uuid` — SECURITY DEFINER: validates lengths and formats, honeypot is checked upstream, rate-limits 5/hour per ip_hash, inserts with status `new`.
- `submit_story(title, name, email, body, photo_path, consent, ip_hash) returns uuid` — same pattern, 3/day per ip_hash, status forced to `pending`.
- `search_content(q text, locale text)` — SECURITY INVOKER (RLS applies), returns `type, slug, title, snippet, rank`.
- `publish_guard()` trigger — sets `published_at` on publish; blocks `is_demo=true` rows from being published.

## Indexes
`(status, visibility, sort_order)` on every content table; unique `slug`; GIN on `search`; `messages(status, created_at desc)`; `story_submissions(status, created_at desc)`; `travel_locations(region, visited_from)`; `memories(event_date desc, category)`; FK indexes on all child tables.

## Storage buckets
| Bucket | Public read | Write | Limits |
|---|---|---|---|
| `profile-photos` | ✅ | admin | image/*, 10 MB |
| `project-images` | ✅ | admin | image/*, 10 MB |
| `travel-photos` | ✅ | admin | image/*, 10 MB |
| `memories` | ✅ | admin | image/*, 10 MB |
| `certificates` | ✅ | admin | image/*, application/pdf, 10 MB |
| `documents` | ✅ (CV, thesis PDF once approved) | admin | application/pdf, 20 MB |
| `videos` | ✅ | admin | video/mp4, video/webm, 50 MB (free-plan cap) |
| `story-uploads` | ❌ private (admin via signed URLs) | anon insert via server route only (validated) | image/jpeg, png, webp, 5 MB |
Public buckets hold only content the admin chose to publish. Private-visibility media goes in a separate `private-media` bucket served by signed URLs.
