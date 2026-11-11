import 'server-only'
import { cache } from 'react'
import fallback from '@/content/fallback.json'
import type { ContentSnapshot, MediaRef, Publishable, SiteSection, SocialLink } from './types'

/**
 * The ONLY entry point for page data.
 * Phase 4: reads content/fallback.json.
 * Phase 7: when Supabase env vars are present, the same functions read published rows
 * through RLS (see docs/PROJECT_ARCHITECTURE.md §3) — callers do not change.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

const isPubliclyListed = (row: Publishable) => row.status === 'published' && row.visibility === 'public'
const isPubliclyReachable = (row: Publishable) =>
  row.status === 'published' && (row.visibility === 'public' || row.visibility === 'unlisted')
const bySort = (a: Publishable, b: Publishable) => a.sort_order - b.sort_order

const loadSnapshot = cache(async (): Promise<ContentSnapshot> => {
  // Supabase source is wired in Phase 7. Until then the verified fallback is used.
  return fallback as unknown as ContentSnapshot
})

export const getSiteSettings = cache(async () => (await loadSnapshot()).settings)

export const getProfile = cache(async () => (await loadSnapshot()).profile)

/** Enabled + published sections, ordered. */
export const getSections = cache(async (): Promise<SiteSection[]> => {
  const { sections } = await loadSnapshot()
  return sections.filter(s => s.enabled && isPubliclyReachable(s)).sort(bySort)
})

/** Sections that appear in navigation, footer and Explore grids. */
export const getNavSections = cache(async (): Promise<SiteSection[]> =>
  (await getSections()).filter(s => s.show_in_nav && isPubliclyListed(s)),
)

export const getSectionBySlug = cache(async (slug: string): Promise<SiteSection | null> => {
  const sections = await getSections()
  return sections.find(s => s.route_slug === slug) ?? null
})

export const getSectionByKey = cache(async (key: string): Promise<SiteSection | null> => {
  const sections = await getSections()
  return sections.find(s => s.key === key) ?? null
})

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const { social_links } = await loadSnapshot()
  return social_links.filter(isPubliclyListed).sort(bySort)
})

export const getMedia = cache(async (id: string | null | undefined): Promise<MediaRef | null> => {
  if (!id) return null
  const { media } = await loadSnapshot()
  return media.find(m => m.id === id) ?? null
})

export const getSectionBlocks = cache(async (sectionKey: string) => {
  const { section_blocks } = await loadSnapshot()
  return (section_blocks[sectionKey] ?? []).filter(isPubliclyListed).sort(bySort)
})
