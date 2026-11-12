'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { heroStore } from '@/lib/hero/store'
import { nexusStore, STATION_ACCENTS } from '@/lib/nexus/store'
import { BASIC_VERT, cometMaterial, easeOut, lockToRect, seg } from './dom-lock'
import { createRandom, randomOnSphere } from './random'
import { HOLO_CARDS, makeCanvasTexture, drawSFLogo } from './holo-textures'

const PORTRAIT = '/images/hero/portrait-cutout.webp'
const PORTRAIT_SM = '/images/hero/portrait-cutout-sm.webp'
const ASPECT = 1188 / 1100

const _a = new THREE.Vector3()
const _p = new THREE.Vector3()
const _color = new THREE.Color()
/** Uniform write through a helper (keeps per-frame mutation out of React's render data-flow). */
const setU = (m: THREE.ShaderMaterial, k: string, v: number) => {
  m.uniforms[k]!.value = v
}

// ─── Shaders (environment only — never applied to the photo) ────────────────
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
// HUD: segmented rings, tick marks and accent arcs (polar coordinates) — sits BEHIND the photo
const hudFrag = /* glsl */ `
  uniform float uTime; uniform float uOpacity; uniform vec3 uAccent;
  varying vec2 vUv;
  float ring(float r, float r0, float w) { return smoothstep(w, 0.0, abs(r - r0)); }
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x) / 6.28318 + 0.5;
    vec3 cyan = vec3(0.32, 0.9, 1.0);
    float outer = ring(r, 0.97, 0.005) * 0.55;
    float segs = step(0.38, fract(a * 56.0 + uTime * 0.25)) * ring(r, 0.905, 0.016) * step(0.08, fract(a * 4.0 - uTime * 0.02));
    float ticks = step(0.82, fract(a * 144.0)) * step(0.845, r) * step(r, 0.865);
    float a1 = ring(r, 0.8, 0.009) * step(fract(a - uTime * 0.035), 0.16);
    float a2 = ring(r, 0.74, 0.005) * step(0.5, fract(a + uTime * 0.05)) * step(fract(a + uTime * 0.05), 0.78);
    float a3 = ring(r, 0.99, 0.012) * step(fract(a * 3.0 + uTime * 0.04), 0.07);
    vec3 col = cyan * (outer + segs * 0.65 + ticks * 0.55 + a2 * 0.7) + uAccent * a1 * 1.3 + vec3(1.0, 0.36, 0.94) * a3 * 1.5;
    col += vec3(0.26, 0.39, 1.0) * smoothstep(0.8, 0.0, r) * 0.18;
    float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(col * uOpacity, alpha);
  }
`
// Rim light: uses ONLY the cutout's alpha to draw a glow BEHIND the silhouette.
const rimFrag = /* glsl */ `
  uniform sampler2D uMask; uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = texture2D(uMask, vUv).a;
    a *= smoothstep(0.0, 0.18, vUv.y) * uOpacity;
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
    pos.z = min(pos.z, -0.05);                         // always behind the photo plane
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
// Platform: glowing top disc with the SF mark + concentric light rings
const discFrag = /* glsl */ `
  uniform sampler2D uLogo; uniform float uTime; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5; float r = length(p) * 2.0;
    vec3 cyan = vec3(0.32, 0.9, 1.0);
    float base = smoothstep(1.0, 0.0, r) * 0.35;
    float rings = 0.0;
    for (int i = 0; i < 4; i++) { float ri = 0.35 + float(i) * 0.18; rings += smoothstep(0.012, 0.0, abs(r - ri)) * (0.4 + 0.15 * float(i)); }
    float pulse = smoothstep(0.03, 0.0, abs(r - fract(uTime * 0.25))) * (1.0 - r) * 0.8;
    vec4 logo = texture2D(uLogo, vUv);
    vec3 col = vec3(0.2, 0.32, 1.0) * base + cyan * (rings + pulse) + logo.rgb * logo.a * 1.4;
    float alpha = clamp(base + rings + pulse + logo.a, 0.0, 1.0) * smoothstep(1.0, 0.96, r) * uOpacity;
    gl_FragColor = vec4(col * uOpacity, alpha);
  }
`
// Platform tiers + light beam: vertical gradient with a bright lip
const bandFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uLip; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float lip = smoothstep(1.0 - uLip, 1.0, vUv.y);
    float body = vUv.y * 0.35;
    float scan = smoothstep(0.02, 0.0, abs(fract(vUv.y - uTime * 0.3) - 0.5)) * 0.25;
    float a = (lip + body + scan) * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`
const beamFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 2.2) * 0.32;
    a *= 0.75 + 0.25 * sin(vUv.x * 60.0 + uTime * 2.0);
    gl_FragColor = vec4(uColor * a * uOpacity, a * uOpacity);
  }
`
const cardFrag = /* glsl */ `
  uniform sampler2D uMap; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    float scan = 0.85 + 0.15 * sin(vUv.y * 140.0 - uTime * 3.0);
    gl_FragColor = vec4(c.rgb * scan * uOpacity, c.a * uOpacity);
  }
`

// Foreground sparkles: drift upward but wrap below the chin line (y ≤ -0.14) — never over the face.
const frontVert = /* glsl */ `
  attribute float aSeed; attribute float aSize;
  uniform float uTime; uniform float uPixelRatio; uniform float uScale;
  varying float vA; varying float vSeed;
  void main() {
    vec3 p = position;
    p.y = -0.78 + mod(p.y + 0.78 + uTime * (0.015 + aSeed * 0.03), 0.64);
    p.x += sin(uTime * 0.5 + aSeed * 30.0) * 0.02;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale * (12.0 / -mv.z);
    float edge = smoothstep(-0.14, -0.24, p.y) * smoothstep(-0.78, -0.68, p.y);
    vA = edge * (0.5 + 0.5 * sin(uTime * 2.5 + aSeed * 40.0));
    vSeed = aSeed;
  }
`
const frontFrag = /* glsl */ `
  uniform float uOpacity; varying float vA; varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a * vA * uOpacity;
    vec3 c = mix(vec3(0.32, 0.9, 1.0), vec3(1.0, 0.36, 0.94), step(0.6, vSeed));
    gl_FragColor = vec4(c * a, a);
  }
