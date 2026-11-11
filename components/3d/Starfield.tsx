'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRandom, randomOnSphere } from './random'

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (60.0 / -mv.z);
    vColor = aColor;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase) + aPhase * 12.0);
  }
`

const fragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor, a * vTwinkle * uOpacity);
  }
`

const PALETTE = ['#f5f7ff', '#f5f7ff', '#cfe0ff', '#51e5ff', '#a678ff', '#4263ff'].map(c => new THREE.Color(c))

function buildGeometry(count: number) {
  const rand = createRandom(2026)
  const pos = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const phase = new Float32Array(count)
  const color = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos.set(randomOnSphere(rand, 14 + rand() * 46), i * 3)
    size[i] = 0.6 + rand() ** 3 * 3.2
    phase[i] = rand()
    const c = PALETTE[Math.floor(rand() * PALETTE.length)]!
    color.set([c.r, c.g, c.b], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
  return g
}

/** Twinkling star shell in a single draw call (custom point shader, no per-frame allocation). */
export function Starfield({ count, opacity }: { count: number; opacity: number }) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => buildGeometry(count), [count])
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0 } }), [])

  useFrame((state, delta) => {
    const u = material.current?.uniforms
    if (u) {
      u.uTime!.value += delta
      u.uPixelRatio!.value = state.viewport.dpr
      u.uOpacity!.value = THREE.MathUtils.damp(u.uOpacity!.value, opacity, 2.5, delta)
    }
    if (points.current) {
      points.current.rotation.y += delta * 0.006
      points.current.rotation.x += delta * 0.002
    }
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
