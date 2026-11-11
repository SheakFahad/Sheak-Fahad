import { getTranslations } from 'next-intl/server'
import { MediaGallery } from '@/components/shared/MediaGallery'
import { BlockHeading, SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, EmptyState, GlassCard } from '@/components/ui/primitives'
import { getMediaMany, getResearch } from '@/lib/content/repository'
import { galleryLabels } from '@/lib/site/labels'
import { requireSection, sectionMetadata } from '@/lib/site/section'
import { jsonLd } from '@/lib/utils/json-ld'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/research'>) => sectionMetadata('research', (await params).locale)

export default async function ResearchPage({ params }: PageProps<'/[locale]/research'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('research', locale)
  const [t, items, labels] = await Promise.all([getTranslations('research'), getResearch(), galleryLabels()])
  const r = items[0]

  if (!r) {
    return (
      <>
        <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} heroAspect="4 / 3" />
        <Container className="pb-16">
          <EmptyState title={t('facts')} text={t('moreSoon')} />
        </Container>
      </>
    )
  }

  const photos = await getMediaMany(r.media_ids)
  const facts = [
    { label: t('kind'), value: r.kind },
    { label: t('institution'), value: r.institution },
    r.department && { label: t('department'), value: r.department },
    r.term && { label: t('term'), value: r.term },
    r.supervisor && { label: t('supervisor'), value: r.supervisor },
    r.co_supervisor && { label: t('coSupervisor'), value: r.co_supervisor },
  ].filter(Boolean) as { label: string; value: string }[]

  const textBlocks = [
    { key: 'abstract', value: r.abstract },
    { key: 'problem', value: r.problem },
    { key: 'methodology', value: r.methodology },
    { key: 'results', value: r.results },
  ].filter(b => b.value)

  const thesis = {
    '@context': 'https://schema.org',
    '@type': 'Thesis',
    name: r.title,
    author: r.team.map(name => ({ '@type': 'Person', name })),
    sourceOrganization: { '@type': 'CollegeOrUniversity', name: r.institution },
    keywords: r.tags.join(', '),
  }

  return (
    <>
      <SectionHero title={section.title} eyebrow={r.term ?? section.eyebrow} intro={r.title} hero={hero} heroAspect="4 / 3" />

      <section className="section-y pt-0" aria-labelledby="facts">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <BlockHeading eyebrow="01" title={t('facts')} id="facts" />
            <dl className="grid gap-4 sm:grid-cols-2">
              {facts.map(f => (
                <GlassCard key={f.label} data-reveal>
                  <dt className="eyebrow !text-[var(--text-2)]">{f.label}</dt>
                  <dd className="mt-2 font-semibold">{f.value}</dd>
                </GlassCard>
              ))}
            </dl>
          </div>
          <div>
            <BlockHeading eyebrow="02" title={t('team')} />
            <ul className="grid gap-3">
              {r.team.map(name => (
                <li key={name} data-reveal>
                  <GlassCard className="flex items-center gap-4 py-4">
                    <span aria-hidden="true" className="size-2.5 rounded-full [background:var(--grad)]" />
                    <span className={name === 'Sheak Fahad' ? 'font-semibold' : 'text-[var(--text-2)]'}>{name}</span>
                  </GlassCard>
                </li>
              ))}
            </ul>
            {r.tags.length > 0 && (
              <div data-reveal className="mt-8">
                <p className="eyebrow mb-3">{t('topics')}</p>
                <div className="flex flex-wrap gap-2">
                  {r.tags.map(tag => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="section-y pt-0">
        <Container className="grid gap-10">
          {textBlocks.length === 0 && r.objectives.length === 0 ? (
            <GlassCard data-reveal className="border-dashed text-[var(--text-2)]">
              {t('moreSoon')}
            </GlassCard>
          ) : (
            <>
              {textBlocks.map(b => (
                <article key={b.key} data-reveal>
                  <h2 className="text-2xl md:text-3xl">{t(b.key)}</h2>
                  <p className="mt-4 max-w-3xl text-lg leading-relaxed whitespace-pre-line text-[var(--text-2)]">{b.value}</p>
                </article>
              ))}
              {r.objectives.length > 0 && (
                <article data-reveal>
                  <h2 className="text-2xl md:text-3xl">{t('objectives')}</h2>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--text-2)]">
                    {r.objectives.map(o => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </article>
              )}
            </>
          )}
        </Container>
      </section>

      {photos.length > 0 && (
        <section className="section-y pt-0" aria-labelledby="photos">
          <Container>
            <BlockHeading eyebrow="03" title={t('photos')} id="photos" />
            <MediaGallery items={photos} labels={labels} />
          </Container>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(thesis) }} />
    </>
  )
}
