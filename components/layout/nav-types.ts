import type { StationIconKey } from '@/lib/content/types'

/** Serializable nav item passed from server (DB-driven sections) to client nav components. */
export interface NavItem {
  key: string
  href: string
  label: string
  eyebrow: string | null
  index: number
  icon: StationIconKey | null
  text: string | null
  /** Creative station name (secondary to the plain label). */
  station: string | null
}

export interface SocialItem {
  platform: string
  label: string
  url: string
  handle: string | null
}

/** Search index entry (sections + published projects). */
export interface SearchEntry {
  href: string
  title: string
  group: 'section' | 'project'
  hint: string | null
}
