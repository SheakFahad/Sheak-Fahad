'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { parallax } from '@/lib/motion/parallax'
import { nexusStore } from '@/lib/nexus/store'
import { BASIC_VERT, easeOut, frustumAt, seg } from './dom-lock'
import { createRandom } from './random'

// ─── Shared noise (GLSL) ─────────────────────────────────────────────────────
const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p, int oct) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) { if (i >= oct) break; v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`

const nebulaFrag = /* glsl */ `
  uniform float uTime; uniform float uOpacity; uniform float uAspect; uniform int uOct;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y) * 2.2;
    float t = uTime * 0.012;
    float n = fbm(p + vec2(t, -t * 0.6) + fbm(p * 1.3 - t, uOct) * 1.4, uOct);
    // two cloud masses: violet top-left, blue/magenta right
    float m1 = smoothstep(0.85, 0.0, distance(vUv, vec2(0.18, 0.78)));
    float m2 = smoothstep(0.8, 0.0, distance(vUv, vec2(0.86, 0.62)));
    float m3 = smoothstep(0.7, 0.0, distance(vUv, vec2(0.55, 0.95)));
    vec3 violet = vec3(0.42, 0.2, 0.85);
    vec3 blue = vec3(0.12, 0.25, 0.95);
    vec3 magenta = vec3(0.85, 0.2, 0.75);
    float d = smoothstep(0.35, 0.85, n);
    vec3 col = violet * d * m1 * 1.1 + blue * d * m2 + magenta * pow(d, 2.0) * m2 * 0.55 + blue * d * m3 * 0.6;
    float a = clamp((col.r + col.g + col.b) * 0.55, 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(col * uOpacity, a);
  }
`

const planetVert = /* glsl */ `
  varying vec3 vN; varying vec3 vWN; varying vec2 vUv;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    vWN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const planetFrag = /* glsl */ `
  uniform vec3 uLight; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uRim; uniform float uOpacity; uniform float uBands;
  varying vec3 vN; varying vec3 vWN; varying vec2 vUv;
  ${NOISE}
  void main() {
    float n = fbm(vec2(vUv.x * 6.0, vUv.y * uBands), 4);
    vec3 col = mix(uColorA, uColorB, n);
    float l = smoothstep(-0.15, 0.9, dot(vWN, uLight));
    col *= 0.08 + l * 0.9;
    float rim = pow(1.0 - max(dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    col += uRim * rim * (0.35 + l);
    gl_FragColor = vec4(col * uOpacity, uOpacity);
  }
`

// Mountain ridge silhouettes (procedural height per layer) with a glowing rim
const ridgeFrag = /* glsl */ `
  uniform float uSeed; uniform float uFreq; uniform float uHeight; uniform vec3 uColor; uniform vec3 uRim; uniform float uOpacity; uniform float uAspect;
  varying vec2 vUv;
  ${NOISE}
  float ridge(float x) {
    float n = fbm(vec2(x * uFreq + uSeed, uSeed), 5);
    n = 1.0 - abs(n * 2.0 - 1.0);
    return n * n;
  }
  void main() {
    float x = vUv.x * uAspect;
    // valley in the middle so the platform stays clear; peaks toward the edges
    float edge = smoothstep(0.15, 0.5, abs(vUv.x - 0.5));
    float h = (0.18 + ridge(x) * 0.82) * uHeight * (0.35 + 0.65 * edge);
    float inside = smoothstep(h + 0.004, h - 0.004, vUv.y);
    if (inside < 0.01) {
      // thin atmospheric glow above the ridge line
      float glow = smoothstep(h + 0.04, h, vUv.y) * 0.18;
      gl_FragColor = vec4(uRim * glow * uOpacity, glow * uOpacity);
      return;
    }
    float rim = smoothstep(h - 0.025, h, vUv.y);
    float fog = smoothstep(0.0, h, vUv.y);
    vec3 col = mix(uColor * 0.55, uColor, fog) + uRim * rim * 0.45;
    gl_FragColor = vec4(col * uOpacity, inside * uOpacity);
  }
`

