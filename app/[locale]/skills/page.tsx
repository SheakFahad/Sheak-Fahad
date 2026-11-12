import { getTranslations } from 'next-intl/server'
import { BlockHeading, SectionHero } from '@/components/shared/SectionHero'
import { Chip, Container, GlassCard } from '@/components/ui/primitives'
import { getAchievements, getSkills } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/skills'>) => sectionMetadata('skills', (await params).locale)

export default async function SkillsPage({ params }: PageProps<'/[locale]/skills'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('skills', locale)
  const [t, skills, achievements] = await Promise.all([getTranslations('skills'), getSkills(), getAchievements()])
  // Verified tools strip (no percentages — evidence over self-ratings)
  const tools = skills.flatMap(s => s.items)

  return (
    <>
      <SectionHero stationKey="skills" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />

      {tools.length > 0 && (
        <div aria-hidden="true" className="overflow-hidden border-y border-[var(--line)] py-5">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 font-[family-name:var(--font-display)] text-2xl text-[var(--text-2)] md:text-4xl">
            {[...tools, ...tools].map((x, i) => (
              <span key={`${x}-${i}`} className="flex items-center gap-10">
                {x} <span className="text-[var(--cyan)]">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="section-y" aria-labelledby="groups">
        <Container>
          <BlockHeading eyebrow="01" title={t('groups')} id="groups" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((s, i) => (
              <li key={s.id} data-reveal>
                <GlassCard interactive className="flex h-full flex-col">
                  <span className="font-mono text-xs text-[var(--cyan)]">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="mt-4 text-xl md:text-2xl">{s.title}</h2>
                  {s.description && <p className="mt-2 text-sm text-[var(--text-2)]">{s.description}</p>}
                  {s.items.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {s.items.map(item => (
                        <Chip key={item}>{item}</Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-[var(--text-2)] italic">{t('soon')}</p>
                  )}
                </GlassCard>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {achievements.length > 0 && (
        <section className="section-y pt-0" aria-labelledby="certs">
          <Container>
            <BlockHeading eyebrow="02" title={t('certificates')} id="certs" />
            <ul className="grid gap-4 md:grid-cols-2">
              {achievements.map(a => (
                <li key={a.id} data-reveal>
                  <GlassCard className="flex h-full gap-5">
                    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl [background:var(--grad)]">
                      🏅
                    </span>
                    <div>
                      <h3 className="text-lg md:text-xl">{a.title}</h3>
                      {a.issuer && (
                        <p className="mt-1 text-[var(--text-2)]">
                          {t('issuer')}: {a.issuer}
                        </p>
                      )}
                      {a.credential_id && (
                        <p className="mt-1 font-mono text-xs text-[var(--text-2)]">
                          {t('credential')}: {a.credential_id}
                        </p>
                      )}
                      {a.description && <p className="mt-3 text-sm text-[var(--text-2)]">{a.description}</p>}
                      {a.credential_url && (
                        <a href={a.credential_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[var(--cyan)] underline-offset-4 hover:underline">
                          ↗
                        </a>
                      )}
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  )
}
