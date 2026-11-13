-- ════════════════════════════════════════════════════════════════════════════
-- CMS extensions (docs/CMS_ARCHITECTURE.md): navigation, content items, media usage,
-- message replies, audit log, private status, soft delete, scheduled publishing.
-- Reuses every existing table; adds only what did not exist.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Publication states: private | draft | published | archived ─────────────
alter type public.content_status add value if not exists 'private' before 'draft';
alter type public.message_status add value if not exists 'spam';

-- ─── Soft delete on content tables ──────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['site_sections','pages','page_blocks','social_links','experiences','education','projects','videos','research','skills','achievements','travel_locations','memories','hobbies','media_assets','media_folders']
  loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
  end loop;
end $$;

-- ─── Sections & pages ───────────────────────────────────────────────────────
alter table public.site_sections
  add column if not exists page_id uuid references public.pages (id) on delete set null,
  add column if not exists is_featured boolean not null default false;

alter table public.pages
  add column if not exists description text;

alter table public.admin_profiles
  add column if not exists email text,
  add column if not exists last_sign_in_at timestamptz;

alter table public.messages
  add column if not exists starred boolean not null default false;

alter table public.travel_photos
  add column if not exists kind text not null default 'photo' check (kind in ('photo', 'video'));

-- Wider block catalogue (validated again server-side with zod; never raw HTML/JS)
alter table public.page_blocks drop constraint if exists page_blocks_type_check;
alter table public.page_blocks add constraint page_blocks_type_check check (type in (
  'heading', 'rich_text', 'image', 'media', 'gallery', 'video', 'document', 'button', 'link',
  'project_grid', 'timeline', 'stats', 'contact_form', 'travel_map', 'quote', 'cta', 'cards', 'divider', 'custom'
));

alter table public.notification_logs drop constraint if exists notification_logs_kind_check;
alter table public.notification_logs add constraint notification_logs_kind_check check (kind in ('message', 'story', 'reply'));

-- ─── Navigation ─────────────────────────────────────────────────────────────
create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.navigation_items (id) on delete cascade,
  label text not null check (length(label) between 1 and 60),
  icon text,
  section_id uuid references public.site_sections (id) on delete cascade,
  page_id uuid references public.pages (id) on delete cascade,
  href text check (href is null or href ~ '^(/[a-z0-9/_-]*|https://.+)$'),
  enabled boolean not null default true,
  show_desktop boolean not null default true,
  show_mobile boolean not null default true,
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nav_has_target check (num_nonnulls(section_id, page_id, href) = 1)
);
create index if not exists navigation_items_order_idx on public.navigation_items (parent_id, sort_order);

-- ─── Generic structured items for custom sections ───────────────────────────
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.site_sections (id) on delete cascade,
  kind text not null default 'card' check (kind ~ '^[a-z_]{2,30}$'),
  title text not null,
  subtitle text,
  body text,
  data jsonb not null default '{}',
  media_ids uuid[] not null default '{}',
  link_url text check (link_url is null or link_url ~ '^(/|https://)'),
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_items_section_idx on public.content_items (section_id, sort_order);

-- ─── Media references held inside JSON (blocks / items) ─────────────────────
create table if not exists public.content_media (
  media_id uuid not null references public.media_assets (id) on delete restrict,
  entity_type text not null check (entity_type in ('block', 'item', 'setting')),
  entity_id uuid,
  field text not null default 'media',
  created_at timestamptz not null default now(),
  unique (media_id, entity_type, entity_id, field)
);
create index if not exists content_media_entity_idx on public.content_media (entity_type, entity_id);

-- ─── Messages: replies ──────────────────────────────────────────────────────
create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 10000),
  delivery_status public.notification_status not null default 'skipped',
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists message_replies_msg_idx on public.message_replies (message_id, created_at);

-- ─── Audit log ──────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null check (action ~ '^[a-z_.]{3,60}$'),
  entity_type text not null,
  entity_id text,
  summary text check (summary is null or length(summary) <= 500),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_time_idx on public.audit_logs (created_at desc);

-- ─── Triggers for the new tables ────────────────────────────────────────────
create trigger navigation_items_updated_at before update on public.navigation_items for each row execute function public.set_updated_at();
create trigger content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
create trigger content_items_published_at before insert or update on public.content_items for each row execute function public.set_published_at();

