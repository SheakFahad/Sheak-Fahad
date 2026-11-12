'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { heroStore, SKILL_ACCENTS } from '@/lib/hero/store'
import { createRandom, randomOnSphere } from './random'

const PORTRAIT = '/images/hero/portrait-cutout.webp'
const PORTRAIT_SM = '/images/hero/portrait-cutout-sm.webp'
const ASPECT = 1188 / 1100

// Re-used math objects (no per-frame allocation)
const _ndc = new THREE.Vector2()
const _ray = new THREE.Raycaster()
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _color = new THREE.Color()

const seg = (t: number, a: number, b: number) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function screenToWorld(x: number, y: number, w: number, h: number, camera: THREE.Camera, out: THREE.Vector3) {
  _ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1)
  _ray.setFromCamera(_ndc, camera)
  return _ray.ray.intersectPlane(_plane, out)
}

// ─── Shaders (environment only — never applied to the photo) ────────────────
const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const ringFrag = /* glsl */ `
  uniform float uTime; uniform float uSpeed; uniform float uOpacity; uniform float uBase; uniform float uDash;
  uniform vec3 uColorA; uniform vec3 uColorB;
  varying vec2 vUv;
  void main() {
    float u = fract(vUv.x - uTime * uSpeed);
    float comet = pow(u, 7.0);                         // bright head with a long fading tail
    float dash = 0.55 + 0.45 * step(0.5, fract(vUv.x * uDash));
    float a = (uBase * dash + comet * 1.6) * uOpacity;
    vec3 col = mix(uColorA, uColorB, comet);
    gl_FragColor = vec4(col * a, a);
  }
`
const glowFrag = /* glsl */ `
  uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5, 0.55));
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * uOpacity;
    vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 0.5, d));
    gl_FragColor = vec4(col * a, a);
  }
`
// Rim light: uses ONLY the cutout's alpha to draw a glow BEHIND the silhouette.
const rimFrag = /* glsl */ `
  uniform sampler2D uMask; uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = texture2D(uMask, vUv).a;
    a *= smoothstep(0.0, 0.18, vUv.y) * uOpacity;      // fade toward the cropped bottom edge
    vec3 col = mix(uColorB, uColorA, vUv.y);
    gl_FragColor = vec4(col * a, a);
  }
`
const dustVert = /* glsl */ `
  attribute vec3 aStart; attribute float aSize; attribute float aSeed;
  uniform float uProgress; uniform float uTime; uniform float uPixelRatio; uniform float uScale;
  varying float vAlpha;
  void main() {
    float p = smoothstep(0.0, 1.0, clamp(uProgress * 1.15 - aSeed * 0.15, 0.0, 1.0));
    vec3 pos = mix(aStart, position, p);
    float ang = uTime * (0.08 + aSeed * 0.12);
    pos.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * pos.xz;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale * (12.0 / -mv.z);
    vAlpha = (0.35 + 0.65 * p) * (0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 30.0));
  }
`
const dustFrag = /* glsl */ `
  uniform float uOpacity; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a * vAlpha * uOpacity;
    gl_FragColor = vec4(vec3(0.62, 0.86, 1.0) * a, a);
  }
`

const BLUE = new THREE.Color('#4263ff')
const CYAN = new THREE.Color('#51e5ff')
const VIOLET = new THREE.Color('#a678ff')

