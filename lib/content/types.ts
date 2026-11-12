/**
 * Content types — mirror the Supabase schema in docs/DATABASE_SCHEMA.md.
 * Components only ever receive these shapes, from lib/content/repository.ts.
 */

export type ContentStatus = 'draft' | 'published' | 'archived'
export type Visibility = 'public' | 'unlisted' | 'private'

/** Per-locale overrides, e.g. { bn: { title: '…' } } */
export type Translations = Partial<Record<'bn', Record<string, string | string[] | undefined>>>

export interface Publishable {
  status: ContentStatus
  visibility: Visibility
  sort_order: number
  translations?: Translations
}

export interface MediaRef {
  id: string
  src: string
  alt: string
  width: number
  height: number
  /** Focal point 0..1 used for object-position when cropping. */
  focal_x?: number
  focal_y?: number
  /** Preferred display ratio for thumbnails, e.g. '3 / 4' for portrait photos stored in a padded landscape canvas. */
  display_aspect?: string
  /** Original personal photo: crop/frame only, never filter or regenerate. */
  is_original_photo?: boolean
}

export type SectionKey =
  | 'home'
  | 'about'
  | 'career'
  | 'education'
  | 'projects'
  | 'video_studio'
  | 'research'
  | 'skills'
  | 'travel'
  | 'memories'
  | 'hobbies'
  | 'achievements'
  | 'contact'
  | (string & {})

/** Icon keys for NEXUS stations (components/nexus/StationIcon.tsx). */
export type StationIconKey = 'home' | 'user' | 'trend' | 'cap' | 'stack' | 'flask' | 'play' | 'layers' | 'trophy' | 'map' | 'image' | 'spark' | 'send'

export interface SiteSection extends Publishable {
  key: SectionKey
  kind: 'builtin' | 'custom'
  /** URL segment without locale; '' for home. */
  route_slug: string
  title: string
  nav_label: string
  intro: string | null
  /** Short label shown on Explore tiles. */
  eyebrow: string | null
  hero_media_id: string | null
  /** Optional photo strip for the section page, chosen in the admin Media Library. */
  gallery_media_ids?: string[]
  enabled: boolean
  show_in_nav: boolean
  /** NEXUS station icon + one-line hover description (homepage station map). */
  icon?: StationIconKey | null
  station_text?: string | null
  /** Creative station name shown next to the plain label (e.g. "Origin" for About). */
  station_name?: string | null
  seo_title: string | null
  seo_description: string | null
}

export interface Profile {
  full_name: string
  roles: string[]
  tagline: string
  intro: string
  location_city: string | null
  avatar_media_id: string | null
  about_media_id: string | null
  /** Hero headline extras (CMS-editable). */
  hero_tagline?: string | null
  /** Professional title under the name in the hero, e.g. "UI/UX Designer & Creative Professional". */
  hero_title?: string | null
  hero_text?: string | null
  /** Background-removed cutout of an original portrait (alpha only; RGB pixels identical to the source). */
  hero_media_id?: string | null
  cv_url?: string | null
  hero_skills?: HeroSkill[]
  translations?: Translations
}

export interface HeroSkill {
  key: string
  title: string
  text: string
  icon: 'layers' | 'pen' | 'chart' | 'atom' | 'play' | 'globe'
}

export type SocialPlatform =
  | 'email'
  | 'whatsapp'
  | 'phone'
  | 'github'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'behance'
  | 'youtube'
  | 'other'

export interface SocialLink extends Publishable {
  platform: SocialPlatform
  label: string
  url: string
  handle: string | null
  show_in_footer: boolean
  show_on_contact: boolean
}

export interface SiteSettings {
  site_title: string
  tagline: string
  seo_description: string
  theme_default: 'dark' | 'light'
  features: {
    assistant: boolean
    explore_mode: boolean
    sound: boolean
  }
  footer_text: string | null
  /** NEXUS AI: 'local' answers only from verified CMS data (no LLM); 'llm' needs a configured provider. */
  assistant?: { mode: 'local' | 'llm'; provider: string | null }
  /** Section keys shown directly in the desktop navigation bar (the rest go under "More"). */
  nav_primary?: string[]
  home?: HomeConfig
  translations?: Translations
}

/** Homepage (NEXUS) configuration — edited in the admin "Homepage" panel. */
export interface HomeConfig {
  /** Ordered project slugs; only published + public projects are ever shown. */
  featured_project_slugs: string[]
  show_stations: boolean
  show_featured: boolean
  show_globe: boolean
  environment: { nebula: boolean; planets: boolean; mountains: boolean; city: boolean; plants: boolean; ground: boolean }
  translations?: Translations
}

