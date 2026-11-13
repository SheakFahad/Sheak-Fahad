-- ════════════════════════════════════════════════════════════════════════════
-- Sheak Fahad — Digital Universe · core schema
-- Docs: docs/DATABASE_SCHEMA.md · docs/SECURITY.md
-- Every table has RLS enabled + forced. Public = published & public/unlisted only.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.visibility as enum ('public', 'unlisted', 'private');
create type public.message_status as enum ('new', 'read', 'replied', 'archived');
create type public.message_category as enum ('general', 'project', 'job', 'collaboration', 'other');
create type public.story_status as enum ('pending', 'approved', 'rejected');
create type public.video_provider as enum ('youtube', 'vimeo', 'storage');
create type public.admin_role as enum ('owner', 'editor');
create type public.media_kind as enum ('image', 'video', 'pdf', 'document', 'audio', 'other');
create type public.notification_status as enum ('sent', 'failed', 'skipped');

-- ─── Helpers ────────────────────────────────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Sets published_at on first publish.
create function public.set_published_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- ─── Admin membership (needed by is_admin) ──────────────────────────────────
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null default 'editor',
  display_name text,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles where user_id = (select auth.uid()));
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role = 'owner');
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to authenticated;

-- ─── Media library ──────────────────────────────────────────────────────────
create table public.media_folders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.media_folders (id) on delete restrict,
  name text not null check (length(name) between 1 and 120),
  slug text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, slug)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,                      -- stable id used by seed/fallback (e.g. 'm-profile')
  folder_id uuid references public.media_folders (id) on delete set null,
  kind public.media_kind not null default 'image',
  title text,
  description text,
  tags text[] not null default '{}',
  category text,
  taken_on date,
  original_filename text,
  mime text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width int,
  height int,
  duration_s numeric,
  alt text not null default '',
  caption text,
  translations jsonb not null default '{}',
  focal_x real not null default 0.5 check (focal_x between 0 and 1),
  focal_y real not null default 0.5 check (focal_y between 0 and 1),
  display_aspect text,
  blurhash text,
  is_original_photo boolean not null default false,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'private',
  private_path text,                           -- object in bucket media-private (always for uploads)
  public_path text,                            -- object in bucket media-public (only while published)
  static_src text,                             -- site-bundled file (e.g. /images/profile.jpg) for seeded assets
  external_url text check (external_url is null or external_url ~ '^https://'),
  version int not null default 1,
  replaced_at timestamptz,
  uploaded_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A published+public asset must have something publicly servable.
  constraint media_public_has_source check (
    not (status = 'published' and visibility <> 'private') or public_path is not null or static_src is not null or external_url is not null
  )
);
create index media_assets_folder_idx on public.media_assets (folder_id);
create index media_assets_status_idx on public.media_assets (status, visibility);
create index media_assets_tags_idx on public.media_assets using gin (tags);