`

const BLUE = new THREE.Color('#4263ff')
const CYAN = new THREE.Color('#51e5ff')
const VIOLET = new THREE.Color('#a678ff')

/** Coloured rim light from the cutout ALPHA only, drawn behind the photo plane. */
function rimMaterial(color: string) {
  return new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: rimFrag,
    uniforms: { uMask: { value: null }, uColorA: { value: new THREE.Color(color) }, uColorB: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

function additive(frag: string, uniforms: Record<string, THREE.IUniform>, side: THREE.Side = THREE.FrontSide) {
  return new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: frag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side,
  })
}

/**
 * Hero centrepiece in the shared canvas: the ORIGINAL portrait cutout on a plane (basic material,
 * no tone mapping, sRGB — pixels shown exactly as photographed), locked to the DOM stage, inside a
 * holographic structure: HUD rings and glow BEHIND the photo, orbit rings whose front arcs stay below
 * the chin, floating glass panels beside the body, and a holographic SF platform below.
 */
export function HeroPortal({ tier }: { tier: 'low' | 'medium' | 'high' }) {
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
  const plat = useRef<THREE.Group>(null)
  const accent = useRef<THREE.PointLight>(null)
  const dustMat = useRef<THREE.ShaderMaterial>(null)
  const glowMat = useRef<THREE.ShaderMaterial>(null)
  const rimMat = useRef<THREE.ShaderMaterial>(null)
  const discEdge = useRef<THREE.MeshBasicMaterial>(null)
  const rings = useRef<THREE.Mesh[]>([])
  const cards = useRef<THREE.Group[]>([])
  const platRings = useRef<THREE.Mesh[]>([])

  // Wipe-reveal of the photo via a clipping plane (geometry clipping — no colour change).
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

  const mats = useMemo(() => {
    const logo = makeCanvasTexture(512, 512, drawSFLogo)
    return {
      rings: [
        cometMaterial(CYAN, '#ffffff', 0.08, 0.32, 48),
        cometMaterial(VIOLET, CYAN, -0.06, 0.22, 64),
        cometMaterial(BLUE, VIOLET, 0.045, 0.12),
        cometMaterial(CYAN, '#ff5cf0', -0.11, 0.0), // pure light trail
        cometMaterial('#ff5cf0', VIOLET, 0.07, 0.03), // wide magenta sweep
        cometMaterial(BLUE, CYAN, -0.05, 0.04), // outer blue sweep
      ],
      rimL: rimMaterial('#51e5ff'),
      rimR: rimMaterial('#ff5cf0'),
      front: new THREE.ShaderMaterial({
        vertexShader: frontVert,
        fragmentShader: frontFrag,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      hud: additive(hudFrag, { uTime: { value: 0 }, uOpacity: { value: 0 }, uAccent: { value: new THREE.Color('#ff5cf0') } }),
      disc: additive(discFrag, { uLogo: { value: logo }, uTime: { value: 0 }, uOpacity: { value: 0 } }, THREE.DoubleSide),
      tiers: [0, 1, 2].map(i => additive(bandFrag, { uColor: { value: new THREE.Color(i === 1 ? '#a678ff' : '#4f8bff') }, uOpacity: { value: 0 }, uLip: { value: 0.12 }, uTime: { value: 0 } }, THREE.DoubleSide)),
      beam: additive(beamFrag, { uColor: { value: new THREE.Color('#51e5ff') }, uOpacity: { value: 0 }, uTime: { value: 0 } }, THREE.DoubleSide),
      platRings: [cometMaterial(CYAN, '#ffffff', 0.12, 0.35, 72), cometMaterial(VIOLET, '#ff5cf0', -0.08, 0.25), cometMaterial(BLUE, CYAN, 0.05, 0.3, 120)],
      cards: HOLO_CARDS.map(c =>
        additive(cardFrag, { uMap: { value: makeCanvasTexture(c.w, c.h, c.draw) }, uOpacity: { value: 0 }, uTime: { value: 0 } }, THREE.DoubleSide),
      ),
      logo,
    }
  }, [])
  useEffect(
    () => () => {
      mats.logo.dispose()
      mats.cards.forEach(m => (m.uniforms.uMap!.value as THREE.Texture).dispose())
      ;[...mats.rings, mats.rimL, mats.rimR, mats.front, mats.hud, mats.disc, ...mats.tiers, mats.beam, ...mats.platRings, ...mats.cards].forEach(m => m.dispose())
    },
    [mats],
  )

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

  const frontCount = tier === 'low' ? 70 : tier === 'medium' ? 140 : 220
  const front = useMemo(() => {
    const rand = createRandom(5150)
    const pos = new Float32Array(frontCount * 3)
    const size = new Float32Array(frontCount)
    const seed = new Float32Array(frontCount)
    for (let i = 0; i < frontCount; i++) {
      pos.set([(rand() - 0.5) * 1.9, -0.78 + rand() * 0.64, 0.05 + rand() * 0.45], i * 3)
      size[i] = 0.8 + rand() ** 2 * 2.6
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [frontCount])

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
      delete document.documentElement.dataset.nexusGl
    },
    [],
  )

  useFrame((state, delta) => {
    const g = root.current
    const stage = heroStore.stage
    if (!g) return
    const worldH = stage && stage.isConnected ? lockToRect(stage, state.size, state.camera, _a) : 0
    if (!worldH) {
      g.visible = false
      if (plat.current) plat.current.visible = false
      if (heroStore.glReady) {
        heroStore.glReady = false
        delete document.documentElement.dataset.heroGl
      }
      return
    }
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

    // portrait reveal: bottom → top in world space (plane normal (0,-1,0) keeps y <= constant)
    const bottomY = g.position.y - worldH / 2
    const plane = portraitMat.current?.clippingPlanes?.[0]
    if (plane) plane.constant = pPortrait >= 1 ? 1e6 : bottomY + worldH * pPortrait * 1.05

    if (inner.current) {
      easing.dampE(inner.current.rotation, [state.pointer.y * 0.05, state.pointer.x * 0.1, 0], 0.5, delta)
      inner.current.position.y = Math.sin(t * 0.6) * 0.018
    }

    if (glowMat.current) glowMat.current.uniforms.uOpacity!.value = pEnv * 0.9
    if (rimMat.current) rimMat.current.uniforms.uOpacity!.value = pPortrait * 0.55
    for (const m of [mats.rimL, mats.rimR]) {
      m.uniforms.uMask!.value = map
      m.uniforms.uOpacity!.value = pPortrait * 0.75
    }
    setU(mats.front, 'uTime', t)
    setU(mats.front, 'uPixelRatio', state.viewport.dpr)
    setU(mats.front, 'uScale', Math.max(0.6, worldH / 3))
    setU(mats.front, 'uOpacity', pTrails)
    if (discEdge.current) discEdge.current.opacity = pRings
    setU(mats.hud, 'uTime', t)
    setU(mats.hud, 'uOpacity', pRings * 0.9)

    const dm = dustMat.current
    if (dm) {
      dm.uniforms.uProgress!.value = pEnv
      dm.uniforms.uTime!.value = t
      dm.uniforms.uPixelRatio!.value = state.viewport.dpr
      dm.uniforms.uScale!.value = Math.max(0.6, worldH / 3)
      dm.uniforms.uOpacity!.value = Math.min(1, intro * 2)
    }

    mats.rings.forEach((m, i) => {
      m.uniforms.uTime!.value = t
      m.uniforms.uOpacity!.value = i >= 3 ? pTrails : pRings
    })
    rings.current.forEach((ring, i) => {
      if (!ring) return
      ring.rotation.z += delta * (i % 2 ? -0.05 : 0.07)
      ring.scale.setScalar(0.6 + 0.4 * pRings)
    })

    // floating glass panels (beside / below the shoulders only)
    cards.current.forEach((c, i) => {
      if (!c) return
      const cfg = HOLO_CARDS[i]!
      c.position.set(cfg.pos[0], cfg.pos[1] + Math.sin(t * 0.9 + i * 2.1) * 0.012, cfg.pos[2])
      c.rotation.set(cfg.rot[0] + Math.sin(t * 0.6 + i) * 0.03, cfg.rot[1] + Math.cos(t * 0.5 + i) * 0.04, cfg.rot[2])
    })
    mats.cards.forEach((m, i) => {
      m.uniforms.uTime!.value = t
      m.uniforms.uOpacity!.value = easeOut(seg(intro, 0.62 + i * 0.07, 0.92 + i * 0.03))
    })

    // accent light follows the hovered station
    const idx = nexusStore.hoverStation
    if (accent.current) {
      _color.set(idx >= 0 ? STATION_ACCENTS[idx % STATION_ACCENTS.length]! : '#51e5ff')
      accent.current.color.lerp(_color, 1 - Math.exp(-delta * 6))
      accent.current.intensity = THREE.MathUtils.damp(accent.current.intensity, idx >= 0 ? 6 : 3, 4, delta)
    }

    // ── holographic platform, locked to the DOM slot under the portrait ──
    const pg = plat.current
    const slot = nexusStore.platform
    const pw = pg && slot && slot.isConnected ? lockToRect(slot, state.size, state.camera, _p, 'width') : 0
    if (pg) {
      pg.visible = pw > 0
      if (pw > 0) {
        pg.position.copy(_p)
        pg.scale.setScalar(pw)
        if (!document.documentElement.dataset.nexusGl) document.documentElement.dataset.nexusGl = '1'
        const pPlat = easeOut(seg(intro, 0.05, 0.55))
        setU(mats.disc, 'uTime', t)
        setU(mats.disc, 'uOpacity', pPlat)
        mats.tiers.forEach(m => {
          m.uniforms.uTime!.value = t
          m.uniforms.uOpacity!.value = pPlat * 0.9
        })
        setU(mats.beam, 'uTime', t)
        setU(mats.beam, 'uOpacity', pTrails)
        mats.platRings.forEach(m => {
          m.uniforms.uTime!.value = t
          m.uniforms.uOpacity!.value = pPlat
        })
        platRings.current.forEach((r, i) => r && (r.rotation.z += delta * (i % 2 ? -0.12 : 0.08)))
      }
    }
  })

  return (
    <>
      <group ref={root} visible={false}>
        <group ref={inner}>
          {/* back glow */}
          <mesh position={[0, 0.05, -0.6]} renderOrder={-3}>
            <planeGeometry args={[2.6, 2.6]} />
            <shaderMaterial
              ref={glowMat}
              vertexShader={BASIC_VERT}
              fragmentShader={glowFrag}
              uniforms={glowUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* holographic HUD structure — fully behind the photo plane */}
          <mesh position={[0, 0.1, -0.5]} renderOrder={-3} material={mats.hud}>
            <planeGeometry args={[1.62, 1.62]} />
          </mesh>

          {/* halo behind the head */}
          <mesh position={[0, 0.14, -0.32]} renderOrder={-2}>
            <torusGeometry args={[0.47, 0.0035, 12, 200]} />
            <meshBasicMaterial ref={discEdge} color="#51e5ff" toneMapped={false} transparent opacity={0} />
          </mesh>

          {/* rim light — behind the silhouette, built from the cutout alpha only */}
          <mesh position={[0, 0, -0.02]} scale={1.012} renderOrder={-1}>
            <planeGeometry args={[ASPECT, 1]} />
            <shaderMaterial
              ref={rimMat}
              vertexShader={BASIC_VERT}
              fragmentShader={rimFrag}
              uniforms={rimUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* coloured rim light: cyan from the left, magenta from the right — alpha-only, behind the photo */}
          <mesh position={[-0.007, 0.002, -0.025]} scale={1.008} renderOrder={-1} material={mats.rimL}>
            <planeGeometry args={[ASPECT, 1]} />
          </mesh>
          <mesh position={[0.007, 0.002, -0.025]} scale={1.008} renderOrder={-1} material={mats.rimR}>
            <planeGeometry args={[ASPECT, 1]} />
          </mesh>

          {/* THE PHOTO — basic material, untouched pixels */}
          <mesh renderOrder={0}>
            <planeGeometry args={[ASPECT, 1]} />
            <meshBasicMaterial ref={portraitMat} map={map} alphaMap={bottomFade} transparent alphaTest={0.02} toneMapped={false} clippingPlanes={clipPlanes} />
          </mesh>

          {/*
            Orbit rings + light trails. Rule: the FRONT arc of every ring stays at chest height
            (negative X tilt → front arc dips below the centre), so nothing ever crosses the face.
          */}
          <group position={[0, -0.18, 0]}>
            {[
              { r: 0.6, tube: 0.0034, rot: [-1.3, 0.12, 0] as const, pos: [0, 0, 0] as const },
              { r: 0.76, tube: 0.0024, rot: [-1.42, -0.16, 0] as const, pos: [0, -0.03, 0] as const },
              { r: 0.58, tube: 0.0022, rot: [0, 0, 0] as const, pos: [0, 0.3, -0.45] as const },
              { r: 0.9, tube: 0.006, rot: [-1.22, 0.08, 0] as const, pos: [0, -0.06, 0] as const },
              { r: 1.06, tube: 0.007, rot: [-1.15, 0.12, 0.08] as const, pos: [0, -0.1, 0] as const },
              { r: 1.24, tube: 0.005, rot: [-1.1, -0.1, -0.06] as const, pos: [0, -0.14, 0] as const },
            ].map((ring, i) => (
              <mesh
                key={i}
                ref={el => {
                  if (el) rings.current[i] = el
                }}
                position={[ring.pos[0], ring.pos[1], ring.pos[2]]}
                rotation={[ring.rot[0], ring.rot[1], ring.rot[2]]}
                renderOrder={1}
                material={mats.rings[i]}
              >
                <torusGeometry args={[ring.r, ring.tube, 8, 320]} />
              </mesh>
            ))}
          </group>

          {/* floating glass interface panels — beside / below the shoulders, never over the face */}
          {tier !== 'low' && HOLO_CARDS.map((c, i) => (
            <group
              key={c.key}
              ref={el => {
                if (el) cards.current[i] = el
              }}
            >
              <mesh renderOrder={3} material={mats.cards[i]}>
                <planeGeometry args={[c.size[0], c.size[1]]} />
              </mesh>
            </group>
          ))}

          {/* foreground sparkles — below the chin line only */}
          <points geometry={front} material={mats.front} renderOrder={4} frustumCulled={false} />

          {/* converging particle dust (clamped behind the photo in the shader) */}
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

      {/* Holographic platform (unit = slot width) */}
      <group ref={plat} visible={false}>
        {/* light beam — BACK half only and untilted (z ≤ 0), so it never passes in front of the portrait */}
        <mesh position={[0, 0.42, -0.02]} renderOrder={-4} material={mats.beam}>
          <cylinderGeometry args={[0.26, 0.31, 0.84, 48, 1, true, Math.PI / 2, Math.PI]} />
        </mesh>
        <group rotation={[0.3, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4} material={mats.disc}>
            <circleGeometry args={[0.33, 96]} />
          </mesh>
          {[
            { r: 0.33, rT: 0.33, rB: 0.36, h: 0.05, y: -0.025 },
            { r: 0.4, rT: 0.4, rB: 0.43, h: 0.045, y: -0.075 },
            { r: 0.48, rT: 0.48, rB: 0.5, h: 0.035, y: -0.12 },
          ].map((tier_, i) => (
            <mesh key={i} position={[0, tier_.y, 0]} renderOrder={3} material={mats.tiers[i]}>
              <cylinderGeometry args={[tier_.rT, tier_.rB, tier_.h, 96, 1, true]} />
            </mesh>
          ))}
          {[0.345, 0.43, 0.5].map((r, i) => (
            <mesh
              key={r}
              ref={el => {
                if (el) platRings.current[i] = el
              }}
              position={[0, -0.002 - i * 0.06, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              renderOrder={5}
              material={mats.platRings[i]}
            >
              <torusGeometry args={[r, 0.0035, 6, 200]} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  )
}
