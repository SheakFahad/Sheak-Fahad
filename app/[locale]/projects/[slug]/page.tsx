import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { MediaGallery } from '@/components/shared/MediaGallery'
import { SectionHero } from '@/components/shared/SectionHero'
import { ButtonLink } from '@/components/ui/Button'
import { Chip, Container, GlassCard } from '@/components/ui/primitives'
import { localize } from '@/lib/content/localize'
import { getMedia, getMediaMany, getProjectBySlug, getProjects, getSectionByKey } from '@/lib/content/repository'
import type { CaseStudy } from '@/lib/content/types'
import { galleryLabels } from '@/lib/site/labels'
import { requireSection } from '@/lib/site/section'
import { jsonLd } from '@/lib/utils/json-ld'

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/[locale]/projects/[slug]'>): Promise<Metadata> {
  const { slug, locale } = await params
  const p = await getProjectBySlug(slug)
  if (!p) return {}
  const cover = await getMedia(p.cover_media_id)
  return {
    title: p.title,
    description: p.summary ?? `${p.title} — ${p.project_type}`,
    alternates: { canonical: locale === 'en' ? `/projects/${slug}` : `/${locale}/projects/${slug}` },
    openGraph: cover ? { images: [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }] } : undefined,
    robots: p.visibility === 'unlisted' ? { index: false } : undefined,
  }
}

const CASE_FIELDS: { key: keyof CaseStudy; label: string }[] = [
  { key: 'overview', label: 'overview' },
  { key: 'problem', label: 'problem' },
  { key: 'objectives', label: 'objectives' },
  { key: 'research', label: 'research' },
  { key: 'user_flow', label: 'userFlow' },
  { key: 'wireframes_note', label: 'wireframes' },
  { key: 'ui_design', label: 'uiDesign' },
  { key: 'design_system', label: 'designSystem' },
  { key: 'prototype_note', label: 'prototypeNote' },
  { key: 'challenges', label: 'challenges' },
  { key: 'results', label: 'results' },
]

export default async function ProjectPage({ params }: PageProps<'/[locale]/projects/[slug]'>) {
  const { locale, slug } = await params
  const { section } = await requireSection('projects', locale)
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const [t, tc, cover, gallery, all, labels, projectsSec] = await Promise.all([
    getTranslations('projects'),
    getTranslations('common'),
    getMedia(project.cover_media_id),
    getMediaMany(project.gallery_media_ids),
    getProjects(),
    galleryLabels(),
    getSectionByKey('projects'),
  ])
  const cs = project.case_study
  const blocks = CASE_FIELDS.map(f => ({ ...f, value: cs?.[f.key] })).filter(b => (Array.isArray(b.value) ? b.value.length > 0 : Boolean(b.value)))
  const idx = all.findIndex(p => p.slug === slug)
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null
  const sectionHref = `/${projectsSec?.route_slug ?? 'projects'}`

  const meta = [
    { label: t('type'), value: project.project_type },
    project.role && { label: t('role'), value: project.role },
    project.year && { label: t('year'), value: String(project.year) },
  ].filter(Boolean) as { label: string; value: string }[]

  const creativeWork = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary ?? undefined,
    creator: { '@type': 'Person', name: 'Sheak Fahad' },
    url: project.live_url ?? undefined,
  }

  return (
    <>
      <SectionHero
        title={project.title}
        eyebrow={project.project_type}
        intro={project.summary}
        crumbs={[{ label: tc('home'), href: '/' }, { label: localize(section, locale).title, href: sectionHref }, { label: project.title }]}
      >
        <div data-reveal className="mt-8 flex flex-wrap gap-3">
          {project.live_url && (
            <ButtonLink href={project.live_url} target="_blank" rel="noopener noreferrer" magnetic>
              {t('live')} ↗
            </ButtonLink>
          )}
          {project.prototype_url && (
            <ButtonLink href={project.prototype_url} variant="secondary" target="_blank" rel="noopener noreferrer">
              {t('prototype')} ↗
            </ButtonLink>
          )}
          {project.behance_url && (
            <ButtonLink href={project.behance_url} variant="secondary" target="_blank" rel="noopener noreferrer">
              {t('behance')} ↗
            </ButtonLink>
          )}
        </div>
      </SectionHero>

      {cover && (
        <section className="pb-12">
          <Container>
            <figure data-reveal className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)]">
              <div className="relative aspect-[16/9] bg-[var(--bg-2)]">
                <Image src={cover.src} alt={cover.alt} fill priority sizes="(min-width: 1320px) 1288px, 100vw" className="object-cover" />
              </div>
              {project.is_concept_visual && (
                <figcaption className="absolute right-4 bottom-4 rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] tracking-wider text-white/85 uppercase backdrop-blur">
                  {t('concept')}
                </figcaption>
              )}
            </figure>
          </Container>
        </section>
      )}

      <section className="section-y pt-4">
        <Container className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <GlassCard className="grid gap-5">
              {meta.map(m => (
                <div key={m.label}>
                  <p className="eyebrow !text-[var(--text-2)]">{m.label}</p>
                  <p className="mt-1 font-semibold">{m.value}</p>
                </div>
              ))}
              {project.did.length > 0 && (
                <div>
                  <p className="eyebrow !text-[var(--text-2)]">{t('did')}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.did.map(d => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                  </div>
                </div>
              )}
              {project.tools.length > 0 && (
                <div>
                  <p className="eyebrow !text-[var(--text-2)]">{t('tools')}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.tools.map(d => (
                      <Chip key={d}>{d}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </aside>

          <div className="grid gap-12">
            {blocks.length === 0 ? (
              <GlassCard data-reveal className="border-dashed text-[var(--text-2)]">
                {t('caseSoon')}
              </GlassCard>
            ) : (
              blocks.map(b => (
                <article key={b.key} data-reveal>
                  <h2 className="text-2xl md:text-3xl">{t(b.label)}</h2>
                  {Array.isArray(b.value) ? (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--text-2)]">
                      {b.value.map(v => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-lg leading-relaxed whitespace-pre-line text-[var(--text-2)]">{b.value}</p>
                  )}
                </article>
              ))
            )}
            {gallery.length > 0 && (
              <article>
                <h2 className="mb-6 text-2xl md:text-3xl">{t('screens')}</h2>
                <MediaGallery items={gallery} labels={labels} />
              </article>
            )}
          </div>
        </Container>
      </section>

      {next && (
        <section className="pb-8">
          <Container>
            <TransitionLink href={`${sectionHref}/${next.slug}`} className="group block">
              <div data-reveal className="glass flex flex-col gap-2 rounded-[var(--radius-panel)] p-8 transition-[border-color] group-hover:border-[var(--line-strong)] md:p-12">
                <p className="eyebrow">{t('more')}</p>
                <p className="flex items-center justify-between gap-6 font-[family-name:var(--font-display)] text-2xl md:text-5xl">
                  {next.title}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-2">
                    →
                  </span>
                </p>
              </div>
            </TransitionLink>
          </Container>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(creativeWork) }} />
    </>
  )
}
