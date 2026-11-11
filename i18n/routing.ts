import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'bn'] as const
export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // `/about` for English, `/bn/about` for Bangla
  localePrefix: 'as-needed',
})
