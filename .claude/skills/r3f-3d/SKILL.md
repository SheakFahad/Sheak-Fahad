---
name: r3f-3d
description: Build interactive 3D web scenes with three.js + React Three Fiber (R3F) + drei. Use when adding a 3D hero, WebGL background, 3D model viewer, shader material, scroll-driven camera, or any <Canvas> work; also when debugging R3F performance, re-renders, loading/Suspense, or color/tonemapping issues.
---

# React Three Fiber (R3F) — 3D for the web

R3F is a React renderer for three.js: `<mesh>` = `new THREE.Mesh()`, props = object properties, `args` = constructor arguments. Everything three.js can do, R3F can do, with no overhead (the render loop runs outside React).

## Versions (verified Nov 2026)
| pkg | version | note |
|---|---|---|
| `@react-three/fiber` | 9.8.x | peer: **react/react-dom >=19 <19.4**, three >=0.156 |
| `@react-three/drei` | 10.7.x | helpers; pairs with fiber 9 |
| `three` | 0.187.x | import addons from `three/addons/...` |
| `react` | 19.3.x | |
R3F v8 = React 18. Never mix v8 with React 19 or v9 with React 18.

## Mental model
- JSX names are camelCase three classes: `<meshStandardMaterial>`, `<boxGeometry args={[1,1,1]}>`, `<ambientLight>`.
- Dashed props pierce: `position-x={1}`, `material-color="hotpink"`, `rotation={[0, Math.PI/2, 0]}`.
- `attach="material"` / `attach="geometry"` is inferred for materials/geometries; use `attach` for others (e.g. `attach="background"`).
- `<primitive object={gltf.scene} />` drops an existing three object in. `extend({ MyClass })` registers custom classes as JSX.
- **All hooks (`useFrame`, `useThree`, `useLoader`) only work inside `<Canvas>` children.**

## Canvas defaults (know these to avoid surprises)
`<Canvas>` creates WebGLRenderer with `antialias, alpha:true, powerPreference:"high-performance"`, sRGB output, **ACESFilmic tonemapping**, camera `{fov:75, near:.1, far:1000, position:[0,0,5]}`, `dpr=[1,2]`, `frameloop="always"`.
- `flat` → NoToneMapping (use when colors must match CSS brand colors exactly).
- `linear` → disables sRGB conversion. Rarely wanted.
- `eventSource={document.body or ref}` + `eventPrefix="client"` → lets a canvas *behind* HTML still receive pointer events.
- `fallback={<img/>}` → DOM shown when WebGL is unavailable.
- `gl={{ antialias:false }}` when using postprocessing (it has its own AA).

## Hooks
```jsx
useFrame((state, delta, xrFrame) => { ref.current.rotation.y += delta * 0.3 }, priority?)
```
- runs every frame before render; auto-unsubscribes on unmount.
- **priority > 0 takes over rendering** (you must call `gl.render`). Negative values only order callbacks.
- `state` = `{ gl, scene, camera, pointer (-1..1), clock, size, viewport, invalidate, ... }`.

```jsx
const viewport = useThree(s => s.viewport)   // ALWAYS use a selector
const get = useThree(s => s.get)             // non-reactive read: get().camera
```
`viewport` is in world units (width/height at z=0) — use it to size meshes to the screen.

```jsx
const tex = useLoader(TextureLoader, url)        // suspends; cached by URL
useLoader.preload(GLTFLoader, '/model.glb')
```
Wrap loaders in `<Suspense fallback={null}>`. Cached results are **shared** — clone before mutating (`useMemo(() => scene.clone(true), [scene])`).

## The 11 performance rules (from official pitfalls page)
1. **Never `setState` in `useFrame`, intervals, or `onPointerMove`.** Mutate refs.
2. Multiply motion by `delta` — never fixed increments (refresh-rate independence).
3. Animate with `THREE.MathUtils.lerp` / `damp` in `useFrame`, or with GSAP tweening a ref (see gsap-motion skill).
4. **Don't allocate in the loop**: hoist `const v = new THREE.Vector3()` outside, then `v.set(...)`.
5. Share geometries/materials across meshes (`useMemo` once, pass via `geometry={g} material={m}`).
6. > ~100 similar meshes → `<instancedMesh args={[null,null,count]}>` or drei `<Instances>`. Keep draw calls < ~500.
7. Toggle `visible` instead of mount/unmount (re-mount recompiles shaders).
8. Read fast-changing stores in `useFrame` via `api.getState()`, not via reactive selectors.
9. `startTransition` for expensive React updates inside the canvas.
10. `frameloop="demand"` for mostly-static scenes, then `invalidate()` on change.
11. Adaptive quality: `<PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)}>`, `<AdaptiveDpr pixelated />`, `performance={{ min: 0.5 }}` + `regress()`.

## Must-do for a production website hero
- Pause rendering when off-screen: IntersectionObserver on the wrapper → `setFrameloop('never')` / `'always'` (or `frameloop="demand"` + invalidate while visible).
- Cap DPR: `dpr={[1, 1.5]}` on marketing pages; mobile 1–1.25.
- Respect `prefers-reduced-motion`: freeze `useFrame` motion (multiply speed by 0) and skip intro.
- Lazy-load the whole 3D chunk: `const Hero3D = lazy(() => import('./Hero3D'))` so text is interactive before WebGL arrives (LCP stays on HTML).
- Provide a static poster image / CSS gradient fallback.
- Compress models: `npx gltfjsx model.glb --transform` (Draco + WebP textures + JSX component). Target < 1–2 MB total 3D payload.
- Textures: power-of-two, ≤ 2048px, `.webp`/KTX2.

## Combining with GSAP and scroll
- GSAP can tween any three object directly: `gsap.to(mesh.current.rotation, { y: Math.PI, scrollTrigger: {...} })`. R3F renders it next frame (with `frameloop="always"`).
- Scroll-driven camera: store scroll progress in a ref (from ScrollTrigger `onUpdate`) and `damp` the camera toward it in `useFrame`.
- drei `<ScrollControls pages={3}>` + `useScroll()` is an alternative when the *whole page* lives inside the canvas — avoid for content-heavy sites (bad for SEO/a11y). Prefer normal DOM scroll + ScrollTrigger.
- One fullscreen fixed canvas + drei `<View>` (gl.scissor) lets many DOM-positioned 3D scenes share ONE WebGL context — use when >1 section needs 3D.

## Reference
See [references/drei-and-recipes.md](references/drei-and-recipes.md) for drei components and copy-paste recipes (floating hero object, mouse parallax rig, particles, shader plane, model viewer, offscreen pause).
