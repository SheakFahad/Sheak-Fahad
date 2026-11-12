'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Magnetic } from '@/components/ui/Magnetic'
import type { HeroSkill } from '@/lib/content/types'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import { heroStore } from '@/lib/hero/store'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { cn } from '@/lib/utils/cn'
import { SkillGlyph } from './SkillGlyph'
import { SocialDock, type DockItem } from './SocialDock'

interface Props {
  name: string
  primaryRoles: string[]
  extraRoles: string[]
  tagline: string
  text: string
  portrait: { src: string; srcSm: string; alt: string; width: number; height: number }
  skills: HeroSkill[]
  dock: DockItem[]
  cta: { exploreLabel: string; projectsLabel: string; projectsHref: string | null; cvLabel: string; cvUrl: string | null }
  labels: { skills: string; social: string; scroll: string; close: string }
}

// Orbit slots around the portrait (percent of the stage box). Left column / right column.
const SLOTS = [
  { side: 'left', x: -6, y: 12 },
  { side: 'left', x: -14, y: 46 },
  { side: 'left', x: -4, y: 80 },
  { side: 'right', x: -2, y: 8 },
  { side: 'right', x: -6, y: 57 },
  { side: 'right', x: 0, y: 84 },
] as const

const INTRO_KEY = 'sf-hero-intro'

