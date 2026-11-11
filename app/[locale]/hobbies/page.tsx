import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, EmptyState } from '@/components/ui/primitives'
import { getHobbies, getMediaMany } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'
import { cn } from '@/lib/utils/cn'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/hobbies'>) => sectionMetadata('hobbies', (await params).locale)

export default async function HobbiesPage({ params }: PageProps<'/[locale]/hobbies'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('hobbies', locale)
  const [ts, hobbies] = await Promise.all([getTranslations('section'), getHobbies()])
  const media = await getMediaMany(hobbies.map(h => h.media_id).filter((x): x is string => Boolean(x)))
  const words = hobbies.flatMap(h => (h.tags.length ? h.tags : [h.title]))

  return (
    <>
      <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />

      {words.length > 0 && (
        <div aria-hidden="true" className="overflow-hidden border-y border-[var(--line)] py-6">
          <div className="flex w-max animate-[marquee_45s_linear_infinite] gap-12 font-[family-name:var(--font-display)] text-4xl md:text-6xl">
            {[...words, ...words].map((w, i) => (
              <span key={`${w}-${i}`} className={i % 2 ? 'text-[var(--text-2)]' : 'text-gradient'}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="section-y">
        <Container>
          {hobbies.length === 0 ? (
            <EmptyState title={ts('preparingTitle')} text={ts('preparingText')} />
          ) : (
            <ul className="grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-3">
              {hobbies.map(h => {
                const img = media.find(m => m.id === h.media_id)
                return (
                  <li
                    key={h.id}
                    data-reveal
                    className={cn(
                      'glass group relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] p-7 transition-[border-color,box-shadow] duration-500 hover:border-[var(--line-strong)] hover:shadow-[var(--glow)]',
                      h.span === 2 && 'md:col-span-2',
                    )}
                  >
                    {img && <Image src={img.src} alt={img.alt} fill sizes="(min-width:768px) 66vw, 100vw" className="-z-10 object-cover opacity-40" />}
                    <span aria-hidden="true" className="absolute top-6 right-6 text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                      {h.icon}
                    </span>
                    <h2 className="text-2xl md:text-3xl">{h.title}</h2>
                    <p className="mt-2 max-w-md text-[var(--text-2)]">{h.description}</p>
                    {h.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {h.tags.map(tag => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
