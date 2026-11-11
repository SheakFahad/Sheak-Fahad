import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { MediaGallery } from '@/components/shared/MediaGallery'
import { BlockHeading, SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, GlassCard } from '@/components/ui/primitives'
import { getEducation, getMediaMany } from '@/lib/content/repository'
import { galleryLabels } from '@/lib/site/labels'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/education'>) => sectionMetadata('education', (await params).locale)

export default async function EducationPage({ params }: PageProps<'/[locale]/education'>) {
  const { locale } = await params
  const { section, hero, raw } = await requireSection('education', locale)
  const [t, education, labels, uniLife] = await Promise.all([
    getTranslations('education'),
    getEducation(),
    galleryLabels(),
    getMediaMany(raw.gallery_media_ids ?? []),
  ])
  const covers = await getMediaMany(education.map(e => e.cover_media_id).filter((x): x is string => Boolean(x)))

  return (
    <>
      <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} heroAspect="4 / 3" />

      <section className="section-y pt-0" aria-labelledby="timeline">
        <Container>
          <BlockHeading eyebrow="01" title={t('timeline')} id="timeline" />
          <ol className="grid gap-6 lg:grid-cols-3">
            {education.map(e => {
              const cover = covers.find(c => c.id === e.cover_media_id)
              return (
                <li key={e.id} data-reveal>
                  <GlassCard className="flex h-full flex-col overflow-hidden p-0">
                    {cover && (
                      <div className="relative aspect-[16/10] bg-[var(--bg-2)]">
                        <Image src={cover.src} alt={cover.alt} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                        {e.end_year && (
                          <span className="glass absolute top-4 left-4 rounded-full px-3 py-1 font-mono text-xs">
                            {t('passed')} {e.end_year}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="eyebrow">{e.level.toUpperCase()}</p>
                      <h2 className="mt-2 text-xl md:text-2xl">{e.degree}</h2>
                      <p className="mt-1 text-[var(--text-2)]">{e.institution}</p>
                      {e.department && <p className="mt-1 text-sm text-[var(--text-2)]">{e.department}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {e.group_name && <Chip>{e.group_name}</Chip>}
                        {e.show_result && e.result_value && (
                          <Chip className="border-[var(--cyan)] text-[var(--text)]">
                            {e.result_label ?? t('result')}: {e.result_value}
                          </Chip>
                        )}
                      </div>
                      {e.summary && <p className="mt-4 text-sm text-[var(--text-2)]">{e.summary}</p>}
                      {e.activities.length > 0 && (
                        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--text-2)]">
                          {e.activities.map(a => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </GlassCard>
                </li>
              )
            })}
          </ol>
        </Container>
      </section>

      {uniLife.length > 0 && (
        <section className="section-y" aria-labelledby="uni-life">
          <Container>
            <BlockHeading eyebrow="02" title={t('uniLife')} id="uni-life" />
            <MediaGallery items={uniLife} labels={labels} />
          </Container>
        </section>
      )}
    </>
  )
}
