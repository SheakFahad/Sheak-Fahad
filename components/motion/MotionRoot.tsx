'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { usePathname } from '@/i18n/navigation'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { setLenis } from '@/lib/motion/lenis'
import { motion, REDUCED_MOTION_QUERY } from '@/lib/motion/presets'

/**
 * Global motion runtime:
 * - Lenis smooth scrolling driven by gsap.ticker (off for reduced motion)
 * - Batched scroll reveals for every [data-reveal] element, re-run on route change
 * - ScrollTrigger refresh after fonts load
 */
export function MotionRoot() {
  const pathname = usePathname()

  // Smooth scroll lifecycle (once)
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY)
    let lenis: Lenis | null = null
    const tick = (time: number) => lenis?.raf(time * 1000)

    const start = () => {
      if (mq.matches || lenis) return
      lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: false })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      setLenis(lenis)
    }
    const stop = () => {
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
      setLenis(null)
    }
    const onChange = () => (mq.matches ? stop() : start())

    start()
    mq.addEventListener('change', onChange)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      mq.removeEventListener('change', onChange)
      stop()
    }
  }, [])

  // Reveals — re-evaluated for each page
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        { reduce: REDUCED_MOTION_QUERY, ok: '(prefers-reduced-motion: no-preference)' },
        ctx => {
          const els = gsap.utils.toArray<HTMLElement>('[data-reveal]')
          if (!els.length) return
          if (ctx.conditions?.reduce) {
            gsap.set(els, { autoAlpha: 1 })
            return
          }
          // Take over from the CSS failsafe: hidden until revealed.
          gsap.set(els, { autoAlpha: 0, animation: 'none' })
          ScrollTrigger.batch(els, {
            start: motion.reveal.start,
            once: true,
            onEnter: batch =>
              gsap.fromTo(
                batch,
                { y: motion.reveal.y, autoAlpha: 0 },
                {
                  y: 0,
                  autoAlpha: 1,
                  duration: motion.reveal.duration,
                  ease: motion.reveal.ease,
                  stagger: motion.reveal.stagger,
                  overwrite: true,
                  clearProps: 'transform',
                },
              ),
          })
          ScrollTrigger.refresh()
        },
      )
      return () => mm.revert()
    },
    { dependencies: [pathname], revertOnUpdate: true },
  )

  return null
}
