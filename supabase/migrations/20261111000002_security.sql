-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security, public views and safe public RPCs
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Enable + force RLS on every table in public
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;

-- 2) Admin full access everywhere (except where narrowed below)
do $$
declare t text;
begin
  foreach t in array array['media_folders','media_assets','site_settings','profiles','site_sections','pages','page_blocks','social_links','experiences','education','projects','project_media','project_case_studies','videos','research','skills','achievements','travel_locations','travel_photos','memories','hobbies','messages','story_submissions','preview_tokens']
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      'admin_all_' || t, t);
  end loop;
end $$;

-- 3) Public read: published + public/unlisted rows only
do $$
declare t text;
begin
  foreach t in array array['site_sections','pages','page_blocks','social_links','experiences','education','projects','research','skills','achievements','memories','hobbies','videos','travel_locations']
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (status = %L and visibility in (%L, %L))',
      'public_read_' || t, t, 'published', 'public', 'unlisted');
  end loop;
end $$;

-- Sections additionally require enabled = true
drop policy public_read_site_sections on public.site_sections;
create policy public_read_site_sections on public.site_sections for select to anon, authenticated
  using (enabled and status = 'published' and visibility in ('public', 'unlisted'));

-- Demo travel rows are never public
drop policy public_read_travel_locations on public.travel_locations;
create policy public_read_travel_locations on public.travel_locations for select to anon, authenticated
  using (not is_demo and status = 'published' and visibility in ('public', 'unlisted'));

-- Singletons are public (they hold no secrets)
create policy public_read_site_settings on public.site_settings for select to anon, authenticated using (true);
create policy public_read_profiles on public.profiles for select to anon, authenticated using (true);

-- Child tables follow their parent's visibility
create policy public_read_project_media on public.project_media for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published' and p.visibility in ('public', 'unlisted')));
create policy public_read_case_studies on public.project_case_studies for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published' and p.visibility in ('public', 'unlisted')));
create policy public_read_travel_photos on public.travel_photos for select to anon, authenticated
  using (exists (select 1 from public.travel_locations l where l.id = location_id and not l.is_demo and l.status = 'published' and l.visibility in ('public', 'unlisted')));

-- Media: published & not private, read through the safe view below (table itself is admin-only for anon).
-- (No anon policy on media_assets → anon reads nothing from the table directly.)

-- Admin profiles: an admin can read own row; only owners manage membership
create policy admin_profiles_self on public.admin_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy admin_profiles_owner on public.admin_profiles for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Notification logs: admins read; writes happen server-side (service role)
create policy notification_logs_admin_read on public.notification_logs for select to authenticated using ((select public.is_admin()));

-- rate_limits: no policies → only SECURITY DEFINER functions / service role touch it.

-- 4) Safe public views (security_invoker = false is intentional: they expose only safe columns of safe rows)
create view public.media_assets_public with (security_barrier) as
  select id, legacy_key, kind, title, alt, caption, translations, width, height, duration_s,
         focal_x, focal_y, display_aspect, blurhash, is_original_photo,
         public_path, static_src, external_url, version
  from public.media_assets
  where status = 'published' and visibility in ('public', 'unlisted');

create view public.public_stories with (security_barrier) as
  select id, title, visitor_name, body, case when show_photo then public_photo_path end as photo_path, reviewed_at as published_at
  from public.story_submissions
  where status = 'approved';

revoke all on public.media_assets_public, public.public_stories from public;
grant select on public.media_assets_public, public.public_stories to anon, authenticated;

