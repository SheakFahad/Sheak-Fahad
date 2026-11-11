import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'
import { SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, GlassCard } from '@/components/ui/primitives'
import { getExperiences, getMediaMany } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/career'>) => sectionMetadata('career', (await params).locale)

export default async function CareerPage({ params }: PageProps<'/[locale]/career'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('career', locale)
  const [t, format, experiences] = await Promise.all([getTranslations('career'), getFormatter(), getExperiences()])
  const logos = await getMediaMany(experiences.map(e => e.logo_media_id).filter((x): x is string => Boolean(x)))
  const fmt = (d: string | null) => (d ? format.dateTime(new Date(d), { month: 'short', year: 'numeric' }) : null)

  return (
    <>
      <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero}>
        <ul data-reveal className="mt-8 flex flex-wrap gap-2" aria-label={t('roles')}>
          {[...new Set(experiences.map(e => e.role))].map(r => (
            <li key={r}>
              <Chip className="text-sm text-[var(--text)]">{r}</Chip>
            </li>
          ))}
        </ul>
      </SectionHero>

      <section className="section-y pt-0">
        <Container>
          <ol className="grid gap-6">
            {experiences.map((x, i) => {
              const logo = logos.find(l => l.id === x.logo_media_id)
              const from = fmt(x.start_date)
              const to = x.is_current ? t('present') : fmt(x.end_date)
              const hasDetails = x.responsibilities.length > 0 || x.achievements.length > 0 || x.summary
              return (
                <li key={x.id} data-reveal>
                  <GlassCard className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-10">
                    <div className="flex items-start gap-4 md:flex-col">
                      <span className="font-mono text-sm text-[var(--cyan)]">{String(i + 1).padStart(2, '0')}</span>
                      {logo && (
                        <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-xl bg-white md:w-full">
                          <Image src={logo.src} alt={logo.alt} fill sizes="220px" className="object-contain p-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="eyebrow">{x.role}</p>
                      <h2 className="mt-2 text-3xl md:text-4xl">{x.company}</h2>
                      {(from || to) && (
                        <p className="mt-2 font-mono text-sm text-[var(--text-2)]">
                          {[from, to].filter(Boolean).join(' — ')}
                          {x.employment_type ? ` · ${x.employment_type}` : ''}
                        </p>
                      )}
                      {x.summary && <p className="mt-5 text-[var(--text-2)]">{x.summary}</p>}
                      {x.responsibilities.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold tracking-wide uppercase">{t('responsibilities')}</h3>
                          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--text-2)]">
                            {x.responsibilities.map(r => (
                              <li key={r}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {x.achievements.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold tracking-wide uppercase">{t('achievements')}</h3>
                          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--text-2)]">
                            {x.achievements.map(a => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!hasDetails && <p className="mt-5 text-sm text-[var(--text-2)] italic">{t('detailsSoon')}</p>}
                    </div>
                  </GlassCard>
                </li>
              )
            })}
          </ol>
        </Container>
      </section>
    </>
  )
}