-- ─── Site structure ─────────────────────────────────────────────────────────
create table public.site_settings (
  singleton boolean primary key default true check (singleton),
  site_title text not null,
  tagline text not null default '',
  seo_description text not null default '',
  og_media_id uuid references public.media_assets (id) on delete set null,
  theme_default text not null default 'dark' check (theme_default in ('dark', 'light')),
  features jsonb not null default '{"assistant": false, "explore_mode": true, "sound": false}',
  footer_text text,
  maintenance boolean not null default false,
  translations jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.profiles (
  singleton boolean primary key default true check (singleton),
  full_name text not null,
  roles text[] not null default '{}',
  tagline text not null default '',
  intro text not null default '',
  location_city text,
  avatar_media_id uuid references public.media_assets (id) on delete set null,
  about_media_id uuid references public.media_assets (id) on delete set null,
  cv_media_id uuid references public.media_assets (id) on delete set null,
  hero_tagline text,
  hero_text text,
  hero_media_id uuid references public.media_assets (id) on delete set null,
  hero_skills jsonb not null default '[]',   -- [{key,title,text,icon}] shown around the hero portrait
  translations jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.site_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  kind text not null default 'custom' check (kind in ('builtin', 'custom')),
  route_slug text not null unique check (route_slug ~ '^[a-z0-9-]*$'),
  title text not null,
  nav_label text not null,
  eyebrow text,
  intro text,
  hero_media_id uuid references public.media_assets (id) on delete set null,
  gallery_media_ids uuid[] not null default '{}',
  enabled boolean not null default true,
  show_in_nav boolean not null default true,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.site_sections (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  excerpt text,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages (id) on delete cascade,
  section_id uuid references public.site_sections (id) on delete cascade,
  type text not null check (type in ('rich_text', 'media', 'gallery', 'video', 'cards', 'timeline', 'quote', 'cta', 'stats', 'embed', 'divider')),
  data jsonb not null default '{}',
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint block_has_parent check ((page_id is not null) <> (section_id is not null))
);
create index page_blocks_page_idx on public.page_blocks (page_id, sort_order);
create index page_blocks_section_idx on public.page_blocks (section_id, sort_order);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  url text not null check (url ~ '^(https://|mailto:|tel:)'),
  handle text,
  show_in_footer boolean not null default true,
  show_on_contact boolean not null default true,
  status public.content_status not null default 'published',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Portfolio content ──────────────────────────────────────────────────────
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  company text not null,
  role text not null,
  employment_type text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  location text,
  summary text,
  responsibilities text[] not null default '{}',
  achievements text[] not null default '{}',
  logo_media_id uuid references public.media_assets (id) on delete set null,
  company_url text check (company_url is null or company_url ~ '^https://'),
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exp_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  level text not null check (level in ('ssc', 'hsc', 'bsc', 'msc', 'other')),
  institution text not null,
  degree text not null,
  department text,
  group_name text,
  start_year int check (start_year between 1950 and 2100),
  end_year int check (end_year between 1950 and 2100),
  result_label text,
  result_value text,
  show_result boolean not null default false,  -- GPA/CGPA hidden unless the owner opts in
  summary text,
  activities text[] not null default '{}',
  cover_media_id uuid references public.media_assets (id) on delete set null,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  project_type text not null,
  summary text,
  role text,
  year int check (year between 1990 and 2100),
  tools text[] not null default '{}',
  did text[] not null default '{}',
  live_url text check (live_url is null or live_url ~ '^https://'),
  behance_url text check (behance_url is null or behance_url ~ '^https://'),
  prototype_url text check (prototype_url is null or prototype_url ~ '^https://'),
  is_featured boolean not null default false,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  is_concept_visual boolean not null default false,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  kind text not null default 'gallery' check (kind in ('screen', 'wireframe', 'flow', 'prototype', 'gallery')),
  caption text,
  sort_order int not null default 0,
  unique (project_id, media_id)
);
create index project_media_project_idx on public.project_media (project_id, sort_order);

create table public.project_case_studies (
  project_id uuid primary key references public.projects (id) on delete cascade,
  overview text,
  problem text,
  objectives text[] not null default '{}',
  research text,
  user_flow text,
  wireframes_note text,
  ui_design text,
  design_system text,
  prototype_note text,
  challenges text,
  results text,
  extra jsonb not null default '{}',
  translations jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  category text not null check (category in ('showreel', 'editing', 'motion', '2d', '3d', 'promo', 'commercial', 'reel')),
  provider public.video_provider not null,
  external_id text,
  media_id uuid references public.media_assets (id) on delete restrict,
  poster_media_id uuid references public.media_assets (id) on delete set null,
  duration_s int,
  year int,
  client text,
  role text,
  tools text[] not null default '{}',
  description text,
  aspect text not null default '16:9' check (aspect in ('16:9', '9:16', '1:1')),
  is_featured boolean not null default false,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'private',  -- company videos stay private until permission
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_source check (
    (provider = 'storage' and media_id is not null) or (provider <> 'storage' and external_id is not null)
  )
);

create table public.research (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  kind text not null,
  team text[] not null default '{}',
  supervisor text,
  co_supervisor text,
  institution text not null,
  department text,
  term text,
  abstract text,
  problem text,
  objectives text[] not null default '{}',
  methodology text,
  architecture jsonb not null default '{}',
  datasets jsonb not null default '[]',
  metrics jsonb not null default '[]',
  results text,
  tags text[] not null default '{}',
  media_ids uuid[] not null default '{}',
  document_media_ids uuid[] not null default '{}',
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  category text not null,
  title text not null,
  description text,
  items text[] not null default '{}',
  evidence jsonb not null default '[]',
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  kind text not null check (kind in ('certificate', 'award', 'training', 'milestone')),
  title text not null,
  issuer text,
  issued_on date,
  credential_id text,
  credential_url text check (credential_url is null or credential_url ~ '^https://'),
  media_id uuid references public.media_assets (id) on delete set null,
  description text,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.travel_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  region text not null check (region in ('bangladesh', 'world')),
  country text not null,
  district text,
  city text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  visited_from date,
  visited_to date,
  short_memory text check (short_memory is null or length(short_memory) <= 300),
  story text,
  tags text[] not null default '{}',
  cover_media_id uuid references public.media_assets (id) on delete set null,
  is_demo boolean not null default false,
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'private',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_never_public check (not (is_demo and status = 'published'))
);

create table public.travel_photos (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.travel_locations (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  caption text,
  sort_order int not null default 0,
  unique (location_id, media_id)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  event_date date,
  date_label text,
  category text not null default 'other' check (category in ('university', 'village', 'friends', 'family', 'travel', 'work', 'other')),
  note text,
  story text,
  media_ids uuid[] not null default '{}',
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'private',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hobbies (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  title text not null,
  description text not null default '',
  icon text not null default '✦',
  tags text[] not null default '{}',
  media_id uuid references public.media_assets (id) on delete set null,
  span int not null default 1 check (span in (1, 2)),
  status public.content_status not null default 'draft',
  visibility public.visibility not null default 'public',
  sort_order int not null default 0,
  translations jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Visitor submissions & ops ──────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  email text not null check (length(email) <= 200),
  subject text check (subject is null or length(subject) <= 150),
  category public.message_category not null default 'general',
  body text not null check (length(body) between 10 and 4000),
  status public.message_status not null default 'new',
  ip_hash text,
  user_agent text,
  locale text,
  replied_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_status_idx on public.messages (status, created_at desc);
create index messages_ip_idx on public.messages (ip_hash, created_at desc);

create table public.story_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 150),
  visitor_name text not null check (length(visitor_name) between 1 and 100),
  email text check (email is null or length(email) <= 200),
  body text not null check (length(body) between 20 and 5000),
  photo_path text,                 -- object in private bucket story-uploads
  consent boolean not null check (consent),
  status public.story_status not null default 'pending',
  show_photo boolean not null default false,
  public_photo_path text,          -- copied to media-public only if the admin approves the photo
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stories_status_idx on public.story_submissions (status, created_at desc);
create index stories_ip_idx on public.story_submissions (ip_hash, created_at desc);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('message', 'story')),
  ref_id uuid,
  channel text not null default 'email',
  recipient text,
  status public.notification_status not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create table public.preview_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  entity_type text not null,
  entity_id uuid not null,
  expires_at timestamptz not null,
  created_by uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─── Generic indexes & triggers for content tables ──────────────────────────
do $$
declare t text;
begin
  foreach t in array array['site_sections','pages','page_blocks','social_links','experiences','education','projects','videos','research','skills','achievements','travel_locations','memories','hobbies','media_assets']
  loop
    execute format('create index %I on public.%I (status, visibility, %s)', t || '_pub_idx', t,
      case when t = 'media_assets' then 'created_at' else 'sort_order' end);
  end loop;

  foreach t in array array['media_folders','media_assets','site_settings','profiles','site_sections','pages','page_blocks','social_links','experiences','education','projects','project_case_studies','videos','research','skills','achievements','travel_locations','memories','hobbies','messages','story_submissions']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;

  foreach t in array array['site_sections','pages','experiences','education','projects','videos','research','skills','achievements','travel_locations','memories','hobbies','media_assets']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_published_at()', t || '_published_at', t);
  end loop;
end $$;
