'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import type { FeaturedProject } from '@/lib/nexus/types'
import { cn } from '@/lib/utils/cn'
import { StationIcon } from './StationIcon'

interface Props {
  projects: FeaturedProject[]
  labels: { title: string; prev: string; next: string; concept: string; view: string }
}

/** Horizontal glass carousel: scroll-snap track, arrow buttons, mouse drag (touch swipes natively). */
export function FeaturedProjects({ projects, labels }: Props) {
  const track = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    // Mouse drag-to-scroll (fine pointers only; touch uses native scrolling)
    let down = false
    let moved = false
    let startX = 0
    let startLeft = 0
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      down = true
      moved = false
      startX = e.clientX
      startLeft = el.scrollLeft
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (!moved && Math.abs(dx) > 6) {
        moved = true
        el.dataset.dragging = '1'
        el.setPointerCapture(e.pointerId)
      }
      if (moved) el.scrollLeft = startLeft - dx
    }
    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      delete el.dataset.dragging
    }
    // A drag must not trigger the link underneath
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
    }
  }, [])

  if (!projects.length) return null

  const step = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('li')
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 12), behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <section aria-labelledby="nx-featured-title" data-nx-featured className="nx-featured relative">
      <h2 id="nx-featured-title" className="nx-featured__tab">
        <StationIcon name="stack" className="size-4 text-[var(--cyan)]" />
        {labels.title}
      </h2>
      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" onClick={() => step(-1)} disabled={edge.start} aria-label={labels.prev} aria-controls="nx-featured-track" className={cn('nx-arrow hidden', !(edge.start && edge.end) && 'sm:grid')}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>
        <ul
          ref={track}
          id="nx-featured-track"
          className="nx-featured__track flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain"
        >
          {projects.map(p => (
            <li key={p.slug} data-nx-card className="w-[min(82vw,320px)] shrink-0 snap-start md:w-[calc((100%-1.5rem)/3)] md:min-w-[260px]">
              <TransitionLink href={p.href} className="nx-card group" draggable={false}>
                <span className="nx-card__thumb">
                  {p.cover ? (
                    <Image
                      src={p.cover.src}
                      alt={p.cover.alt}
                      width={240}
                      height={150}
                      sizes="120px"
                      draggable={false}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                      style={{ objectPosition: `${p.cover.focalX * 100}% ${p.cover.focalY * 100}%` }}
                    />
                  ) : (
                    <StationIcon name="stack" className="size-7 text-[var(--cyan)]" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="nx-card__cat">{p.type}</span>
                  <span className="nx-card__title">{p.title}</span>
                  {p.summary && <span className="mt-1 block truncate text-xs text-[var(--text-2)]">{p.summary}</span>}
                  <span className="mt-2 flex items-center gap-2">
                    {p.isConcept && <span className="nx-badge">{labels.concept}</span>}
                    <span className="nx-card__go" aria-hidden="true">
                      {labels.view} →
                    </span>
                  </span>
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => step(1)} disabled={edge.end} aria-label={labels.next} aria-controls="nx-featured-track" className={cn('nx-arrow hidden', !(edge.start && edge.end) && 'sm:grid')}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </section>
  )
}
