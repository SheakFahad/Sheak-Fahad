'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Lightbox } from '@/components/ui/Lightbox'
import type { MediaRef } from '@/lib/content/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  items: MediaRef[]
  labels: { open: string; close: string; previous: string; next: string }
  layout?: 'grid' | 'masonry' | 'auto'
  className?: string
}

/**
 * Clickable gallery → fullscreen lightbox. Photos are shown untouched (crop via object-position only).
 * 'auto' layout: masonry whenever photos have different shapes (portrait + landscape), grid otherwise.
 */
export function MediaGallery({ items, labels, layout = 'auto', className }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  if (!items.length) return null
  const shapeOf = (m: MediaRef) => m.display_aspect ?? `${m.width} / ${m.height}`
  const mode = layout === 'auto' ? (new Set(items.map(shapeOf)).size > 1 ? 'masonry' : 'grid') : layout
  return (
    <>
      <ul
        className={cn(
          mode === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
          className,
        )}
      >
        {items.map((m, i) => (
          <li key={m.id} data-reveal className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${labels.open}: ${m.alt}`}
              className="group relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--bg-2)]"
              style={{ aspectRatio: mode === 'masonry' ? shapeOf(m) : (m.display_aspect ?? '4 / 3') }}
            >
              <Image
                src={m.src}
                alt={m.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                style={{ objectPosition: `${(m.focal_x ?? 0.5) * 100}% ${(m.focal_y ?? 0.5) * 100}%` }}
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} labels={labels} />
    </>
  )
}
