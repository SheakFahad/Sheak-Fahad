import { getTranslations } from 'next-intl/server'
import { ProjectGrid, type ProjectCard } from '@/components/projects/ProjectGrid'
import { SectionHero } from '@/components/shared/SectionHero'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { getMediaMany, getProjects, getSocialLinks } from '@/lib/content/repository'
import { requireSection, sectionMetadata } from '@/lib/site/section'

export const generateMetadata = async ({ params }: PageProps<'/[locale]/projects'>) => sectionMetadata('projects', (await params).locale)

export default async function ProjectsPage({ params }: PageProps<'/[locale]/projects'>) {
  const { locale } = await params
  const { section } = await requireSection('projects', locale)
  const [t, projects, socials] = await Promise.all([getTranslations('projects'), getProjects(), getSocialLinks()])
  const covers = await getMediaMany(projects.map(p => p.cover_media_id).filter((x): x is string => Boolean(x)))
  const behance = socials.find(s => s.platform === 'behance')

  const cards: ProjectCard[] = projects.map(p => {
    const c = covers.find(m => m.id === p.cover_media_id)
    return {
      slug: p.slug,
      title: p.title,
      type: p.project_type,
      summary: p.summary,
      concept: p.is_concept_visual,
      cover: c ? { src: c.src, alt: c.alt, fx: c.focal_x ?? 0.5, fy: c.focal_y ?? 0.5 } : null,
    }
  })

  return (
    <>
      <SectionHero stationKey="projects" title={section.title} eyebrow={section.eyebrow} intro={section.intro} />
      <section className="pb-16">
        <Container>
          <ProjectGrid
            projects={cards}
            labels={{ all: t('all'), viewCase: t('viewCase'), concept: t('concept'), filterLabel: t('filterLabel') }}
          />
          {behance && (
            <div data-reveal className="mt-12 flex justify-center">
              <ButtonLink href={behance.url} variant="secondary" target="_blank" rel="noopener noreferrer">
                {t('behance')} ↗
              </ButtonLink>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
