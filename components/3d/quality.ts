'use client'

export type QualityTier = 'off' | 'low' | 'medium' | 'high'

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Picks the 3D quality tier (docs/3D_ANIMATION_PLAN.md):
 * off  — reduced motion, no WebGL, Save-Data, or ?nowebgl
 * low  — touch/coarse pointer or narrow screens or low-memory devices
 * medium — tablets / mid devices
 * high — desktop with a fine pointer
 */
export function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'off'
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    nav.connection?.saveData ||
    new URLSearchParams(location.search).has('nowebgl') ||
    !hasWebGL()
  )
    return 'off'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const w = window.innerWidth
  if (coarse || w < 768 || (nav.deviceMemory ?? 8) <= 3) return 'low'
  if (w < 1280 || (nav.deviceMemory ?? 8) <= 4) return 'medium'
  return 'high'
}

export const TIER_SETTINGS = {
  low: { stars: 900, shards: 14, dpr: [1, 1.25] as [number, number], glass: false },
  medium: { stars: 1800, shards: 26, dpr: [1, 1.5] as [number, number], glass: false },
  high: { stars: 2800, shards: 40, dpr: [1, 1.75] as [number, number], glass: true },
} as const
