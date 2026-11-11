'use client'

import { useCallback, useEffect, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MegaMenu } from './MegaMenu'
import type { NavItem, SocialItem } from './nav-types'
import { SFMark } from './SFMark'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  siteName: string
  items: NavItem[]
  /** How many nav items fit in the desktop bar; the rest live in the menu. */
  barCount?: number
  socials: SocialItem[]
  labels: {
    primary: string
    menu: string
    openMenu: string
    closeMenu: string
    allSections: string
    connect: string
    language: string
    toDark: string
    toLight: string
    home: string
  }
}

export function Header({ siteName, items, barCount = 6, socials, labels }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const activeHref = items.find(i => isActive(i.href))?.href ?? pathname

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[75] px-3 pt-3 md:px-5 md:pt-4">
        <div
          className={cn(
            'mx-auto flex max-w-[1320px] items-center gap-2 rounded-full px-3 py-2 transition-[background,border-color,box-shadow] duration-500 md:px-4',
            scrolled || open ? 'glass shadow-[0_10px_40px_-20px_rgb(0_0_0/0.6)]' : 'border border-transparent',
          )}
        >
          <TransitionLink href="/" aria-label={`${siteName} — ${labels.home}`} className="flex min-h-11 items-center gap-2.5 rounded-full pr-2">
            <SFMark className="size-9" />
            <span className="hidden font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight sm:inline">{siteName}</span>
          </TransitionLink>

          <nav aria-label={labels.primary} className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {items.slice(0, barCount).map(item => (
                <li key={item.key}>
                  <TransitionLink
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex min-h-11 items-center rounded-full px-3.5 text-sm transition-colors',
                      isActive(item.href) ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
                    )}
                  >
                    {item.label}
                    {isActive(item.href) && (
                      <span aria-hidden="true" className="absolute inset-x-3.5 bottom-2 h-px [background:var(--grad)]" />
                    )}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <LocaleSwitcher label={labels.language} />
            <ThemeToggle labels={{ toDark: labels.toDark, toLight: labels.toLight }} />
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="mega-menu"
              aria-label={open ? labels.closeMenu : labels.openMenu}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full pr-2 pl-3 text-sm font-semibold hover:bg-[var(--line)]"
            >
              <span className="hidden sm:inline">{labels.menu}</span>
              <span aria-hidden="true" className="relative block h-3 w-5">
                <span className={cn('absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300', open ? 'top-1.5 rotate-45' : 'top-0')} />
                <span className={cn('absolute left-0 h-0.5 rounded bg-current transition-all duration-300', open ? 'top-1.5 w-5 -rotate-45' : 'top-2.5 w-3.5')} />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MegaMenu
        id="mega-menu"
        open={open}
        onClose={close}
        items={items}
        socials={socials}
        activeHref={activeHref}
        labels={{ title: labels.allSections, close: labels.closeMenu, connect: labels.connect }}
      />
    </>
  )
}
