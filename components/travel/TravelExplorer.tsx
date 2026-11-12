'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { GlobeAnchor } from '@/components/nexus/GlobeAnchor'
import { Lightbox } from '@/components/ui/Lightbox'
import { VideoCard, type VideoCardData } from '@/components/video/VideoCard'
import type { MediaRef } from '@/lib/content/types'
import { nexusStore } from '@/lib/nexus/store'
import { cn } from '@/lib/utils/cn'

export interface AtlasPlace {
  id: string
  name: string
  country: string
  district: string | null
  region: 'bangladesh' | 'world'
  lat: number | null
  lng: number | null
  date: string | null
  story: string | null
  tags: string[]
  cover: MediaRef | null
  photos: MediaRef[]
  memories: { title: string; href: string }[]
  videos: VideoCardData[]
  isDemo: boolean
}

interface Labels {
  all: string
  bangladesh: string
  world: string
  regions: string
  globe: string
  select: string
  selectText: string
  destinations: string
  timeline: string
  photos: string
  memories: string
  videos: string
  play: string
  demo: string
  close: string
  previous: string
  next: string
  undated: string
}

/**
 * ATLAS: interactive Earth with a marker for every published destination, a destination panel
 * (location, date, story, photos, related memories and videos), destination cards and a timeline.
 * Only published, verified places reach this component.
 */