-- 5) Rate limiter used by public RPCs (fixed window)
create function public.hit_rate_limit(p_key text, p_window interval, p_max int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
        c int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, w, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into c;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return c <= p_max;
end $$;
revoke execute on function public.hit_rate_limit(text, interval, int) from public;

-- 6) Public submissions — the ONLY way visitors can write
create function public.submit_message(
  p_name text, p_email text, p_subject text, p_category public.message_category,
  p_body text, p_ip_hash text, p_user_agent text, p_locale text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_ip_hash is null or length(p_ip_hash) < 16 then raise exception 'invalid_request'; end if;
  if length(coalesce(trim(p_name), '')) not between 1 and 100
     or length(coalesce(trim(p_body), '')) not between 10 and 4000
     or coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 200
     or length(coalesce(p_subject, '')) > 150 then
    raise exception 'invalid_input';
  end if;
  if not public.hit_rate_limit('msg:' || p_ip_hash, interval '1 hour', 5) then raise exception 'rate_limited'; end if;
  insert into public.messages (name, email, subject, category, body, ip_hash, user_agent, locale)
  values (trim(p_name), lower(trim(p_email)), nullif(trim(p_subject), ''), coalesce(p_category, 'general'), trim(p_body),
          p_ip_hash, left(p_user_agent, 300), left(p_locale, 8))
  returning id into v_id;
  return v_id;
end $$;

create function public.submit_story(
  p_title text, p_name text, p_email text, p_body text, p_photo_path text, p_consent boolean, p_ip_hash text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_ip_hash is null or length(p_ip_hash) < 16 then raise exception 'invalid_request'; end if;
  if not coalesce(p_consent, false) then raise exception 'consent_required'; end if;
  if length(coalesce(trim(p_title), '')) not between 3 and 150
     or length(coalesce(trim(p_name), '')) not between 1 and 100
     or length(coalesce(trim(p_body), '')) not between 20 and 5000
     or (p_email is not null and p_email <> '' and (p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 200))
     or (p_photo_path is not null and p_photo_path !~ '^[0-9a-f-]{36}\.(jpg|webp)$') then
    raise exception 'invalid_input';
  end if;
  if not public.hit_rate_limit('story:' || p_ip_hash, interval '1 day', 3) then raise exception 'rate_limited'; end if;
  insert into public.story_submissions (title, visitor_name, email, body, photo_path, consent, ip_hash)
  values (trim(p_title), trim(p_name), nullif(lower(trim(p_email)), ''), trim(p_body), p_photo_path, true, p_ip_hash)
  returning id into v_id;   -- status defaults to 'pending': never auto-published
  return v_id;
end $$;

revoke execute on function public.submit_message(text, text, text, public.message_category, text, text, text, text) from public;
revoke execute on function public.submit_story(text, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_message(text, text, text, public.message_category, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_story(text, text, text, text, text, boolean, text) to anon, authenticated;

-- 7) Usage view for the media library (admin only via RLS on underlying tables)
create view public.media_usage with (security_invoker = true) as
  select m.id as media_id, u.entity_type, u.entity_id, u.field
  from public.media_assets m
  join lateral (
    select 'profile'::text, null::uuid, 'avatar' where exists (select 1 from public.profiles where avatar_media_id = m.id)
    union all select 'profile', null, 'about' where exists (select 1 from public.profiles where about_media_id = m.id)
    union all select 'profile', null, 'cv' where exists (select 1 from public.profiles where cv_media_id = m.id)
    union all select 'section', s.id, 'hero' from public.site_sections s where s.hero_media_id = m.id
    union all select 'section', s.id, 'gallery' from public.site_sections s where m.id = any (s.gallery_media_ids)
    union all select 'project', p.id, 'cover' from public.projects p where p.cover_media_id = m.id
    union all select 'project', pm.project_id, 'gallery' from public.project_media pm where pm.media_id = m.id
    union all select 'experience', e.id, 'logo' from public.experiences e where e.logo_media_id = m.id
    union all select 'education', e.id, 'cover' from public.education e where e.cover_media_id = m.id
    union all select 'video', v.id, 'file' from public.videos v where v.media_id = m.id
    union all select 'video', v.id, 'poster' from public.videos v where v.poster_media_id = m.id
    union all select 'research', r.id, 'photo' from public.research r where m.id = any (r.media_ids) or m.id = any (r.document_media_ids)
    union all select 'achievement', a.id, 'file' from public.achievements a where a.media_id = m.id
    union all select 'travel', t.id, 'cover' from public.travel_locations t where t.cover_media_id = m.id
    union all select 'travel', tp.location_id, 'photo' from public.travel_photos tp where tp.media_id = m.id
    union all select 'memory', me.id, 'photo' from public.memories me where m.id = any (me.media_ids)
    union all select 'hobby', h.id, 'photo' from public.hobbies h where h.media_id = m.id
    union all select 'page', pg.id, 'cover' from public.pages pg where pg.cover_media_id = m.id
  ) as u(entity_type, entity_id, field) on true;
revoke all on public.media_usage from anon;
