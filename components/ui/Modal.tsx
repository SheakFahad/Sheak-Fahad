'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { lockScroll } from '@/lib/motion/lenis'
import { cn } from '@/lib/utils/cn'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean
  children: ReactNode
  className?: string
  closeLabel?: string
}

/** Accessible modal on the native <dialog>: focus trap, Esc, backdrop click, focus return. */
export function Modal({ open, onClose, title, hideTitle, children, className, closeLabel = 'Close' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      lockScroll(true)
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onDialogClose = () => {
      lockScroll(false)
      onClose()
    }
    d.addEventListener('close', onDialogClose)
    return () => d.removeEventListener('close', onDialogClose)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      data-lenis-prevent
      onClick={e => {
        if (e.target === ref.current) ref.current?.close()
      }}
      className={cn(
        'glass m-auto w-[min(92vw,720px)] rounded-[var(--radius-panel)] bg-[var(--surface-strong)] p-0 text-[var(--text)] backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="relative p-6 md:p-8">
        <h2 id="modal-title" className={cn('pr-12 text-xl', hideTitle && 'sr-only')}>
          {title}
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={closeLabel}
          className="absolute top-4 right-4 grid size-11 place-items-center rounded-full text-[var(--text-2)] hover:bg-[var(--line)] hover:text-[var(--text)]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className={cn(!hideTitle && 'mt-4')}>{children}</div>
      </div>
    </dialog>
  )
}
