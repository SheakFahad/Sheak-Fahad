'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { NavItem } from '@/components/layout/nav-types'
import { SocialDock, type DockItem } from '@/components/hero/SocialDock'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Magnetic } from '@/components/ui/Magnetic'
import type { HomeConfig } from '@/lib/content/types'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { heroStore } from '@/lib/hero/store'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { nexusStore } from '@/lib/nexus/store'
import type { AssistantEntry, FeaturedProject } from '@/lib/nexus/types'
import { FeaturedProjects } from './FeaturedProjects'
import { GATE_EVENT, isGated } from './Gateway'
import { NexusAssistant } from './NexusAssistant'
import { NexusCursor } from './NexusCursor'
import { StationOrbit } from './StationOrbit'

interface Props {
  config: HomeConfig
  name: string
  primaryRoles: string[]
  extraRoles: string[]
  text: string
  portrait: { src: string; srcSm: string; alt: string; width: number; height: number }
  dock: DockItem[]
  stations: NavItem[]
  featured: FeaturedProject[]
  assistant: AssistantEntry[] | null
  cta: { exploreLabel: string; exploreHref: string; projectsLabel: string; projectsHref: string | null; cvLabel: string; cvUrl: string | null }
  labels: {
    social: string
    scroll: string
    stations: string
    globe: string
    open: string
    featured: { title: string; prev: string; next: string; concept: string; view: string }
    ai: React.ComponentProps<typeof NexusAssistant>['labels']
  }
}

const INTRO_KEY = 'sf-nexus-intro'

