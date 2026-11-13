-- ════════════════════════════════════════════════════════════════════════════
-- Storage buckets & policies (privacy enforced at the storage layer)
-- media-private : every upload lands here (no public read)
-- media-public  : only copies of explicitly published assets
-- story-uploads : visitor photos, private, written by the server route only
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media-private', 'media-private', false, 52428800, array[
    'image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml',
    'video/mp4','video/webm','video/quicktime',
    'application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]),
  ('media-public', 'media-public', true, 52428800, null),
  ('story-uploads', 'story-uploads', false, 5242880, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Admin-only management of private media
create policy media_private_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'media-private' and (select public.is_admin()));
create policy media_private_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media-private' and (select public.is_admin()));
create policy media_private_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media-private' and (select public.is_admin()));
create policy media_private_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media-private' and (select public.is_admin()));

-- Public bucket: anyone may read; only admins write (in practice only the publish server action)
create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media-public');
create policy media_public_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'media-public' and (select public.is_admin()));
create policy media_public_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media-public' and (select public.is_admin()));
create policy media_public_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media-public' and (select public.is_admin()));

-- Story uploads: admins read/delete; inserts only via the server (service role bypasses RLS)
create policy story_uploads_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'story-uploads' and (select public.is_admin()));
create policy story_uploads_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'story-uploads' and (select public.is_admin()));
