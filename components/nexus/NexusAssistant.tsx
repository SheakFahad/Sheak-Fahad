'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TransitionLink } from '@/components/motion/TransitionLink'
import type { AssistantEntry } from '@/lib/nexus/types'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { cn } from '@/lib/utils/cn'

interface Labels {
  title: string
  text: string
  open: string
  close: string
  hide: string
  placeholder: string
  send: string
  note: string
  suggest: string
  noAnswer: string
  greeting: string
  you: string
}

interface Msg {
  id: number
  from: 'bot' | 'user'
  text: string
  link?: { href: string; label: string }
}

const HIDE_KEY = 'sf-nexus-ai-hidden'
const tokens = (s: string) => s.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

/** Keyword retrieval over verified entries — deterministic, offline, never invents an answer. */
function answer(query: string, kb: AssistantEntry[]): AssistantEntry | null {
  const words = tokens(query)
  if (!words.length) return null
  let best: AssistantEntry | null = null
  let bestScore = 0
  for (const e of kb) {
    let score = 0
    for (const w of words) {
      if (w.length < 3 && /^[a-z0-9]+$/.test(w)) continue // skip short Latin words (is, do, my…)
      if (e.keywords.includes(w)) score += 2
      else if (w.length >= 5 && e.keywords.some(k => k.length >= 5 && (k.startsWith(w) || w.startsWith(k)))) score += 1
    }
    if (score > bestScore) {
      best = e
      bestScore = score
    }
  }
  return bestScore > 0 ? best : null
}

/** "NEXUS AI" panel. Local mode: answers only from published CMS data; no model, no network, nothing stored. */
export function NexusAssistant({ kb, labels }: { kb: AssistantEntry[]; labels: Labels }) {
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const panelId = useId()
  const log = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const seq = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read per-session preference after hydration
      if (sessionStorage.getItem(HIDE_KEY) === '1') setHidden(true)
    } catch {}
    const t = timers.current
    return () => t.forEach(id => window.clearTimeout(id))
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    field.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [msgs, typing])

  if (hidden || !kb.length) return null

  const openPanel = () => {
    if (!msgs.length) setMsgs([{ id: seq.current++, from: 'bot', text: labels.greeting }])
    setOpen(true)
  }

  const ask = (q: string, entry?: AssistantEntry) => {
    const text = q.trim()
    if (!text || typing) return
    const hit = entry ?? answer(text, kb)
    setMsgs(m => [...m, { id: seq.current++, from: 'user', text }])
    setInput('')
    setTyping(true)
    const reply: Msg = hit
      ? {
          id: seq.current++,
          from: 'bot',
          text: hit.answer,
          link: hit.href ? { href: hit.href, label: hit.linkLabel } : undefined,
        }
      : { id: seq.current++, from: 'bot', text: labels.noAnswer }
    timers.current.push(
      window.setTimeout(
        () => {
          setTyping(false)
          setMsgs(m => [...m, reply])
        },
        prefersReducedMotion() ? 0 : 520,
      ),
    )
  }

  const hide = () => {
    try {
      sessionStorage.setItem(HIDE_KEY, '1')
    } catch {}
    setHidden(true)
  }

  return (
    <div data-nx-ai className="nx-ai">
      {/* Teaser card (desktop) / floating orb (mobile) */}
      <div className={cn('nx-ai__teaser', open && 'is-hidden')}>
        <button ref={trigger} type="button" onClick={openPanel} aria-expanded={open} aria-controls={panelId} className="nx-ai__open" aria-label={labels.open}>
          <span className="nx-ai__orb" aria-hidden="true">
            <span className="nx-ai__eye" />
            <span className="nx-ai__eye" />
          </span>
          <span className="hidden min-w-0 text-left xl:block">
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-[15px] font-semibold">
              {labels.title}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 text-[var(--cyan)]" fill="currentColor">
                <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
              </svg>
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-[var(--text-2)]">{labels.text}</span>
          </span>
          <span aria-hidden="true" className="nx-ai__go hidden xl:grid">
            →
          </span>
        </button>
        <button type="button" onClick={hide} aria-label={labels.hide} className="nx-ai__x hidden xl:grid">
          ×
        </button>
      </div>

      {open &&
        createPortal(
          <div id={panelId} role="dialog" aria-label={labels.title} className="nx-ai__panel" data-lenis-prevent>
            <header className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
              <span className="nx-ai__orb nx-ai__orb--sm" aria-hidden="true">
                <span className="nx-ai__eye" />
                <span className="nx-ai__eye" />
              </span>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold">{labels.title}</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  trigger.current?.focus()
                }}
                aria-label={labels.close}
                className="ml-auto grid size-9 place-items-center rounded-full text-lg text-[var(--text-2)] hover:bg-[var(--line)] hover:text-[var(--text)]"
              >
                ×
              </button>
            </header>

            <div ref={log} role="log" aria-live="polite" className="nx-ai__log">
              {msgs.map(m => (
                <div key={m.id} className={cn('nx-ai__msg', m.from === 'user' ? 'is-user' : 'is-bot')}>
                  {m.from === 'user' && <span className="sr-only">{labels.you}: </span>}
                  <p>{m.text}</p>
                  {m.link &&
                    (m.link.href.startsWith('/') && !m.link.href.endsWith('.pdf') ? (
                      <TransitionLink href={m.link.href} onClick={() => setOpen(false)} className="nx-ai__link">
                        {m.link.label} →
                      </TransitionLink>
                    ) : (
                      <a href={m.link.href} download={m.link.href.endsWith('.pdf') || undefined} className="nx-ai__link">
                        {m.link.label} ↓
                      </a>
                    ))}
                </div>
              ))}
              {typing && (
                <div className="nx-ai__msg is-bot" aria-hidden="true">
                  <span className="nx-ai__dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--line)] px-4 pt-3 pb-4">
              <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-2)] uppercase">{labels.suggest}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {kb.slice(0, 6).map(e => (
                  <li key={e.id}>
                    <button type="button" onClick={() => ask(e.question, e)} className="nx-ai__chip">
                      {e.question}
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={e => {
                  e.preventDefault()
                  ask(input)
                }}
              >
                <input
                  ref={field}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={200}
                  aria-label={labels.placeholder}
                  placeholder={labels.placeholder}
                  className="min-h-11 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--cyan)]"
                />
                <button type="submit" aria-label={labels.send} className="nx-ai__send">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
              <p className="mt-2 text-[10px] leading-snug text-[var(--text-2)]">{labels.note}</p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
