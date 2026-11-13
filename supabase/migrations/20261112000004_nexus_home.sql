-- NEXUS homepage (R2): station metadata on sections + homepage / assistant configuration.
-- All values are edited from the admin "Homepage" and "Sections" panels (Phase 8). RLS from 0002 applies unchanged.

-- Station icon + one-line hover description for each section (homepage station map, navigation, search).
alter table public.site_sections
  add column if not exists icon text
    check (icon is null or icon in ('home','user','trend','cap','stack','flask','play','layers','trophy','map','image','spark','send')),
  add column if not exists station_text text check (station_text is null or char_length(station_text) <= 140),
  -- creative station name shown next to the plain nav label (e.g. "Origin" for About)
  add column if not exists station_name text;

-- Professional title under the name in the hero.
alter table public.profiles add column if not exists hero_title text;

-- Homepage configuration (texts, featured projects order, visibility toggles, environment layers).
alter table public.site_settings
  add column if not exists home jsonb not null default '{
    "featured_project_slugs": [],
    "show_stations": true,
    "show_featured": true,
    "show_globe": true,
    "environment": {"nebula": true, "planets": true, "mountains": true, "city": true, "plants": true, "ground": true}
  }'::jsonb,
  -- NEXUS AI: 'local' = answers only from published rows, no model, no network. 'llm' requires a server-side provider key.
  add column if not exists assistant jsonb not null default '{"mode": "local", "provider": null}'::jsonb,
  -- section keys shown directly in the desktop navigation bar
  add column if not exists nav_primary text[] not null default '{about,career,projects,research,skills,travel,contact}';

-- Travel: related memories / videos for the ATLAS destination panel.
alter table public.travel_locations
  add column if not exists related_memory_ids uuid[] not null default '{}',
  add column if not exists video_ids uuid[] not null default '{}';

alter table public.site_settings
  add constraint site_settings_assistant_mode check (assistant->>'mode' in ('local', 'llm'));

-- Achievements get their own station (MILESTONES).
insert into public.site_sections (key, kind, route_slug, title, nav_label, eyebrow, intro, icon, station_text, enabled, show_in_nav, status, visibility, sort_order)
values ('achievements', 'builtin', 'achievements', 'Achievements', 'Achievements', 'My Achievements',
        'Certificates, programs and milestones — each one verified.', 'trophy', 'Certificates and achievements.',
        true, true, 'published', 'public', 75)
on conflict (key) do nothing;