export function TravelExplorer({ places, labels }: { places: AtlasPlace[]; labels: Labels }) {
  const [region, setRegion] = useState<'all' | 'bangladesh' | 'world'>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [photo, setPhoto] = useState<number | null>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const visible = useMemo(() => places.filter(p => region === 'all' || p.region === region), [places, region])
  const current = places.find(p => p.id === selected) ?? null
  const timeline = [...visible].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  // Publish markers to the shared 3D Earth
  useEffect(() => {
    nexusStore.markers = visible.flatMap(p => (p.lat !== null && p.lng !== null ? [{ id: p.id, lat: p.lat, lng: p.lng }] : []))
    return () => {
      nexusStore.markers = []
      nexusStore.markerScreen = {}
    }
  }, [visible])

  useEffect(() => {
    nexusStore.selected = selected
    return () => {
      nexusStore.selected = null
    }
  }, [selected])

  // Position the DOM marker buttons over the WebGL Earth every frame
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const box = overlay.current
      if (box) {
        const r = box.getBoundingClientRect()
        box.querySelectorAll<HTMLElement>('[data-marker]').forEach(btn => {
          const s = nexusStore.markerScreen[btn.dataset.marker!]
          if (!s) {
            btn.style.opacity = '0'
            btn.style.pointerEvents = 'none'
            return
          }
          btn.style.transform = `translate(${s.x - r.left}px, ${s.y - r.top}px)`
          btn.style.opacity = s.front ? '1' : '0'
          btn.style.pointerEvents = s.front ? 'auto' : 'none'
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const choose = (id: string) => {
    setSelected(id)
    requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }))
  }

  return (
    <div className="grid gap-14">
      {/* Region switch */}
      <div role="radiogroup" aria-label={labels.regions} className="flex flex-wrap gap-2">
        {(['all', 'bangladesh', 'world'] as const).map(r => (
          <button key={r} type="button" role="radio" aria-checked={region === r} onClick={() => setRegion(r)} className={cn('atlas-tab', region === r && 'is-on')}>
            {labels[r]}
          </button>
        ))}
      </div>

      {/* Globe + destination panel */}
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative mx-auto w-full max-w-[560px]">
          <GlobeAnchor label={labels.globe} className="w-full" />
          <div ref={overlay} className="pointer-events-none absolute inset-0">
            {visible.map(p =>
              p.lat !== null && p.lng !== null ? (
                <button
                  key={p.id}
                  type="button"
                  data-marker={p.id}
                  onClick={() => choose(p.id)}
                  aria-label={`${p.name}, ${p.country}`}
                  aria-pressed={selected === p.id}
                  className={cn('atlas-marker', selected === p.id && 'is-on')}
                  style={{ opacity: 0 }}
                >
                  <span className="atlas-marker__label">{p.name}</span>
                </button>
              ) : null,
            )}
          </div>
        </div>

        <div ref={panel} tabIndex={-1} aria-live="polite" className="atlas-panel outline-none">
          {current ? (
            <article>
              {current.isDemo && <p className="placeholder-card__badge mb-3">{labels.demo}</p>}
              <p className="eyebrow">{[current.district, current.country].filter(Boolean).join(', ')}</p>
              <h3 className="mt-2 text-3xl md:text-4xl">{current.name}</h3>
              <p className="mt-1 font-mono text-xs text-[var(--text-2)]">{current.date ?? labels.undated}</p>
              {current.story && <p className="mt-4 text-[var(--text-2)]">{current.story}</p>}
              {current.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {current.tags.map(t => (
                    <li key={t} className="rounded-full px-3 py-1 text-xs ring-1 ring-[var(--line-strong)]">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {current.photos.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow mb-3">{labels.photos}</p>
                  <ul className="grid grid-cols-3 gap-2">
                    {current.photos.map((m, i) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => setPhoto(i)} className="relative block aspect-square w-full overflow-hidden rounded-xl">
                          <Image src={m.src} alt={m.alt} fill sizes="160px" className="object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {current.memories.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow mb-2">{labels.memories}</p>
                  <ul className="grid gap-1">
                    {current.memories.map(m => (
                      <li key={m.href}>
                        <TransitionLink href={m.href} className="text-[var(--cyan)] hover:underline">
                          {m.title} →
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {current.videos.length > 0 && (
                <div className="mt-6 grid gap-4">
                  <p className="eyebrow">{labels.videos}</p>
                  {current.videos.map(v => (
                    <VideoCard key={v.id} video={v} playLabel={labels.play} />
                  ))}
                </div>
              )}
            </article>
          ) : (
            <div>
              <p className="eyebrow">{labels.select}</p>
              <p className="mt-3 text-[var(--text-2)]">{labels.selectText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Destination cards */}
      <section aria-labelledby="atlas-dest">
        <h2 id="atlas-dest" className="mb-6 text-2xl md:text-3xl">
          {labels.destinations}
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(p => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p.id)} aria-pressed={selected === p.id} className={cn('atlas-card group', selected === p.id && 'is-on')}>
                <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-[var(--bg-2)]">
                  {p.cover && <Image src={p.cover.src} alt={p.cover.alt} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                  {p.isDemo && <span className="placeholder-card__badge absolute top-3 left-3 bg-[var(--bg)]">{labels.demo}</span>}
                </span>
                <span className="mt-4 block text-left">
                  <span className="eyebrow block">{[p.district, p.country].filter(Boolean).join(', ')}</span>
                  <span className="mt-1 block font-[family-name:var(--font-display)] text-xl">{p.name}</span>
                  {p.date && <span className="mt-1 block font-mono text-xs text-[var(--text-2)]">{p.date}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      <section aria-labelledby="atlas-time">
        <h2 id="atlas-time" className="mb-6 text-2xl md:text-3xl">
          {labels.timeline}
        </h2>
        <ol className="atlas-timeline">
          {timeline.map(p => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p.id)} className="atlas-timeline__item">
                <span className="font-mono text-xs text-[var(--cyan)]">{p.date ?? labels.undated}</span>
                <span className="font-[family-name:var(--font-display)]">{p.name}</span>
                <span className="text-sm text-[var(--text-2)]">{p.country}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {current && (
        <Lightbox items={current.photos} index={photo} onClose={() => setPhoto(null)} labels={{ close: labels.close, previous: labels.previous, next: labels.next }} />
      )}
    </div>
  )
}
