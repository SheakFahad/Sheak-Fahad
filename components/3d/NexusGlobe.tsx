'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { nexusStore, STATION_ACCENTS } from '@/lib/nexus/store'
import { cometMaterial, easeOut, lockToRect, seg } from './dom-lock'
import { createRandom, randomOnSphere } from './random'

// Packed data texture (public/textures/earth-data*.webp, NASA-derived): R = land mask, G = city lights, B = relief.
const DATA = '/textures/earth-data.webp'
const DATA_SM = '/textures/earth-data-sm.webp'

const globeVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const globeFrag = /* glsl */ `
  uniform sampler2D uData;
  uniform vec3 uSun;
  uniform vec3 uAccent;
  uniform float uIntro;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;
  void main() {
    vec3 d = texture2D(uData, vUv).rgb;
    float land = smoothstep(0.35, 0.65, d.r);
    vec3 ocean = vec3(0.012, 0.035, 0.12);
    vec3 landCol = mix(vec3(0.06, 0.2, 0.62), vec3(0.32, 0.72, 1.0), d.b);
    vec3 col = mix(ocean, landCol, land);

    // coastline glow
    float coast = 1.0 - abs(d.r - 0.5) * 2.0;
    col += vec3(0.32, 0.9, 1.0) * smoothstep(0.55, 1.0, coast) * 0.35;

    // day / night
    float sun = dot(normalize(vWorldNormal), uSun);
    float day = smoothstep(-0.3, 0.55, sun);
    col *= 0.22 + 0.95 * day;
    col += vec3(1.0, 0.74, 0.38) * pow(d.g, 1.3) * (1.0 - day * 0.85) * 2.2;

    // holographic lat/long grid
    vec2 g = abs(fract(vUv * vec2(36.0, 18.0)) - 0.5);
    float grid = smoothstep(0.47, 0.5, max(g.x, g.y));
    col += vec3(0.32, 0.9, 1.0) * grid * 0.06;

    // inner fresnel rim
    float f = pow(1.0 - max(dot(vViewNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
    col += mix(vec3(0.32, 0.9, 1.0), uAccent, 0.5) * f * 0.9;

    // activation scan (bottom → top)
    float y = vWorldNormal.y * 0.5 + 0.5;
    float scan = smoothstep(uIntro * 1.3 - 0.2, uIntro * 1.3 - 0.25, y);
    float edge = smoothstep(0.05, 0.0, abs(y - (uIntro * 1.3 - 0.22)));
    col = col * scan + vec3(0.32, 0.9, 1.0) * edge * step(uIntro, 0.999);
    gl_FragColor = vec4(col, 1.0);
  }
`
const atmoVert = /* glsl */ `
  varying vec3 vViewNormal;
  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const atmoFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying vec3 vViewNormal;
  void main() {
    float i = pow(max(0.0, 0.72 - dot(vViewNormal, vec3(0.0, 0.0, 1.0))), 2.6) * 3.2;
    gl_FragColor = vec4(uColor * i * uOpacity, i * uOpacity);
  }
`
const pointsVert = /* glsl */ `
  attribute float aSize; attribute float aSeed;
  uniform float uTime; uniform float uPixelRatio; uniform float uScale;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale * (10.0 / -mv.z);
    vA = 0.45 + 0.55 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0);
  }
`
const pointsFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a * vA * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`

// Network nodes (decorative connections — not travel claims)
const NODES: [number, number][] = [
  [23.81, 90.41], // hub
  [51.5, -0.12],
  [40.71, -74.0],
  [35.68, 139.69],
  [1.35, 103.82],
  [25.2, 55.27],
  [-33.87, 151.21],
  [52.52, 13.4],
  [-23.55, -46.63],
]

function latLon(lat: number, lon: number, r = 1) {
  const phi = ((lon + 180) / 360) * Math.PI * 2
  const theta = ((90 - lat) / 180) * Math.PI
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r)
}

function arcCurve(a: THREE.Vector3, b: THREE.Vector3) {
  const dist = a.distanceTo(b)
  const lift = 1 + dist * 0.38
  const m1 = a.clone().lerp(b, 0.33).normalize().multiplyScalar(lift)
  const m2 = a.clone().lerp(b, 0.66).normalize().multiplyScalar(lift)
  return new THREE.CubicBezierCurve3(a.clone().multiplyScalar(1.002), m1, m2, b.clone().multiplyScalar(1.002))
}

const _c = new THREE.Vector3()
const _accent = new THREE.Color()
const CYAN = new THREE.Color('#51e5ff')
const ATMO_BASE = new THREE.Color('#3f8cff')

export function NexusGlobe({ tier }: { tier: 'low' | 'medium' | 'high' }) {
  const data = useTexture(tier === 'low' ? DATA_SM : DATA, t => {
    const tex = Array.isArray(t) ? t[0] : t
    if (tex) {
      tex.colorSpace = THREE.NoColorSpace // packed data, not colour
      tex.anisotropy = 4
    }
  })
  const root = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const earth = useRef<THREE.Group>(null)
  const sat = useRef<THREE.Group>(null)
  const globeMat = useRef<THREE.ShaderMaterial>(null)
  const atmoMat = useRef<THREE.ShaderMaterial>(null)
  const ptsMat = useRef<THREE.ShaderMaterial>(null)
  const nodeMat = useRef<THREE.ShaderMaterial>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)

  const seg_ = tier === 'low' ? 48 : 96
  const globeUniforms = useMemo(
    () => ({
      uData: { value: data },
      uSun: { value: new THREE.Vector3(-0.55, 0.35, 0.76).normalize() },
      uAccent: { value: CYAN.clone() },
      uIntro: { value: 0 },
      uTime: { value: 0 },
    }),
    [data],
  )
  const atmoUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#3f8cff') }, uOpacity: { value: 0 } }), [])

  // Arcs (great-circle-ish bezier tubes) from the hub
  const arcs = useMemo(() => {
    const hub = latLon(NODES[0]![0], NODES[0]![1])
    return NODES.slice(1).map(([lat, lon], i) => {
      const geo = new THREE.TubeGeometry(arcCurve(hub, latLon(lat, lon)), 64, 0.0045, 6, false)
      const mat = cometMaterial(i % 2 ? '#a678ff' : '#51e5ff', '#9ff3ff', 0.22 + (i % 3) * 0.07, 0.08)
      return { geo, mat }
    })
  }, [])
  useEffect(() => () => arcs.forEach(a => (a.geo.dispose(), a.mat.dispose())), [arcs])

  const ringMats = useMemo(() => [cometMaterial('#51e5ff', '#ffffff', 0.05, 0.22, 90), cometMaterial('#a678ff', '#ff5cf0', -0.04, 0.12)], [])
  useEffect(() => () => ringMats.forEach(m => m.dispose()), [ringMats])

  // Node markers + data particles
  const nodeGeo = useMemo(() => {
    const pos = new Float32Array(NODES.length * 3)
    const size = new Float32Array(NODES.length)
    const seed = new Float32Array(NODES.length)
    NODES.forEach(([lat, lon], i) => {
      pos.set(latLon(lat, lon, 1.01).toArray(), i * 3)
      size[i] = i === 0 ? 7 : 4
      seed[i] = i / NODES.length
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [])
  const ptsCount = tier === 'low' ? 160 : tier === 'medium' ? 320 : 520
  const ptsGeo = useMemo(() => {
    const rand = createRandom(8801)
    const pos = new Float32Array(ptsCount * 3)
    const size = new Float32Array(ptsCount)
    const seed = new Float32Array(ptsCount)
    for (let i = 0; i < ptsCount; i++) {
      pos.set(randomOnSphere(rand, 1.15 + rand() * 0.7), i * 3)
      size[i] = 0.8 + rand() ** 3 * 2.4
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [ptsCount])
  const ptsUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uColor: { value: new THREE.Color('#9fdcff') }, uOpacity: { value: 0 } }),
    [],
  )
  const nodeUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uColor: { value: new THREE.Color('#ffd27a') }, uOpacity: { value: 0 } }),
    [],
  )

  useEffect(
    () => () => {
      delete document.documentElement.dataset.globeGl
    },
    [],
  )

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const el = nexusStore.globe
    const size = el && el.isConnected ? lockToRect(el, state.size, state.camera, _c) : 0
    if (!size) {
      g.visible = false
      return
    }
    g.visible = true
    g.position.copy(_c)
    g.scale.setScalar(size / 2) // unit sphere → DOM circle
    if (!document.documentElement.dataset.globeGl) document.documentElement.dataset.globeGl = '1'

    const t = state.clock.elapsedTime
    const intro = nexusStore.intro
    const pGlobe = easeOut(seg(intro, 0.15, 0.75))
    const pFx = easeOut(seg(intro, 0.5, 1))

    // rotation: idle drift + drag spin (decays)
    nexusStore.spin *= Math.exp(-delta * 1.6)
    if (earth.current) earth.current.rotation.y += delta * (0.09 + nexusStore.spin)
    if (tilt.current) easing.dampE(tilt.current.rotation, [0.18 + state.pointer.y * 0.12, state.pointer.x * 0.25, 0.41], 0.6, delta)

    const hover = nexusStore.hoverStation
    _accent.set(hover >= 0 ? STATION_ACCENTS[hover % STATION_ACCENTS.length]! : '#51e5ff')

    const gm = globeMat.current
    if (gm) {
      gm.uniforms.uIntro!.value = pGlobe
      gm.uniforms.uTime!.value = t
      ;(gm.uniforms.uAccent!.value as THREE.Color).lerp(_accent, 1 - Math.exp(-delta * 5))
    }
    const am = atmoMat.current
    if (am) {
      am.uniforms.uOpacity!.value = THREE.MathUtils.damp(am.uniforms.uOpacity!.value, pGlobe * (hover >= 0 ? 1.35 : 1), 4, delta)
      ;(am.uniforms.uColor!.value as THREE.Color).lerp(hover >= 0 ? _accent : ATMO_BASE, 1 - Math.exp(-delta * 4))
    }
    for (const m of [ptsMat.current, nodeMat.current]) {
      if (!m) continue
      m.uniforms.uTime!.value = t
      m.uniforms.uPixelRatio!.value = state.viewport.dpr
      m.uniforms.uScale!.value = size
      m.uniforms.uOpacity!.value = pFx
    }
    arcs.forEach((a, i) => {
      a.mat.uniforms.uTime!.value = t + i * 0.37
      a.mat.uniforms.uOpacity!.value = pFx * (hover >= 0 ? 1.4 : 1)
    })
    ringMats.forEach(m => {
      m.uniforms.uTime!.value = t
      m.uniforms.uOpacity!.value = pFx
    })
    if (ringA.current) ringA.current.rotation.z += delta * 0.05
    if (ringB.current) ringB.current.rotation.z -= delta * 0.035
    if (sat.current) {
      const a = t * 0.18
      sat.current.position.set(Math.cos(a) * 1.75, Math.sin(a) * 0.55 + 0.35, Math.sin(a) * 1.75)
      sat.current.rotation.set(0.3, -a, 0.2)
      sat.current.visible = pFx > 0.05
    }
  })

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        <group ref={earth}>
          <mesh>
            <sphereGeometry args={[1, seg_, seg_ / 2]} />
            <shaderMaterial ref={globeMat} vertexShader={globeVert} fragmentShader={globeFrag} uniforms={globeUniforms} toneMapped={false} />
          </mesh>
          {arcs.map((a, i) => (
            <mesh key={i} geometry={a.geo} material={a.mat} renderOrder={2} />
          ))}
          <points geometry={nodeGeo} renderOrder={3}>
            <shaderMaterial
              ref={nodeMat}
              vertexShader={pointsVert}
              fragmentShader={pointsFrag}
              uniforms={nodeUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>
        </group>
        {/* orbiting energy rings */}
        <mesh ref={ringA} rotation={[1.25, 0.2, 0]} material={ringMats[0]} renderOrder={2}>
          <torusGeometry args={[1.42, 0.006, 6, 240]} />
        </mesh>
        <mesh ref={ringB} rotation={[1.05, -0.45, 0.3]} material={ringMats[1]} renderOrder={2}>
          <torusGeometry args={[1.6, 0.004, 6, 240]} />
        </mesh>
        {/* satellite */}
        <group ref={sat} scale={0.06}>
          <mesh>
            <boxGeometry args={[0.8, 0.5, 0.5]} />
            <meshStandardMaterial color="#c9d6ff" metalness={0.8} roughness={0.3} emissive="#1b2a6b" />
          </mesh>
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * 1.15, 0, 0]}>
              <boxGeometry args={[1.3, 0.04, 0.55]} />
              <meshStandardMaterial color="#2f5bff" metalness={0.6} roughness={0.25} emissive="#2142ff" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      </group>
      {/* atmosphere glow (back faces, slightly larger) */}
      <mesh scale={1.22} renderOrder={-1}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          ref={atmoMat}
          vertexShader={atmoVert}
          fragmentShader={atmoFrag}
          uniforms={atmoUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* floating data particles */}
      <points geometry={ptsGeo} renderOrder={1}>
        <shaderMaterial
          ref={ptsMat}
          vertexShader={pointsVert}
          fragmentShader={pointsFrag}
          uniforms={ptsUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