export type PageBlock = Publishable & {
  id: string
} & (
    | { type: 'rich_text'; data: { markdown: string } }
    | { type: 'media'; data: { media_id: string; caption?: string } }
    | { type: 'gallery'; data: { media_ids: string[] } }
    | { type: 'cta'; data: { title: string; text?: string; href: string; label: string } }
    | { type: 'quote'; data: { text: string; cite?: string } }
  )

export interface Experience extends Publishable {
  id: string
  company: string
  role: string
  employment_type: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  location: string | null
  summary: string | null
  responsibilities: string[]
  achievements: string[]
  logo_media_id: string | null
  company_url: string | null
}

export interface Education extends Publishable {
  id: string
  level: 'ssc' | 'hsc' | 'bsc' | 'msc' | 'other'
  institution: string
  degree: string
  department: string | null
  group_name: string | null
  start_year: number | null
  end_year: number | null
  result_label: string | null
  result_value: string | null
  /** GPA/CGPA is public only when the owner turns this on (default false). */
  show_result: boolean
  summary: string | null
  activities: string[]
  cover_media_id: string | null
}

export interface CaseStudy {
  overview: string | null
  problem: string | null
  objectives: string[]
  research: string | null
  user_flow: string | null
  wireframes_note: string | null
  ui_design: string | null
  design_system: string | null
  prototype_note: string | null
  challenges: string | null
  results: string | null
}

export interface Project extends Publishable {
  id: string
  slug: string
  title: string
  project_type: string
  summary: string | null
  role: string | null
  year: number | null
  tools: string[]
  did: string[]
  live_url: string | null
  behance_url: string | null
  prototype_url: string | null
  is_featured: boolean
  cover_media_id: string | null
  /** Cover is an illustrative concept visual, not a real product screenshot. */
  is_concept_visual: boolean
  gallery_media_ids: string[]
  case_study: CaseStudy | null
}

export interface Video extends Publishable {
  id: string
  slug: string
  title: string
  category: 'showreel' | 'editing' | 'motion' | '2d' | '3d' | 'promo' | 'commercial' | 'reel'
  provider: 'youtube' | 'vimeo' | 'storage'
  external_id: string | null
  src: string | null
  poster_media_id: string | null
  year: number | null
  client: string | null
  role: string | null
  tools: string[]
  description: string | null
  aspect: '16:9' | '9:16' | '1:1'
}

export interface Research extends Publishable {
  id: string
  slug: string
  title: string
  kind: string
  team: string[]
  supervisor: string | null
  co_supervisor: string | null
  institution: string
  department: string | null
  term: string | null
  abstract: string | null
  problem: string | null
  objectives: string[]
  methodology: string | null
  results: string | null
  tags: string[]
  media_ids: string[]
}

export interface SkillGroup extends Publishable {
  id: string
  category: string
  title: string
  description: string | null
  items: string[]
}

export interface Achievement extends Publishable {
  id: string
  kind: 'certificate' | 'award' | 'training' | 'milestone'
  title: string
  issuer: string | null
  issued_on: string | null
  credential_id: string | null
  credential_url: string | null
  media_id: string | null
  description: string | null
}

export interface TravelLocation extends Publishable {
  id: string
  slug: string
  name: string
  region: 'bangladesh' | 'world'
  country: string
  district: string | null
  lat: number | null
  lng: number | null
  visited_from: string | null
  short_memory: string | null
  tags: string[]
  cover_media_id: string | null
  photo_media_ids: string[]
  /** Related CMS memories / videos shown in the ATLAS destination panel. */
  related_memory_ids?: string[]
  video_ids?: string[]
  is_demo: boolean
}

export interface Memory extends Publishable {
  id: string
  slug: string
  title: string
  event_date: string | null
  /** Human label when the exact date is unknown, e.g. "Fall 2025". */
  date_label: string | null
  category: 'university' | 'village' | 'friends' | 'family' | 'travel' | 'work' | 'other'
  note: string | null
  media_ids: string[]
}

export interface Hobby extends Publishable {
  id: string
  title: string
  description: string
  icon: string
  tags: string[]
  media_id: string | null
  span: 1 | 2
}

export interface ContentSnapshot {
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  videos: Video[]
  research: Research[]
  skills: SkillGroup[]
  achievements: Achievement[]
  travel: TravelLocation[]
  memories: Memory[]
  hobbies: Hobby[]
  settings: SiteSettings
  profile: Profile
  sections: SiteSection[]
  social_links: SocialLink[]
  media: MediaRef[]
  /** Extra blocks appended to a section page, keyed by section key. */
  section_blocks: Record<string, PageBlock[]>
}