// Reflective floor: perspective grid, horizon glow and light trails rushing toward the viewer
const groundFrag = /* glsl */ `
  uniform float uTime; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float far = uv.y;                     // 0 near camera → 1 horizon
    vec2 g = abs(fract(vec2(uv.x * 40.0, uv.y * 30.0 - uTime * 0.15)) - 0.5);
    float line = smoothstep(0.47, 0.5, max(g.x, g.y));
    float fade = smoothstep(1.0, 0.25, far) * smoothstep(0.0, 0.08, far);
    float farEdge = smoothstep(1.0, 0.85, far);
    vec3 col = vec3(0.2, 0.5, 1.0) * line * 0.22 * fade;
    // horizon reflection band
    col += vec3(0.3, 0.45, 1.0) * smoothstep(0.55, 0.95, far) * 0.22 * farEdge;
    col += vec3(0.65, 0.3, 1.0) * smoothstep(0.75, 0.95, far) * 0.16 * farEdge;
    // light trails along lanes
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float lane = i < 2 ? 0.1 + fi * 0.16 : 0.74 + (fi - 2.0) * 0.16;
      float w = smoothstep(0.0025, 0.0, abs(uv.x - lane));
      float head = fract(uTime * (0.12 + fi * 0.03) + fi * 0.37);
      float d = head - (1.0 - far);
      float trail = smoothstep(0.0, 0.002, d) * smoothstep(0.25, 0.0, d);
      vec3 c = i == 1 || i == 3 ? vec3(1.0, 0.45, 0.25) : vec3(0.3, 0.9, 1.0);
      col += c * w * trail * 1.4 * fade;
    }
    gl_FragColor = vec4(col * uOpacity, clamp(length(col), 0.0, 1.0) * uOpacity);
  }
`

// City towers: procedural lit windows
const cityVert = /* glsl */ `
  varying vec2 vUv; varying float vSeed;
  attribute float aSeed;
  void main() {
    vUv = uv; vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`
const cityFrag = /* glsl */ `
  uniform float uOpacity; uniform float uTime;
  varying vec2 vUv; varying float vSeed;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 cell = floor(vUv * vec2(4.0, 26.0));
    vec2 f = fract(vUv * vec2(4.0, 26.0));
    float on = step(0.62, hash(cell + vSeed * 17.0)) * step(0.25, f.x) * step(f.x, 0.75) * step(0.3, f.y) * step(f.y, 0.7);
    float flick = 0.7 + 0.3 * sin(uTime * 1.5 + hash(cell) * 30.0);
    vec3 body = mix(vec3(0.02, 0.03, 0.09), vec3(0.08, 0.06, 0.2), vUv.y);
    vec3 win = mix(vec3(0.35, 0.8, 1.0), vec3(0.75, 0.45, 1.0), hash(cell + 3.0));
    vec3 col = body + win * on * flick * 0.9;
    float edge = smoothstep(0.96, 1.0, vUv.y) * 0.8;
    col += vec3(0.65, 0.4, 1.0) * edge;
    gl_FragColor = vec4(col * uOpacity, uOpacity);
  }
`

// Crystal flora: additive gradient shards (instanced — the vertex shader must apply instanceMatrix)
const instVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
`
const crystalFrag = /* glsl */ `
  uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float a = smoothstep(0.0, 1.0, vUv.y) * 0.9 + 0.1;
    vec3 col = mix(vec3(0.35, 0.1, 0.7), vec3(1.0, 0.45, 1.0), vUv.y);
    float pulse = 0.75 + 0.25 * sin(uTime * 1.3 + vUv.x * 6.0);
    gl_FragColor = vec4(col * a * pulse * uOpacity, a * uOpacity * 0.85);
  }
