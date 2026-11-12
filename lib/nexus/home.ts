import 'server-only'
import { localize, sectionHref } from '@/lib/content/localize'
import {
  getAchievements,
  getEducation,
  getExperiences,
  getMediaMany,
  getNavSections,
  getProfile,
  getProjects,
  getResearch,
  getSiteSettings,
  getSkills,
  getSocialLinks,
} from '@/lib/content/repository'
import type { HomeConfig } from '@/lib/content/types'
import type { AssistantEntry, FeaturedProject } from './types'

const DEFAULT_HOME: HomeConfig = {
  welcome_label: 'Welcome to',
  title: 'NEXUS',
  subtitle: 'The Gateway to My Digital Universe',
  intro_prefix: "I'm",
  featured_project_slugs: [],
  show_stations: true,
  show_featured: true,
  show_globe: true,
  environment: { nebula: true, planets: true, mountains: true, city: true, plants: true, ground: true },
}

/** Homepage config (CMS `site_settings.home`), localized, with safe defaults. */
export async function getHomeConfig(locale: string): Promise<HomeConfig> {
  const settings = await getSiteSettings()
  const raw = { ...DEFAULT_HOME, ...settings.home, environment: { ...DEFAULT_HOME.environment, ...settings.home?.environment } }
  return localize(raw, locale)
}

/** Featured projects in the order chosen by the owner; unpublished/private ones never appear. */
export async function getFeaturedProjects(locale: string, slugs: string[]): Promise<FeaturedProject[]> {
  const [projects, sections] = await Promise.all([getProjects(), getNavSections()])
  const projectsSection = sections.find(s => s.key === 'projects')
  if (!projectsSection) return []
  const chosen = slugs.length ? slugs.flatMap(slug => projects.filter(p => p.slug === slug)) : projects.filter(p => p.is_featured)
  const media = await getMediaMany(chosen.map(p => p.cover_media_id).filter((x): x is string => Boolean(x)))
  return chosen.map(p => {
    const l = localize(p, locale)
    const cover = media.find(m => m.id === p.cover_media_id) ?? null
    return {
      slug: p.slug,
      title: l.title,
      type: l.project_type,
      summary: l.summary,
      href: `${sectionHref(projectsSection.route_slug)}/${p.slug}`,
      cover: cover ? { src: cover.src, alt: cover.alt, focalX: cover.focal_x ?? 0.5, focalY: cover.focal_y ?? 0.5 } : null,
      isConcept: p.is_concept_visual,
    }
  })
}

// ─── NEXUS AI (local mode) ──────────────────────────────────────────────────
// Every answer is assembled from published, verified rows. No model, no network, nothing invented.

const T = {
  en: {
    who: { q: 'What does Sheak do?', a: (roles: string, text: string) => `Sheak Fahad is a ${roles}. ${text}` },
    projects: { q: 'Which projects has he worked on?', a: (list: string) => `Published projects: ${list}. Each one has its own case-study page.` },
    skills: { q: 'What are his skills?', a: (list: string) => `Skill areas: ${list}.` },
    research: { q: 'Tell me about his research', a: (title: string, kind: string, inst: string) => `${kind} at ${inst}: “${title}”.` },
    education: { q: 'Where did he study?', a: (list: string) => `Education: ${list}.` },
    career: { q: 'Where has he worked?', a: (list: string) => `Experience: ${list}.` },
    achievements: { q: 'Any certificates?', a: (list: string) => `Certificates: ${list}.` },
    contact: { q: 'How can I contact him?', a: (list: string) => `You can reach Sheak via ${list} — or use the message form on the contact page.` },
    cv: { q: 'Can I download his CV?', a: () => 'Yes — the CV is available as a PDF download.' },
    at: ' at ',
    and: ', ',
    open: 'Open',
    cvLabel: 'Download CV',
  },
  bn: {
    who: { q: 'শেখ ফাহাদ কী করেন?', a: (roles: string, text: string) => `শেখ ফাহাদ একজন ${roles}। ${text}` },
    projects: { q: 'তিনি কোন কোন প্রজেক্টে কাজ করেছেন?', a: (list: string) => `প্রকাশিত প্রজেক্ট: ${list}। প্রতিটির আলাদা কেস স্টাডি পেজ আছে।` },
    skills: { q: 'তার দক্ষতা কী কী?', a: (list: string) => `দক্ষতার ক্ষেত্র: ${list}।` },
    research: { q: 'তার গবেষণা সম্পর্কে বলুন', a: (title: string, kind: string, inst: string) => `${inst}-এ ${kind}: “${title}”।` },
    education: { q: 'তিনি কোথায় পড়াশোনা করেছেন?', a: (list: string) => `শিক্ষা: ${list}।` },
    career: { q: 'তিনি কোথায় কাজ করেছেন?', a: (list: string) => `অভিজ্ঞতা: ${list}।` },
    achievements: { q: 'কোনো সার্টিফিকেট আছে?', a: (list: string) => `সার্টিফিকেট: ${list}।` },
    contact: { q: 'কীভাবে যোগাযোগ করব?', a: (list: string) => `${list} — এর মাধ্যমে যোগাযোগ করতে পারেন, অথবা যোগাযোগ পেজের মেসেজ ফর্ম ব্যবহার করুন।` },
    cv: { q: 'সিভি ডাউনলোড করা যাবে?', a: () => 'হ্যাঁ — সিভি PDF হিসেবে ডাউনলোড করা যায়।' },
    at: ', ',
    and: ', ',
    open: 'খুলুন',
    cvLabel: 'সিভি ডাউনলোড',
  },
} as const

