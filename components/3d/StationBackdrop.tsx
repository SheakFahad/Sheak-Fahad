'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { cometMaterial, frustumAt } from './dom-lock'
import { createRandom, randomOnSphere } from './random'

/** Route slug → station signature object. Unknown/custom sections fall back to a constellation. */
export type StationVariant = 'origin' | 'trajectory' | 'academy' | 'hangar' | 'laboratory' | 'motion' | 'arsenal' | 'milestones' | 'chronicles' | 'offbeat' | 'transmission' | 'atlas'

const BY_SLUG: Record<string, StationVariant> = {
  about: 'origin',
  career: 'trajectory',
  education: 'academy',
  projects: 'hangar',
  research: 'laboratory',
  'video-studio': 'motion',
  skills: 'arsenal',
  achievements: 'milestones',
  travel: 'atlas',
  memories: 'chronicles',
  hobbies: 'offbeat',
  contact: 'transmission',
}
export const variantForPath = (pathname: string): StationVariant => BY_SLUG[pathname.split('/')[1] ?? ''] ?? 'origin'

const CYAN = '#51e5ff'
const BLUE = '#4263ff'
const VIOLET = '#a678ff'
const MAGENTA = '#ff5cf0'

const pointsVert = /* glsl */ `
  attribute float aSeed; uniform float uTime; uniform float uPixelRatio; uniform float uSize;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aSeed) * uPixelRatio * (10.0 / -mv.z);
    vA = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 30.0);
  }
`
const pointsFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a * vA * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`

function pointsMaterial(color: string, size: number) {
  return new THREE.ShaderMaterial({
    vertexShader: pointsVert,
    fragmentShader: pointsFrag,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uSize: { value: size }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}
const lineMaterial = (color: string) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
const wireMaterial = (color: string) =>
  new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
const glassMaterial = (color: string) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })

function pointGeo(pts: number[][]) {
  const rand = createRandom(pts.length * 7)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.flat()), 3))
  g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(pts.map(() => rand())), 1))
  return g
}

type Built = { group: THREE.Group; materials: THREE.Material[]; geometries: THREE.BufferGeometry[]; tick: (t: number, d: number) => void }

/** Builds the signature object for a station. Everything is procedural (no assets) and additive (no lighting cost). */
function build(variant: StationVariant): Built {
  const group = new THREE.Group()
  const materials: THREE.Material[] = []
  const geometries: THREE.BufferGeometry[] = []
  const add = <T extends THREE.Object3D>(o: T) => (group.add(o), o)
  const mat = <M extends THREE.Material>(m: M) => (materials.push(m), m)
  const geo = <G extends THREE.BufferGeometry>(g: G) => (geometries.push(g), g)
  const rand = createRandom(variant.length * 131)
  let tick: Built['tick'] = () => {}

  const ring = (r: number, color: string, colorB: string, speed: number, rot: [number, number, number], tube = 0.012, dash = 0) => {
    const m = add(new THREE.Mesh(geo(new THREE.TorusGeometry(r, tube, 8, 220)), mat(cometMaterial(color, colorB, speed, 0.18, dash))))
    m.rotation.set(...rot)
    return m
  }

  switch (variant) {
    case 'origin': {
      // Constellation: life chapters joined by light lines
      const pts = Array.from({ length: 9 }, (_, i) => [Math.cos(i * 0.9) * (0.4 + i * 0.13), Math.sin(i * 1.3) * 0.7 + (i - 4) * 0.12, (rand() - 0.5) * 0.6])
      add(new THREE.Line(geo(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...(p as [number, number, number]))))), mat(lineMaterial(CYAN))))
      add(new THREE.Points(geo(pointGeo(pts)), mat(pointsMaterial('#ffffff', 9))))
      add(new THREE.Points(geo(pointGeo(Array.from({ length: 160 }, () => randomOnSphere(rand, 0.8 + rand() * 1.2)))), mat(pointsMaterial(VIOLET, 3))))
      tick = t => (group.rotation.y = Math.sin(t * 0.15) * 0.4)
      break
    }
    case 'trajectory': {
      // Orbital career track with moving planets
      const planets: THREE.Mesh[] = []
      ;[0.6, 0.95, 1.3].forEach((r, i) => {
        ring(r, [CYAN, VIOLET, MAGENTA][i]!, '#ffffff', 0.05 + i * 0.02, [1.2, 0.2 * i, 0], 0.006, 60)
        const p = add(new THREE.Mesh(geo(new THREE.SphereGeometry(0.06 + i * 0.015, 24, 16)), mat(glassMaterial([CYAN, VIOLET, MAGENTA][i]!))))
        p.userData = { r, i }
        planets.push(p)
      })
      tick = t =>
        planets.forEach(p => {
          const { r, i } = p.userData as { r: number; i: number }
          const a = t * (0.35 - i * 0.08) + i * 2
          const v = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0).applyEuler(new THREE.Euler(1.2, 0.2 * i, 0))
          p.position.copy(v)
        })
      break
    }
    case 'academy': {
      // Rising light platforms (SSC → HSC → B.Sc.)
      const plats = [0, 1, 2].map(i => {
        const m = add(new THREE.Mesh(geo(new THREE.CylinderGeometry(0.75 - i * 0.18, 0.8 - i * 0.18, 0.04, 64, 1, true)), mat(glassMaterial([BLUE, VIOLET, CYAN][i]!))))
        m.position.y = -0.6 + i * 0.55
        ring(0.78 - i * 0.18, [BLUE, VIOLET, CYAN][i]!, '#ffffff', 0.08, [Math.PI / 2, 0, 0]).position.y = -0.58 + i * 0.55
        return m
      })
      add(new THREE.Points(geo(pointGeo(Array.from({ length: 120 }, () => [(rand() - 0.5) * 1.6, rand() * 1.8 - 0.8, (rand() - 0.5) * 1.6]))), mat(pointsMaterial(CYAN, 3))))
      tick = t => plats.forEach((p, i) => (p.rotation.y = t * (0.2 + i * 0.1)))
      break
    }
    case 'hangar': {
      // Hangar tunnel: rings receding in depth
      const rings = Array.from({ length: 9 }, (_, i) => {
        const m = ring(0.9, i % 2 ? CYAN : VIOLET, '#ffffff', 0.04, [0, 0, (i * Math.PI) / 9], 0.008, 32)
        m.position.z = -i * 0.45
        return m
      })
      tick = t => rings.forEach((r, i) => (r.position.z = -((i * 0.45 + t * 0.25) % 4)))
      break
    }
    case 'laboratory': {
      // Federated network: client nodes → aggregator → twin
      const nodes = Array.from({ length: 7 }, (_, i) => [Math.cos((i / 7) * Math.PI * 2) * 1.0, Math.sin((i / 7) * Math.PI * 2) * 0.75, (rand() - 0.5) * 0.4])
      const seg: THREE.Vector3[] = []
      nodes.forEach(n => seg.push(new THREE.Vector3(...(n as [number, number, number])), new THREE.Vector3(0, 0, 0)))
      add(new THREE.LineSegments(geo(new THREE.BufferGeometry().setFromPoints(seg)), mat(lineMaterial(CYAN))))
      add(new THREE.Points(geo(pointGeo([...nodes, [0, 0, 0]])), mat(pointsMaterial('#ffffff', 12))))
      const core = add(new THREE.Mesh(geo(new THREE.IcosahedronGeometry(0.28, 1)), mat(wireMaterial(MAGENTA))))
      ring(0.45, MAGENTA, VIOLET, 0.12, [1.1, 0, 0])
      tick = t => {
        core.rotation.set(t * 0.3, t * 0.4, 0)
        group.rotation.y = Math.sin(t * 0.2) * 0.35
      }
      break
    }
    case 'motion': {
      // Film-strip helix
      const frames = Array.from({ length: 22 }, (_, i) => {
        const m = add(new THREE.Mesh(geo(new THREE.PlaneGeometry(0.32, 0.2)), mat(glassMaterial(i % 3 === 0 ? MAGENTA : i % 3 === 1 ? CYAN : VIOLET))))
        m.userData.i = i
        return m
      })
      tick = t =>
        frames.forEach(f => {
          const i = f.userData.i as number
          const a = i * 0.55 + t * 0.4
          f.position.set(Math.cos(a) * 0.85, (i - 11) * 0.09, Math.sin(a) * 0.85)
          f.rotation.y = -a + Math.PI / 2
        })
      break
    }
    case 'arsenal': {
      // Nested instruments: wireframe solids
      const solids = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(0.7, 0), new THREE.DodecahedronGeometry(0.42, 0)].map((g, i) =>
        add(new THREE.Mesh(geo(g), mat(wireMaterial([CYAN, VIOLET, MAGENTA][i]!)))),
      )
      tick = t => solids.forEach((s, i) => s.rotation.set(t * (0.1 + i * 0.07), t * (0.15 - i * 0.04), 0))
      break
    }
    case 'milestones': {
      // Crystal with orbiting rings
      const crystal = add(new THREE.Mesh(geo(new THREE.OctahedronGeometry(0.55, 0)), mat(wireMaterial(CYAN))))
      crystal.scale.y = 1.5
      const inner = add(new THREE.Mesh(geo(new THREE.OctahedronGeometry(0.5, 0)), mat(glassMaterial(VIOLET))))
      inner.scale.y = 1.5
      ring(0.9, MAGENTA, '#ffffff', 0.1, [1.3, 0, 0])
      ring(1.1, CYAN, VIOLET, -0.07, [1.1, 0.4, 0], 0.008, 60)
      tick = t => {
        crystal.rotation.y = t * 0.4
        inner.rotation.y = -t * 0.3
      }
      break
    }
    case 'chronicles': {
      // Drifting memory frames
      const frames = Array.from({ length: 10 }, (_, i) => {
        const m = add(new THREE.Mesh(geo(new THREE.PlaneGeometry(0.42, 0.3)), mat(glassMaterial(i % 2 ? VIOLET : BLUE))))
        m.position.set((rand() - 0.5) * 2.2, (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.2)
        m.rotation.set((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.3)
        m.userData.s = rand()
        return m
      })
      tick = t => frames.forEach(f => (f.position.y += Math.sin(t * 0.6 + (f.userData.s as number) * 9) * 0.0012))
      break
    }
    case 'offbeat': {
      // Playful low-poly objects
      const objs = [
        new THREE.Mesh(geo(new THREE.IcosahedronGeometry(0.35, 1)), mat(wireMaterial(CYAN))),
        new THREE.Mesh(geo(new THREE.TorusKnotGeometry(0.28, 0.07, 80, 10)), mat(wireMaterial(MAGENTA))),
        new THREE.Mesh(geo(new THREE.BoxGeometry(0.4, 0.4, 0.4)), mat(wireMaterial(VIOLET))),
      ].map((m, i) => {
        m.position.set([-0.7, 0.6, 0][i]!, [0.3, 0.1, -0.5][i]!, 0)
        return add(m)
      })
      tick = t =>
        objs.forEach((o, i) => {
          o.rotation.set(t * (0.4 + i * 0.2), t * (0.3 + i * 0.1), 0)
          o.position.y = [0.3, 0.1, -0.5][i]! + Math.abs(Math.sin(t * 1.2 + i)) * 0.25
        })
      break
    }
    case 'transmission': {
      // Signal beacon: mast + expanding pulse rings
      add(new THREE.Mesh(geo(new THREE.CylinderGeometry(0.012, 0.035, 0.55, 8)), mat(glassMaterial(CYAN)))).position.y = 0.22
      const pulses = [0, 1, 2, 3].map(i => {
        const m = add(new THREE.Mesh(geo(new THREE.TorusGeometry(1, 0.01, 6, 160)), mat(glassMaterial(i % 2 ? MAGENTA : CYAN))))
        m.rotation.x = Math.PI / 2
        m.position.y = 0.5
        return m
      })
      tick = t =>
        pulses.forEach((p, i) => {
          const k = (t * 0.35 + i / 4) % 1
          p.scale.setScalar(0.1 + k * 1.4)
          ;(p.material as THREE.MeshBasicMaterial).userData.pulse = 1 - k
        })
      break
    }
    case 'atlas': {
      // The real Earth is drawn by NexusGlobe on the Atlas page — only a faint orbit here.
      ring(1.2, CYAN, VIOLET, 0.05, [1.25, 0, 0], 0.006, 80)
      break
    }
  }
  return { group, materials, geometries, tick }
}

/** Per-frame opacity/time update (module-level: mutation stays outside React's render data-flow). */
function applyFade(materials: THREE.Material[], fade: number, t: number, dpr: number) {
  for (const m of materials) {
    if (m instanceof THREE.ShaderMaterial) {
      if (m.uniforms.uOpacity) m.uniforms.uOpacity.value = fade
      if (m.uniforms.uTime) m.uniforms.uTime.value = t
      if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = dpr
    } else {
      const pulse = (m.userData.pulse as number | undefined) ?? 1
      const base = m instanceof THREE.MeshBasicMaterial && m.wireframe ? 0.55 : m instanceof THREE.LineBasicMaterial ? 0.6 : 0.22
      m.opacity = base * pulse * fade
    }
  }
}

/**
 * Signature 3D object for the current station, placed in the shared canvas behind the page header
 * (right side on wide screens, centred behind the title on narrow ones). It fades as the visitor scrolls.
 */
export function StationBackdrop({ variant, light }: { variant: StationVariant; light: boolean }) {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera
  const size = useThree(s => s.size)
  const built = useMemo(() => build(variant), [variant])
  const root = useRef<THREE.Group>(null)
  const fade = useRef(0)

  useEffect(
    () => () => {
      built.materials.forEach(m => m.dispose())
      built.geometries.forEach(g => g.dispose())
    },
    [built],
  )

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const aspect = size.width / Math.max(1, size.height)
    const { halfW, halfH } = frustumAt(camera, -5, aspect)
    const wide = aspect > 1.1
    g.position.set(wide ? halfW * 0.48 : 0, wide ? halfH * 0.12 : halfH * 0.38, -5)
    g.scale.setScalar(halfH * (wide ? 0.55 : 0.42))

    const scrollFade = 1 - THREE.MathUtils.clamp(window.scrollY / (window.innerHeight * 0.9), 0, 0.8)
    fade.current = THREE.MathUtils.damp(fade.current, scrollFade * (light ? 0.55 : 1) * (wide ? 1 : 0.32), 2.5, delta)
    const t = state.clock.elapsedTime
    built.tick(t, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, state.pointer.y * 0.12, 3, delta)
    applyFade(built.materials, fade.current, t, state.viewport.dpr)
  })

  return (
    <group ref={root}>
      <primitive object={built.group} />
    </group>
  )
}