`

const moteVert = /* glsl */ `
  attribute float aSeed; uniform float uTime; uniform float uPixelRatio; uniform float uHeight;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.08 + aSeed * 0.12) + uHeight, uHeight * 2.0) - uHeight;
    p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.5 + aSeed * 3.0) * uPixelRatio * (12.0 / -mv.z);
    vA = 0.4 + 0.6 * sin(uTime + aSeed * 50.0);
  }
`
const moteFrag = /* glsl */ `
  uniform float uOpacity; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a * vA * uOpacity;
    gl_FragColor = vec4(vec3(0.75, 0.6, 1.0) * a, a);
  }
`

function shader(frag: string, uniforms: Record<string, THREE.IUniform>, vert = BASIC_VERT, opts: Partial<THREE.ShaderMaterialParameters> = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    ...opts,
  })
}

interface Props {
  tier: 'low' | 'medium' | 'high'
  light: boolean
}

/**
 * NEXUS homepage environment in the shared canvas: nebula, planets, mountain ridges, reflective floor with
 * light trails, distant city, crystal flora and rising motes. Layout follows the camera frustum so the
 * composition holds at any aspect ratio. Each layer can be toggled from the CMS (site_settings.home.environment).
 */
export function NexusEnvironment({ tier, light }: Props) {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera
  const size = useThree(s => s.size)
  const aspect = size.width / Math.max(1, size.height)
  const group = useRef<THREE.Group>(null)
  const sink = useRef(0)
  const oct = tier === 'low' ? 3 : tier === 'medium' ? 4 : 5

  const mats = useMemo(() => {
    const nebula = shader(nebulaFrag, { uTime: { value: 0 }, uOpacity: { value: 0 }, uAspect: { value: 1 }, uOct: { value: oct } }, BASIC_VERT, { blending: THREE.AdditiveBlending })
    const planet = shader(
      planetFrag,
      {
        uLight: { value: new THREE.Vector3(0.6, 0.3, 0.75).normalize() },
        uColorA: { value: new THREE.Color('#141a3a') },
        uColorB: { value: new THREE.Color('#3a4f9a') },
        uRim: { value: new THREE.Color('#5fd8ff') },
        uOpacity: { value: 0 },
        uBands: { value: 3 },
      },
      planetVert,
      { transparent: true, depthWrite: true },
    )
    const moon = shader(
      planetFrag,
      {
        uLight: { value: new THREE.Vector3(-0.7, 0.3, 0.6).normalize() },
        uColorA: { value: new THREE.Color('#1d2244') },
        uColorB: { value: new THREE.Color('#7c86c9') },
        uRim: { value: new THREE.Color('#a678ff') },
        uOpacity: { value: 0 },
        uBands: { value: 8 },
      },
      planetVert,
    )
    const ridges = [
      { seed: 3.1, freq: 0.9, height: 0.95, color: '#1a1d4d', rim: '#6a5cff' },
      { seed: 7.7, freq: 1.4, height: 0.8, color: '#10132f', rim: '#51e5ff' },
      { seed: 1.9, freq: 2.0, height: 0.7, color: '#070917', rim: '#a678ff' },
    ].map(r =>
      shader(ridgeFrag, {
        uSeed: { value: r.seed },
        uFreq: { value: r.freq },
        uHeight: { value: r.height },
        uColor: { value: new THREE.Color(r.color) },
        uRim: { value: new THREE.Color(r.rim) },
        uOpacity: { value: 0 },
        uAspect: { value: 1 },
      }),
    )
    const ground = shader(groundFrag, { uTime: { value: 0 }, uOpacity: { value: 0 } }, BASIC_VERT, { blending: THREE.AdditiveBlending })
    const city = shader(cityFrag, { uTime: { value: 0 }, uOpacity: { value: 0 } }, cityVert, { transparent: true, depthWrite: true })
    const crystal = shader(crystalFrag, { uTime: { value: 0 }, uOpacity: { value: 0 } }, instVert, { blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    const motes = shader(moteFrag, { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0 }, uHeight: { value: 6 } }, moteVert, { blending: THREE.AdditiveBlending })
    return { nebula, planet, moon, ridges, ground, city, crystal, motes }
  }, [oct])
  useEffect(
    () => () => {
      Object.values(mats)
        .flat()
        .forEach(m => m.dispose())
    },
    [mats],
  )

  // Frustum-based layout (recomputed on resize only)
  const layout = useMemo(() => {
    const at = (z: number) => frustumAt(camera, z, aspect)
    const neb = at(-45)
    const pl = at(-30)
    const r1 = at(-26)
    const r2 = at(-18)
    const r3 = at(-11)
    const ct = at(-21)
    return { neb, pl, r: [r1, r2, r3], ct, z: { neb: -45, pl: -30, r: [-26, -18, -11], ct: -21 } }
  }, [camera, aspect])

  // City towers (instanced)
  const cityCount = tier === 'low' ? 0 : 14
  const city = useMemo(() => {
    if (!cityCount) return null
    const rand = createRandom(2711)
    const geo = new THREE.BoxGeometry(1, 1, 1)
    geo.translate(0, 0.5, 0)
    const seeds = new Float32Array(cityCount)
    const mesh = new THREE.InstancedMesh(geo, mats.city, cityCount)
    const m = new THREE.Matrix4()
    const { halfW, halfH } = layout.ct
    for (let i = 0; i < cityCount; i++) {
      const w = 0.5 + rand() * 0.9
      const h = (i === 4 ? 9 : 1.6 + rand() * 4.5) * (halfH / 9)
      const x = halfW * (0.55 + (i / cityCount) * 0.5) + (rand() - 0.5) * 0.8
      m.compose(new THREE.Vector3(x, -halfH * 0.62, (rand() - 0.5) * 3), new THREE.Quaternion(), new THREE.Vector3(w, h, w))
      mesh.setMatrixAt(i, m)
      seeds[i] = rand()
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
    mesh.frustumCulled = false
    return mesh
  }, [cityCount, mats.city, layout.ct])
  useEffect(() => () => city?.geometry.dispose(), [city])

  // Crystal flora clusters in the bottom corners (foreground, below the text lines)
  const crystals = useMemo(() => {
    const rand = createRandom(4242)
    const n = tier === 'low' ? 10 : 22
    const geo = new THREE.ConeGeometry(0.08, 1, 4, 1, true)
    geo.translate(0, 0.5, 0)
    const mesh = new THREE.InstancedMesh(geo, mats.crystal, n * 2)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const { halfW, halfH } = frustumAt(camera, -3, aspect)
    for (let i = 0; i < n * 2; i++) {
      const side = i < n ? -1 : 1
      const x = side * (halfW * (0.78 + rand() * 0.3))
      e.set((rand() - 0.5) * 0.5, rand() * Math.PI, side * (0.1 + rand() * 0.35))
      q.setFromEuler(e)
      const s = 0.3 + rand() * 0.6
      m.compose(new THREE.Vector3(x, -halfH * 1.02, -3 + (rand() - 0.5) * 1.5), q, new THREE.Vector3(s, s * (0.8 + rand()), s))
      mesh.setMatrixAt(i, m)
    }
    mesh.frustumCulled = false
    return mesh
  }, [tier, mats.crystal, camera, aspect])
  useEffect(() => () => crystals.geometry.dispose(), [crystals])

  const motes = useMemo(() => {
    const rand = createRandom(99)
    const n = tier === 'low' ? 60 : 160
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos.set([(rand() - 0.5) * 18, (rand() - 0.5) * 12, -2 - rand() * 10], i * 3)
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [tier])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const env = nexusStore.env
    g.visible = Boolean(env)
    if (!env) return
    const t = state.clock.elapsedTime
    const intro = nexusStore.intro
    const fade = light ? 0.32 : 1
    const leave = 1 - THREE.MathUtils.clamp(nexusStore.scroll * 1.15, 0, 1)
    const p = (a: number, b: number) => easeOut(seg(intro, a, b)) * fade

    // scroll: landscape sinks, sky remains → we rise into space
    // scroll lowers the landscape; the background drifts opposite to the mouse (deep layer → larger shift)
    sink.current = THREE.MathUtils.damp(sink.current, -nexusStore.scroll * 3.2, 6, delta)
    g.position.set(-parallax.x * 0.9, sink.current - parallax.y * 0.45, 0)

    const u = (m: THREE.ShaderMaterial, k: string, v: number) => (m.uniforms[k]!.value = v)
    u(mats.nebula, 'uTime', t)
    u(mats.nebula, 'uOpacity', env.nebula ? p(0, 0.6) : 0)
    u(mats.nebula, 'uAspect', aspect)
    // planets read as grey discs on the light theme → only drawn in dark mode
    u(mats.planet, 'uOpacity', env.planets && !light ? p(0.1, 0.6) : 0)
    u(mats.moon, 'uOpacity', env.planets && !light ? p(0.2, 0.7) : 0)
    mats.ridges.forEach((m, i) => {
      u(m, 'uOpacity', env.mountains ? p(0.15 + i * 0.08, 0.6 + i * 0.08) * (0.4 + 0.6 * leave) : 0)
      u(m, 'uAspect', aspect)
    })
    u(mats.ground, 'uTime', t)
    u(mats.ground, 'uOpacity', env.ground ? p(0.3, 0.8) * leave * leave : 0)
    u(mats.city, 'uTime', t)
    u(mats.city, 'uOpacity', env.city ? p(0.35, 0.85) * leave : 0)
    u(mats.crystal, 'uTime', t)
    u(mats.crystal, 'uOpacity', env.plants ? p(0.45, 0.95) * leave : 0)
    u(mats.motes, 'uTime', t)
    u(mats.motes, 'uPixelRatio', state.viewport.dpr)
    u(mats.motes, 'uOpacity', p(0.4, 1))
  })

  const { neb, pl, r, z } = layout
  return (
    <group ref={group} visible={false}>
      {/* nebula sky */}
      <mesh position={[0, 0, z.neb]} renderOrder={-20} material={mats.nebula}>
        <planeGeometry args={[neb.halfW * 2.3, neb.halfH * 2.3]} />
      </mesh>
      {/* gas giant top-left (behind the NEXUS title) + small moon top-right */}
      <mesh position={[-pl.halfW * 0.7, pl.halfH * 0.58, z.pl]} rotation={[0.3, 0.4, -0.35]} renderOrder={-19} material={mats.planet}>
        <sphereGeometry args={[pl.halfH * 0.36, 48, 32]} />
      </mesh>
      <mesh position={[pl.halfW * 0.86, pl.halfH * 0.62, z.pl + 4]} renderOrder={-19} material={mats.moon}>
        <sphereGeometry args={[pl.halfH * 0.07, 32, 24]} />
      </mesh>
      {/* distant city (right) */}
      {city && <primitive object={city} position={[0, 0, z.ct]} renderOrder={-17.5} />}
      {/* mountain ridges (far → near) */}
      {r.map((f, i) => (
        <mesh key={i} position={[0, -f.halfH * (0.74 - i * 0.04), z.r[i]]} renderOrder={-18 + i} material={mats.ridges[i]}>
          <planeGeometry args={[f.halfW * 2.4, f.halfH * 0.9]} />
        </mesh>
      ))}
      {/* reflective floor */}
      <mesh position={[0, -3.4, -6]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-14} material={mats.ground}>
        <planeGeometry args={[40, 12]} />
      </mesh>
      {/* crystal flora */}
      <primitive object={crystals} renderOrder={-12} />
      {/* rising motes */}
      <points geometry={motes} material={mats.motes} renderOrder={-11} frustumCulled={false} />
    </group>
  )
}
