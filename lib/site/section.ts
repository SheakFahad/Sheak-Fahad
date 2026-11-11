import 'server-only'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { localize } from '@/lib/content/localize'
import { getMedia, getSectionByKey } from '@/lib/content/repository'
import type { SiteSection } from '@/lib/content/types'

/**
 * Loads a built-in section for its dedicated page. Disabled/unpublished/private sections → 404,
 * so the owner can hide any section from the admin panel without code changes.
 */
export async function requireSection(key: string, locale: string) {
  setRequestLocale(locale)
  const raw = await getSectionByKey(key)
  if (!raw) notFound()
  const section = localize(raw, locale)
  const hero = await getMedia(raw.hero_media_id)
  return { section, raw, hero }
}

export async function sectionMetadata(key: string, locale: string): Promise<Metadata> {
  const raw = await getSectionByKey(key)
  if (!raw) return {}
  const s: SiteSection = localize(raw, locale)
  const path = raw.route_slug ? `/${raw.route_slug}` : ''
  return {
    title: s.seo_title || s.title,
    description: s.seo_description || s.intro || undefined,
    alternates: { canonical: locale === 'en' ? path || '/' : `/${locale}${path}`, languages: { en: path || '/', bn: `/bn${path}` } },
    robots: raw.visibility === 'unlisted' ? { index: false } : undefined,
  }
}
