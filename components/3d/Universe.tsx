'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { detectTier, type QualityTier } from './quality'

// The whole three.js bundle is code-split and loaded only after the page is interactive.
const UniverseCanvas = dynamic(() => import('./UniverseCanvas'), { ssr: false, loading: () => null })

/**
 * Persistent WebGL universe behind every page. Skipped entirely for reduced motion, Save-Data,
 * missing WebGL or `?nowebgl` — the CSS starfield (.cosmos) remains as the fallback.
 */
export function Universe() {
  const [tier, setTier] = useState<QualityTier>('off')

  useEffect(() => {
    let cancelled = false
    const start = () => {
      if (!cancelled) setTier(detectTier())
    }
    // Wait for idle so the 3D chunk never competes with LCP / first input.
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    const id = ric ? ric(start, { timeout: 1500 }) : window.setTimeout(start, 600)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setTier(detectTier())
    mq.addEventListener('change', onChange)
    return () => {
      cancelled = true
      if (!ric) window.clearTimeout(id)
      mq.removeEventListener('change', onChange)
    }
  }, [])

  if (tier === 'off') return null
  return <UniverseCanvas tier={tier} />
}