-- ─── RLS for new tables ─────────────────────────────────────────────────────
alter table public.navigation_items enable row level security;
alter table public.navigation_items force row level security;
alter table public.content_items enable row level security;
alter table public.content_items force row level security;
alter table public.content_media enable row level security;
alter table public.content_media force row level security;
alter table public.message_replies enable row level security;
alter table public.message_replies force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

create policy admin_all_navigation_items on public.navigation_items for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all_content_items on public.content_items for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all_content_media on public.content_media for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all_message_replies on public.message_replies for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- Audit log: admins read and append; nobody updates or deletes
create policy audit_logs_admin_read on public.audit_logs for select to authenticated using ((select public.is_admin()));
create policy audit_logs_admin_insert on public.audit_logs for insert to authenticated with check ((select public.is_admin()) and actor_id = (select auth.uid()));

create policy public_read_navigation_items on public.navigation_items for select to anon, authenticated using (enabled);

-- ─── Public read rules v2: published, not private, not deleted, publish time reached ──
do $$
declare t text;
begin
  foreach t in array array['pages','page_blocks','social_links','experiences','education','projects','research','skills','achievements','memories','hobbies','videos','content_items']
  loop
    execute format('drop policy if exists %I on public.%I', 'public_read_' || t, t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (status::text = %L and visibility <> %L and deleted_at is null %s)',
      'public_read_' || t, t, 'published', 'private',
      case when t in ('page_blocks', 'social_links') then '' else 'and (published_at is null or published_at <= now())' end);
  end loop;
end $$;

drop policy if exists public_read_site_sections on public.site_sections;
create policy public_read_site_sections on public.site_sections for select to anon, authenticated
  using (enabled and status::text = 'published' and visibility <> 'private' and deleted_at is null and (published_at is null or published_at <= now()));

drop policy if exists public_read_travel_locations on public.travel_locations;
create policy public_read_travel_locations on public.travel_locations for select to anon, authenticated
  using (not is_demo and status::text = 'published' and visibility <> 'private' and deleted_at is null and (published_at is null or published_at <= now()));

-- Safe media view excludes deleted assets
create or replace view public.media_assets_public with (security_barrier) as
  select id, legacy_key, kind, title, alt, caption, translations, width, height, duration_s,
         focal_x, focal_y, display_aspect, blurhash, is_original_photo,
         public_path, static_src, external_url, version
  from public.media_assets
  where status::text = 'published' and visibility <> 'private' and deleted_at is null;

-- Usage view now also covers JSON references and settings
create or replace view public.media_usage with (security_invoker = true) as
  select m.id as media_id, u.entity_type, u.entity_id, u.field
  from public.media_assets m
  join lateral (
    select 'profile'::text, null::uuid, 'avatar'::text where exists (select 1 from public.profiles where avatar_media_id = m.id)
    union all select 'profile', null, 'about' where exists (select 1 from public.profiles where about_media_id = m.id)
    union all select 'profile', null, 'cv' where exists (select 1 from public.profiles where cv_media_id = m.id)
    union all select 'profile', null, 'hero' where exists (select 1 from public.profiles where hero_media_id = m.id)
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
    union all select 'item', ci.id, 'media' from public.content_items ci where m.id = any (ci.media_ids)
    union all select cm.entity_type, cm.entity_id, cm.field from public.content_media cm where cm.media_id = m.id
  ) as u(entity_type, entity_id, field) on true;
revoke all on public.media_usage from anon;

-- Dashboard counters in one round trip (admins only)
create or replace function public.admin_overview() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'pages', (select count(*) from public.pages where deleted_at is null),
    'sections', (select count(*) from public.site_sections where deleted_at is null),
    'sections_published', (select count(*) from public.site_sections where deleted_at is null and status::text = 'published'),
    'drafts', (select (select count(*) from public.projects where deleted_at is null and status::text = 'draft')
                    + (select count(*) from public.pages where deleted_at is null and status::text = 'draft')
                    + (select count(*) from public.site_sections where deleted_at is null and status::text = 'draft')
                    + (select count(*) from public.travel_locations where deleted_at is null and status::text = 'draft')),
    'projects', (select count(*) from public.projects where deleted_at is null),
    'media', (select count(*) from public.media_assets where deleted_at is null),
    'storage_bytes', (select coalesce(sum(size_bytes), 0) from public.media_assets where deleted_at is null),
    'unread_messages', (select count(*) from public.messages where status = 'new'),
    'travel', (select count(*) from public.travel_locations where deleted_at is null and not is_demo)
  );
end $$;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
