import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { GlobeAnchor } from '@/components/nexus/GlobeAnchor'
import { PlaceholderCard } from '@/components/shared/PlaceholderCard'
import { SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, GlassCard } from '@/components/ui/primitives'
import { getMediaMany, getTravel } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/travel'>) => sectionMetadata('travel', (await params).locale)

export default async function TravelPage({ params }: PageProps<'/[locale]/travel'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('travel', locale)
  const [t, ts, places] = await Promise.all([getTranslations('travel'), getTranslations('station'), getTravel()])
  const covers = await getMediaMany(places.map(p => p.cover_media_id).filter((x): x is string => Boolean(x)))
  const groups = (['bangladesh', 'world'] as const).map(region => ({ region, items: places.filter(p => p.region === region) })).filter(g => g.items.length)

  return (
    <>
      <SectionHero stationKey="travel" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />
      {/* The Atlas — interactive 3D Earth (shared canvas; CSS globe without WebGL) */}
      <section className="pb-16" aria-labelledby="atlas-title">
        <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div data-reveal>
            <p className="eyebrow">{t('atlasTitle')}</p>
            <h2 id="atlas-title" className="mt-2 text-3xl md:text-5xl">
              {places.length === 0 ? t('emptyTitle') : t('atlasTitle')}
            </h2>
            <p className="mt-4 max-w-md text-[var(--text-2)]">{t('atlasText')}</p>
            {places.length === 0 && <p className="mt-3 max-w-md text-sm text-[var(--text-2)]">{t('emptyText')}</p>}
          </div>
          <GlobeAnchor label={t('atlasText')} className="mx-auto w-full max-w-[520px]" />
        </Container>
      </section>
      <section className="pb-16">
        <Container>
          {places.length === 0 ? (
            <div className="grid gap-12">
              {(['bangladesh', 'world'] as const).map(region => (
                <div key={region}>
                  <h2 className="mb-6 text-2xl md:text-3xl">{t(region)}</h2>
                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map(i => (
                      <li key={i} data-reveal>
                        <PlaceholderCard badge={ts('placeholder')} title={t('phPlace')} text={t('phPlaceText')} aspect="4 / 3" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-16">
              {groups.map(g => (
                <div key={g.region}>
                  <h2 className="mb-8 text-3xl md:text-4xl">{t(g.region)}</h2>
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map(p => {
                      const c = covers.find(m => m.id === p.cover_media_id)
                      return (
                        <li key={p.id} data-reveal>
                          <GlassCard className="h-full overflow-hidden p-0">
                            {c && (
                              <div className="relative aspect-[4/3]">
                                <Image src={c.src} alt={c.alt} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                              </div>
                            )}
                            <div className="p-6">
                              <p className="eyebrow">{[p.district, p.country].filter(Boolean).join(', ')}</p>
                              <h3 className="mt-2 text-xl">{p.name}</h3>
                              {p.short_memory && <p className="mt-2 text-[var(--text-2)]">{p.short_memory}</p>}
                              {p.tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                  {p.tags.map(tag => (
                                    <Chip key={tag}>{tag}</Chip>
                                  ))}
                                </div>
                              )}
                            </div>
                          </GlassCard>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
