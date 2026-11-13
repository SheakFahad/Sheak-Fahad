'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { NavItem } from '@/components/layout/nav-types'
import { SocialDock, type DockItem } from '@/components/hero/SocialDock'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Magnetic } from '@/components/ui/Magnetic'
import type { HomeConfig } from '@/lib/content/types'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { nexusStore } from '@/lib/nexus/store'
import type { FeaturedProject } from '@/lib/nexus/types'
import { FeaturedProjects } from './FeaturedProjects'
import { GATE_EVENT, isGated } from './Gateway'
import { NexusCursor } from './NexusCursor'
import { StationOrbit } from './StationOrbit'

interface Props {
  config: HomeConfig
  name: string
  /** Professional title under the name. */
  title: string
  tagline: string
  roles: string[]
  text: string
  portrait: { src: string; srcSm: string; alt: string; width: number; height: number }
  dock: DockItem[]
  stations: NavItem[]
  featured: FeaturedProject[]
  cta: { workLabel: string; workHref: string | null; cvLabel: string; cvUrl: string | null; connectLabel: string; connectHref: string | null }
  labels: {
    social: string
    scroll: string
    stations: string
    globe: string
    open: string
    featured: { title: string; prev: string; next: string; concept: string; view: string }
  }
}

const INTRO_KEY = 'sf-nexus-intro'

