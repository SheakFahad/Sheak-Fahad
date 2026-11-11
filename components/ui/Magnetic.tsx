'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { motion } from '@/lib/motion/presets'

/** Magnetic hover (fine pointers, no reduced motion). Wraps a single interactive child. */
export function Magnetic({ children, strength = motion.magnetic.strength }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const xTo = gsap.quickTo(el, 'x', { duration: motion.magnetic.duration, ease: motion.magnetic.ease })
        const yTo = gsap.quickTo(el, 'y', { duration: motion.magnetic.duration, ease: motion.magnetic.ease })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - r.left - r.width / 2) * strength)
          yTo((e.clientY - r.top - r.height / 2) * strength)
        }
        const leave = () => {
          xTo(0)
          yTo(0)
        }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        return () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', leave)
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <span ref={ref} className="inline-flex will-change-transform">
      {children}
    </span>
  )
}
