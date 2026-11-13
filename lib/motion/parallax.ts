'use client'

/**
 * One shared, damped parallax input for every layer (WebGL + DOM).
 * - Only a mouse/pen on a hover-capable device drives it; touch devices and reduced motion keep it at 0.
 * - Targets are normalised to -1..1 (y up); `x`/`y` ease toward them, so no layer ever snaps to the cursor.
 * - When the pointer leaves the window everything glides back to rest.
 */
export const parallax = { x: 0, y: 0, tx: 0, ty: 0, enabled: false }

const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
let started = false

export function startParallax() {
  if (started || typeof window === 'undefined') return
  started = true
  const mq = window.matchMedia(QUERY)
  const sync = () => {
    parallax.enabled = mq.matches
    if (!mq.matches) parallax.tx = parallax.ty = 0
  }
  sync()
  mq.addEventListener('change', sync)
  window.addEventListener(
    'pointermove',
    e => {
      if (!parallax.enabled || e.pointerType === 'touch') return
      parallax.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
      parallax.ty = Math.max(-1, Math.min(1, -((e.clientY / window.innerHeight) * 2 - 1)))
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', () => {
    parallax.tx = parallax.ty = 0
  })
}

/** Advance the damped values once per frame (called by the canvas camera rig). `lambda` ≈ 2.4 → ~0.4 s settle. */
export function stepParallax(delta: number, lambda = 2.4) {
  const k = 1 - Math.exp(-lambda * Math.min(delta, 0.1))
  parallax.x += (parallax.tx - parallax.x) * k
  parallax.y += (parallax.ty - parallax.y) * k
}
