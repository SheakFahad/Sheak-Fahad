import { defineRouting } from 'next-intl/routing'

const locales = ['en', 'bn'] as const

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // `/about` for English, `/bn/about` for Bangla
  localePrefix: 'as-needed',
})
