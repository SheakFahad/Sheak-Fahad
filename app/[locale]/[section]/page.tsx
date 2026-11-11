import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { ButtonLink } from '@/components/ui/Button'
import { FramedPhoto } from '@/components/ui/FramedPhoto'
import { Container, EmptyState, Eyebrow } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getMedia, getSectionBlocks, getSectionBySlug, getSections } from '@/lib/content/repository'

/**
 * Generic, CMS-driven section route.
 * Renders ANY enabled section (built-in ones until their dedicated layouts land in Phase 5,
 * and admin-created custom sections forever). Disabled/unpublished sections → 404.
 */

export async function generateStaticParams() {
  const sections = await getSections()
  return sections.filter(s => s.route_slug).map(s => ({ section: s.route_slug }))
}

export async function generateMetadata({ params }: PageProps<'/[locale]/[section]'>): Promise<Metadata> {
  const { locale, section: slug } = await params
  const section = await getSectionBySlug(slug)
  if (!section) return {}
  const l = localize(section, locale)
  return {
    title: l.seo_title || l.title,
    description: l.seo_description || l.intro || undefined,
    alternates: { canonical: locale === 'en' ? `/${slug}` : `/${locale}/${slug}`, languages: { en: `/${slug}`, bn: `/bn/${slug}` } },
    robots: section.visibility === 'unlisted' ? { index: false } : undefined,
  }
}

export default async function SectionPage({ params }: PageProps<'/[locale]/[section]'>) {
  const { locale, section: slug } = await params
  setRequestLocale(locale)

  const section = await getSectionBySlug(slug)
  if (!section) notFound()

  const [t, tc, hero, blocks, contact] = await Promise.all([
    getTranslations('section'),
    getTranslations('common'),
    getMedia(section.hero_media_id),
    getSectionBlocks(section.key),
    getSectionBySlug('contact'),
  ])
  const l = localize(section, locale)

  return (
    <>
      <section className="relative pt-36 pb-16 md:pt-44">
        <Container className="grid items-end gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Breadcrumbs
              label={tc('breadcrumb')}
              siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
              items={[{ label: tc('home'), href: '/' }, { label: l.title }]}
            />
            {l.eyebrow && <Eyebrow className="mt-8">{l.eyebrow}</Eyebrow>}
            <SplitHeading as="h1" trigger="load" className="mt-3 text-[clamp(2.5rem,6vw,5.5rem)] font-bold">
              {l.title}
            </SplitHeading>
            {l.intro && (
              <p data-reveal className="mt-6 max-w-2xl text-lg text-[var(--text-2)]">
                {l.intro}
              </p>
            )}
          </div>
          {hero && (
            <div data-reveal className="w-full max-w-sm justify-self-center lg:justify-self-end">
              <FramedPhoto media={hero} aspect="3 / 4" priority sizes="(min-width: 1024px) 384px, 80vw" />
            </div>
          )}
        </Container>
      </section>

      <section className="pb-12">
        <Container>
          {blocks.length === 0 ? (
            <EmptyState title={t('preparingTitle')} text={t('preparingText')}>
              {contact && contact.key !== section.key && (
                <ButtonLink href={`/${contact.route_slug}`} variant="secondary">
                  {localize(contact, locale).nav_label}
                </ButtonLink>
              )}
              <ButtonLink href="/" variant="ghost">
                {tc('goHome')}
              </ButtonLink>
            </EmptyState>
          ) : (
            // Block renderer arrives with the CMS block builder (Phase 8); fallback has no blocks.
            <div />
          )}
        </Container>
      </section>
    </>
  )
}
