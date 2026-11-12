'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { REDUCED_MOTION_QUERY } from '@/lib/motion/presets'

/** A light line that draws itself as its parent scrolls through the viewport (scrubbed ScrollTrigger). */
export function ScrollLine({ className, axis = 'y' }: { className?: string; axis?: 'x' | 'y' }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const fill = ref.current?.firstElementChild as HTMLElement | null
    const host = ref.current?.parentElement
    if (!fill || !host) return
    const mm = gsap.matchMedia()
    mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
      gsap.fromTo(
        fill,
        { [axis === 'y' ? 'scaleY' : 'scaleX']: 0 },
        { [axis === 'y' ? 'scaleY' : 'scaleX']: 1, ease: 'none', scrollTrigger: { trigger: host, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 } },
      )
    })
    return () => mm.revert()
  })
  return (
    <span ref={ref} aria-hidden="true" className={`scroll-line scroll-line--${axis} ${className ?? ''}`}>
      <span />
    </span>
  )
}
