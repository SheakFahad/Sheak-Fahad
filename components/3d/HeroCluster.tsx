'use client'

import { Float } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRandom } from './random'

interface Props {
  visible: boolean
  shards: number
  glass: boolean
  /** 0 at the top of the page → 1 after one viewport of scrolling. */
  scroll: React.RefObject<number>
}

const SHARD_COLORS = ['#4263ff', '#51e5ff', '#a678ff'].map(c => new THREE.Color(c))

/**
 * "Portal" around the hero portrait: a glass core, two orbit rings and instanced orbiting shards.
 * It lives BEHIND the DOM portrait (the photo itself is never rendered in WebGL or altered).
 */
export function HeroCluster({ visible, shards, glass, scroll }: Props) {
  const root = useRef<THREE.Group>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const inst = useRef<THREE.InstancedMesh>(null)
  const viewport = useThree(s => s.viewport)
  const size = useThree(s => s.size)

  const data = useMemo(() => {
    const rand = createRandom(221)
    return Array.from({ length: shards }, (_, i) => ({
      radius: 2.0 + rand() * 1.1,
      speed: (0.15 + rand() * 0.35) * (i % 2 ? 1 : -1),
      tilt: (rand() - 0.5) * 0.9,
      offset: rand() * Math.PI * 2,
      scale: 0.06 + rand() * 0.14,
      spin: rand() * 2,
    }))
  }, [shards])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const m = inst.current
    if (!m) return
    data.forEach((_, i) => m.setColorAt(i, SHARD_COLORS[i % SHARD_COLORS.length]!))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [data])

  // Desktop: centred on the portrait column (right side). Mobile: smaller, upper right.
  const wide = size.width >= 1024
  const baseX = wide ? viewport.width * 0.24 : viewport.width * 0.4
  const baseY = wide ? 0 : viewport.height * 0.36
  const baseScale = wide ? 1 : 0.42

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const s = scroll.current ?? 0
    const target = visible ? baseScale * (1 - Math.min(s, 1) * 0.35) : 0.0001
    easing.damp3(g.scale, [target, target, target], 0.35, delta)
    easing.damp3(g.position, [baseX + state.pointer.x * 0.25, baseY + s * viewport.height * 0.45 + state.pointer.y * 0.2, 0], 0.4, delta)
    g.visible = g.scale.x > 0.002

    const t = state.clock.elapsedTime
    if (ringA.current) ringA.current.rotation.z += delta * 0.12
    if (ringB.current) ringB.current.rotation.z -= delta * 0.08
    const m = inst.current
    if (m) {
      data.forEach((d, i) => {
        const a = d.offset + t * d.speed
        dummy.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius * 0.55 + Math.sin(a * 2) * d.tilt * 0.3, Math.sin(a) * d.tilt)
        dummy.rotation.set(t * d.spin, t * d.spin * 0.7, 0)
        dummy.scale.setScalar(d.scale)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={root} scale={0.0001}>
      <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.6}>
        {/* glass core sits behind the photo; visible around its edges */}
        <mesh position={[0, 0, -1.2]} visible={wide}>
          <icosahedronGeometry args={[1.35, 1]} />
          {glass ? (
            <meshPhysicalMaterial
              color="#9fb2ff"
              roughness={0.08}
              metalness={0.1}
              transmission={1}
              thickness={1.4}
              ior={1.45}
              iridescence={0.6}
              iridescenceIOR={1.3}
              clearcoat={1}
              flatShading
            />
          ) : (
            <meshStandardMaterial color="#4263ff" roughness={0.25} metalness={0.7} flatShading emissive="#101a35" />
          )}
        </mesh>
        <mesh ref={ringA} rotation={[Math.PI / 2.4, 0.2, 0]}>
          <torusGeometry args={[2.35, 0.018, 16, 220]} />
          <meshBasicMaterial color="#51e5ff" toneMapped={false} />
        </mesh>
        <mesh ref={ringB} rotation={[Math.PI / 1.7, -0.35, 0.4]}>
          <torusGeometry args={[2.9, 0.012, 16, 220]} />
          <meshBasicMaterial color="#a678ff" toneMapped={false} transparent opacity={0.8} />
        </mesh>
      </Float>
      <instancedMesh ref={inst} args={[undefined, undefined, shards]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.2} metalness={0.6} emissive="#1a2a6c" emissiveIntensity={0.6} />
      </instancedMesh>
    </group>
  )
}