const KEYWORDS: Record<string, string[]> = {
  who: ['who', 'role', 'roles', 'designer', 'profession', 'background', 'introduce', 'introduction', 'sheak', 'fahad', 'কে', 'করেন', 'পরিচয়', 'সম্পর্কে'],
  projects: ['project', 'projects', 'work', 'portfolio', 'case', 'uninest', 'pos', 'salon', 'islamic', 'healthcare', 'app', 'প্রজেক্ট', 'কাজ'],
  skills: ['skill', 'skills', 'tool', 'tools', 'figma', 'software', 'stack', 'know', 'দক্ষতা', 'টুল', 'স্কিল'],
  research: ['research', 'thesis', 'paper', 'digital', 'twin', 'federated', 'capstone', 'গবেষণা', 'থিসিস'],
  education: ['study', 'studied', 'education', 'university', 'degree', 'school', 'college', 'cse', 'green', 'পড়াশোনা', 'শিক্ষা', 'বিশ্ববিদ্যালয়', 'পড়েছেন'],
  career: ['work', 'worked', 'experience', 'company', 'companies', 'career', 'job', 'employ', 'zensoft', 'অভিজ্ঞতা', 'চাকরি', 'ক্যারিয়ার', 'কোম্পানি'],
  achievements: ['certificate', 'certificates', 'achievement', 'achievements', 'award', 'course', 'ostad', 'সার্টিফিকেট', 'অর্জন'],
  contact: ['contact', 'email', 'mail', 'whatsapp', 'reach', 'hire', 'message', 'phone', 'talk', 'যোগাযোগ', 'ইমেইল', 'হোয়াটসঅ্যাপ'],
  cv: ['cv', 'resume', 'résumé', 'download', 'pdf', 'সিভি', 'রিজিউম'],
}

export async function getAssistantKnowledge(locale: string): Promise<AssistantEntry[]> {
  const t = locale === 'bn' ? T.bn : T.en
  const [rawProfile, sections, projects, skills, research, education, experiences, achievements, socials] = await Promise.all([
    getProfile(),
    getNavSections(),
    getProjects(),
    getSkills(),
    getResearch(),
    getEducation(),
    getExperiences(),
    getAchievements(),
    getSocialLinks(),
  ])
  const profile = localize(rawProfile, locale)
  const href = (key: string) => {
    const s = sections.find(x => x.key === key)
    return s ? sectionHref(s.route_slug) : null
  }
  const out: AssistantEntry[] = []
  const push = (id: string, answer: string, link: string | null, linkLabel: string = t.open) => {
    const qa = t[id as keyof typeof KEYWORDS & keyof typeof t] as { q: string }
    out.push({ id, question: qa.q, keywords: KEYWORDS[id] ?? [], answer, href: link, linkLabel })
  }

  if (profile.roles.length) push('who', t.who.a(profile.roles.slice(0, 4).join(', '), profile.hero_text ?? profile.intro), href('about'))
  if (projects.length && href('projects')) push('projects', t.projects.a(projects.map(p => localize(p, locale).title).join(t.and)), href('projects'))
  if (skills.length) push('skills', t.skills.a(skills.map(s => localize(s, locale).title).join(t.and)), href('skills'))
  const thesis = research[0] ? localize(research[0], locale) : null
  if (thesis) push('research', t.research.a(thesis.title, thesis.kind, thesis.institution), href('research'))
  // GPA/CGPA is never included here (education.show_result governs the public pages only).
  if (education.length) push('education', t.education.a(education.map(e => localize(e, locale)).map(e => `${e.degree}${t.at}${e.institution}`).join(t.and)), href('education'))
  if (experiences.length) push('career', t.career.a(experiences.map(e => localize(e, locale)).map(e => `${e.role}${t.at}${e.company}`).join(t.and)), href('career'))
  if (achievements.length)
    push(
      'achievements',
      t.achievements.a(achievements.map(a => localize(a, locale)).map(a => (a.issuer ? `${a.title} (${a.issuer})` : a.title)).join(t.and)),
      href('achievements'),
    )
  const channels = socials.filter(s => s.platform === 'email' || s.platform === 'whatsapp' || s.platform === 'linkedin')
  if (channels.length) push('contact', t.contact.a(channels.map(s => (s.handle ? `${s.label} (${s.handle})` : s.label)).join(t.and)), href('contact'))
  if (rawProfile.cv_url) push('cv', t.cv.a(), rawProfile.cv_url, t.cvLabel)
  return out
}