export function NexusHero({ config, name, title, tagline, roles, text, portrait, dock, stations, featured, cta, labels }: Props) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const glass = useRef<HTMLDivElement>(null)

  // Name: last word gets the gradient ("SHEAK FAHAD" → SHEAK + FAHAD)
  const parts = name.trim().split(/\s+/)
  const last = parts.length > 1 ? parts.pop()! : ''
  const first = parts.join(' ')

  // Shared-canvas inputs (environment layers, Earth)
  useEffect(() => {
    nexusStore.env = config.environment
    return () => {
      nexusStore.env = null
      nexusStore.scroll = 0
      nexusStore.hoverStation = -1
    }
  }, [config.environment])

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const q = gsap.utils.selector(el)
      const reveal = ['[data-nx-photo]', '[data-pf-in]', '[data-nx-in]', '[data-nx-name]', '[data-nx-station]', '[data-nx-card]', '[data-nx-ai]', '.dock-link']

      if (prefersReducedMotion()) {
        nexusStore.intro = 1
        reveal.forEach(s => gsap.set(q(s), { autoAlpha: 1, clearProps: 'transform,filter' }))
        return
      }

      let seen = false
      try {
        seen = sessionStorage.getItem(INTRO_KEY) === '1'
        sessionStorage.setItem(INTRO_KEY, '1')
      } catch {}

      // While the Welcome gateway is open the intro waits; "Enter"/"Skip" starts it.
      const gated = isGated()
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: gated })
      tl.timeScale(seen && !gated ? 2.4 : 1)
      const onGate = () => tl.play()
      if (gated) window.addEventListener(GATE_EVENT, onGate, { once: true })

      // 1) Environment + Earth (WebGL reads this)
      nexusStore.intro = 0
      tl.to(nexusStore, { intro: 1, duration: 3.4, ease: 'power2.inOut' }, 0)
      // 2) Portrait composition: ambient light + glass panel settle in, then the photo is revealed
      tl.fromTo(q('[data-pf-in]'), { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 1.6, stagger: 0.12, ease: 'power3.out' }, 0.4)
      // Portrait reveal: geometric wipe (clip-path) only — the pixels are never filtered or altered
      tl.fromTo(
        q('[data-nx-photo]'),
        { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'power3.inOut', clearProps: 'clipPath' },
        1.0,
      )

      const splits: SplitText[] = []

      // 4) "SHEAK FAHAD" — character cascade with blur
      const nameEl = q('[data-nx-name]')[0] as HTMLElement | undefined
      if (nameEl) {
        gsap.set(nameEl, { autoAlpha: 1 })
        const lines = nameEl.querySelectorAll<HTMLElement>('[data-nx-name-part]')
        lines.forEach(line => {
          const s = SplitText.create(line, { type: 'chars' })
          splits.push(s)
          tl.from(s.chars, { y: 30, autoAlpha: 0, filter: 'blur(10px)', duration: 0.9, stagger: 0.035, ease: 'power3.out' }, 1.25)
          tl.call(() => s.revert(), [], '>')
        })
      }

      // 5) Identity copy, CTAs, dock
      tl.fromTo(q('[data-nx-in]'), { y: 24, autoAlpha: 0, filter: 'blur(6px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1, stagger: 0.08 }, 1.1)
      tl.fromTo(q('.dock-link'), { y: 18, scale: 0.6, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'back.out(1.8)' }, 2.1)

      // 6) Stations activate around the Earth (clockwise from the top)
      tl.fromTo(q('[data-nx-station]'), { scale: 0.4, autoAlpha: 0, transformOrigin: '0% 0%' }, { scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'back.out(1.5)' }, 1.9)

      // 7) Featured projects + assistant
      tl.fromTo(q('[data-nx-card]'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, 2.4)
      tl.fromTo(q('[data-nx-ai]'), { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1 }, 2.9)
      tl.call(() => reveal.forEach(s => gsap.set(q(s), { clearProps: 'filter' })))

      const mm = gsap.matchMedia()

      // Pointer depth: layers drift at different depths (fine pointers only)
      // Interactive parallax portrait (mouse/pen only — never on touch, never with reduced motion).
      // Every layer eases toward its target (quickTo = damped), so nothing tracks the cursor directly.
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const layers = (q('[data-depth]') as HTMLElement[]).map(n => ({
          x: gsap.quickTo(n, 'x', { duration: 1.4, ease: 'power3' }),
          y: gsap.quickTo(n, 'y', { duration: 1.4, ease: 'power3' }),
          d: Number(n.dataset.depth) || 0,
        }))
        // Portrait: calm, small turn toward the visitor — max 1.5° yaw / 1° pitch, a few px of drift.
        // A rigid 3D rotation of the whole photo (no warping, no per-pixel change).
        const photo = stage.current
        let tilt: { ry: (v: number) => void; rx: (v: number) => void; x: (v: number) => void } | null = null
        if (photo) {
          gsap.set(photo, { transformPerspective: 1400, transformOrigin: '50% 60%' })
          tilt = {
            ry: gsap.quickTo(photo, 'rotationY', { duration: 1.8, ease: 'power3' }),
            rx: gsap.quickTo(photo, 'rotationX', { duration: 1.8, ease: 'power3' }),
            x: gsap.quickTo(photo, 'x', { duration: 1.8, ease: 'power3' }),
          }
        }
        // Glass panel sits deeper: drifts the opposite way with a slight turn
        const g = glass.current
        if (g) gsap.set(g, { transformPerspective: 1400 })
        const panel = g
          ? {
              x: gsap.quickTo(g, 'x', { duration: 2.2, ease: 'power3' }),
              y: gsap.quickTo(g, 'y', { duration: 2.2, ease: 'power3' }),
              ry: gsap.quickTo(g, 'rotationY', { duration: 2.2, ease: 'power3' }),
            }
          : null
        const apply = (nx: number, ny: number) => {
          layers.forEach(l => {
            l.x(-nx * l.d)
            l.y(-ny * l.d)
          })
          tilt?.ry(nx * 1.5)
          tilt?.rx(-ny * 1)
          tilt?.x(nx * 4)
          panel?.x(-nx * 10)
          panel?.y(-ny * 6)
          panel?.ry(-nx * 1.2)
        }
        const onMove = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return
          apply((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
        }
        const onLeave = () => apply(0, 0)
        window.addEventListener('pointermove', onMove, { passive: true })
        document.documentElement.addEventListener('pointerleave', onLeave)
        return () => {
          window.removeEventListener('pointermove', onMove)
          document.documentElement.removeEventListener('pointerleave', onLeave)
          if (photo) gsap.set(photo, { clearProps: 'transform' })
          if (g) gsap.set(g, { clearProps: 'transform' })
        }
      })

      // Scroll: the hero recedes while the camera pushes into the universe
      mm.add('(min-width: 1280px)', () => {
        const st = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            onUpdate: self => (nexusStore.scroll = self.progress),
          },
        })
        st.to(q('[data-nx-left]'), { yPercent: -18, autoAlpha: 0.15, ease: 'none' }, 0)
        st.to(q('[data-nx-orbit-wrap]'), { scale: 0.86, yPercent: -10, autoAlpha: 0.2, ease: 'none' }, 0)
        st.to(q('[data-nx-bottom]'), { yPercent: 30, autoAlpha: 0, ease: 'none' }, 0)
      })
      mm.add('(max-width: 1279px)', () => {
        const st = ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top', onUpdate: self => (nexusStore.scroll = self.progress) })
        return () => st.kill()
      })

      return () => {
        window.removeEventListener(GATE_EVENT, onGate)
        mm.revert()
        splits.forEach(s => s.revert())
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="nexus" aria-labelledby="nx-heading" className="nexus relative overflow-x-clip pt-24 pb-8 md:pt-28 xl:pt-[96px]">
      <NexusCursor />
      <div className="nx-container">
        <div className="nx-grid">
          {/* ── LEFT: identity ─────────────────────── */}
          <div data-nx-left data-depth="6" className="nx-head relative z-10">
            <p data-nx-in className="nx-welcome">
              <span aria-hidden="true" className="text-[var(--cyan)]">
                {'///'}
              </span>
              {tagline}
            </p>
            <h1 id="nx-heading" data-nx-name className="nx-name mt-4" aria-label={name}>
              <span data-nx-name-part aria-hidden="true" className="block">
                {first}
              </span>
              {last && (
                <span aria-hidden="true" className="block">
                  <span data-nx-name-part className="nx-name__last">
                    {last}
                  </span>
                  <span className="nx-caret" />
                </span>
              )}
            </h1>
            <p data-nx-in className="nx-headline mt-4">
              {title}
            </p>
            {roles.length > 0 && (
              <ul data-nx-in className="nx-roleline" aria-label={title}>
                {roles.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <p data-nx-in className="nx-lede">
              {text}
            </p>
          </div>

          <div data-nx-left data-depth="3" className="nx-body relative z-10">

            <div data-nx-in className="nx-ctas">
              {cta.workHref && (
                <Magnetic>
                  <TransitionLink href={cta.workHref} className="nx-cta nx-cta--primary">
                    <span>{cta.workLabel}</span>
                    <span aria-hidden="true" className="nx-cta__arrow">
                      →
                    </span>
                  </TransitionLink>
                </Magnetic>
              )}
              {cta.cvUrl && (
                <Magnetic>
                  <a href={cta.cvUrl} download className="nx-cta nx-cta--glass">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                    </svg>
                    <span>{cta.cvLabel}</span>
                  </a>
                </Magnetic>
              )}
              {cta.connectHref && (
                <Magnetic>
                  <TransitionLink href={cta.connectHref} className="nx-cta nx-cta--ghost">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 3.5 10 14M21 3.5 14.5 21 10 14l-6.5-4.5L21 3.5Z" />
                    </svg>
                    <span>{cta.connectLabel}</span>
                  </TransitionLink>
                </Magnetic>
              )}
            </div>

            <div data-nx-in className="mt-6">
              <SocialDock items={dock} label={labels.social} />
            </div>
          </div>

          {/* ── CENTER: holographic glass portrait (CSS only — works with or without WebGL) ── */}
          <div className="nx-center relative">
            <div className="pf" style={{ '--pf-mask': `url(${portrait.srcSm || portrait.src})` } as React.CSSProperties}>
              {/* slow blue / purple ambient light */}
              <div data-pf-in aria-hidden="true" className="pf-ambient" />
              {/* one transparent glass panel behind the portrait */}
              <div ref={glass} data-pf-in aria-hidden="true" className="pf-glass">
                <span className="pf-glass__scan" />
                <span className="pf-glass__tick pf-glass__tick--tl" />
                <span className="pf-glass__tick pf-glass__tick--br" />
              </div>
              {/* a few drifting particles — outside the face area */}
              <div aria-hidden="true" className="pf-particles">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
            <div ref={stage} data-hero-stage className="nx-stage relative" style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}>
              {/* soft rim light: the cutout's alpha as a mask behind the photo (the photo itself is untouched) */}
              <span data-pf-in aria-hidden="true" className="pf-rim" />
              {/* THE PHOTO — the original cutout as a native <img>: full resolution, aspect preserved, no filters */}
              <Image
                data-nx-photo
                src={portrait.src}
                alt={portrait.alt}
                width={portrait.width}
                height={portrait.height}
                priority
                unoptimized
                draggable={false}
                className="nx-photo"
              />
            </div>
              {/* natural contact shadow */}
              <span aria-hidden="true" className="pf-shadow" />
            </div>
          </div>

          {/* ── RIGHT: Earth + stations ─────────────── */}
          {stations.length > 0 && (
            <div data-nx-orbit-wrap className="nx-right relative hidden xl:block">
              <StationOrbit stations={stations} showGlobe={config.show_globe} labels={{ stations: labels.stations, globe: labels.globe, open: labels.open }} />
            </div>
          )}
        </div>

        {/* ── BOTTOM: featured projects + assistant ─ */}
        <div data-nx-bottom className="nx-bottom">
          {featured.length > 0 && <FeaturedProjects projects={featured} labels={labels.featured} />}
        </div>

        <a href="#explore" className="nx-scroll" data-nx-in>
          <span>{labels.scroll}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="nx-scroll__chev" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 6 6 6 6-6M6 12l6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  )
}
