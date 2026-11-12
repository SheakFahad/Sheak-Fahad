'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { StationIcon } from '@/components/nexus/StationIcon'
import { StationOrbit } from '@/components/nexus/StationOrbit'
import { usePathname } from '@/i18n/navigation'
import { gsap } from '@/lib/gsap'
import { lockScroll } from '@/lib/motion/lenis'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { cn } from '@/lib/utils/cn'
import type { NavItem } from './nav-types'

export const EXPLORE_EVENT = 'nexus:explore'
export const openExplore = () => window.dispatchEvent(new Event(EXPLORE_EVENT))

interface Labels {
  prev: string
  next: string
  explore: string
  exploreTitle: string
  exploreHint: string
  quickNav: string
  close: string
  current: string
  stations: string
  globe: string
  open: string
}

/**
 * Global station navigation:
 * - Explore Mode: fullscreen station map (orbit on desktop, list on mobile), opened from the header,
 *   the pager or any `openExplore()` call. Focus is trapped; Esc closes; arrow keys move between stations.
 * - Quick Navigation: compact icon rail on inner pages (wide screens).
 * - Station pager: previous / next station at the end of every station page.
 */
export function StationNavigator({ home, items, labels }: { home: NavItem | null; items: NavItem[]; labels: Labels }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  const index = items.findIndex(i => i.href !== '/' && (pathname === i.href || pathname.startsWith(`${i.href}/`)))
  const current = index >= 0 ? items[index]! : null
  const prev = index > 0 ? items[index - 1]! : home
  const next = index >= 0 && index < items.length - 1 ? items[index + 1]! : home
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(EXPLORE_EVENT, onOpen)
    return () => window.removeEventListener(EXPLORE_EVENT, onOpen)
  }, [])

  // Close when the route changes
  useEffect(() => {
    setOpen(false) // eslint-disable-line react-hooks/set-state-in-effect -- navigation side effect
  }, [pathname])

  useEffect(() => {
    const el = panel.current
    if (!open || !el) return
    lastFocus.current = document.activeElement as HTMLElement
    lockScroll(true)
    if (!prefersReducedMotion()) {
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' })
      gsap.fromTo(el.querySelectorAll('[data-nx-station], [data-explore-item]'), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7, stagger: 0.04, ease: 'back.out(1.6)', delay: 0.1 })
    }
    el.querySelector<HTMLElement>('[data-explore-close]')?.focus()

    const links = () => [...el.querySelectorAll<HTMLElement>('a[href]:not([data-explore-skip]),button:not([disabled])')].filter(n => n.offsetParent !== null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      const f = links()
      const i = f.indexOf(document.activeElement as HTMLElement)
      if (e.key === 'Tab' && f.length) {
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          f[f.length - 1]!.focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          f[0]!.focus()
        }
      }
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) && f.length) {
        e.preventDefault()
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
        f[(i + d + f.length) % f.length]!.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lockScroll(false)
      lastFocus.current?.focus?.()
    }
  }, [open])

  const all = home ? [home, ...items] : items

  return (
    <>
      {/* Quick navigation rail (inner pages, wide screens) */}
      {current && (
        <nav aria-label={labels.quickNav} className="quick-rail">
          <ul>
            {all.map(i => {
              const here = i.key === current.key
              return (
                <li key={i.key}>
                  <TransitionLink href={i.href} aria-current={here ? 'page' : undefined} className={cn('quick-rail__link', here && 'is-here')}>
                    <StationIcon name={i.icon} className="size-[17px]" />
                    <span className="quick-rail__tip">{i.label}</span>
                  </TransitionLink>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      {/* Station pager */}
      {current && (
        <nav aria-label={labels.quickNav} className="container-x pb-6">
          <div className="station-pager">
            {prev ? (
              <TransitionLink href={prev.href} className="station-pager__link" rel="prev">
                <span className="station-pager__dir">← {labels.prev}</span>
                <span className="station-pager__name">
                  <StationIcon name={prev.icon} className="size-5 text-[var(--cyan)]" />
                  {prev.label}
                </span>
              </TransitionLink>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => setOpen(true)} className="station-pager__explore" aria-haspopup="dialog">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="9" />
                <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
              </svg>
              {labels.explore}
            </button>
            {next ? (
              <TransitionLink href={next.href} className="station-pager__link is-next" rel="next">
                <span className="station-pager__dir">
                  {labels.next} →
                </span>
                <span className="station-pager__name">
                  {next.label}
                  <StationIcon name={next.icon} className="size-5 text-[var(--cyan)]" />
                </span>
              </TransitionLink>
            ) : (
              <span />
            )}
          </div>
        </nav>
      )}

      {/* Explore mode */}
      {open && (
        <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="explore-title" className="explore-mode" data-lenis-prevent>
          <div aria-hidden="true" className="cosmos !absolute" />
          <div className="relative mx-auto flex min-h-full max-w-[1200px] flex-col px-4 pt-6 pb-10 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{labels.explore}</p>
                <h2 id="explore-title" className="mt-2 text-3xl md:text-5xl">
                  {labels.exploreTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[var(--text-2)]">{labels.exploreHint}</p>
              </div>
              <button type="button" data-explore-close onClick={close} aria-label={labels.close} className="grid size-12 shrink-0 place-items-center rounded-full text-2xl ring-1 ring-[var(--line-strong)] hover:bg-[var(--line)]">
                ×
              </button>
            </div>

            {/* Desktop: orbit map around the NEXUS core */}
            <div className="relative mx-auto mt-6 hidden w-full max-w-[min(760px,calc(100dvh-180px))] lg:block">
              <div className="explore-core" aria-hidden="true">
                <span>SF</span>
              </div>
              <StationOrbit stations={items} showGlobe={false} labels={{ stations: labels.stations, globe: labels.globe, open: labels.open }} />
            </div>

            {/* Mobile / tablet: list */}
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:hidden">
              {all.map(i => {
                const here = current?.key === i.key || (!current && i.href === '/' && pathname === '/')
                return (
                  <li key={i.key} data-explore-item>
                    <TransitionLink href={i.href} onClick={close} aria-current={here ? 'page' : undefined} className={cn('explore-item', here && 'is-here')}>
                      <span className="nexus-more__icon">
                        <StationIcon name={i.icon} className="size-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-[family-name:var(--font-display)] text-sm tracking-[0.06em] uppercase">{i.label}</span>
                        {i.eyebrow && <span className="block text-xs text-[var(--text-2)]">{here ? labels.current : i.eyebrow}</span>}
                      </span>
                    </TransitionLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
