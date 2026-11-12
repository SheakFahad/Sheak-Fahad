'use client'

import { BrandIcon, BRAND_ICONS, type BrandKey } from '@/components/icons/BrandIcons'
import { ContactHref } from '@/components/shared/ContactHref'
import { Magnetic } from '@/components/ui/Magnetic'

export interface DockItem {
  key: BrandKey
  label: string
  url: string
}

/** Floating glass dock with genuine brand marks, magnetic hover, animated tooltips and keyboard focus. */
export function SocialDock({ items, label }: { items: DockItem[]; label: string }) {
  if (!items.length) return null
  return (
    <nav aria-label={label} data-hero-dock>
      <ul className="glass inline-flex items-center gap-1 rounded-full p-1.5 shadow-[0_20px_60px_-25px_rgb(66_99_255/0.6)]">
        {items.map(item => {
          return (
            <li key={item.key} className="relative">
              <Magnetic strength={0.3}>
                <ContactHref
                  url={item.url}
                  aria-label={item.label}
                  className="dock-link group relative grid size-12 place-items-center rounded-full text-[var(--text-2)] transition-[color,background,transform,box-shadow] duration-300 hover:scale-110 hover:text-white focus-visible:scale-110 focus-visible:text-white"
                  style={{ '--brand': BRAND_ICONS[item.key].hex } as React.CSSProperties}
                >
                  <BrandIcon name={item.key} className="size-[20px]" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 translate-y-1 rounded-full bg-[var(--surface-strong)] px-3 py-1 font-mono text-[11px] whitespace-nowrap text-[var(--text)] opacity-0 shadow-lg ring-1 ring-[var(--line)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  >
                    {item.label}
                  </span>
                </ContactHref>
              </Magnetic>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
