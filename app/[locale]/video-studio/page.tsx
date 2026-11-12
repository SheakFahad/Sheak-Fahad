import { getTranslations } from 'next-intl/server'
import { PlaceholderCard } from '@/components/shared/PlaceholderCard'
import { SectionHero } from '@/components/shared/SectionHero'
import { Container } from '@/components/ui/primitives'
import { VideoCard, type VideoCardData } from '@/components/video/VideoCard'
import { getMediaMany, getVideos } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/video-studio'>) => sectionMetadata('video_studio', (await params).locale)

export default async function VideoStudioPage({ params }: PageProps<'/[locale]/video-studio'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('video_studio', locale)
  const [t, ts, videos] = await Promise.all([getTranslations('studio'), getTranslations('station'), getVideos()])
  const posters = await getMediaMany(videos.map(v => v.poster_media_id).filter((x): x is string => Boolean(x)))

  const cards: VideoCardData[] = videos.map(v => {
    const p = posters.find(m => m.id === v.poster_media_id)
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      provider: v.provider,
      externalId: v.external_id,
      src: v.src,
      poster: p ? { src: p.src, alt: p.alt } : null,
      aspect: v.aspect,
      meta: [v.category, v.client, v.year ? String(v.year) : null, ...v.tools].filter((x): x is string => Boolean(x)),
    }
  })
  const showreel = cards.find((_, i) => videos[i]?.category === 'showreel')
  const rest = cards.filter(c => c !== showreel)

  return (
    <>
      <SectionHero stationKey="video_studio" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />
      <section className="pb-16">
        <Container>
          {cards.length === 0 ? (
            <div className="grid gap-10">
              {/* Projection room: showreel stage + reels — clearly marked until real videos are published */}
              <div data-reveal className="projection-stage">
                <PlaceholderCard badge={ts('placeholder')} title={t('phShowreel')} text={t('phShowreelText')} aspect="16 / 9" className="!min-h-0">
                  <span aria-hidden="true" className="projection-stage__play">
                    <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
                      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                    </svg>
                  </span>
                </PlaceholderCard>
              </div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {(['motion', 'editing', 'reel', 'promo'] as const).map(c => (
                  <li key={c} data-reveal>
                    <PlaceholderCard badge={ts('placeholder')} title={t(`categories.${c}`)} text={t('phCategory')} aspect={c === 'reel' ? '9 / 12' : '4 / 3'} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid gap-10">
              {showreel && (
                <div data-reveal>
                  <VideoCard video={showreel} playLabel={t('play')} />
                </div>
              )}
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map(v => (
                  <li key={v.id} data-reveal>
                    <VideoCard video={v} playLabel={t('play')} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
