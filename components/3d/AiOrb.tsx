'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { nexusStore } from '@/lib/nexus/store'
import { cometMaterial, easeOut, lockToRect, seg } from './dom-lock'

const coreVert = /* glsl */ `
  varying vec3 vN; varying vec3 vP;
  void main() {
    vN = normalize(normalMatrix * normal);
    vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const coreFrag = /* glsl */ `
  uniform float uTime; uniform float uGlow; uniform float uOpacity;
  varying vec3 vN; varying vec3 vP;
  void main() {
    float f = pow(1.0 - max(dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    float bands = 0.5 + 0.5 * sin(vP.y * 9.0 + uTime * 1.6 + sin(vP.x * 6.0 + uTime) * 1.5);
    vec3 deep = vec3(0.04, 0.07, 0.22);
    vec3 col = mix(deep, vec3(0.26, 0.39, 1.0), bands * 0.45) + mix(vec3(0.32, 0.9, 1.0), vec3(0.65, 0.47, 1.0), vP.y + 0.5) * f * (1.2 + uGlow);
    gl_FragColor = vec4(col * uOpacity, uOpacity);
  }
`
const haloFrag = /* glsl */ `
  uniform float uOpacity; uniform float uGlow;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float a = smoothstep(0.5, 0.18, d) * (0.35 + uGlow * 0.4) * uOpacity;
    gl_FragColor = vec4(vec3(0.32, 0.75, 1.0) * a, a);
  }
`
const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const _c = new THREE.Vector3()

/**
 * Floating 3D assistant orb on the homepage (shared canvas). Locked to the DOM slot `[data-ai-anchor]`,
 * it drifts gently inside that box, blinks, tracks the pointer and brightens on hover/focus.
 */
export function AiOrb() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const glow = useRef(0)

  const mats = useMemo(
    () => ({
      core: new THREE.ShaderMaterial({
        vertexShader: coreVert,
        fragmentShader: coreFrag,
        uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uOpacity: { value: 0 } },
        transparent: true,
        toneMapped: false,
      }),
      halo: new THREE.ShaderMaterial({
        vertexShader: haloVert,
        fragmentShader: haloFrag,
        uniforms: { uGlow: { value: 0 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      eye: new THREE.MeshBasicMaterial({ color: '#9ff6ff', transparent: true, opacity: 0, toneMapped: false }),
      ring: cometMaterial('#51e5ff', '#ff5cf0', 0.25, 0.25, 40),
    }),
    [],
  )
  useEffect(() => () => Object.values(mats).forEach(m => m.dispose()), [mats])

  useFrame((state, delta) => {
    const g = root.current
    const el = nexusStore.aiAnchor
    const size = g && el && el.isConnected ? lockToRect(el, state.size, state.camera, _c) : 0
    if (!g) return
    g.visible = size > 0
    if (!size) return
    const t = state.clock.elapsedTime
    const appear = easeOut(seg(nexusStore.intro, 0.7, 1))

    // gentle idle drift inside the slot (never leaves its box)
    g.position.set(_c.x + Math.sin(t * 0.7) * size * 0.08, _c.y + Math.sin(t * 1.1) * size * 0.07, 0.2)
    const hovered = nexusStore.aiHover
    glow.current = THREE.MathUtils.damp(glow.current, hovered ? 1 : 0, 6, delta)
    g.scale.setScalar(size * 0.32 * (1 + glow.current * 0.12) * (0.6 + 0.4 * appear))

    if (body.current) {
      body.current.rotation.y = THREE.MathUtils.damp(body.current.rotation.y, state.pointer.x * 0.5, 4, delta)
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, -state.pointer.y * 0.3, 4, delta)
    }
    // blink every ~4 s
    if (eyes.current) eyes.current.scale.y = (t % 4.2) > 4.05 ? 0.1 : 1

    setOpacity(mats, appear, glow.current, t)
  })

  return (
    <group ref={root} visible={false}>
      <mesh position={[0, 0, -0.4]} material={mats.halo} renderOrder={5}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>
      <group ref={body}>
        <mesh material={mats.core} renderOrder={6}>
          <sphereGeometry args={[0.62, 48, 32]} />
        </mesh>
        <group ref={eyes} position={[0, 0.06, 0.58]}>
          {[-0.17, 0.17].map(x => (
            <mesh key={x} position={[x, 0, 0]} material={mats.eye} renderOrder={7}>
              <capsuleGeometry args={[0.045, 0.1, 6, 12]} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh rotation={[1.2, 0.2, 0]} material={mats.ring} renderOrder={6}>
        <torusGeometry args={[0.95, 0.012, 8, 160]} />
      </mesh>
    </group>
  )
}

function setOpacity(m: { core: THREE.ShaderMaterial; halo: THREE.ShaderMaterial; eye: THREE.MeshBasicMaterial; ring: THREE.ShaderMaterial }, a: number, glow: number, t: number) {
  m.core.uniforms.uTime!.value = t
  m.core.uniforms.uGlow!.value = glow
  m.core.uniforms.uOpacity!.value = a
  m.halo.uniforms.uGlow!.value = glow
  m.halo.uniforms.uOpacity!.value = a
  m.eye.opacity = a
  m.ring.uniforms.uTime!.value = t
  m.ring.uniforms.uOpacity!.value = a * (0.7 + glow * 0.3)
}
