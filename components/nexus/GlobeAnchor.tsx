'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion/presets'
import { nexusStore } from '@/lib/nexus/store'

/**
 * DOM anchor for the shared-canvas 3D Earth on pages other than NEXUS (e.g. ATLAS).
 * Drag or use the arrow keys to rotate; a CSS globe shows when WebGL is off.
 */
export function GlobeAnchor({ label, className }: { label: string; className?: string }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node) return
    nexusStore.globe = node
    nexusStore.env = null
    if (prefersReducedMotion()) nexusStore.intro = 1
    else {
      nexusStore.intro = 0
      gsap.to(nexusStore, { intro: 1, duration: 2.6, ease: 'power2.inOut', delay: 0.3 })
    }
    let dragging = false
    let lastX = 0
    let lastT = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastT = performance.now()
      node.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const now = performance.now()
      const dt = Math.max(8, now - lastT) / 1000
      nexusStore.spin = Math.max(-8, Math.min(8, (((e.clientX - lastX) / Math.max(1, node.clientWidth)) * Math.PI) / dt))
      lastX = e.clientX
      lastT = now
    }
    const up = () => (dragging = false)
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nexusStore.spin = -2.5
      else if (e.key === 'ArrowRight') nexusStore.spin = 2.5
      else return
      e.preventDefault()
    }
    node.addEventListener('pointerdown', down)
    node.addEventListener('pointermove', move)
    node.addEventListener('pointerup', up)
    node.addEventListener('pointercancel', up)
    node.addEventListener('keydown', key)
    return () => {
      if (nexusStore.globe === node) nexusStore.globe = null
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', up)
      node.removeEventListener('pointercancel', up)
      node.removeEventListener('keydown', key)
    }
  }, [])

  return (
    <div ref={el} data-globe-core role="img" tabIndex={0} aria-label={label} className={`nx-globe-core relative aspect-square cursor-grab touch-pan-y rounded-full ${className ?? ''}`}>
      <span aria-hidden="true" className="nx-globe-fallback" />
    </div>
  )
}
