import { getFormatter, getTranslations } from 'next-intl/server'
import { MemoryArchive, type MemoryItem } from '@/components/memories/MemoryArchive'
import { SectionHero } from '@/components/shared/SectionHero'
import { Container, EmptyState } from '@/components/ui/primitives'
import { getMediaMany, getMemories } from '@/lib/content/repository'
import { galleryLabels } from '@/lib/site/labels'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/memories'>) => sectionMetadata('memories', (await params).locale)

export default async function MemoriesPage({ params }: PageProps<'/[locale]/memories'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('memories', locale)
  const [t, ts, format, memories, labels] = await Promise.all([
    getTranslations('memories'),
    getTranslations('section'),
    getFormatter(),
    getMemories(),
    galleryLabels(),
  ])

  const items: MemoryItem[] = await Promise.all(
    memories.map(async m => ({
      id: m.id,
      title: m.title,
      when: m.event_date ? format.dateTime(new Date(m.event_date), { month: 'long', year: 'numeric' }) : m.date_label,
      category: m.category,
      categoryLabel: t(`categories.${m.category}`),
      note: m.note,
      photos: await getMediaMany(m.media_ids),
    })),
  )

  return (
    <>
      <SectionHero stationKey="memories" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} heroAspect="4 / 3" />
      <section className="pb-16">
        <Container>
          {items.length === 0 ? (
            <EmptyState title={ts('preparingTitle')} text={ts('preparingText')} />
          ) : (
            <MemoryArchive items={items} labels={{ all: t('all'), filterLabel: t('filterLabel'), gallery: labels }} />
          )}
        </Container>
      </section>
    </>
  )
}
