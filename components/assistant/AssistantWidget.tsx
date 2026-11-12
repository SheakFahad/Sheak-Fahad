'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { TransitionLink } from '@/components/motion/TransitionLink'
import { localAnswer } from '@/lib/assistant/local'
import { prefersReducedMotion } from '@/lib/motion/presets'
import type { AssistantEntry } from '@/lib/nexus/types'
import { cn } from '@/lib/utils/cn'
import { ASSISTANT_EVENT } from './events'

export interface AssistantLabels {
  button: string
  title: string
  subtitle: string
  greeting: string
  placeholder: string
  send: string
  minimize: string
  restore: string
  close: string
  clear: string
  suggest: string
  you: string
  open: string
  noAnswer: string
  refused: string
  modeAi: string
  modeOffline: string
  offlineNote: string
  fallbackNote: string
}

interface Msg {
  id: number
  from: 'bot' | 'user'
  text: string
  link?: { href: string; label: string }
  note?: string
}

type Mode = 'checking' | 'ai' | 'offline'
const STORE = 'fahad-ai-chat'
const SUGGEST_ORDER = ['who', 'career', 'projects', 'skills', 'research', 'achievements', 'contact']

/**
 * Fahad's AI Assistant: a persistent floating button on every page and a chat window.
 * - AI mode: answers come from /api/assistant (Claude, server-side key, grounded in published data only).
 * - Offline mode (no key configured, or the AI service fails): clearly labelled portfolio guide that only
 *   returns answers assembled from verified content — it never pretends to be a live AI.
 * No audio, no microphone, nothing sent anywhere except the visitor's question to our own API.
 */
