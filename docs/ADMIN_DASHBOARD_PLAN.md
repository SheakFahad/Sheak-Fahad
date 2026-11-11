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
| Education | ordered | form + "show result publicly" toggle | |
| Research | single/multi | rich sections + architecture JSON editor with live diagram preview | upload documents |
| Skills | grouped by category | form + evidence picker (link projects/videos) | reorder |
| Achievements | list | form + certificate upload (PDF/image) | |
| Videos | grid | provider (YouTube/Vimeo/Upload), URL/ID, poster, category, aspect | featured/showreel flag |
| Travel | table + map preview | form with map click-to-pick (lat/lng optional), gallery upload | `is_demo` rows cannot be published |
| Memories | timeline | form + multi-photo upload | |
| Hobbies | bento preview | form | span toggle |
| Media Library | grid, filter by bucket/type, unused detector | alt (EN/BN), caption, focal point picker, "original photo" flag | replace file, delete (blocked if referenced) |
| Social Links | list | platform, URL (validated), placement toggles | reorder |
| Website Settings | — | title, tagline, SEO description, OG image, default theme, feature toggles (assistant, explore mode, sound), maintenance mode | export JSON backup |

## Editor UX
zod validation inline · autosave drafts every 10s (local) + explicit Save · unsaved-changes warning · upload progress · toasts · Markdown editor with preview for long text · EN | বাংলা tabs (Bangla optional per field) · status pill (Draft/Published/Archived) + visibility select · "Preview" opens the public page with a signed draft token (server-verified, admin only) · every save triggers `revalidateTag`.

## Implementation notes
- Server actions in `app/admin/**/actions.ts` → `requireAdmin()` → Supabase server client (user session) → mutation → `revalidateTag()`.
- Shared `ResourceTable` and `ResourceForm` components generated from per-resource config (fields + zod schema) to keep 15 sections consistent and small.
- Images uploaded straight to Storage from the browser (RLS-checked), then a `media_assets` row is created. Width/height/blurhash are computed client-side before upload.
