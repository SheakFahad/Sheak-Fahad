import 'server-only'
import type { NavItem, SocialItem } from '@/components/layout/nav-types'
import { localize, sectionHref } from '@/lib/content/localize'
import { getNavSections, getProfile, getSiteSettings, getSocialLinks } from '@/lib/content/repository'

/** Data for the site shell (header, menu, footer) — everything comes from the content layer. */
export async function getShellData(locale: string) {
  const [settings, profile, sections, socials] = await Promise.all([
    getSiteSettings(),
    getProfile(),
    getNavSections(),
    getSocialLinks(),
  ])

  const navItems: NavItem[] = sections.map((s, i) => {
    const l = localize(s, locale)
    return { key: s.key, href: sectionHref(s.route_slug), label: l.nav_label, eyebrow: l.eyebrow, index: i + 1 }
  })

  const footerSocials: SocialItem[] = socials
    .filter(s => s.show_in_footer)
    .map(s => ({ platform: s.platform, label: s.label, url: s.url, handle: s.handle }))

  return {
    settings: localize(settings, locale),
    profile: localize(profile, locale),
    navItems,
    socials: footerSocials,
  }
}
