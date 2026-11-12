'use client'

import { BrandIcon, BRAND_ICONS, type BrandKey } from '@/components/icons/BrandIcons'
import { cn } from '@/lib/utils/cn'
import { ContactHref } from './ContactHref'

/** Platform → genuine brand mark. Contact details are never printed as text — icons + accessible names only. */
const MARK: Partial<Record<string, BrandKey>> = {
  email: 'gmail',
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
  github: 'github',
  facebook: 'facebook',
  instagram: 'instagram',
  behance: 'behance',
}

export interface SocialIconItem {
  platform: string
  label: string
  url: string
}

export function SocialIcons({ items, label, size = 'md', className }: { items: SocialIconItem[]; label: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const list = items.flatMap(i => {
    const key = MARK[i.platform]
    return key ? [{ ...i, key }] : []
  })
  if (!list.length) return null
  const box = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-10' : 'size-12'
  const icon = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-[18px]' : 'size-5'
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-2.5', className)}>
      {list.map(i => {
        return (
          <li key={i.platform}>
            <ContactHref
              url={i.url}
              aria-label={i.label}
              title={i.label}
              className={cn('social-tile group', box)}
              style={{ '--brand': BRAND_ICONS[i.key].hex } as React.CSSProperties}
              data-platform={i.platform}
            >
              <BrandIcon name={i.key} className={icon} />
            </ContactHref>
          </li>
        )
      })}
    </ul>
  )
}