export function NexusHero({ config, name, primaryRoles, extraRoles, text, portrait, dock, stations, featured, assistant, cta, labels }: Props) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const platform = useRef<HTMLDivElement>(null)

  // Name: last word gets the gradient ("SHEAK FAHAD" → SHEAK + FAHAD)
  const parts = name.trim().split(/\s+/)
  const last = parts.length > 1 ? parts.pop()! : ''
  const first = parts.join(' ')

  // WebGL anchors
  useEffect(() => {
    heroStore.stage = stage.current
    nexusStore.platform = platform.current
    nexusStore.env = config.environment
    return () => {
      heroStore.stage = null
      nexusStore.platform = null
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
      const reveal = ['[data-nx-photo]', '[data-nx-in]', '[data-nx-title]', '[data-nx-name]', '[data-nx-station]', '[data-nx-card]', '[data-nx-ai]', '.dock-link']

      if (prefersReducedMotion()) {
        heroStore.intro = 1
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

      // 1) Environment + Earth, 2) portrait portal (WebGL reads these)
      heroStore.intro = 0
      nexusStore.intro = 0
      tl.to(nexusStore, { intro: 1, duration: 3.4, ease: 'power2.inOut' }, 0)
      tl.to(heroStore, { intro: 1, duration: 3.2, ease: 'power2.inOut' }, 0.35)
      // Portrait reveal: geometric wipe (clip-path) only — the pixels are never filtered or altered
      tl.fromTo(
        q('[data-nx-photo]'),
        { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'power3.inOut', clearProps: 'clipPath' },
        1.0,
      )

      // 3) Typography — NEXUS: masked chars rise in depth, then the orbit swoosh draws
      const splits: SplitText[] = []
      const title = q('[data-nx-title]')[0] as HTMLElement | undefined
      if (title) {
        const word = title.querySelector<HTMLElement>('[data-nx-word]')
        gsap.set(title, { autoAlpha: 1 })
        if (word) {
          const s = SplitText.create(word, { type: 'chars', mask: 'chars' })
          splits.push(s)
          tl.from(s.chars, { yPercent: 120, rotationX: -80, transformOrigin: '50% 100%', duration: 1.3, stagger: 0.06 }, 0.5)
          tl.call(() => s.revert(), [], '>+0.02')
        }
        const swoosh = title.querySelector('[data-nx-swoosh]')
        if (swoosh) tl.fromTo(swoosh, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power3.inOut' }, 0.9)
      }

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
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const layers = (q('[data-depth]') as HTMLElement[]).map(n => ({
          x: gsap.quickTo(n, 'x', { duration: 1.2, ease: 'power3' }),
          y: gsap.quickTo(n, 'y', { duration: 1.2, ease: 'power3' }),
          d: Number(n.dataset.depth) || 0,
        }))
        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1
          const ny = (e.clientY / window.innerHeight) * 2 - 1
          layers.forEach(l => {
            l.x(-nx * l.d)
            l.y(-ny * l.d)
          })
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
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
            <div>
              <p data-nx-in className="nx-welcome">
                <span aria-hidden="true" className="text-[var(--cyan)]">
                  {'///'}
                </span>
                {config.welcome_label}
              </p>
              <h1 id="nx-heading" className="mt-3">
                <span data-nx-title className="nx-title">
                  <span data-nx-word className="nx-title__word">
                    {config.title}
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 400 120" className="nx-title__swoosh" fill="none">
                    <defs>
                      <linearGradient id="nx-swoosh" x1="0" x2="1">
                        <stop offset="0" stopColor="#51e5ff" stopOpacity="0" />
                        <stop offset="0.45" stopColor="#a678ff" />
                        <stop offset="1" stopColor="#ff5cf0" />
                      </linearGradient>
                    </defs>
                    <path data-nx-swoosh pathLength={1} strokeDasharray="1" d="M8 96C80 118 250 112 340 70c40-19 56-40 44-52-14-14-64-6-112 14" stroke="url(#nx-swoosh)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                <span data-nx-in className="nx-subtitle">
                  {config.subtitle}
                </span>
              </h1>
            </div>
          </div>

          <div data-nx-left data-depth="3" className="nx-body relative z-10">
            <div>
              <p data-nx-in className="font-[family-name:var(--font-display)] text-[clamp(1rem,1.5vw,1.35rem)] font-semibold tracking-[0.06em] uppercase">
                {config.intro_prefix}
              </p>
              <p data-nx-name className="nx-name" aria-label={name}>
                <span data-nx-name-part aria-hidden="true">
                  {first}
                </span>{' '}
                {last && (
                  <span data-nx-name-part aria-hidden="true" className="nx-name__last">
                    {last}
                  </span>
                )}
                <span aria-hidden="true" className="nx-caret" />
              </p>
              <p data-nx-in className="nx-roles mt-3 flex flex-wrap gap-x-2 text-[15px] text-[var(--text)]/90">
                {primaryRoles.map((r, i) => (
                  <span key={r} className="whitespace-nowrap">
                    {i > 0 && (
                      <span aria-hidden="true" className="mr-2 text-[var(--cyan)]">
                        ·
                      </span>
                    )}
                    {r}
                  </span>
                ))}
              </p>
              {extraRoles.length > 0 && (
                <p data-nx-in className="nx-pill mt-3">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 text-[#ff5cf0]" fill="currentColor">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 6.5 6 3.5-6 3.5v-7Z" />
                  </svg>
                  {extraRoles.join(' · ')}
                </p>
              )}
              <p data-nx-in className="mt-5 max-w-[30rem] text-[15px] leading-relaxed text-[var(--text-2)] md:text-base">
                {text}
              </p>

              <div data-nx-in className="mt-6 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <a href={cta.exploreHref} className="nx-cta nx-cta--primary">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 15c-1.5 1.3-2 3.5-2 6 2.5 0 4.7-.5 6-2m-1-4 4 4m-2.5-6.5L15 7c2-2 4.5-3 6-3 0 1.5-1 4-3 6l-5.5 5.5m-4-4L5 11l3-3h4m1 9-.5 3 3-3v-4" />
                    </svg>
                    <span>{cta.exploreLabel}</span>
                    <span aria-hidden="true" className="nx-cta__arrow">
                      →
                    </span>
                  </a>
                </Magnetic>
                {cta.projectsHref && (
                  <Magnetic>
                    <TransitionLink href={cta.projectsHref} className="nx-cta nx-cta--glass">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="9" />
                        <path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z" fill="currentColor" />
                      </svg>
                      <span>{cta.projectsLabel}</span>
                    </TransitionLink>
                  </Magnetic>
                )}
                {cta.cvUrl && (
                  <Magnetic>
                    <a href={cta.cvUrl} download className="nx-cta nx-cta--ghost">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                      </svg>
                      <span>{cta.cvLabel}</span>
                    </a>
                  </Magnetic>
                )}
              </div>

              <div data-nx-in className="mt-6">
                <SocialDock items={dock} label={labels.social} />
              </div>
            </div>
          </div>

          {/* ── CENTER: portrait (WebGL locks to the stage; DOM fallback without WebGL) ── */}
          <div className="nx-center relative">
            <div ref={stage} data-hero-stage className="nx-stage relative" style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}>
              {/* CSS portal only when WebGL is not drawing the holographic structure */}
              <div data-hero-fallback aria-hidden="true" className="absolute inset-0 transition-opacity duration-700">
                <div className="hero-css-portal" />
              </div>
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
            <div ref={platform} data-nx-platform aria-hidden="true" className="nx-platform">
              <span className="nx-platform__fallback" />
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
          {assistant && <NexusAssistant kb={assistant} labels={labels.ai} />}
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
