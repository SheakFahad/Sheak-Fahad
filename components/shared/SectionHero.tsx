import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '@/components/layout/Breadcrumbs'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { StationIcon } from '@/components/nexus/StationIcon'
import { FramedPhoto } from '@/components/ui/FramedPhoto'
import { Container, Eyebrow } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getNavSections } from '@/lib/content/repository'
import type { MediaRef } from '@/lib/content/types'

interface Props {
  title: string
  eyebrow?: string | null
  intro?: string | null
  hero?: MediaRef | null
  crumbs?: Crumb[]
  heroAspect?: string
  /** Section key → renders the NEXUS station header (code, icon, station name). */
  stationKey?: string
  /** 'detail' keeps `title` as the h1 (e.g. a project case study) and shows the station as a kicker only. */
  stationMode?: 'index' | 'detail'
  children?: ReactNode
}

/**
 * Inner-page hero. With `stationKey` it becomes a NEXUS station header: station code + icon kicker,
 * oversized station name with the page title beneath, intro, and a HUD-framed original photo.
 * The photo is never filtered — effects live on the frame only.
 */
export async function SectionHero({ title, eyebrow, intro, hero, crumbs, heroAspect = '3 / 4', stationKey, stationMode = 'index', children }: Props) {
  const [t, ts, locale, sections] = await Promise.all([getTranslations('common'), getTranslations('station'), getLocale(), stationKey ? getNavSections() : Promise.resolve([])])
  const index = sections.findIndex(s => s.key === stationKey)
  const station = index >= 0 ? localize(sections[index]!, locale) : null
  const code = station ? `${ts('station')} ${String(index + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}` : null

  return (
    <section className="station-hero relative pt-32 pb-12 md:pt-40 md:pb-16" data-station={stationKey}>
      <Container className="grid items-end gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Breadcrumbs
            label={t('breadcrumb')}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
            items={crumbs ?? [{ label: t('home'), href: '/' }, { label: station?.nav_label ?? title }]}
          />
          {station ? (
            <>
              <p data-reveal className="station-kicker mt-8">
                <span className="station-kicker__icon">
                  <StationIcon name={station.icon} className="size-[18px]" />
                </span>
                <span>{code}</span>
                {station.eyebrow && (
                  <>
                    <span aria-hidden="true" className="text-[var(--violet)]">
                      ·
                    </span>
                    <span className="text-[var(--text)]">{stationMode === 'detail' ? station.nav_label : station.eyebrow}</span>
                  </>
                )}
              </p>
              {stationMode === 'index' ? (
                <h1 className="mt-4">
                  {/* plain text (a split would break the gradient text clip); revealed with a CSS mask wipe */}
                  <span className="station-word block">{station.nav_label}</span>
                  <span className="sr-only">: </span>
                  <span data-reveal className="station-sub mt-3 block">
                    {title}
                  </span>
                </h1>
              ) : (
                <>
                  {eyebrow && <Eyebrow className="mt-6">{eyebrow}</Eyebrow>}
                  <SplitHeading as="h1" trigger="load" className="mt-3 text-[clamp(2.4rem,6vw,5rem)] font-bold">
                    {title}
                  </SplitHeading>
                </>
              )}
            </>
          ) : (
            <>
              {eyebrow && <Eyebrow className="mt-8">{eyebrow}</Eyebrow>}
              <SplitHeading as="h1" trigger="load" className="mt-3 text-[clamp(2.4rem,6vw,5.5rem)] font-bold">
                {title}
              </SplitHeading>
            </>
          )}
          {intro && (
            <p data-reveal className="mt-6 max-w-2xl text-lg text-[var(--text-2)]">
              {intro}
            </p>
          )}
          {children}
        </div>
        {hero && (
          <div data-reveal className="station-frame w-full max-w-sm justify-self-center lg:justify-self-end">
            <FramedPhoto media={hero} aspect={heroAspect} priority sizes="(min-width: 1024px) 384px, 80vw" />
          </div>
        )}
      </Container>
    </section>
  )
}

/** Section block heading used inside pages. */
export function BlockHeading({ eyebrow, title, id }: { eyebrow?: string; title: string; id?: string }) {
  return (
    <div className="mb-10">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <SplitHeading id={id} className="mt-2 text-3xl md:text-5xl">
        {title}
      </SplitHeading>
    </div>
  )
}