export function HeroExperience({ name, primaryRoles, extraRoles, tagline, text, portrait, skills, dock, cta, labels }: Props) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)

  // Register the stage for the WebGL portal
  useEffect(() => {
    heroStore.stage = stage.current
    return () => {
      heroStore.stage = null
      heroStore.activeSkill = -1
      heroStore.hoverSkill = -1
    }
  }, [])

  useEffect(() => {
    heroStore.activeSkill = active
  }, [active])

  // Close the pinned skill on Escape / outside click
  useEffect(() => {
    if (active < 0) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(-1)
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-skill-node]')) setActive(-1)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [active])

  // ── Cinematic intro + pointer depth ────────────────────────────────────────
  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const q = gsap.utils.selector(el)
      const reduced = prefersReducedMotion()
      let seen = false
      try {
        seen = sessionStorage.getItem(INTRO_KEY) === '1'
        sessionStorage.setItem(INTRO_KEY, '1')
      } catch {}

      const show = (sel: string) => gsap.set(q(sel), { autoAlpha: 1, clearProps: 'transform,filter' })
      if (reduced) {
        heroStore.intro = 1
        ;['[data-hero-in]', '[data-hero-name]', '[data-skill-node]'].forEach(show)
        return
      }

      const speed = seen ? 2.6 : 1 // repeat visits play faster
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.timeScale(speed)

      // 1) environment + 2) portrait (WebGL reads heroStore.intro)
      heroStore.intro = 0
      tl.to(heroStore, { intro: 1, duration: 3.2, ease: 'power2.inOut' }, 0)

      // 3) name: masked character rise with depth
      let split: SplitText | null = null
      const nameEl = q('[data-hero-name]')[0] as HTMLElement | undefined
      if (nameEl) {
        nameEl.classList.add('is-splitting')
        split = SplitText.create(nameEl, { type: 'words,chars', mask: 'chars', charsClass: 'hero-char' })
        gsap.set(nameEl, { autoAlpha: 1, animation: 'none' })
        tl.from(split.chars, { yPercent: 115, rotationX: -70, transformOrigin: '50% 100%', duration: 1.25, stagger: 0.045 }, 0.9)
        tl.call(
          () => {
            split?.revert() // restore real text (gradient + selection + a11y)
            nameEl.classList.remove('is-splitting')
          },
          [],
          '>+0.05',
        )
      }

      // 4) identity + copy
      tl.fromTo(q('[data-hero-in]'), { y: 26, autoAlpha: 0, filter: 'blur(8px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1, stagger: 0.09 }, 1.5)
      // 5) skill stations pop in around the portal
      tl.fromTo(q('[data-skill-node]'), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: 'back.out(1.6)' }, 2.1)

      // Pointer depth (fine pointers only)
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const nodes = q('[data-skill-node]') as HTMLElement[]
        const tos = nodes.map((n, i) => {
          const depth = 10 + (i % 3) * 7
          return {
            x: gsap.quickTo(n, 'x', { duration: 1.1, ease: 'power3' }),
            y: gsap.quickTo(n, 'y', { duration: 1.1, ease: 'power3' }),
            depth,
          }
        })
        const title = nameEl ? { rx: gsap.quickTo(nameEl, 'rotationX', { duration: 1.2, ease: 'power3' }), ry: gsap.quickTo(nameEl, 'rotationY', { duration: 1.2, ease: 'power3' }) } : null
        if (nameEl) gsap.set(nameEl, { transformPerspective: 900 })
        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1
          const ny = (e.clientY / window.innerHeight) * 2 - 1
          tos.forEach(t => {
            t.x(-nx * t.depth)
            t.y(-ny * t.depth)
          })
          title?.rx(-ny * 4)
          title?.ry(nx * 6)
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
      })

      return () => {
        mm.revert()
        split?.revert()
        nameEl?.classList.remove('is-splitting')
      }
    },
    { scope: root },
  )

  const onHover = useCallback((i: number) => {
    heroStore.hoverSkill = i
  }, [])

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-dvh items-center overflow-x-clip pt-28 pb-24 lg:pt-24"
    >
      <div className="container-x grid w-full grid-cols-1 items-center gap-x-10 gap-y-8 [grid-template-areas:'head'_'stage'_'body'_'skills'] lg:grid-cols-[1.05fr_1fr] lg:[grid-template-areas:'head_stage'_'body_stage']">
        {/* ── Identity ───────────────────────────── */}
        <div className="relative z-10 [grid-area:head]">
          <p data-hero-in className="eyebrow flex flex-wrap gap-x-3 gap-y-1">
            {primaryRoles.map((r, i) => (
              <span key={r} className="whitespace-nowrap">
                {i > 0 && <span aria-hidden="true" className="mr-3 text-[var(--violet)]">·</span>}
                {r}
              </span>
            ))}
          </p>
          <h1 id="hero-title" className="hero-name mt-5" data-hero-name>
            {name}
          </h1>
        </div>

        {/* ── Portrait stage (WebGL locks onto this box) ─ */}
        <div className="relative mx-auto w-full max-w-[min(560px,88vw)] [grid-area:stage] lg:row-span-2">
          <div ref={stage} data-hero-stage className="relative w-full" style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}>
            {/* DOM fallback (no WebGL / reduced motion) — hidden once the WebGL portrait is live */}
            <div data-hero-fallback className="absolute inset-0 transition-opacity duration-700">
              <div aria-hidden="true" className="hero-css-portal" />
              <picture>
                <source media="(max-width: 767px)" srcSet={portrait.srcSm} />
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  width={portrait.width}
                  height={portrait.height}
                  priority
                  unoptimized
                  className="relative h-full w-full object-contain [mask-image:linear-gradient(to_top,transparent,black_12%)]"
                />
              </picture>
            </div>
            {/* Accessible text alternative when the photo is drawn in WebGL */}
            <span className="sr-only">{portrait.alt}</span>

            {/* Skill stations — desktop orbit */}
            <ul aria-label={labels.skills} className="absolute inset-0 hidden lg:block">
              {skills.map((s, i) => {
                const slot = SLOTS[i % SLOTS.length]!
                const open = active === i
                return (
                  <li
                    key={s.key}
                    data-skill-node
                    className="absolute"
                    style={{
                      top: `${slot.y}%`,
                      [slot.side]: `${slot.x}%`,
                      animationDelay: `${i * -1.3}s`,
                    }}
                  >
                    <SkillNode skill={s} index={i} open={open} side={slot.side} onToggle={() => setActive(open ? -1 : i)} onHover={onHover} closeLabel={labels.close} />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* ── Copy, CTAs, dock ───────────────────── */}
        <div className="relative z-10 [grid-area:body]">
          <p data-hero-in className="font-[family-name:var(--font-display)] text-[clamp(1rem,1.6vw,1.35rem)] font-semibold tracking-[0.14em] uppercase">
            <span className="text-gradient">{tagline}</span>
          </p>
          <p data-hero-in className="mt-4 max-w-xl text-lg text-[var(--text-2)]">
            {text}
          </p>
          {extraRoles.length > 0 && (
            <p data-hero-in className="mt-3 font-mono text-xs tracking-wide text-[var(--text-2)]">
              + {extraRoles.join(' · ')}
            </p>
          )}

          <div data-hero-in className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a href="#explore" className="hero-cta hero-cta--primary">
                <span>{cta.exploreLabel}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </a>
            </Magnetic>
            {cta.projectsHref && (
              <Magnetic>
                <TransitionLink href={cta.projectsHref} className="hero-cta hero-cta--glass">
                  <span>{cta.projectsLabel}</span>
                  <span aria-hidden="true">→</span>
                </TransitionLink>
              </Magnetic>
            )}
            {cta.cvUrl && (
              <a href={cta.cvUrl} download className="hero-cta hero-cta--ghost">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
                </svg>
                <span>{cta.cvLabel}</span>
              </a>
            )}
          </div>

          <div data-hero-in className="mt-9">
            <SocialDock items={dock} label={labels.social} />
          </div>
        </div>

        {/* Skill stations — mobile / tablet list */}
        <ul aria-label={labels.skills} className="grid grid-cols-2 gap-2.5 [grid-area:skills] sm:grid-cols-3 lg:hidden">
          {skills.map(s => (
            <li key={s.key} data-hero-in>
              <details className="holo-chip group h-full">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <SkillGlyph icon={s.icon} className="size-5 shrink-0 text-[var(--cyan)]" />
                  <span>{s.title}</span>
                </summary>
                <p className="px-3 pb-3 text-xs leading-relaxed text-[var(--text-2)]">{s.text}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>

      <a href="#explore" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-[var(--text-2)] uppercase md:flex">
        {labels.scroll}
        <span aria-hidden="true" className="hero-scroll-line" />
      </a>
    </section>
  )
}

function SkillNode({
  skill,
  index,
  open,
  side,
  onToggle,
  onHover,
  closeLabel,
}: {
  skill: HeroSkill
  index: number
  open: boolean
  side: 'left' | 'right'
  onToggle: () => void
  onHover: (i: number) => void
  closeLabel: string
}) {
  const tipId = `skill-tip-${skill.key}`
  return (
    <div className="hero-float relative" style={{ animationDelay: `${index * -1.1}s` }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={onToggle}
        onPointerEnter={() => onHover(index)}
        onPointerLeave={() => onHover(-1)}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(-1)}
        className={cn('holo-node group', open && 'is-open')}
      >
        <span className="holo-node__icon">
          <SkillGlyph icon={skill.icon} className="size-5" />
        </span>
        <span className="holo-node__label">{skill.title}</span>
      </button>
      <div
        id={tipId}
        role="region"
        aria-label={skill.title}
        className={cn('holo-tip', side === 'left' ? 'right-0 lg:right-auto lg:left-0' : 'right-0', open && 'is-open')}
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--cyan)] uppercase">0{index + 1} · station</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-sm">{skill.title}</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-2)]">{skill.text}</p>
        {open && (
          <button type="button" onClick={onToggle} className="mt-3 font-mono text-[10px] tracking-widest text-[var(--text-2)] uppercase hover:text-[var(--text)]">
            {closeLabel} ✕
          </button>
        )}
      </div>
    </div>
  )
}