function ringMaterial(colorA: THREE.Color, colorB: THREE.Color, speed: number, base: number, dash: number) {
  return new THREE.ShaderMaterial({
    vertexShader: ringVert,
    fragmentShader: ringFrag,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uOpacity: { value: 0 },
      uBase: { value: base },
      uDash: { value: dash },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

interface Props {
  tier: 'low' | 'medium' | 'high'
}

/**
 * Hero centrepiece in the shared canvas: the ORIGINAL portrait cutout on a plane (standard material,
 * no tone mapping, sRGB — pixels shown exactly as photographed), locked to the DOM stage, inside a
 * holographic portal: back glow, rim light, orbit rings with light trails and converging dust.
 */
export function HeroPortal({ tier }: Props) {
  const dustCount = tier === 'low' ? 260 : tier === 'medium' ? 520 : 900
  const map = useTexture(tier === 'low' ? PORTRAIT_SM : PORTRAIT, t => {
    const tex = Array.isArray(t) ? t[0] : t
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
    }
  })

  const root = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const portrait = useRef<THREE.Mesh>(null)
  const accent = useRef<THREE.PointLight>(null)
  const dustMat = useRef<THREE.ShaderMaterial>(null)
  const glowMat = useRef<THREE.ShaderMaterial>(null)
  const rimMat = useRef<THREE.ShaderMaterial>(null)
  const discEdge = useRef<THREE.MeshBasicMaterial>(null)
  const rings = useRef<THREE.Mesh[]>([])

  // Wipe-reveal of the photo via a clipping plane (geometry clipping — no colour change).
  // Requires renderer.localClippingEnabled (set in UniverseCanvas onCreated).
  const clipPlanes = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), -1000)], [])
  const portraitMat = useRef<THREE.MeshBasicMaterial>(null)

  // Soft fade of the cropped bottom edge (alpha only).
  const bottomFade = useMemo(() => {
    const h = 64
    const data = new Uint8Array(h * 4)
    for (let i = 0; i < h; i++) {
      const v = i / (h - 1)
      const a = Math.round(255 * Math.min(1, v / 0.1) ** 1.5)
      data.set([a, a, a, 255], i * 4)
    }
    const tex = new THREE.DataTexture(data, 1, h, THREE.RGBAFormat)
    tex.needsUpdate = true
    return tex
  }, [])

  const ringMats = useMemo(
    () => [
      ringMaterial(CYAN, new THREE.Color('#ffffff'), 0.08, 0.32, 48),
      ringMaterial(VIOLET, CYAN, -0.06, 0.22, 64),
      ringMaterial(BLUE, VIOLET, 0.045, 0.12, 0),
      ringMaterial(CYAN, VIOLET, -0.11, 0.0, 0), // pure light trail
    ],
    [],
  )
  useEffect(() => () => ringMats.forEach(m => m.dispose()), [ringMats])

  const dust = useMemo(() => {
    const rand = createRandom(1794)
    const end = new Float32Array(dustCount * 3)
    const start = new Float32Array(dustCount * 3)
    const size = new Float32Array(dustCount)
    const seed = new Float32Array(dustCount)
    for (let i = 0; i < dustCount; i++) {
      const [x, y, z] = randomOnSphere(rand, 0.55 + rand() * 0.45)
      end.set([x * 1.05, y * 0.75 + 0.05, -Math.abs(z) * 0.6 - 0.05], i * 3)
      const st = randomOnSphere(rand, 2.5 + rand() * 3)
      start.set([st[0], st[1], -Math.abs(st[2])], i * 3)
      size[i] = 0.6 + rand() ** 2 * 2.2
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(end, 3))
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [dustCount])

  const glowUniforms = useMemo(() => ({ uColorA: { value: BLUE.clone() }, uColorB: { value: VIOLET.clone() }, uOpacity: { value: 0 } }), [])
  const rimUniforms = useMemo(() => ({ uMask: { value: map }, uColorA: { value: CYAN.clone() }, uColorB: { value: VIOLET.clone() }, uOpacity: { value: 0 } }), [map])
  const dustUniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uOpacity: { value: 0 } }),
    [],
  )

  useEffect(
    () => () => {
      heroStore.glReady = false
      delete document.documentElement.dataset.heroGl
    },
    [],
  )

  useFrame((state, delta) => {
    const g = root.current
    const stage = heroStore.stage
    if (!g) return
    if (!stage || !stage.isConnected) {
      g.visible = false
      if (heroStore.glReady) {
        heroStore.glReady = false
        delete document.documentElement.dataset.heroGl
      }
      return
    }

    // Lock the portrait plane to the DOM stage rectangle.
    const r = stage.getBoundingClientRect()
    const { width: w, height: h } = state.size
    if (r.bottom < -h * 0.5 || r.top > h * 1.5) {
      g.visible = false
      return
    }
    if (!screenToWorld(r.left + r.width / 2, r.top + r.height / 2, w, h, state.camera, _a)) return
    if (!screenToWorld(r.left + r.width / 2, r.bottom, w, h, state.camera, _b)) return
    const worldH = Math.abs(_a.y - _b.y) * 2
    g.visible = true
    g.position.copy(_a)
    g.scale.setScalar(worldH)

    if (!heroStore.glReady) {
      heroStore.glReady = true
      document.documentElement.dataset.heroGl = '1'
    }

    const t = state.clock.elapsedTime
    const intro = heroStore.intro
    const pEnv = easeOut(seg(intro, 0, 0.45))
    const pRings = easeOut(seg(intro, 0.25, 0.7))
    const pPortrait = easeOut(seg(intro, 0.4, 0.85))
    const pTrails = easeOut(seg(intro, 0.6, 1))

    // portrait reveal: bottom → top in world space
    const bottomY = g.position.y - worldH / 2
    // plane normal (0,-1,0) keeps y <= constant
    const plane = portraitMat.current?.clippingPlanes?.[0]
    if (plane) plane.constant = pPortrait >= 1 ? 1e6 : bottomY + worldH * pPortrait * 1.05

    // gentle float + pointer tilt of the whole composition (not the photo pixels)
    if (inner.current) {
      easing.dampE(inner.current.rotation, [state.pointer.y * 0.06, state.pointer.x * 0.12, 0], 0.5, delta)
      inner.current.position.y = Math.sin(t * 0.8) * 0.012
    }

    if (glowMat.current) glowMat.current.uniforms.uOpacity!.value = pEnv * 0.9
    if (rimMat.current) rimMat.current.uniforms.uOpacity!.value = pPortrait * 0.55
    if (discEdge.current) discEdge.current.opacity = pRings

    const dm = dustMat.current
    if (dm) {
      dm.uniforms.uProgress!.value = pEnv
      dm.uniforms.uTime!.value = t
      dm.uniforms.uPixelRatio!.value = state.viewport.dpr
      dm.uniforms.uScale!.value = Math.max(0.6, worldH / 3)
      dm.uniforms.uOpacity!.value = Math.min(1, intro * 2)
    }

    ringMats.forEach((m, i) => {
      m.uniforms.uTime!.value = t
      m.uniforms.uOpacity!.value = i === 3 ? pTrails : pRings
    })
    rings.current.forEach((ring, i) => {
      if (!ring) return
      ring.rotation.z += delta * (i % 2 ? -0.05 : 0.07)
      const s = 0.6 + 0.4 * pRings
      ring.scale.setScalar(s)
    })

    // Accent light follows the hovered / selected skill
    const idx = heroStore.hoverSkill >= 0 ? heroStore.hoverSkill : heroStore.activeSkill
    if (accent.current) {
      _color.set(idx >= 0 ? SKILL_ACCENTS[idx % SKILL_ACCENTS.length]! : '#51e5ff')
      accent.current.color.lerp(_color, 1 - Math.exp(-delta * 6))
      accent.current.intensity = THREE.MathUtils.damp(accent.current.intensity, idx >= 0 ? 6 : 3, 4, delta)
    }
  })

  return (
    <group ref={root} visible={false}>
      <group ref={inner}>
        {/* back glow */}
        <mesh position={[0, 0.05, -0.6]} renderOrder={-3}>
          <planeGeometry args={[2.6, 2.6]} />
          <shaderMaterial
            ref={glowMat}
            vertexShader={ringVert}
            fragmentShader={glowFrag}
            uniforms={glowUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* halo behind the head — entirely behind the photo plane, never over the face */}
        <group position={[0, 0.14, -0.32]}>
          <mesh renderOrder={-2}>
            <torusGeometry args={[0.47, 0.0035, 12, 200]} />
            <meshBasicMaterial ref={discEdge} color="#51e5ff" toneMapped={false} transparent opacity={0} />
          </mesh>
        </group>

        {/* rim light — behind the silhouette, built from the cutout alpha only */}
        <mesh position={[0, 0, -0.02]} scale={1.012} renderOrder={-1}>
          <planeGeometry args={[ASPECT, 1]} />
          <shaderMaterial
            ref={rimMat}
            vertexShader={ringVert}
            fragmentShader={rimFrag}
            uniforms={rimUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* THE PHOTO — standard material, untouched pixels */}
        <mesh ref={portrait} renderOrder={0}>
          <planeGeometry args={[ASPECT, 1]} />
          <meshBasicMaterial
            ref={portraitMat}
            map={map}
            alphaMap={bottomFade}
            transparent
            alphaTest={0.02}
            toneMapped={false}
            clippingPlanes={clipPlanes}
          />
        </mesh>

        {/*
          Orbit rings with light trails. Rule: the FRONT arc of every ring stays at chest height
          (negative X tilt → front arc dips below the centre), so nothing ever crosses the face.
          The back arcs pass behind the body and are hidden by it (depth test).
        */}
        <group position={[0, -0.16, 0]}>
          {[
            { r: 0.6, tube: 0.0034, rot: [-1.3, 0.12, 0] as const, pos: [0, 0, 0] as const },
            { r: 0.76, tube: 0.0024, rot: [-1.42, -0.16, 0] as const, pos: [0, -0.03, 0] as const },
            { r: 0.58, tube: 0.0022, rot: [0, 0, 0] as const, pos: [0, 0.3, -0.45] as const }, // halo ring, fully behind
            { r: 0.9, tube: 0.006, rot: [-1.22, 0.08, 0] as const, pos: [0, -0.05, 0] as const }, // light-trail ring
          ].map((ring, i) => (
            <mesh
              key={i}
              ref={el => {
                if (el) rings.current[i] = el
              }}
              position={[ring.pos[0], ring.pos[1], ring.pos[2]]}
              rotation={[ring.rot[0], ring.rot[1], ring.rot[2]]}
              renderOrder={1}
              material={ringMats[i]}
            >
              <torusGeometry args={[ring.r, ring.tube, 8, 320]} />
            </mesh>
          ))}
        </group>

        {/* converging particle dust */}
        <points geometry={dust} renderOrder={2} frustumCulled={false}>
          <shaderMaterial
            ref={dustMat}
            vertexShader={dustVert}
            fragmentShader={dustFrag}
            uniforms={dustUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>

        <pointLight ref={accent} position={[0.55, 0.35, 0.5]} intensity={3} distance={3} color="#51e5ff" />
      </group>
    </group>
  )
}