export function AssistantWidget({ kb, locale, labels }: { kb: AssistantEntry[]; locale: string; labels: AssistantLabels }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [mode, setMode] = useState<Mode>('checking')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const panelId = useId()
  const log = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const seq = useRef(1)

  const greeting = useCallback((): Msg => ({ id: 0, from: 'bot', text: labels.greeting }), [labels.greeting])

  // Restore history for this tab
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as Msg[] | null
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate per-tab history after mount
      if (saved?.length) setMsgs(saved)
      seq.current = (saved?.reduce((m, x) => Math.max(m, x.id), 0) ?? 0) + 1
    } catch {}
  }, [])
  useEffect(() => {
    try {
      if (msgs.length) sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-40)))
      else sessionStorage.removeItem(STORE)
    } catch {}
  }, [msgs])

  // Is the AI service configured? (server decides — the key never reaches the browser)
  useEffect(() => {
    if (!open || mode !== 'checking') return
    let alive = true
    fetch('/api/assistant')
      .then(r => (r.ok ? r.json() : { configured: false }))
      .then((d: { configured?: boolean }) => alive && setMode(d.configured ? 'ai' : 'offline'))
      .catch(() => alive && setMode('offline'))
    return () => {
      alive = false
    }
  }, [open, mode])

  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      setMinimized(false)
    }
    window.addEventListener(ASSISTANT_EVENT, onOpen)
    return () => window.removeEventListener(ASSISTANT_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    if (!minimized) field.current?.focus({ preventScroll: true })
    return () => document.removeEventListener('keydown', onKey)
  }, [open, minimized])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [msgs, busy, open, minimized])

  const offlineReply = (q: string, entry?: AssistantEntry, note?: string): Msg => {
    const hit = entry ?? localAnswer(q, kb)
    return hit
      ? { id: seq.current++, from: 'bot', text: hit.answer, link: hit.href ? { href: hit.href, label: hit.linkLabel } : undefined, note }
      : { id: seq.current++, from: 'bot', text: labels.noAnswer, note }
  }

  const ask = async (q: string, entry?: AssistantEntry) => {
    const text = q.trim()
    if (!text || busy) return
    const user: Msg = { id: seq.current++, from: 'user', text }
    const history = [...msgs.filter(m => m.id !== 0), user]
    setMsgs(m => [...(m.length ? m : [greeting()]), user])
    setInput('')
    setBusy(true)

    let reply: Msg
    if (mode === 'ai' && !entry) {
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale, messages: history.slice(-12).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })) }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const d = (await res.json()) as { answer: string | null; action: { href: string; label: string } | null; refused?: boolean }
        reply = d.refused || !d.answer ? { id: seq.current++, from: 'bot', text: labels.refused } : { id: seq.current++, from: 'bot', text: d.answer, link: d.action ?? undefined }
      } catch {
        reply = offlineReply(text, undefined, labels.fallbackNote)
      }
    } else {
      await new Promise(r => setTimeout(r, prefersReducedMotion() ? 0 : 450))
      reply = offlineReply(text, entry)
    }
    setMsgs(m => [...m, reply])
    setBusy(false)
  }

  const suggestions = SUGGEST_ORDER.flatMap(id => kb.filter(e => e.id === id))
  const shown = msgs.length ? msgs : [greeting()]

  return (
    <div className="fahad-ai" data-assistant>
      {/* Persistent floating button */}
      <button
        ref={button}
        type="button"
        onClick={() => {
          setOpen(o => !o || minimized)
          setMinimized(false)
        }}
        aria-expanded={open && !minimized}
        aria-controls={panelId}
        className={cn('fahad-ai__fab', open && !minimized && 'is-open')}
      >
        <span aria-hidden="true" className="fahad-ai__orb">
          <i />
          <i />
        </span>
        <span className="fahad-ai__tip">{labels.button}</span>
        <span className="sr-only">{labels.button}</span>
      </button>

      {open && (
        <section id={panelId} role="dialog" aria-label={labels.title} className={cn('fahad-ai__panel', minimized && 'is-min')} data-lenis-prevent>
          <header className="fahad-ai__head">
            <span aria-hidden="true" className="fahad-ai__orb fahad-ai__orb--sm">
              <i />
              <i />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold">{labels.title}</p>
              <p className="truncate text-[11px] text-[var(--text-2)]">{labels.subtitle}</p>
            </div>
            <span className={cn('fahad-ai__mode', mode === 'ai' ? 'is-ai' : 'is-off')} title={mode === 'offline' ? labels.offlineNote : undefined}>
              {mode === 'ai' ? labels.modeAi : mode === 'offline' ? labels.modeOffline : '…'}
            </span>
            <button type="button" onClick={() => setMsgs([])} aria-label={labels.clear} title={labels.clear} className="fahad-ai__icon">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" />
              </svg>
            </button>
            <button type="button" onClick={() => setMinimized(v => !v)} aria-label={minimized ? labels.restore : labels.minimize} title={minimized ? labels.restore : labels.minimize} className="fahad-ai__icon">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={minimized ? 'm6 15 6-6 6 6' : 'M5 12h14'} />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                button.current?.focus()
              }}
              aria-label={labels.close}
              title={labels.close}
              className="fahad-ai__icon"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          {!minimized && (
            <>
              {mode === 'offline' && <p className="fahad-ai__notice">{labels.offlineNote}</p>}
              <div ref={log} role="log" aria-live="polite" className="fahad-ai__log">
                {shown.map(m => (
                  <div key={m.id} className={cn('fahad-ai__msg', m.from === 'user' ? 'is-user' : 'is-bot')}>
                    {m.from === 'user' && <span className="sr-only">{labels.you}: </span>}
                    {m.note && <p className="mb-1 text-[11px] text-[var(--warn)]">{m.note}</p>}
                    <p>{m.text}</p>
                    {m.link &&
                      (m.link.href.endsWith('.pdf') ? (
                        <a href={m.link.href} download className="fahad-ai__link">
                          {m.link.label} ↓
                        </a>
                      ) : (
                        <TransitionLink href={m.link.href} className="fahad-ai__link">
                          {labels.open}: {m.link.label} →
                        </TransitionLink>
                      ))}
                  </div>
                ))}
                {busy && (
                  <div className="fahad-ai__msg is-bot" aria-label="…">
                    <span className="fahad-ai__dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                )}
              </div>
              <div className="fahad-ai__foot">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-2)] uppercase">{labels.suggest}</p>
                <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                  {suggestions.map(e => (
                    <li key={e.id} className="shrink-0">
                      <button type="button" disabled={busy} onClick={() => ask(e.question, mode === 'ai' ? undefined : e)} className="fahad-ai__chip">
                        {e.question}
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-2 flex items-center gap-2"
                  onSubmit={e => {
                    e.preventDefault()
                    ask(input)
                  }}
                >
                  <input
                    ref={field}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    maxLength={500}
                    aria-label={labels.placeholder}
                    placeholder={labels.placeholder}
                    className="min-h-11 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--cyan)]"
                  />
                  <button type="submit" disabled={busy || !input.trim()} aria-label={labels.send} className="fahad-ai__send">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
