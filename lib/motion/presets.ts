/**
 * Motion presets — the single source of timing for the whole site (docs/DESIGN_SYSTEM.md).
 * Reuse these instead of inventing new durations/eases.
 */
export const motion = {
  reveal: { y: 60, duration: 0.9, ease: 'expo.out', stagger: 0.08, start: 'top 88%' },
  mask: { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.09 },
  clip: { duration: 1.2, ease: 'expo.inOut', scaleFrom: 1.3 },
  hover: { y: -6, duration: 0.35, ease: 'power3.out' },
  magnetic: { duration: 0.6, ease: 'elastic.out(1,0.35)', strength: 0.35 },
  curtain: { duration: 0.7, ease: 'power4.inOut', offset: 0.08 },
  menu: { duration: 0.8, ease: 'expo.out', stagger: 0.04 },
  camera: { duration: 1.6, ease: 'power3.inOut' },
} as const

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}
