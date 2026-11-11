import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { ButtonLink } from '@/components/ui/Button'
import { FramedPhoto } from '@/components/ui/FramedPhoto'
import { Container, Eyebrow, GlassCard } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getMedia, getProfile, getSectionByKey, getSocialLinks } from '@/lib/content/repository'
import { getShellData } from '@/lib/site/shell'
import { jsonLd } from '@/lib/utils/json-ld'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, rawProfile, shell, socials, projects] = await Promise.all([
    getTranslations('home'),
    getProfile(),
    getShellData(locale),
    getSocialLinks(),
    getSectionByKey('projects'),
  ])
  const profile = localize(rawProfile, locale)
  const portrait = await getMedia(rawProfile.avatar_media_id)
  const quick = socials.filter(s => s.show_on_contact && (s.platform === 'email' || s.platform === 'whatsapp' || s.platform === 'linkedin'))
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
      {/* ───────── Hero ───────── */}
      <section aria-labelledby="hero-title" className="relative flex min-h-dvh items-center pt-28 pb-16">
        <Container className="grid items-center gap-14 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <Eyebrow className="mb-6">{profile.roles.slice(0, 4).join(' · ')}</Eyebrow>
            <SplitHeading as="h1" id="hero-title" trigger="load" className="text-[clamp(3rem,9vw,8rem)] leading-[0.95] font-bold">
              <span className="text-gradient">{profile.full_name}</span>
            </SplitHeading>
            <p data-reveal className="mt-6 max-w-xl text-lg text-[var(--text-2)] md:text-xl">
              {profile.tagline}
            </p>
            <ul data-reveal className="mt-6 flex flex-wrap gap-2" aria-label="Roles">
              {profile.roles.map(r => (
                <li key={r} className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--text-2)]">
                  {r}
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/about" size="lg" magnetic>
                {t('exploreWorld')}
              </ButtonLink>
              {projects && (
                <ButtonLink href={`/${projects.route_slug}`} variant="secondary" size="lg" magnetic>
                  {t('viewProjects')}
                </ButtonLink>
              )}
            </div>
            {quick.length > 0 && (
              <div data-reveal className="mt-10">
                <p className="eyebrow mb-3">{t('quickContact')}</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {quick.map(s => (
                    <li key={s.platform}>
                      <a
                        href={s.url}
                        target={s.url.startsWith('http') ? '_blank' : undefined}
                        rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="inline-flex min-h-11 items-center gap-2 text-[var(--text-2)] underline-offset-4 hover:text-[var(--text)] hover:underline"
                      >
                        <span className="font-semibold text-[var(--text)]">{s.label}</span>
                        {s.handle && <span className="font-mono text-xs">{s.handle}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {portrait && (
            <div data-reveal className="mx-auto w-full max-w-[420px]">
              <FramedPhoto media={portrait} priority aspect="1 / 1" sizes="(min-width: 1024px) 420px, 80vw" />
            </div>
          )}
        </Container>
      </section>

      {/* ───────── Explore grid (every enabled section, from the CMS) ───────── */}
      <section aria-labelledby="explore-title" className="section-y">
        <Container>
          <Eyebrow>{shell.navItems.length.toString().padStart(2, '0')} · Universe</Eyebrow>
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
