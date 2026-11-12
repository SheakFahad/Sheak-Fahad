'use client'

import { useEffect, useRef } from 'react'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { SFMark } from '@/components/layout/SFMark'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { gsap } from '@/lib/gsap'
import { lockScroll } from '@/lib/motion/lenis'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { GATEWAY_STORAGE_KEY } from '@/lib/site/theme'
import { StationIcon } from './StationIcon'
import type { StationIconKey } from '@/lib/content/types'

export const GATE_EVENT = 'nexus:gate-open'
/** True while the Welcome gateway is covering the homepage (flag set by the head boot script). */
export const isGated = () => typeof document !== 'undefined' && document.documentElement.dataset.gate === '1'

interface Props {
  name: string
  links: { href: string; label: string; icon: StationIconKey }[]
  labels: { label: string; hello: string; welcome: string; roles: string; enter: string; skip: string; quick: string; language: string }
}

/**
 * Optional Welcome / Entry experience (first visit per browser). "Enter" plays a warp into the NEXUS,
 * "Skip" goes straight to the site; both remember the choice. Rendered in the HTML but only displayed
 * when <html data-gate="1"> (so there is no flash and no-JS visitors never see it).
 */
export function Gateway({ name, links, labels }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !isGated()) return
    lockScroll(true)
    el.querySelector<HTMLElement>('[data-gate-enter]')?.focus({ preventScroll: true })
    if (!prefersReducedMotion()) {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(el.querySelectorAll('.gate-ring'), { scale: 0.6, autoAlpha: 0, duration: 1.6, stagger: 0.12 }, 0)
      tl.from(el.querySelectorAll('[data-gate-in]'), { y: 30, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1, stagger: 0.08, clearProps: 'filter' }, 0.4)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave(false)
      if (e.key !== 'Tab') return
      const f = [...el.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')]
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
    return () => {
      document.removeEventListener('keydown', onKey)
      lockScroll(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = () => {
    try {
      localStorage.setItem(GATEWAY_STORAGE_KEY, '1')
    } catch {}
    delete document.documentElement.dataset.gate
    lockScroll(false)
    window.dispatchEvent(new Event(GATE_EVENT))
  }

  function leave(warp: boolean) {
    const el = root.current
    if (!el) return finish()
    if (!warp || prefersReducedMotion()) {
      finish()
      return
    }
    // Warp: rings rush outward, content dissolves, then the NEXUS intro begins
    gsap
      .timeline({ onComplete: finish })
      .to(el.querySelectorAll('[data-gate-in]'), { autoAlpha: 0, y: -20, duration: 0.45, stagger: 0.03, ease: 'power2.in' }, 0)
      .to(el.querySelectorAll('.gate-ring'), { scale: 3.2, autoAlpha: 0, duration: 1.1, stagger: 0.05, ease: 'power3.in' }, 0.1)
      .to(el, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, 0.8)
  }

  return (
    <div ref={root} className="gateway" role="dialog" aria-modal="true" aria-label={labels.label}>
      <div aria-hidden="true" className="gateway__bg" />
      <header className="relative z-10 flex items-center justify-between gap-4 p-4 md:p-8">
        <span className="flex items-center gap-3">
          <SFMark className="size-11" />
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-[0.12em] uppercase">{name}</span>
        </span>
        <LocaleSwitcher label={labels.language} />
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10">
        <div aria-hidden="true" className="gate-rings">
          <span className="gate-ring gate-ring--1" />
          <span className="gate-ring gate-ring--2" />
          <span className="gate-ring gate-ring--3" />
        </div>
        <div className="relative text-center">
          <SFMark className="mx-auto size-16 md:size-20" />
          <h2 data-gate-in className="gateway__title mt-5">
            {labels.hello}
          </h2>
          <p data-gate-in className="mt-4 font-[family-name:var(--font-display)] text-lg md:text-2xl">
            {labels.welcome}
          </p>
          <p data-gate-in className="mt-3 font-mono text-[11px] tracking-[0.3em] text-[var(--cyan)] uppercase md:text-sm">
            {labels.roles}
          </p>
          <div data-gate-in className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" data-gate-enter onClick={() => leave(true)} className="nx-cta nx-cta--primary">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M7 4.5v15l12-7.5-12-7.5Z" />
              </svg>
              <span>{labels.enter}</span>
              <span aria-hidden="true" className="nx-cta__arrow">
                →
              </span>
            </button>
            <button type="button" onClick={() => leave(false)} className="nx-cta nx-cta--glass">
              <span aria-hidden="true">»</span>
              <span>{labels.skip}</span>
            </button>
          </div>
          {links.length > 0 && (
            <nav data-gate-in aria-label={labels.quick} className="mt-8">
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                {links.map(l => (
                  <li key={l.href}>
                    <TransitionLink href={l.href} onClick={finish} className="inline-flex min-h-11 items-center gap-2 text-[var(--text-2)] hover:text-[var(--text)]">
                      <StationIcon name={l.icon} className="size-5 text-[var(--cyan)]" />
                      {l.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
