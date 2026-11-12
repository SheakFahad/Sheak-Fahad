import 'server-only'
import type { NavItem, SearchEntry, SocialItem } from '@/components/layout/nav-types'
import { localize, sectionHref } from '@/lib/content/localize'
import { getNavSections, getProfile, getProjects, getSectionByKey, getSiteSettings, getSocialLinks } from '@/lib/content/repository'
import type { SiteSection } from '@/lib/content/types'

const toItem = (s: SiteSection, locale: string, index: number): NavItem => {
  const l = localize(s, locale)
  return {
    key: s.key,
    href: sectionHref(s.route_slug),
    label: l.nav_label,
    eyebrow: l.eyebrow,
    index,
    icon: s.icon ?? null,
    text: l.station_text ?? null,
  }
}

/** Data for the site shell (header, menu, footer, search) — everything comes from the content layer. */
export async function getShellData(locale: string) {
  const [settings, profile, sections, socials, home, projects] = await Promise.all([
    getSiteSettings(),
    getProfile(),
    getNavSections(),
    getSocialLinks(),
    getSectionByKey('home'),
    getProjects(),
  ])

  const navItems: NavItem[] = sections.map((s, i) => toItem(s, locale, i + 1))
  const homeItem: NavItem | null = home ? toItem(home, locale, 0) : null

  const footerSocials: SocialItem[] = socials
    .filter(s => s.show_in_footer)
    .map(s => ({ platform: s.platform, label: s.label, url: s.url, handle: s.handle }))

  const projectsSection = sections.find(s => s.key === 'projects')
  const search: SearchEntry[] = [
    ...(homeItem ? [homeItem] : []),
    ...navItems,
  ].map(i => ({ href: i.href, title: i.label, group: 'section' as const, hint: i.eyebrow }))
  if (projectsSection) {
    for (const p of projects) {
      const l = localize(p, locale)
      search.push({ href: `/${projectsSection.route_slug}/${p.slug}`, title: l.title, group: 'project', hint: l.project_type })
    }
  }

  return {
    settings: localize(settings, locale),
    profile: localize(profile, locale),
    navItems,
    homeItem,
    socials: footerSocials,
    search,
  }
}
