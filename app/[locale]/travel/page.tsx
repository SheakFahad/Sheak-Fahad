import { getTranslations } from 'next-intl/server'
import { GlobeAnchor } from '@/components/nexus/GlobeAnchor'
import { PlaceholderCard } from '@/components/shared/PlaceholderCard'
import { SectionHero } from '@/components/shared/SectionHero'
import { TravelExplorer, type AtlasPlace } from '@/components/travel/TravelExplorer'
import { Container } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getMediaMany, getMemories, getNavSections, getTravel, getTravelPreview, getVideos } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/travel'>) => sectionMetadata('travel', (await params).locale)

/**
 * ATLAS — travel & exploration. Only published, verified destinations are shown; until the owner adds
 * them the page keeps its full structure with clearly labelled placeholders.
 */
export default async function TravelPage({ params }: PageProps<'/[locale]/travel'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('travel', locale)
  const [t, ts, tc, tst, published, preview, memories, videos, sections] = await Promise.all([
    getTranslations('travel'),
    getTranslations('station'),
    getTranslations('common'),
    getTranslations('studio'),
    getTravel(),
    getTravelPreview(),
    getMemories(),
    getVideos(),
    getNavSections(),
  ])
  const rows = [...published, ...preview]
  const media = await getMediaMany(rows.flatMap(p => [p.cover_media_id, ...p.photo_media_ids].filter((x): x is string => Boolean(x))))
  const memoriesSection = sections.find(s => s.key === 'memories')

  const places: AtlasPlace[] = rows.map(raw => {
    const p = localize(raw, locale)
    return {
      id: p.id,
      name: p.name,
      country: p.country,
      district: p.district,
      region: p.region,
      lat: p.lat,
      lng: p.lng,
      date: p.visited_from,
      story: p.short_memory,
      tags: p.tags,
      cover: media.find(m => m.id === p.cover_media_id) ?? null,
      photos: p.photo_media_ids.flatMap(id => media.filter(m => m.id === id)),
      memories: memoriesSection
        ? memories.filter(m => p.related_memory_ids?.includes(m.id)).map(m => ({ title: localize(m, locale).title, href: `/${memoriesSection.route_slug}#${m.slug}` }))
        : [],
      videos: videos
        .filter(v => p.video_ids?.includes(v.id))
        .map(v => ({ id: v.id, title: v.title, description: v.description, provider: v.provider, externalId: v.external_id, src: v.src, poster: null, aspect: v.aspect, meta: [] })),
      isDemo: p.is_demo,
    }
  })

  return (
    <>
      <SectionHero stationKey="travel" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />
      <section className="pb-16">
        <Container>
          {places.length > 0 ? (
            <TravelExplorer
              places={places}
              labels={{
                all: t('all'),
                bangladesh: t('bangladesh'),
                world: t('world'),
                regions: t('regions'),
                globe: t('atlasText'),
                select: t('select'),
                selectText: t('selectText'),
                destinations: t('destinations'),
                timeline: t('timeline'),
                photos: t('photos'),
                memories: t('memories'),
                videos: t('videos'),
                play: tst('play'),
                demo: t('demo'),
                close: tc('close'),
                previous: tc('previous'),
                next: tc('next'),
                undated: t('undated'),
              }}
            />
          ) : (
            <div className="grid gap-16">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
                <div data-reveal>
                  <p className="eyebrow">{t('atlasTitle')}</p>
                  <h2 className="mt-2 text-3xl md:text-5xl">{t('emptyTitle')}</h2>
                  <p className="mt-4 max-w-md text-[var(--text-2)]">{t('atlasText')}</p>
                  <p className="mt-3 max-w-md text-sm text-[var(--text-2)]">{t('emptyText')}</p>
                </div>
                <GlobeAnchor label={t('atlasText')} className="mx-auto w-full max-w-[520px]" />
              </div>
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
          )}
        </Container>
      </section>
    </>
  )
}
