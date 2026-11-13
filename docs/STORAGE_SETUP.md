# Storage setup (Supabase Storage)

Uploads never touch the Vercel server's disk (it is read-only and ephemeral). The admin browser uploads directly to Supabase Storage with the admin's session; policies are enforced by Supabase.

| Bucket | Public | Who writes | Purpose |
|---|---|---|---|
| `media-private` | no | admins (RLS) | Every upload lands here first. Previews in the admin use short-lived signed URLs. |
| `media-public` | yes (read) | admins (publish action) | A copy is made **only** when an asset is published; unpublish deletes the copy. Public pages reference only these URLs or files bundled in `/public`. |
| `story-uploads` | no | server route only | Visitor photos attached to stories; reviewed by an admin before anything is published. |

The buckets and policies are created by `supabase/migrations/20261111000003_storage.sql`. After applying it, check Storage → Buckets shows the three buckets and that `media-public` is marked public.

Rules:
- Allowed types: JPG, PNG, WebP, AVIF, GIF, SVG (sanitised before saving — scripts, event handlers and `foreignObject` removed), MP4, WebM, MOV, PDF, DOC(X), PPT(X). Max 50 MB per file (videos larger than that: YouTube/Vimeo link instead).
- Replacing a file keeps the same media id (version + 1) so every page that uses it updates.
- Deleting is blocked while published content still uses the file; the Media Library lists where it is used.
- Private files never get a public URL.

Planned with the Media Library: `next.config.ts` will allow images from `*.supabase.co/storage/v1/object/public/media-public/**`.
