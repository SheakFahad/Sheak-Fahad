import { getTranslations } from 'next-intl/server'
import { MediaGallery } from '@/components/shared/MediaGallery'
import { BlockHeading, SectionHero } from '@/components/shared/SectionHero'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { ButtonLink } from '@/components/ui/Button'
import { Container, GlassCard } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getEducation, getExperiences, getHobbies, getMediaMany, getProfile, getSectionByKey } from '@/lib/content/repository'
import { galleryLabels } from '@/lib/site/labels'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/about'>) => sectionMetadata('about', (await params).locale)

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params
  const { section, hero, raw } = await requireSection('about', locale)
  const [t, rawProfile, education, experiences, hobbies, photos, labels, careerSec, eduSec, contactSec] = await Promise.all([
    getTranslations('about'),
    getProfile(),
    getEducation(),
    getExperiences(),
    getHobbies(),
    getMediaMany(raw.gallery_media_ids ?? []),
    galleryLabels(),
    getSectionByKey('career'),
    getSectionByKey('education'),
    getSectionByKey('contact'),
  ])
  const profile = localize(rawProfile, locale)

  const journey = [
    ...education.map(e => ({ id: e.id, when: e.end_year ? String(e.end_year) : null, title: e.degree, sub: e.institution, href: eduSec ? `/${eduSec.route_slug}` : null })),
    ...experiences.map(x => ({ id: x.id, when: null, title: x.role, sub: x.company, href: careerSec ? `/${careerSec.route_slug}` : null })),
  ]

  return (
    <>
      <SectionHero stationKey="about" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />

      <section className="section-y" aria-labelledby="story">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <BlockHeading eyebrow="01" title={t('story')} id="story" />
          <div data-reveal className="space-y-6 text-lg leading-relaxed text-[var(--text-2)]">
            <p className="text-2xl leading-snug text-[var(--text)] md:text-3xl">{profile.intro}</p>
            {profile.location_city && <p className="font-mono text-sm">📍 {profile.location_city}</p>}
          </div>
        </Container>
      </section>

      {journey.length > 0 && (
        <section className="section-y" aria-labelledby="journey">
          <Container>
            <BlockHeading eyebrow="02" title={t('journey')} id="journey" />
            <ol className="relative grid gap-4 border-l border-[var(--line)] pl-6 md:pl-10">
              {journey.map(j => (
                <li key={j.id} data-reveal className="relative">
                  <span aria-hidden="true" className="absolute top-6 -left-[31px] size-3 rounded-full [background:var(--grad)] md:-left-[47px]" />
                  <GlassCard className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-xl">{j.title}</p>
                      <p className="text-[var(--text-2)]">{j.sub}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {j.when && <span className="font-mono text-sm text-[var(--cyan)]">{j.when}</span>}
                      {j.href && (
                        <TransitionLink href={j.href} className="text-sm text-[var(--text-2)] underline-offset-4 hover:text-[var(--text)] hover:underline">
                          →
                        </TransitionLink>
                      )}
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {hobbies.length > 0 && (
        <section className="section-y" aria-labelledby="loves">
          <Container>
            <BlockHeading eyebrow="03" title={t('loves')} id="loves" />
            <ul className="grid gap-4 sm:grid-cols-3">
              {hobbies.slice(0, 3).map(h => (
                <li key={h.id} data-reveal>
                  <GlassCard className="h-full">
                    <span aria-hidden="true" className="text-3xl">{h.icon}</span>
                    <p className="mt-4 font-[family-name:var(--font-display)] text-xl">{h.title}</p>
                    <p className="mt-2 text-[var(--text-2)]">{h.description}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {photos.length > 0 && (
        <section className="section-y" aria-labelledby="moments">
          <Container>
            <BlockHeading eyebrow="04" title={t('photos')} id="moments" />
            <MediaGallery items={photos} labels={labels} className="lg:grid-cols-4" />
          </Container>
        </section>
      )}

      {contactSec && (
        <section className="pb-8">
          <Container>
            <div data-reveal className="glass flex flex-col items-start justify-between gap-6 rounded-[var(--radius-panel)] p-8 md:flex-row md:items-center md:p-12">
              <p className="font-[family-name:var(--font-display)] text-2xl md:text-4xl">{t('cta')}</p>
              <ButtonLink href={`/${contactSec.route_slug}`} size="lg" magnetic>
                {localize(contactSec, locale).nav_label}
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
