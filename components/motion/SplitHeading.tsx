'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import { motion, REDUCED_MOTION_QUERY } from '@/lib/motion/presets'

interface Props {
  as?: ElementType
  children: ReactNode
  className?: string
  /** 'load' animates immediately (hero); 'view' waits until scrolled into view. */
  trigger?: 'load' | 'view'
  delay?: number
  id?: string
}

/** Masked line-rise heading (SplitText). Accessible: SplitText keeps aria-label on the parent. */
export function SplitHeading({ as: Tag = 'h2', children, className, trigger = 'view', delay = 0, id }: Props) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        let split: SplitText | null = null
        const run = () => {
          split = SplitText.create(el, {
            type: 'lines,words',
            mask: 'lines',
            autoSplit: true,
            onSplit: self =>
              gsap.from(self.lines, {
                yPercent: motion.mask.yPercent,
                duration: motion.mask.duration,
                ease: motion.mask.ease,
                stagger: motion.mask.stagger,
                delay,
                scrollTrigger: trigger === 'view' ? { trigger: el, start: 'top 85%', once: true } : undefined,
              }),
          })
          gsap.set(el, { autoAlpha: 1, animation: 'none' })
        }
        if (document.fonts?.status === 'loaded') run()
        else document.fonts.ready.then(run)
        return () => split?.revert()
      })
      mm.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(el, { autoAlpha: 1, animation: 'none' })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} id={id} className={className} data-split>
      {children}
    </Tag>
  )
}
