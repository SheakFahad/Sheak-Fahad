# Admin Dashboard Plan

## Access
`/admin/login` → Supabase Auth (email + password, optional TOTP). Middleware redirects unauthenticated users, and every server action and RLS policy re-checks `is_admin()`. The session idles out after 7 days (Supabase refresh). `noindex`, not linked from the public nav. A tiny "Admin" link appears in the footer only when already signed in as admin.

## Layout
Same identity (dark glass, Unbounded/Manrope) but calmer: no 3D, no Lenis, no custom cursor. Sidebar + top bar (global search, "View site", account). Responsive: the sidebar becomes a drawer on mobile.

## Sections & capabilities
| Section | List view | Editor | Special actions |
|---|---|---|---|
| Overview | KPI tiles: new messages, pending stories, drafts, published counts, storage used; recent activity; "Needs info" checklist (from MISSING_INFORMATION) | — | quick links |
| Messages | table: status, name, subject, category, date; filters, search, bulk | detail drawer | mark read/replied/archived, delete (confirm), reply via `mailto:` prefill |
| Story Submissions | pending first | detail with photo (signed URL) | approve (choose to publish photo or not), reject (reason), delete |
| Projects + Case Studies | sortable (drag reorder), featured toggle | tabs: Basics · Case study · Media · SEO · বাংলা | publish/unpublish, preview, duplicate |
| Career (experience) | ordered list | form with date pickers, "current" toggle | reorder, publish |
| Education | ordered | form + **"Show GPA/CGPA publicly" toggle (off by default)** | |
| Research | single/multi | rich sections + architecture JSON editor with live diagram preview | upload documents |
| Skills | grouped by category | form + evidence picker (link projects/videos) | reorder |
| Achievements | list | form + certificate upload (PDF/image) | |
| Videos | grid | provider (YouTube/Vimeo/Upload), URL/ID, poster, category, aspect | featured/showreel flag |
| Travel | table + map preview | form with map click-to-pick (lat/lng optional), gallery upload | `is_demo` rows cannot be published |
| Memories | timeline | form + multi-photo upload | |
| Hobbies | bento preview | form | span toggle |
| **Media Library / File Manager** | folder tree (create, rename, move, delete empty) · grid/list · filters: type, folder, category, tag, status, visibility, date · search · unused detector · storage usage meter | title, description, tags, date, category, alt + caption (EN/BN), focal point, "original photo" flag, status + visibility, version history | multi-file drag-and-drop upload with progress (resumable > 6 MB), bulk move/tag/publish/private/delete, **replace file (same ID)**, **"Use in…"** assign to any section/item, usage panel, private preview (signed URL), copy public link (published only), external video URL + poster |
| **Sections & Pages** | all `site_sections` with toggles: enabled, in nav, status, visibility; drag reorder | title, nav label, intro, hero media, SEO, EN/BN | **add a new section/page**, block builder (rich text, media, gallery, video, cards, timeline, quote, CTA, stats, embed), preview, hide/unpublish section |
| **Homepage (NEXUS)** | live preview | welcome label, title, subtitle, "I'm" prefix (EN/BN); portrait = profile.hero_media_id (Media Library, original-photo cutouts only); featured projects picker (drag order, published only); toggles: stations, featured strip, Earth, each environment layer; NEXUS AI on/off + mode | stations come from Sections (icon + hover line per section) |
| Social Links | list | platform, URL (validated), placement toggles | reorder |
| Website Settings | — | title, tagline, SEO description, OG image, default theme, feature toggles (AI assistant — off by default, explore mode, sound), AI provider/model display (keys stay in env), maintenance mode | export JSON backup |

**Admin route additions:** `/admin/media` (library), `/admin/sections` (sections, custom pages, block builder), `/admin/preview/[token]`.

## Editor UX
zod validation inline · autosave drafts every 10s (local) + explicit Save · unsaved-changes warning · upload progress · toasts · Markdown editor with preview for long text · EN | বাংলা tabs (Bangla optional per field) · status pill (Draft/Published/Archived) + visibility select · "Preview" opens the public page with a signed draft token (server-verified, admin only) · every save triggers `revalidateTag`.

## Implementation notes
- Server actions in `app/admin/**/actions.ts` → `requireAdmin()` → Supabase server client (user session) → mutation → `revalidateTag()`.
- Shared `ResourceTable` and `ResourceForm` components generated from per-resource config (fields + zod schema) to keep 15 sections consistent and small.
- Images uploaded straight to Storage from the browser (RLS-checked), then a `media_assets` row is created. Width/height/blurhash are computed client-side before upload.
