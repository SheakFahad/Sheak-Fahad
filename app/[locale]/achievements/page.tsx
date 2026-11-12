import { getTranslations } from 'next-intl/server'
import { SectionHero } from '@/components/shared/SectionHero'
import { StationIcon } from '@/components/nexus/StationIcon'
import { Chip, Container, EmptyState } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getAchievements } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/achievements'>) => sectionMetadata('achievements', (await params).locale)

/** MILESTONES — certificates and achievements (only published, verified rows). */
export default async function AchievementsPage({ params }: PageProps<'/[locale]/achievements'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('achievements', locale)
  const [ts, t, rows] = await Promise.all([getTranslations('section'), getTranslations('achievements'), getAchievements()])
  const items = rows.map(r => localize(r, locale))

  return (
    <>
      <SectionHero title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />
      <section className="section-y">
        <Container>
          {items.length === 0 ? (
            <EmptyState title={ts('preparingTitle')} text={ts('preparingText')} />
          ) : (
            <ol className="grid gap-4 md:grid-cols-2">
              {items.map((a, i) => (
                <li key={a.id} data-reveal className="glass relative overflow-hidden rounded-[var(--radius-panel)] p-7">
                  <div className="flex items-start gap-5">
                    <span className="nx-tile-icon shrink-0">
                      <StationIcon name="trophy" className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[var(--cyan)]">
                        {String(i + 1).padStart(2, '0')} · {t(`kind.${a.kind}`)}
                      </p>
                      <h2 className="mt-2 text-xl md:text-2xl">{a.title}</h2>
                      {a.issuer && <p className="mt-1 text-[var(--text-2)]">{a.issuer}</p>}
                      {a.description && <p className="mt-3 text-sm text-[var(--text-2)]">{a.description}</p>}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {a.issued_on && <Chip>{a.issued_on}</Chip>}
                        {a.credential_id && (
                          <Chip>
                            {t('credential')}: {a.credential_id}
                          </Chip>
                        )}
                        {a.credential_url && (
                          <a href={a.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--cyan)] underline-offset-4 hover:underline">
                            {t('verify')} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Container>
      </section>
    </>
  )
}
