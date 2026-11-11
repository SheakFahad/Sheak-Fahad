'use client'

import { useState } from 'react'
import { MediaGallery } from '@/components/shared/MediaGallery'
import type { MediaRef } from '@/lib/content/types'
import { cn } from '@/lib/utils/cn'

export interface MemoryItem {
  id: string
  title: string
  when: string | null
  category: string
  categoryLabel: string
  note: string | null
  photos: MediaRef[]
}

interface Props {
  items: MemoryItem[]
  labels: { all: string; filterLabel: string; gallery: { open: string; close: string; previous: string; next: string } }
}

/** Memory timeline with category filters; each memory opens its photos in the lightbox. */
export function MemoryArchive({ items, labels }: Props) {
  const cats = [...new Map(items.map(i => [i.category, i.categoryLabel])).entries()]
  const [active, setActive] = useState<string | null>(null)
  const shown = active ? items.filter(i => i.category === active) : items

  return (
    <>
      {cats.length > 1 && (
        <div role="group" aria-label={labels.filterLabel} className="mb-12 flex flex-wrap gap-2">
          {[[null, labels.all] as const, ...cats].map(([key, label]) => (
            <button
              key={key ?? 'all'}
              type="button"
              aria-pressed={active === key}
              onClick={() => setActive(key)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm transition-colors',
                active === key ? 'border-transparent bg-[var(--text)] text-[var(--bg)]' : 'border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <ol className="relative grid gap-16 border-l border-[var(--line)] pl-6 md:pl-12">
        {shown.map(m => (
          <li key={m.id} className="relative">
            <span aria-hidden="true" className="absolute top-2 -left-[31px] size-3 rounded-full [background:var(--grad)] md:-left-[55px]" />
            <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-2xl md:text-3xl">{m.title}</h2>
              <span className="font-mono text-xs text-[var(--cyan)] uppercase">
                {[m.categoryLabel, m.when].filter(Boolean).join(' · ')}
              </span>
            </div>
            {m.note && <p className="mb-6 max-w-2xl text-[var(--text-2)]">{m.note}</p>}
            <MediaGallery items={m.photos} labels={labels.gallery} />
          </li>
        ))}
      </ol>
    </>
  )
}
