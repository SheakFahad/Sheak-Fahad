import { getTranslations } from 'next-intl/server'
import type { BrandKey } from '@/components/icons/BrandIcons'
import { localize } from '@/lib/content/localize'
import { getMedia, getProfile, getSectionByKey, getSocialLinks } from '@/lib/content/repository'
import type { SocialPlatform } from '@/lib/content/types'
import { HeroExperience } from './HeroExperience'
import type { DockItem } from './SocialDock'

// Platform → brand mark used in the hero dock (order = dock order).
const DOCK: [SocialPlatform, BrandKey][] = [
  ['email', 'gmail'],
  ['linkedin', 'linkedin'],
  ['facebook', 'facebook'],
  ['instagram', 'instagram'],
  ['whatsapp', 'whatsapp'],
  ['github', 'github'],
]

/** Server wrapper: every hero string, link and image comes from the content layer (CMS). */
export async function HeroSection({ locale }: { locale: string }) {
  const [t, rawProfile, socials, projects] = await Promise.all([
    getTranslations('home'),
    getProfile(),
    getSocialLinks(),
    getSectionByKey('projects'),
  ])
  const profile = localize(rawProfile, locale)
  const cutout = await getMedia(rawProfile.hero_media_id ?? rawProfile.avatar_media_id)

  const dock: DockItem[] = DOCK.flatMap(([platform, key]) => {
    const s = socials.find(x => x.platform === platform)
    return s ? [{ key, label: s.label, url: s.url }] : []
  })

  const roles = profile.roles ?? []
  const smSrc = cutout?.src.replace(/\.webp$/, '-sm.webp') ?? ''

  return (
    <HeroExperience
      name={profile.full_name}
      primaryRoles={roles.slice(0, 4)}
      extraRoles={roles.slice(4)}
      tagline={profile.hero_tagline ?? profile.tagline}
      text={profile.hero_text ?? profile.intro}
      portrait={{
        src: cutout?.src ?? '',
        srcSm: smSrc,
        alt: cutout?.alt ?? profile.full_name,
        width: cutout?.width ?? 1188,
        height: cutout?.height ?? 1100,
      }}
      skills={rawProfile.hero_skills ?? []}
      dock={dock}
      cta={{
        exploreLabel: t('exploreWorld'),
        projectsLabel: t('viewProjects'),
        projectsHref: projects ? `/${projects.route_slug}` : null,
        cvLabel: t('downloadCv'),
        cvUrl: rawProfile.cv_url ?? null,
      }}
      labels={{ skills: t('skillsLabel'), social: t('socialLabel'), scroll: t('scrollHint'), close: t('closeSkill') }}
    />
  )
}
