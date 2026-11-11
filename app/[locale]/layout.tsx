import '../globals.css'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MotionRoot } from '@/components/motion/MotionRoot'
import { PageTransitionProvider } from '@/components/motion/PageTransition'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { ToastProvider } from '@/components/ui/Toast'
import { routing } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/content/repository'
import { fontVariables } from '@/lib/fonts'
import { getShellData } from '@/lib/site/shell'
import { themeBootScript } from '@/lib/site/theme'

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: '#08090D',
  colorScheme: 'dark light',
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const { settings } = await getShellData(locale)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.site_title, template: `%s — ${settings.site_title}` },
    description: settings.seo_description,
    alternates: { languages: { en: '/', bn: '/bn' } },
    openGraph: { type: 'website', siteName: settings.site_title, locale: locale === 'bn' ? 'bn_BD' : 'en_US' },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [{ settings, profile, navItems, socials }, t, rawSettings] = await Promise.all([
    getShellData(locale),
    getTranslations(),
    getSiteSettings(),
  ])

  return (
    <html lang={locale} data-theme={rawSettings.theme_default} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(rawSettings.theme_default) }} />
      </head>
      <body id="top">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-[var(--text)] px-5 py-3 text-[var(--bg)] focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {t('common.skipToContent')}
        </a>
        <div aria-hidden="true" className="cosmos" />
        <NextIntlClientProvider>
          <ToastProvider>
            <PageTransitionProvider>
              <ScrollProgress />
              <Header
                siteName={profile.full_name}
                items={navItems}
                socials={socials}
                labels={{
                  primary: t('nav.primary'),
                  menu: t('common.menu'),
                  openMenu: t('common.openMenu'),
                  closeMenu: t('common.closeMenu'),
                  allSections: t('nav.allSections'),
                  connect: t('footer.connect'),
                  language: t('common.language'),
                  toDark: t('common.themeToDark'),
                  toLight: t('common.themeToLight'),
                  home: t('common.home'),
                }}
              />
              <main id="main" tabIndex={-1} className="outline-none">
                {children}
              </main>
              <Footer
                siteName={profile.full_name}
                tagline={settings.tagline}
                items={navItems}
                socials={socials}
                labels={{
                  tagline: t('footer.tagline'),
                  explore: t('footer.explore'),
                  connect: t('footer.connect'),
                  rights: t('footer.rights'),
                  backToTop: t('common.backToTop'),
                }}
              />
              <MotionRoot />
            </PageTransitionProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
