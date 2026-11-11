/** Serializable nav item passed from server (DB-driven sections) to client nav components. */
export interface NavItem {
  key: string
  href: string
  label: string
  eyebrow: string | null
  index: number
}

export interface SocialItem {
  platform: string
  label: string
  url: string
  handle: string | null
}
