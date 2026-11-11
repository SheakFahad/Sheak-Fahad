# drei cheat-sheet + R3F recipes

## drei components worth knowing
| Need | Component |
|---|---|
| Gentle bobbing/rotation | `<Float speed={1.5} rotationIntensity={0.6} floatIntensity={1}>` |
| Realistic lighting fast | `<Environment preset="city" />` (presets: apartment, city, dawn, forest, lobby, night, park, studio, sunset, warehouse) |
| Soft ground shadow | `<ContactShadows opacity={0.4} blur={2.5} far={4} />` |
| Glass/refraction | `<MeshTransmissionMaterial thickness={0.5} roughness={0} transmission={1} ior={1.5} chromaticAberration={0.06} backside />` (expensive) |
| Wobbly blob | `<MeshDistortMaterial distort={0.4} speed={2} />`, `<MeshWobbleMaterial factor={1} />` |
| 3D/SDF text | `<Text font="/fonts/x.woff" fontSize={0.5}>Hi</Text>`, `<Text3D>` + `<Center>` |
| HTML inside 3D | `<Html transform occlude>` |
| Sparkles / stars | `<Sparkles count={60} scale={4} size={2} speed={0.4} />`, `<Stars />` |
| Centering / fitting | `<Center>`, `<Bounds fit clip observe>` |
| Images as planes | `<Image url="/a.jpg" scale={[2,1.3]} />` (supports `grayscale`, `zoom`, `radius`) |
| Model loading | `useGLTF('/m.glb')`, `useGLTF.preload('/m.glb')`, `useTexture()` |
| Many objects | `<Instances>` + `<Instance>`, `<Merged>` |
| Loading progress | `useProgress()` / `<Loader />` (DOM) |
| Perf | `<PerformanceMonitor>`, `<AdaptiveDpr pixelated />`, `<AdaptiveEvents />`, `<Preload all />`, `<BakeShadows />` |
| Controls | `<OrbitControls enableZoom={false} />`, `<PresentationControls global polar={[-.2,.2]} azimuth={[-.5,.5]}>` (great for "drag to rotate" without breaking page scroll) |
| Multiple scenes 1 canvas | `<View>` + `<View.Port />` with `<Canvas eventSource={container}>` |
| Scroll inside canvas | `<ScrollControls pages={3} damping={0.2}>` + `useScroll()` |
| Camera shake / rigs | `<CameraShake />`, `<CameraControls />` |
| Postprocessing | `@react-three/postprocessing`: `<EffectComposer><Bloom luminanceThreshold={1} mipmapBlur /><Noise opacity={.03}/><Vignette/></EffectComposer>` |

`maath` (pmndrs) gives `easing.damp3(vec, target, smoothTime, delta)` / `easing.dampE` for frame-rate-independent smoothing — preferred over raw lerp.

## Recipe: floating hero object with mouse parallax rig
```jsx
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, ContactShadows } from '@react-three/drei'
import { easing } from 'maath'

function Rig() {
  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [state.pointer.x * 0.6, state.pointer.y * 0.4, 6], 0.35, delta)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Hero3D({ reduced }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 35 }} eventSource={document.body} eventPrefix="client">
      <Float speed={reduced ? 0 : 1.4} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh>
          <torusKnotGeometry args={[1, 0.32, 220, 32]} />
          <meshStandardMaterial color="#14b8a6" metalness={0.8} roughness={0.15} />
        </mesh>
      </Float>
      <Environment preset="city" />
      <ContactShadows position={[0, -1.8, 0]} opacity={0.35} blur={2.5} />
      {!reduced && <Rig />}
    </Canvas>
  )
}
```

## Recipe: pause when off-screen
```jsx
function useInView(ref) {
  const [v, setV] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: '100px' })
    io.observe(ref.current); return () => io.disconnect()
  }, [])
  return v
}
// <Canvas frameloop={inView ? 'always' : 'never'}>
```
Also pause on `document.visibilitychange` (browsers throttle rAF anyway, but timers keep going).

## Recipe: instanced particle field (one draw call)
```jsx
function Particles({ count = 400 }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => Array.from({ length: count }, () => ({
    p: new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 4),
    s: 0.2 + Math.random() * 0.6 })), [count])
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    data.forEach((d, i) => {
      dummy.position.copy(d.p).applyAxisAngle(UP, t * 0.05 * d.s)
      dummy.scale.setScalar(0.02 + d.s * 0.03)
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[null, null, count]}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color="#e0a96d" /></instancedMesh>
}
const UP = new THREE.Vector3(0, 1, 0)
```

## Recipe: fullscreen shader plane (custom background)
```jsx
const Mat = shaderMaterial({ uTime: 0, uMouse: new THREE.Vector2() },
  /* vert */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.); }`,
  /* frag */ `uniform float uTime; varying vec2 vUv; void main(){ gl_FragColor=vec4(vUv, .5+.5*sin(uTime),1.); }`)
extend({ Mat })
function Bg() {
  const m = useRef()
  useFrame((s, d) => { m.current.uTime += d; m.current.uMouse.lerp(s.pointer, 0.05) })
  return <mesh><planeGeometry args={[2, 2]} /><mat ref={m} depthWrite={false} /></mesh>
}
```
(Using clip-space `gl_Position=vec4(position,1.)` makes a 2×2 plane always cover the screen.)

## Recipe: scroll-scrubbed 3D via GSAP
```jsx
function Model() {
  const g = useRef()
  useGSAP(() => {
    gsap.timeline({ scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      .to(g.current.rotation, { y: Math.PI * 2, ease: 'none' }, 0)
      .to(g.current.position, { x: 2, ease: 'none' }, 0)
  })
  return <group ref={g}>...</group>
}
```
`useGSAP` works inside Canvas children (it's a normal React hook); targets are three objects, not DOM.

## Recipe: load + normalize any GLB
```jsx
function Model({ url }) {
  const { scene } = useGLTF(url)
  const obj = useMemo(() => scene.clone(true), [scene])
  return <Center><primitive object={obj} /></Center>
}
useGLTF.preload('/models/hero.glb')
```

## Common bugs
- Colors look washed/dark vs CSS → tonemapping; add `flat` to Canvas or set `toneMapped={false}` on the material.
- Canvas is 0px tall → the parent needs an explicit height.
- Events not firing through overlay HTML → `eventSource` + `pointer-events:none` on overlay.
- Black screen on mobile → too many lights/shadows or float textures; lower dpr, disable shadows.
- Memory leak when swapping models → don't dispose cached `useLoader` assets; dispose only what you created.
