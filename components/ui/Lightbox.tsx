'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaRef } from '@/lib/content/types'
import { lockScroll } from '@/lib/motion/lenis'

interface Props {
  items: (MediaRef & { caption?: string })[]
  index: number | null
  onClose: () => void
  labels?: { close: string; previous: string; next: string }
}

/** Fullscreen image viewer: keyboard (←/→/Esc), swipe, counter, captions. Images are never filtered. */
export function Lightbox({ items, index, onClose, labels = { close: 'Close', previous: 'Previous', next: 'Next' } }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [i, setI] = useState(index ?? 0)
  const [prevIndex, setPrevIndex] = useState(index)
  const touchX = useRef<number | null>(null)
  const open = index !== null && items.length > 0

  // Sync the shown image when the caller opens the lightbox at a new index (render-time adjustment).
  if (index !== prevIndex) {
    setPrevIndex(index)
    if (index !== null) setI(index)
  }

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      lockScroll(true)
    }
    if (!open && d.open) d.close()
  }, [open])

  const go = useCallback((dir: number) => setI(v => (v + dir + items.length) % items.length), [items.length])

  const item = items[i]
  if (!item) return null

  return (
    <dialog
      ref={ref}
      aria-label={item.alt}
      data-lenis-prevent
      onClose={() => {
        lockScroll(false)
        onClose()
      }}
      onKeyDown={e => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      onTouchStart={e => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={e => {
        const start = touchX.current
        const end = e.changedTouches[0]?.clientX
        if (start != null && end != null && Math.abs(end - start) > 50) go(end < start ? 1 : -1)
        touchX.current = null
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/90"
    >
      <div className="relative flex h-full flex-col items-center justify-center p-4 md:p-12">
        <div className="relative h-full w-full">
          <Image
            key={item.id}
            src={item.src}
            alt={item.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
        <p className="mt-4 min-h-6 text-center text-sm text-white/80" aria-live="polite">
          {item.caption ?? item.alt} <span className="ml-2 font-mono text-white/50">{i + 1} / {items.length}</span>
        </p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={labels.close}
          className="absolute top-4 right-4 grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={labels.previous}
              className="absolute top-1/2 left-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={labels.next}
              className="absolute top-1/2 right-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </dialog>
  )
}
