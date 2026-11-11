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
  | 'contact'
  | (string & {})

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
  enabled: boolean
  show_in_nav: boolean
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
  translations?: Translations
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

export interface ContentSnapshot {
  settings: SiteSettings
  profile: Profile
  sections: SiteSection[]
  social_links: SocialLink[]
  media: MediaRef[]
  /** Extra blocks appended to a section page, keyed by section key. */
  section_blocks: Record<string, PageBlock[]>
}
