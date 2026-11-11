'use client'

import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import { HeroCluster } from './HeroCluster'
import { TIER_SETTINGS, type QualityTier } from './quality'
import { Starfield } from './Starfield'

/** Camera: damped mouse parallax + scroll dolly. Reads refs only — no React state per frame. */
function Rig({ scroll }: { scroll: React.RefObject<number> }) {
  useFrame((state, delta) => {
    const s = Math.min(scroll.current ?? 0, 3)
    easing.damp3(state.camera.position, [state.pointer.x * 0.45, state.pointer.y * 0.3, 8 + s * 0.9], 0.45, delta)
    state.camera.lookAt(0, 0, 0)
  })
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
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(settings.dpr[1])} flipflops={3} onFallback={() => setDpr(1)} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 4, 6]} intensity={60} color="#51e5ff" />
      <pointLight position={[-6, -3, 4]} intensity={50} color="#a678ff" />
      <directionalLight position={[0, 5, 8]} intensity={1.2} color="#f5f7ff" />
      {settings.glass && (
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} color="#4263ff" position={[0, 3, 5]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={2} color="#a678ff" position={[-5, -1, 3]} scale={[4, 6, 1]} />
          <Lightformer form="ring" intensity={2} color="#51e5ff" position={[5, 0, 3]} scale={3} />
        </Environment>
      )}
      <Starfield count={settings.stars} opacity={light ? 0.35 : 1} />
      <HeroCluster visible={isHome} shards={settings.shards} glass={settings.glass} scroll={scroll} />
      <Rig scroll={scroll} />
    </Canvas>
  )
}
