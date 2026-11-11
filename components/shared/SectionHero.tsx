import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '@/components/layout/Breadcrumbs'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { FramedPhoto } from '@/components/ui/FramedPhoto'
import { Container, Eyebrow } from '@/components/ui/primitives'
import type { MediaRef } from '@/lib/content/types'

interface Props {
  title: string
  eyebrow?: string | null
  intro?: string | null
  hero?: MediaRef | null
  crumbs?: Crumb[]
  heroAspect?: string
  children?: ReactNode
}

/** Standard inner-page hero: breadcrumbs, eyebrow, split-text title, intro, optional framed photo. */
export async function SectionHero({ title, eyebrow, intro, hero, crumbs, heroAspect = '3 / 4', children }: Props) {
  const t = await getTranslations('common')
  return (
    <section className="relative pt-36 pb-12 md:pt-44 md:pb-16">
      <Container className="grid items-end gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Breadcrumbs
            label={t('breadcrumb')}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
            items={crumbs ?? [{ label: t('home'), href: '/' }, { label: title }]}
          />
          {eyebrow && <Eyebrow className="mt-8">{eyebrow}</Eyebrow>}
          <SplitHeading as="h1" trigger="load" className="mt-3 text-[clamp(2.4rem,6vw,5.5rem)] font-bold">
            {title}
          </SplitHeading>
          {intro && (
            <p data-reveal className="mt-6 max-w-2xl text-lg text-[var(--text-2)]">
              {intro}
            </p>
          )}
          {children}
        </div>
        {hero && (
          <div data-reveal className="w-full max-w-sm justify-self-center lg:justify-self-end">
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
