'use client'

import { useEffect, useRef, useState } from 'react'
import type { NavItem } from '@/components/layout/nav-types'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { nexusStore } from '@/lib/nexus/store'
import { cn } from '@/lib/utils/cn'
import { StationIcon } from './StationIcon'

interface Props {
  stations: NavItem[]
  showGlobe: boolean
  labels: { stations: string; globe: string; open: string }
}

// Orbit ellipse (percent of the square box)
const RX = 41
const RY = 42

/**
 * Right side of NEXUS: the interactive Earth (drawn by the shared WebGL canvas, locked to [data-globe-core])
 * with every enabled CMS section as a floating holographic station. Stations are real links.
 */
export function StationOrbit({ stations, showGlobe, labels }: Props) {
  const core = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(-1)
  const n = stations.length

  useEffect(() => {
    nexusStore.stationCount = n
  }, [n])

  useEffect(() => {
    nexusStore.hoverStation = hover
  }, [hover])

  // Register the globe anchor + drag / keyboard rotation
  useEffect(() => {
    const el = core.current
    if (!el || !showGlobe) return
    nexusStore.globe = el
    let dragging = false
    let lastX = 0
    let lastT = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastT = performance.now()
      el.setPointerCapture(e.pointerId)
      el.dataset.dragging = '1'
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const now = performance.now()
      const dt = Math.max(8, now - lastT) / 1000
      const dx = (e.clientX - lastX) / Math.max(1, el.clientWidth)
      nexusStore.spin = Math.max(-8, Math.min(8, (dx * Math.PI) / dt))
      lastX = e.clientX
      lastT = now
    }
    const up = (e: PointerEvent) => {
      dragging = false
      delete el.dataset.dragging
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nexusStore.spin = -2.5
      else if (e.key === 'ArrowRight') nexusStore.spin = 2.5
      else return
      e.preventDefault()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('keydown', key)
    return () => {
      nexusStore.globe = null
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('keydown', key)
    }
  }, [showGlobe])

  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { x: 50 + Math.cos(a) * RX, y: 50 + Math.sin(a) * RY }
  }
  const active = hover >= 0 ? stations[hover] : null

  return (
    <div className="nx-orbit relative mx-auto aspect-square w-full" data-nx-orbit>
      {/* Orbit path + connection beams */}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id="nx-orbit-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#51e5ff" />
            <stop offset="0.5" stopColor="#4263ff" />
            <stop offset="1" stopColor="#ff5cf0" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx={RX} ry={RY} className="nx-orbit__path" />
        <ellipse cx="50" cy="50" rx={RX} ry={RY} className="nx-orbit__flow" />
        {stations.map((s, i) => {
          const p = pos(i)
          return <line key={s.key} x1="50" y1="50" x2={p.x} y2={p.y} className={cn('nx-orbit__beam', hover === i && 'is-on')} />
        })}
      </svg>

      {/* Globe anchor (WebGL Earth locks here) + CSS fallback */}
      {showGlobe && (
        <div
          ref={core}
          data-globe-core
          role="img"
          tabIndex={0}
          aria-label={labels.globe}
          className="nx-globe-core absolute top-1/2 left-1/2 aspect-square w-[44%] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-pan-y rounded-full"
        >
          <span aria-hidden="true" className="nx-globe-fallback" />
        </div>
      )}

      {/* Readout for the hovered station (projected over the Earth) */}
      <div aria-hidden="true" className={cn('nx-readout pointer-events-none absolute top-1/2 left-1/2 w-[42%] text-center', active && 'is-on')}>
        {active && (
          <>
            <StationIcon name={active.icon} className="mx-auto size-6 text-[var(--cyan)]" />
            <p className="mt-1.5 font-[family-name:var(--font-display)] text-sm tracking-[0.12em] uppercase">{active.label}</p>
            {active.text && <p className="mt-1 text-[11px] leading-snug text-[var(--text-2)]">{active.text}</p>}
          </>
        )}
      </div>

      <ul aria-label={labels.stations} className="absolute inset-0">
        {stations.map((s, i) => {
          const p = pos(i)
          const descId = `nx-st-${s.key}`
          return (
            <li key={s.key} data-nx-station className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <div className="nx-float" style={{ animationDelay: `${(i * -0.9).toFixed(1)}s` }}>
                <TransitionLink
                  href={s.href}
                  aria-describedby={s.text ? descId : undefined}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(-1)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(-1)}
                  className="nx-station group"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="nx-station__icon">
                    <StationIcon name={s.icon} className="size-[22px]" />
                  </span>
                  <span className="nx-station__label">{s.label}</span>
                  {s.eyebrow && <span className="nx-station__sub">{s.eyebrow}</span>}
                </TransitionLink>
                {s.text && (
                  <span id={descId} className="sr-only">
                    {s.text}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
