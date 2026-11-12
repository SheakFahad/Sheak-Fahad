import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Gateway } from '@/components/nexus/Gateway'
import { NexusSection } from '@/components/nexus/NexusSection'
import { StationIcon } from '@/components/nexus/StationIcon'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Container, Eyebrow, GlassCard } from '@/components/ui/primitives'
import { getProfile, getSocialLinks } from '@/lib/content/repository'
import { getShellData } from '@/lib/site/shell'
import { getHomeConfig } from '@/lib/nexus/home'
import { jsonLd } from '@/lib/utils/json-ld'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, tg, tc, rawProfile, shell, socials, home] = await Promise.all([
    getTranslations('home'),
    getTranslations('gateway'),
    getTranslations('common'),
    getProfile(),
    getShellData(locale),
    getSocialLinks(),
    getHomeConfig(locale),
  ])
  const byKey = (k: string) => shell.navItems.find(i => i.key === k)
  const gateLinks = (
    [
      ['projects', tg('work')],
      ['career', tg('journey')],
      ['research', tg('research')],
      ['about', tg('vision')],
    ] as const
  ).flatMap(([k, label]) => {
    const it = byKey(k)
    return it ? [{ href: it.href, label, icon: it.icon ?? 'spark' }] : []
  })
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
      <Gateway
        name={shell.profile.full_name}
        title={home.title}
        links={gateLinks}
        labels={{
          label: tg('label'),
          brandSub: tg('brandSub'),
          kicker: tg('kicker'),
          tagline: tg('tagline'),
          enter: tg('enter'),
          skip: tg('skip'),
          quick: tg('quick'),
          language: tc('language'),
        }}
      />
      <NexusSection locale={locale} />

      {/* ───────── Station map (every enabled section, from the CMS) ───────── */}
      <section id="explore" aria-labelledby="explore-title" className="section-y scroll-mt-24">
        <Container>
          <Eyebrow>
            {shell.navItems.length.toString().padStart(2, '0')} · {t('stationsLabel')}
          </Eyebrow>
          <SplitHeading id="explore-title" className="mt-3 text-4xl md:text-6xl">
            {t('stationsTitle')}
          </SplitHeading>
          <p data-reveal className="mt-4 max-w-xl text-[var(--text-2)]">
            {t('exploreText')}
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shell.navItems.map(item => (
              <li key={item.key} data-reveal>
                <TransitionLink href={item.href} className="block h-full rounded-[var(--radius-card)]">
                  <GlassCard interactive className="group flex h-full min-h-44 flex-col justify-between gap-6">
                    <span className="flex items-center justify-between">
                      <span className="nx-tile-icon">
                        <StationIcon name={item.icon} className="size-6" />
                      </span>
                      <span className="font-mono text-xs text-[var(--cyan)]">{String(item.index).padStart(2, '0')}</span>
                    </span>
                    <span>
                      {item.eyebrow && <span className="eyebrow !text-[var(--text-2)]">{item.eyebrow}</span>}
                      <span className="mt-1 block font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">{item.label}</span>
                      {item.text && <span className="mt-2 block text-sm text-[var(--text-2)]">{item.text}</span>}
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
