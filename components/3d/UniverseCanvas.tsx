'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import { parallax, startParallax, stepParallax } from '@/lib/motion/parallax'
import { AiOrb } from './AiOrb'
import { NexusEnvironment } from './NexusEnvironment'
import { NexusGlobe } from './NexusGlobe'
import { StationBackdrop, variantForPath } from './StationBackdrop'
import { TIER_SETTINGS, type QualityTier } from './quality'
import { Starfield } from './Starfield'

/** Camera: damped mouse parallax + scroll dolly. Reads refs only — no React state per frame. */
function Rig({ scroll }: { scroll: React.RefObject<number> }) {
  useEffect(() => startParallax(), [])
  // Priority -1: runs before scene objects that project DOM rectangles into the world.
  useFrame((state, delta) => {
    stepParallax(delta)
    const s = Math.min(scroll.current ?? 0, 3)
    // gentle camera drift only — each layer adds its own depth-scaled parallax
    easing.damp3(state.camera.position, [parallax.x * 0.22, parallax.y * 0.14, 8 + s * 0.9], 0.6, delta)
    state.camera.lookAt(0, 0, 0)
  }, -1)
  return null
}

export default function UniverseCanvas({ tier }: { tier: Exclude<QualityTier, 'off'> }) {
  const settings = TIER_SETTINGS[tier]
  const pathname = usePathname()
  const isHome = pathname === '/'
  const scroll = useRef(0)
  const [dpr, setDpr] = useState<number>(settings.dpr[1])
  const [running, setRunning] = useState(true)
  const [light, setLight] = useState(false)

  // Scroll progress in viewport units (ref only)
  useEffect(() => {
    const onScroll = () => (scroll.current = window.scrollY / Math.max(1, window.innerHeight))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Pause when the tab is hidden
  useEffect(() => {
    const onVis = () => setRunning(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Follow the site theme
  useEffect(() => {
    const el = document.documentElement
    const read = () => setLight(el.dataset.theme === 'light')
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])

  return (
    <Canvas
      aria-hidden="true"
      className="!fixed inset-0 -z-[1] !h-dvh !w-screen"
      style={{ pointerEvents: 'none' }}
      dpr={dpr}
      frameloop={running ? 'always' : 'never'}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(settings.dpr[1])} flipflops={3} onFallback={() => setDpr(1)} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 4, 6]} intensity={60} color="#51e5ff" />
      <pointLight position={[-6, -3, 4]} intensity={50} color="#a678ff" />
      <directionalLight position={[0, 5, 8]} intensity={1.2} color="#f5f7ff" />
      <Starfield count={settings.stars} opacity={light ? 0.35 : 1} />
      {isHome && (
        <>
          <NexusEnvironment tier={tier} light={light} />
          <Suspense fallback={null}>
            <NexusGlobe tier={tier} />
          </Suspense>
          <AiOrb />
        </>
      )}
      {!isHome && <StationBackdrop variant={variantForPath(pathname)} light={light} />}
      {variantForPath(pathname) === 'atlas' && !isHome && (
        <Suspense fallback={null}>
          <NexusGlobe tier={tier} />
        </Suspense>
      )}
      <Rig scroll={scroll} />
    </Canvas>
  )
}
