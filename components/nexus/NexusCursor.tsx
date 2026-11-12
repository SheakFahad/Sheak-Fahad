'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Desktop-only cursor halo (fine pointer, motion allowed). The native cursor stays visible —
 * this is a soft light that trails it and grows over interactive elements.
 */
export function NexusCursor() {
  const ring = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const el = ring.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' })
      const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' })
      let shown = false
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        if (!shown) {
          gsap.set(el, { x: e.clientX, y: e.clientY })
          gsap.to(el, { autoAlpha: 1, duration: 0.3 })
          shown = true
        }
        x(e.clientX)
        y(e.clientY)
        const hot = (e.target as HTMLElement | null)?.closest('a,button,[role="img"][tabindex]')
        el.classList.toggle('is-hot', Boolean(hot))
      }
      const leave = () => {
        gsap.to(el, { autoAlpha: 0, duration: 0.3 })
        shown = false
      }
      window.addEventListener('pointermove', move, { passive: true })
      document.documentElement.addEventListener('pointerleave', leave)
      return () => {
        window.removeEventListener('pointermove', move)
        document.documentElement.removeEventListener('pointerleave', leave)
      }
    })
    return () => mm.revert()
  })

  return <div ref={ring} aria-hidden="true" className="nx-cursor" />
}
