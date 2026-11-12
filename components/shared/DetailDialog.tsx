'use client'

import { useRef, type ReactNode } from 'react'

/** Accessible detail view using the native <dialog> (focus trap, Esc, backdrop click to close). */
export function DetailDialog({ trigger, title, close, children }: { trigger: string; title: string; close: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--cyan)] hover:underline">
        {trigger} →
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        className="detail-dialog"
        onClick={e => {
          if (e.target === ref.current) ref.current?.close()
        }}
      >
        <div className="detail-dialog__body">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl md:text-3xl">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={close} className="grid size-10 shrink-0 place-items-center rounded-full text-xl ring-1 ring-[var(--line-strong)] hover:bg-[var(--line)]">
              ×
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  )
}
