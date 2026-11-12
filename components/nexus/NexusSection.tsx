import { getTranslations } from 'next-intl/server'
import type { DockItem } from '@/components/hero/SocialDock'
import type { BrandKey } from '@/components/icons/BrandIcons'
import { localize } from '@/lib/content/localize'
import { getMedia, getProfile, getSectionByKey, getSiteSettings, getSocialLinks } from '@/lib/content/repository'
import type { SocialPlatform } from '@/lib/content/types'
import { getAssistantKnowledge, getFeaturedProjects, getHomeConfig } from '@/lib/nexus/home'
import { getShellData } from '@/lib/site/shell'
import { NexusHero } from './NexusHero'

// Platform → brand mark used in the dock (order = dock order, as in the NEXUS reference).
const DOCK: [SocialPlatform, BrandKey][] = [
  ['email', 'gmail'],
  ['linkedin', 'linkedin'],
  ['facebook', 'facebook'],
  ['instagram', 'instagram'],
  ['whatsapp', 'whatsapp'],
  ['github', 'github'],
]

/** NEXUS homepage hero — every string, link, image and toggle comes from the CMS content layer. */
export async function NexusSection({ locale }: { locale: string }) {
  const [t, rawProfile, socials, projectsSection, settings, config, shell] = await Promise.all([
    getTranslations('home'),
    getProfile(),
    getSocialLinks(),
    getSectionByKey('projects'),
    getSiteSettings(),
    getHomeConfig(locale),
    getShellData(locale),
  ])
  const profile = localize(rawProfile, locale)
  const [cutout, featured, assistant] = await Promise.all([
    getMedia(rawProfile.hero_media_id ?? rawProfile.avatar_media_id),
    config.show_featured ? getFeaturedProjects(locale, config.featured_project_slugs) : Promise.resolve([]),
    settings.features.assistant ? getAssistantKnowledge(locale) : Promise.resolve(null),
  ])

  const dock: DockItem[] = DOCK.flatMap(([platform, key]) => {
    const s = socials.find(x => x.platform === platform)
    return s ? [{ key, label: s.label, url: s.url }] : []
  })
  const roles = profile.roles ?? []

  return (
    <NexusHero
      config={config}
      name={profile.full_name}
      primaryRoles={roles.slice(0, 4)}
      extraRoles={roles.slice(4)}
      text={profile.hero_text ?? profile.intro}
      portrait={{
        src: cutout?.src ?? '',
        srcSm: cutout?.src.replace(/\.webp$/, '-sm.webp') ?? '',
        alt: cutout?.alt ?? profile.full_name,
        width: cutout?.width ?? 1188,
        height: cutout?.height ?? 1100,
      }}
      dock={dock}
      stations={config.show_stations ? shell.navItems : []}
      featured={featured}
      assistant={assistant}
      cta={{
        exploreLabel: t('exploreWorld'),
        exploreHref: '#explore',
        projectsLabel: t('viewProjects'),
        projectsHref: projectsSection ? `/${projectsSection.route_slug}` : null,
        cvLabel: t('downloadCv'),
        cvUrl: rawProfile.cv_url ?? null,
      }}
      labels={{
        social: t('socialLabel'),
        scroll: t('scrollHint'),
        stations: t('stationsLabel'),
        globe: t('globeLabel'),
        open: t('openStation'),
        featured: { title: t('featuredTitle'), prev: t('prevProject'), next: t('nextProject'), concept: t('conceptVisual'), view: t('viewCase') },
        ai: {
          title: t('aiTitle'),
          text: t('aiText'),
          open: t('aiOpen'),
          close: t('aiClose'),
          hide: t('aiHide'),
          placeholder: t('aiPlaceholder'),
          send: t('aiSend'),
          note: t('aiNote'),
          suggest: t('aiSuggest'),
          noAnswer: t('aiNoAnswer'),
          greeting: t('aiGreeting'),
          you: t('aiYou'),
        },
      }}
    />
  )
}
