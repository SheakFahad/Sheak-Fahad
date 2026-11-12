'use client'

import { useEffect, useRef } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { StationIcon } from '@/components/nexus/StationIcon'
import { SocialIcons } from '@/components/shared/SocialIcons'
import { gsap } from '@/lib/gsap'
import { lockScroll } from '@/lib/motion/lenis'
import { motion, prefersReducedMotion } from '@/lib/motion/presets'
import { cn } from '@/lib/utils/cn'
import type { NavItem, SocialItem } from './nav-types'

interface Props {
  id: string
  open: boolean
  onClose: () => void
  items: NavItem[]
  socials: SocialItem[]
  activeHref: string
  labels: { title: string; close: string; connect: string }
}

/** Fullscreen navigation overlay. Focus is trapped while open; Esc closes; focus returns to the trigger. */
export function MegaMenu({ id, open, onClose, items, socials, activeHref, labels }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = panel.current
    if (!el) return
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement
      lockScroll(true)
      el.hidden = false
      const links = el.querySelectorAll('[data-menu-item]')
      if (!prefersReducedMotion()) {
        gsap.fromTo(el, { clipPath: 'circle(0% at 95% 4%)' }, { clipPath: 'circle(150% at 95% 4%)', duration: motion.menu.duration, ease: 'expo.inOut' })
        gsap.fromTo(links, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: motion.menu.duration, ease: motion.menu.ease, stagger: motion.menu.stagger, delay: 0.25 })
      }
      el.querySelector<HTMLElement>('a,button')?.focus()
    } else if (!el.hidden) {
      lockScroll(false)
      const done = () => {
        el.hidden = true
        lastFocus.current?.focus()
      }
      if (prefersReducedMotion()) done()
      else gsap.to(el, { clipPath: 'circle(0% at 95% 4%)', duration: 0.6, ease: 'expo.inOut', onComplete: done })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !panel.current) return
      const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')
      const first = f[0]
      const last = f[f.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      ref={panel}
      id={id}
      hidden
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      data-lenis-prevent
      className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--bg)]/95 backdrop-blur-xl"
    >
      <div aria-hidden="true" className="cosmos !absolute" />
      <div className="container-x flex min-h-full flex-col pt-28 pb-10">
        <nav aria-label={labels.title} className="flex-1">
          <ol className="grid gap-x-10 md:grid-cols-2 xl:grid-cols-3">
            {items.map(item => {
              const active = activeHref === item.href
              return (
                <li key={item.key} className="overflow-hidden border-b border-[var(--line)]">
                  <TransitionLink
                    href={item.href}
                    onClick={onClose}
                    data-menu-item
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-baseline gap-4 py-4 md:py-5',
                      active ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
                    )}
                  >
                    <span className="font-mono text-xs text-[var(--cyan)]">{String(item.index).padStart(2, '0')}</span>
                    <StationIcon name={item.icon} className="size-5 shrink-0 self-center text-[var(--cyan)]" />
                    <span className="font-[family-name:var(--font-display)] text-2xl transition-transform duration-300 group-hover:translate-x-2 md:text-3xl">
                      {item.label}
                    </span>
                    {(item.station ?? item.eyebrow) && <span className="ml-auto hidden font-mono text-xs uppercase tracking-widest sm:inline">{item.station ?? item.eyebrow}</span>}
                  </TransitionLink>
                </li>
              )
            })}
          </ol>
        </nav>
        {socials.length > 0 && (
          <div className="mt-10">
            <p className="eyebrow mb-3">{labels.connect}</p>
            <SocialIcons items={socials} label={labels.connect} />
          </div>
        )}
      </div>
    </div>
  )
}
