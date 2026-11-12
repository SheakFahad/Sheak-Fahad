import type { Translations } from './types'

type WithTranslations = { translations?: Translations }

/** Localize several fields at once. */
export function localize<T extends WithTranslations>(row: T, locale: string): T {
  if (locale === 'en' || !row.translations?.[locale as 'bn']) return row
  const out: Record<string, unknown> = { ...row }
  for (const [key, value] of Object.entries(row.translations[locale as 'bn'] ?? {})) {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  }
  return out as T
}

/** href for a section (without locale — the i18n Link adds it). */
export function sectionHref(routeSlug: string): string {
  return routeSlug ? `/${routeSlug}` : '/'
}
