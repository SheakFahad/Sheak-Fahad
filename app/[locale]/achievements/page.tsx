import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { DetailDialog } from '@/components/shared/DetailDialog'
import { SectionHero } from '@/components/shared/SectionHero'
import { StationIcon } from '@/components/nexus/StationIcon'
import { Chip, Container, EmptyState } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getAchievements, getMediaMany } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/achievements'>) => sectionMetadata('achievements', (await params).locale)

/** MILESTONES — certificates and achievements (only published, verified rows). */
export default async function AchievementsPage({ params }: PageProps<'/[locale]/achievements'>) {
  const { locale } = await params
  const { section, hero } = await requireSection('achievements', locale)
  const [ts, t, tc, rows] = await Promise.all([getTranslations('section'), getTranslations('achievements'), getTranslations('common'), getAchievements()])
  const items = rows.map(r => localize(r, locale))
  const media = await getMediaMany(items.map(a => a.media_id).filter((x): x is string => Boolean(x)))

  return (
    <>
      <SectionHero stationKey="achievements" title={section.title} eyebrow={section.eyebrow} intro={section.intro} hero={hero} />
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
                      <DetailDialog trigger={t('details')} title={a.title} close={tc('close')}>
                        <dl className="mt-6 grid gap-3 text-sm">
                          <div className="flex gap-3"><dt className="w-32 shrink-0 text-[var(--text-2)]">{t('type')}</dt><dd>{t(`kind.${a.kind}`)}</dd></div>
                          {a.issuer && <div className="flex gap-3"><dt className="w-32 shrink-0 text-[var(--text-2)]">{t('issuer')}</dt><dd>{a.issuer}</dd></div>}
                          {a.issued_on && <div className="flex gap-3"><dt className="w-32 shrink-0 text-[var(--text-2)]">{t('issued')}</dt><dd>{a.issued_on}</dd></div>}
                          {a.credential_id && <div className="flex gap-3"><dt className="w-32 shrink-0 text-[var(--text-2)]">{t('credential')}</dt><dd className="font-mono">{a.credential_id}</dd></div>}
                        </dl>
                        {a.description && <p className="mt-5 text-[var(--text-2)]">{a.description}</p>}
                        {(() => {
                          const img = media.find(m => m.id === a.media_id)
                          return img ? (
                            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-xl bg-[var(--bg-2)]">
                              <Image src={img.src} alt={img.alt} fill sizes="600px" className="object-contain" />
                            </div>
                          ) : (
                            <p className="mt-6 text-sm text-[var(--text-2)] italic">{t('noImage')}</p>
                          )
                        })()}
                        {a.credential_url && (
                          <a href={a.credential_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex text-[var(--cyan)] hover:underline">
                            {t('verify')} ↗
                          </a>
                        )}
                      </DetailDialog>
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
