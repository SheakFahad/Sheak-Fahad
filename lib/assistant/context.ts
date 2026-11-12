import 'server-only'
import { localize, sectionHref } from '@/lib/content/localize'
import {
  getAchievements,
  getEducation,
  getExperiences,
  getHobbies,
  getNavSections,
  getProfile,
  getProjects,
  getResearch,
  getSiteSettings,
  getSkills,
  getSocialLinks,
  getTravel,
  getVideos,
} from '@/lib/content/repository'

export interface AssistantAction {
  href: string
  label: string
}

/**
 * Grounding for Fahad's AI Assistant: ONLY published, verified rows from the content layer.
 * Never includes private contact details (email address, phone/WhatsApp number), GPA/CGPA,
 * draft/private/demo rows, or anything not in the CMS.
 */
export async function buildAssistantContext(locale: string) {
  const [rawProfile, sections, experiences, education, projects, research, skills, achievements, travel, videos, hobbies, socials, settings] =
    await Promise.all([
      getProfile(),
      getNavSections(),
      getExperiences(),
      getEducation(),
      getProjects(),
      getResearch(),
      getSkills(),
      getAchievements(),
      getTravel(),
      getVideos(),
      getHobbies(),
      getSocialLinks(),
      getSiteSettings(),
    ])
  const L = <T extends { translations?: unknown }>(r: T) => localize(r as never, locale) as T
  const profile = L(rawProfile)

  const actions: AssistantAction[] = sections.map(s => {
    const l = L(s)
    return { href: sectionHref(s.route_slug), label: l.station_name ? `${l.nav_label} — ${l.station_name}` : l.nav_label }
  })
  const projectsSection = sections.find(s => s.key === 'projects')
  if (projectsSection) for (const p of projects) actions.push({ href: `/${projectsSection.route_slug}/${p.slug}`, label: L(p).title })

  const lines: string[] = []
  lines.push(`# Sheak Fahad — verified portfolio facts`)
  lines.push(`Name: ${profile.full_name}`)
  lines.push(`Professional title: ${profile.hero_title ?? profile.roles[0] ?? ''}`)
  lines.push(`Roles: ${profile.roles.join(', ')}`)
  lines.push(`Tagline: ${settings.tagline}`)
  if (profile.hero_text) lines.push(`Focus: ${profile.hero_text}`)
  lines.push(`About: ${profile.intro}`)
  if (profile.location_city) lines.push(`Based in: ${profile.location_city}`)

  lines.push(`\n## Experience (dates and responsibilities are not published yet unless listed)`)
  for (const e of experiences.map(L)) {
    const dates = [e.start_date, e.is_current ? 'present' : e.end_date].filter(Boolean).join(' – ')
    lines.push(`- ${e.role} at ${e.company}${dates ? ` (${dates})` : ''}${e.summary ? ` — ${e.summary}` : ''}`)
    e.responsibilities.forEach(r => lines.push(`  • ${r}`))
  }

  lines.push(`\n## Education (results are private and must never be stated)`)
  for (const e of education.map(L)) lines.push(`- ${e.degree}, ${e.institution}${e.end_year ? ` (passed ${e.end_year})` : ''}`)

  lines.push(`\n## Projects (covers marked "concept visual" are illustrations, not product screenshots)`)
  for (const p of projects.map(L)) {
    lines.push(`- ${p.title} — ${p.project_type}${p.role ? `; role: ${p.role}` : ''}${p.summary ? `; ${p.summary}` : ''}${p.tools.length ? `; tools: ${p.tools.join(', ')}` : ''}${p.is_concept_visual ? ' (concept visual cover)' : ''}`)
  }

  lines.push(`\n## Research`)
  for (const r of research.map(L)) lines.push(`- ${r.kind}: "${r.title}" — ${r.institution}${r.term ? `, ${r.term}` : ''}${r.tags.length ? `; topics: ${r.tags.join(', ')}` : ''}`)

  lines.push(`\n## Skills`)
  for (const s of skills.map(L)) lines.push(`- ${s.title}${s.items.length ? `: ${s.items.join(', ')}` : ''}`)

  lines.push(`\n## Certificates & achievements`)
  for (const a of achievements.map(L)) lines.push(`- ${a.title}${a.issuer ? ` — ${a.issuer}` : ''}`)

  lines.push(`\n## Travel`)
  if (travel.length) for (const t of travel.map(L)) lines.push(`- ${t.name}, ${t.country}${t.visited_from ? ` (${t.visited_from})` : ''}`)
  else lines.push(`- No travel destinations have been published yet.`)

  lines.push(`\n## Videos`)
  lines.push(videos.length ? videos.map(v => `- ${L(v).title}`).join('\n') : '- No videos have been published yet.')

  lines.push(`\n## Hobbies`)
  for (const h of hobbies.map(L)) lines.push(`- ${h.title}`)

  lines.push(`\n## Contact`)
  lines.push(`Visitors can reach Sheak through ${socials.map(s => s.label).join(', ')} using the icons on the Contact page, or the message form there. Never write an email address or phone number.`)

  lines.push(`\n## Site pages (use only these paths for ACTION lines)`)
  for (const a of actions) lines.push(`- ${a.href} — ${a.label}`)

  return { facts: lines.join('\n'), actions }
}
