import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HeroSection } from '@/components/hero/HeroSection'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Container, Eyebrow, GlassCard } from '@/components/ui/primitives'
import { getProfile, getSocialLinks } from '@/lib/content/repository'
import { getShellData } from '@/lib/site/shell'
import { jsonLd } from '@/lib/utils/json-ld'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, rawProfile, shell, socials] = await Promise.all([getTranslations('home'), getProfile(), getShellData(locale), getSocialLinks()])
  const sameAs = socials.filter(s => s.url.startsWith('http') && s.platform !== 'whatsapp').map(s => s.url)

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: rawProfile.full_name,
    jobTitle: rawProfile.roles.slice(0, 3).join(', '),
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Green University of Bangladesh' },
    sameAs,
  }

  return (
    <>
      <HeroSection locale={locale} />

      {/* ───────── Station map (every enabled section, from the CMS) ───────── */}
      <section id="explore" aria-labelledby="explore-title" className="section-y scroll-mt-24">
        <Container>
          <Eyebrow>{shell.navItems.length.toString().padStart(2, '0')} · Stations</Eyebrow>
          <SplitHeading id="explore-title" className="mt-3 text-4xl md:text-6xl">
            {t('exploreTitle')}
          </SplitHeading>
          <p data-reveal className="mt-4 max-w-xl text-[var(--text-2)]">
            {t('exploreText')}
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shell.navItems.map(item => (
              <li key={item.key} data-reveal>
                <TransitionLink href={item.href} className="block h-full rounded-[var(--radius-card)]">
                  <GlassCard interactive className="flex h-full min-h-40 flex-col justify-between">
                    <span className="font-mono text-xs text-[var(--cyan)]">{String(item.index).padStart(2, '0')}</span>
                    <span>
                      {item.eyebrow && <span className="eyebrow !text-[var(--text-2)]">{item.eyebrow}</span>}
                      <span className="mt-1 block font-[family-name:var(--font-display)] text-2xl">{item.label}</span>
                    </span>
                  </GlassCard>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(person) }} />
    </>
  )
}
