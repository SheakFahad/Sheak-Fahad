'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { Flip } from 'gsap/Flip'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { cn } from '@/lib/utils/cn'

gsap.registerPlugin(Flip)

export interface ProjectCard {
  slug: string
  title: string
  type: string
  summary: string | null
  concept: boolean
  cover: { src: string; alt: string; fx: number; fy: number } | null
}

interface Props {
  projects: ProjectCard[]
  labels: { all: string; viewCase: string; concept: string; filterLabel: string }
}

/** Project gallery with type filters animated by GSAP Flip. */
export function ProjectGrid({ projects, labels }: Props) {
  const types = [...new Set(projects.map(p => p.type))]
  const [active, setActive] = useState<string | null>(null)
  const list = useRef<HTMLUListElement>(null)

  const choose = (type: string | null) => {
    if (type === active) return
    const items = list.current?.querySelectorAll('[data-card]')
    if (!items || prefersReducedMotion()) {
      setActive(type)
      return
    }
    const state = Flip.getState(items)
    setActive(type)
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.6,
        ease: 'power2.inOut',
        absolute: true,
        scale: true,
        onEnter: els => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.4 }),
        onLeave: els => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.3 }),
      })
    })
  }

  return (
    <>
      {types.length > 1 && (
        <div role="group" aria-label={labels.filterLabel} className="mb-10 flex flex-wrap gap-2">
          {[null, ...types].map(type => (
            <button
              key={type ?? 'all'}
              type="button"
              aria-pressed={active === type}
              onClick={() => choose(type)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm transition-colors',
                active === type ? 'border-transparent bg-[var(--text)] text-[var(--bg)]' : 'border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)]',
              )}
            >
              {type ?? labels.all}
            </button>
          ))}
        </div>
      )}
      <ul ref={list} className="grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.slug} data-card data-reveal hidden={active !== null && p.type !== active}>
            <TransitionLink href={`/projects/${p.slug}`} className="group block h-full rounded-[var(--radius-panel)]">
              <article className="glass h-full overflow-hidden rounded-[var(--radius-panel)] transition-[border-color,box-shadow] duration-500 group-hover:border-[var(--line-strong)] group-hover:shadow-[var(--glow)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-2)]">
                  {p.cover && (
                    <Image
                      src={p.cover.src}
                      alt={p.cover.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                      style={{ objectPosition: `${p.cover.fx * 100}% ${p.cover.fy * 100}%` }}
                    />
                  )}
                  <span className="absolute top-4 left-4 font-mono text-xs text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {p.concept && (
                    <span className="absolute top-4 right-4 rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] tracking-wider text-white/85 uppercase backdrop-blur">
                      {labels.concept}
                    </span>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <p className="eyebrow">{p.type}</p>
                  <h2 className="mt-2 text-2xl md:text-3xl">{p.title}</h2>
                  {p.summary && <p className="mt-3 text-[var(--text-2)]">{p.summary}</p>}
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    {labels.viewCase}
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </div>
              </article>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </>
  )
}
