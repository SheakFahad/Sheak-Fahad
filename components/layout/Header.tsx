'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { StationIcon } from '@/components/nexus/StationIcon'
import { usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MegaMenu } from './MegaMenu'
import type { NavItem, SearchEntry, SocialItem } from './nav-types'
import { SearchDialog } from './SearchDialog'
import { openExplore } from './StationNavigator'
import { SFMark } from './SFMark'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  siteName: string
  brandSub: string
  homeItem: NavItem | null
  items: NavItem[]
  /** How many section items sit in the desktop bar after NEXUS; the rest live under MORE. */
  barCount?: number
  socials: SocialItem[]
  search: SearchEntry[]
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
    more: string
    search: string
    searchPlaceholder: string
    noResults: string
    sections: string
    projects: string
    explore: string
  }
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function Header({ siteName, brandSub, homeItem, items, barCount = 5, socials, search, labels }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const navRef = useRef<HTMLUListElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const moreRef = useRef<HTMLLIElement>(null)

  const bar = [...(homeItem ? [homeItem] : []), ...items.slice(0, barCount)]
  const more = items.slice(barCount)
  const allItems = [...(homeItem ? [homeItem] : []), ...items]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const activeHref = allItems.find(i => isActive(i.href))?.href ?? pathname
  const moreActive = more.some(i => isActive(i.href))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ctrl/⌘+K or "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input,textarea,select,[contenteditable="true"]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // MORE dropdown: Escape / outside click closes
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false)
        moreRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [moreOpen])

  // Sliding glow pill: sits on the active item, follows hover/focus.
  const movePill = useCallback((el: HTMLElement | null) => {
    const p = pill.current
    const list = navRef.current
    if (!p || !list) return
    if (!el) {
      p.style.opacity = '0'
      return
    }
    const a = el.getBoundingClientRect()
    const b = list.getBoundingClientRect()
    p.style.opacity = '1'
    p.style.transform = `translateX(${a.left - b.left}px)`
    p.style.width = `${a.width}px`
  }, [])
  const restPill = useCallback(() => {
    const list = navRef.current
    movePill(list?.querySelector<HTMLElement>('[data-nav-current="true"]') ?? null)
  }, [movePill])

  useIsoLayoutEffect(() => {
    restPill()
    window.addEventListener('resize', restPill)
    // fonts can change widths after load
    document.fonts?.ready.then(restPill).catch(() => {})
    return () => window.removeEventListener('resize', restPill)
  }, [restPill, pathname])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[75] px-3 pt-3 md:px-5 md:pt-4">
        <div
          className={cn(
            'nexus-bar mx-auto flex max-w-[1440px] items-center gap-2 rounded-[22px] px-3 py-2 transition-[background,border-color,box-shadow] duration-500 md:px-4',
            scrolled || open ? 'is-solid' : '',
          )}
        >
          <TransitionLink href="/" aria-label={`${siteName} — ${labels.home}`} className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-full pr-2">
            <SFMark className="size-10" />
            <span className="hidden leading-none sm:block">
              <span className="block font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">{siteName}</span>
              <span className="mt-1 block font-mono text-[9px] tracking-[0.32em] text-[var(--text-2)] uppercase">{brandSub}</span>
            </span>
          </TransitionLink>

          <nav aria-label={labels.primary} className="mx-auto hidden xl:block">
            <ul ref={navRef} className="relative flex items-center gap-0.5" onPointerLeave={restPill} onBlur={restPill}>
              <span ref={pill} aria-hidden="true" className="nexus-pill" />
              {bar.map(item => {
                const current = isActive(item.href)
                return (
                  <li key={item.key}>
                    <TransitionLink
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                      data-nav-current={current}
                      onPointerEnter={e => movePill(e.currentTarget)}
                      onFocus={e => movePill(e.currentTarget)}
                      className={cn(
                        'nexus-link relative z-[1] inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 font-[family-name:var(--font-display)] text-[11.5px] tracking-[0.06em] uppercase transition-colors 2xl:gap-2 2xl:px-3.5 2xl:text-[12px] 2xl:tracking-[0.08em]',
                        current ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
                      )}
                    >
                      <StationIcon name={item.icon} className="size-4 text-[var(--cyan)]" />
                      {item.label}
                    </TransitionLink>
                  </li>
                )
              })}
              {more.length > 0 && (
                <li ref={moreRef} className="relative">
                  <button
                    type="button"
                    aria-expanded={moreOpen}
                    aria-controls="nav-more"
                    data-nav-current={moreActive}
                    onClick={() => setMoreOpen(v => !v)}
                    onPointerEnter={e => movePill(e.currentTarget)}
                    onFocus={e => movePill(e.currentTarget)}
                    className={cn(
                      'relative z-[1] inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 font-[family-name:var(--font-display)] text-[11.5px] tracking-[0.06em] uppercase transition-colors 2xl:px-3.5 2xl:text-[12px] 2xl:tracking-[0.08em]',
                      moreActive || moreOpen ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
                    )}
                  >
                    {labels.more}
                    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn('size-3.5 transition-transform duration-300', moreOpen && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div id="nav-more" className={cn('nexus-more', moreOpen && 'is-open')} hidden={!moreOpen}>
                    <ul className="grid gap-0.5">
                      {more.map(item => {
                        const current = isActive(item.href)
                        return (
                          <li key={item.key}>
                            <TransitionLink
                              href={item.href}
                              aria-current={current ? 'page' : undefined}
                              onClick={() => setMoreOpen(false)}
                              className={cn('nexus-more__link group', current && 'is-current')}
                            >
                              <span className="nexus-more__icon">
                                <StationIcon name={item.icon} className="size-[18px]" />
                              </span>
                              <span className="min-w-0">
                                <span className="block font-[family-name:var(--font-display)] text-[13px] tracking-[0.06em] uppercase">{item.label}</span>
                                {item.eyebrow && <span className="block truncate text-xs text-[var(--text-2)]">{item.eyebrow}</span>}
                              </span>
                            </TransitionLink>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </li>
              )}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 xl:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={labels.search}
              aria-haspopup="dialog"
              title={`${labels.search} (Ctrl K)`}
              className="grid size-11 place-items-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--line)] hover:text-[var(--text)]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4.2-4.2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={openExplore}
              aria-label={labels.explore}
              aria-haspopup="dialog"
              title={labels.explore}
              className="hidden size-11 place-items-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--line)] hover:text-[var(--text)] sm:grid"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
              </svg>
            </button>
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[var(--line-strong)] md:block" />
            <LocaleSwitcher label={labels.language} />
            <ThemeToggle labels={{ toDark: labels.toDark, toLight: labels.toLight }} />
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="mega-menu"
              aria-label={open ? labels.closeMenu : labels.openMenu}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full pr-2 pl-3 text-sm font-semibold hover:bg-[var(--line)] xl:hidden"
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
        items={allItems}
        socials={socials}
        activeHref={activeHref}
        labels={{ title: labels.allSections, close: labels.closeMenu, connect: labels.connect }}
      />
      <SearchDialog
        open={searchOpen}
        onClose={closeSearch}
        entries={search}
        labels={{ title: labels.search, placeholder: labels.searchPlaceholder, empty: labels.noResults, sections: labels.sections, projects: labels.projects, close: labels.closeMenu }}
      />
    </>
  )
}
