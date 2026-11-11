'use client'

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { gsap } from '@/lib/gsap'
import { scrollToTop } from '@/lib/motion/lenis'
import { motion, prefersReducedMotion } from '@/lib/motion/presets'

type Navigate = (href: string) => void
const TransitionContext = createContext<Navigate | null>(null)

/** Curtain page transitions: cover → route change → reveal. Instant navigation under reduced motion. */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const curtain = useRef<HTMLDivElement>(null)
  const covering = useRef(false)
  const pending = useRef<string | null>(null)

  const navigate = useCallback<Navigate>(
    href => {
      const target = href.split('#')[0] || '/'
      if (target === pathname) {
        scrollToTop(false)
        return
      }
      if (prefersReducedMotion() || !curtain.current) {
        router.push(href)
        return
      }
      if (covering.current) return
      covering.current = true
      pending.current = target
      const panels = curtain.current.children
      gsap.set(curtain.current, { display: 'block' })
      gsap.fromTo(
        panels,
        { scaleY: 0, transformOrigin: '50% 100%' },
        {
          scaleY: 1,
          duration: motion.curtain.duration,
          ease: motion.curtain.ease,
          stagger: motion.curtain.offset,
          onComplete: () => router.push(href),
        },
      )
    },
    [pathname, router],
  )

  // Reveal once the new route has rendered
  useEffect(() => {
    if (!covering.current || !curtain.current) return
    scrollToTop(true)
    const el = curtain.current
    gsap.to(el.children, {
      scaleY: 0,
      transformOrigin: '50% 0%',
      duration: motion.curtain.duration,
      ease: motion.curtain.ease,
      stagger: motion.curtain.offset,
      delay: 0.05,
      onComplete: () => {
        gsap.set(el, { display: 'none' })
        covering.current = false
        pending.current = null
      },
    })
  }, [pathname])

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      <div ref={curtain} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden">
        <div className="absolute inset-0 bg-[var(--bg-2)]" style={{ transform: 'scaleY(0)' }} />
        <div className="absolute inset-0" style={{ background: 'var(--grad)', transform: 'scaleY(0)', opacity: 0.9 }} />
        <div className="absolute inset-0 bg-[var(--bg)]" style={{ transform: 'scaleY(0)' }} />
      </div>
    </TransitionContext.Provider>
  )
}

export function useTransitionNavigate(): Navigate | null {
  return useContext(TransitionContext)
}
