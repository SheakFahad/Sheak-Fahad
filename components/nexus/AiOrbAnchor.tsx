'use client'

import { useEffect, useRef, useState } from 'react'
import { openAssistant } from '@/components/assistant/events'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { nexusStore } from '@/lib/nexus/store'
import { cn } from '@/lib/utils/cn'

/**
 * Homepage slot for the floating 3D assistant orb (drawn in the shared canvas, locked to this box).
 * It is a real button: it opens Fahad's AI Assistant. A CSS orb stands in when WebGL is off.
 * An occasional greeting bubble appears beside it (never over the portrait or navigation).
 */
export function AiOrbAnchor({ label, greeting }: { label: string; greeting: string }) {
  const el = useRef<HTMLButtonElement>(null)
  const [bubble, setBubble] = useState(false)

  useEffect(() => {
    nexusStore.aiAnchor = el.current
    // While this orb is on screen it IS the assistant entry point — the fixed button steps aside.
    const root = document.documentElement
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && getComputedStyle(e.target).display !== 'none') root.dataset.aiOrb = '1'
      else delete root.dataset.aiOrb
    })
    if (el.current) io.observe(el.current.parentElement ?? el.current)
    return () => {
      io.disconnect()
      delete root.dataset.aiOrb
      nexusStore.aiAnchor = null
      nexusStore.aiHover = false
    }
  }, [])

  // Occasional greeting: first after 6 s, then every ~40 s, visible for 5 s
  useEffect(() => {
    const timers: number[] = []
    const show = () => {
      setBubble(true)
      timers.push(window.setTimeout(() => setBubble(false), 5000))
    }
    timers.push(window.setTimeout(show, 6000))
    const id = prefersReducedMotion() ? 0 : window.setInterval(show, 40000)
    return () => {
      timers.forEach(t => window.clearTimeout(t))
      if (id) window.clearInterval(id)
    }
  }, [])

  return (
    <div className="ai-anchor" data-nx-ai>
      <p aria-hidden="true" className={cn('ai-anchor__bubble', bubble && 'is-on')}>
        {greeting}
      </p>
      <button
        ref={el}
        type="button"
        data-ai-anchor
        onClick={openAssistant}
        onPointerEnter={() => (nexusStore.aiHover = true)}
        onPointerLeave={() => (nexusStore.aiHover = false)}
        onFocus={() => (nexusStore.aiHover = true)}
        onBlur={() => (nexusStore.aiHover = false)}
        aria-label={label}
        title={label}
        className="ai-anchor__hit"
      >
        <span aria-hidden="true" className="ai-anchor__fallback" />
      </button>
    </div>
  )
}
