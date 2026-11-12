'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTransitionNavigate } from '@/components/motion/PageTransition'
import { useRouter } from '@/i18n/navigation'
import { lockScroll } from '@/lib/motion/lenis'
import { cn } from '@/lib/utils/cn'
import type { SearchEntry } from './nav-types'

interface Props {
  open: boolean
  onClose: () => void
  entries: SearchEntry[]
  labels: { title: string; placeholder: string; empty: string; sections: string; projects: string; close: string }
}

const norm = (s: string) => s.toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')

/** Site search (sections + published projects). Combobox pattern: arrows move, Enter opens, Esc closes. */
export function SearchDialog({ open, onClose, entries, labels }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const listId = useId()
  const navigate = useTransitionNavigate()
  const router = useRouter()

  const results = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return entries
    return entries.filter(e => norm(`${e.title} ${e.hint ?? ''}`).includes(q))
  }, [entries, query])

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement as HTMLElement
    lockScroll(true)
    const id = requestAnimationFrame(() => input.current?.focus())
    return () => {
      cancelAnimationFrame(id)
      lockScroll(false)
      lastFocus.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const go = (e: SearchEntry | undefined) => {
    if (!e) return
    onClose()
    setQuery('')
    if (navigate) navigate(e.href)
    else router.push(e.href)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(results.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(0, c - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[cursor])
    } else if (e.key === 'Tab') {
      e.preventDefault() // focus stays in the field (single-control dialog)
    }
  }

  const groups: [SearchEntry['group'], string][] = [
    ['section', labels.sections],
    ['project', labels.projects],
  ]

  return (
    <div className="fixed inset-0 z-[90] grid place-items-start justify-center bg-[var(--bg)]/70 px-4 pt-[12vh] backdrop-blur-md" onPointerDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={labels.title} className="nexus-search w-full max-w-xl" onKeyDown={onKey} data-lenis-prevent>
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-5">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-[var(--cyan)]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            ref={input}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog opened by an explicit user action
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[cursor] ? `${listId}-${cursor}` : undefined}
            aria-autocomplete="list"
            aria-label={labels.title}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            placeholder={labels.placeholder}
            className="min-h-16 w-full bg-transparent text-lg outline-none placeholder:text-[var(--text-2)]/70"
          />
          <button type="button" onClick={onClose} className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--text-2)]">
            ESC<span className="sr-only"> — {labels.close}</span>
          </button>
        </div>
        <ul id={listId} role="listbox" aria-label={labels.title} className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-[var(--text-2)]">{labels.empty}</li>}
          {groups.map(([g, title]) => {
            const items = results.map((r, i) => [r, i] as const).filter(([r]) => r.group === g)
            if (!items.length) return null
            return (
              <li key={g} role="presentation">
                <p className="px-3 pt-3 pb-1 font-mono text-[10px] tracking-[0.25em] text-[var(--text-2)] uppercase">{title}</p>
                <ul role="presentation">
                  {items.map(([r, i]) => (
                    <li
                      key={r.href}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === cursor}
                      onPointerMove={() => setCursor(i)}
                      onClick={() => go(r)}
                      className={cn('flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5', i === cursor && 'bg-[var(--line)]')}
                    >
                      <span className="font-semibold">{r.title}</span>
                      {r.hint && <span className="truncate text-xs text-[var(--text-2)]">{r.hint}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
