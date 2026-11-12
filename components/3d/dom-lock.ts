'use client'

import * as THREE from 'three'

// Re-used math objects (no per-frame allocation)
const _ndc = new THREE.Vector2()
const _ray = new THREE.Raycaster()
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()

/** Projects a screen point onto the z=0 world plane. */
function screenToWorld(x: number, y: number, w: number, h: number, camera: THREE.Camera, out: THREE.Vector3) {
  _ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1)
  _ray.setFromCamera(_ndc, camera)
  return _ray.ray.intersectPlane(_plane, out)
}

/**
 * Locks a 3D object to a DOM element's rectangle on the z=0 plane.
 * Writes the rect centre into `center` and returns the world height (or width) of the rect, or 0 when off-screen.
 */
export function lockToRect(el: HTMLElement, size: { width: number; height: number }, camera: THREE.Camera, center: THREE.Vector3, measure: 'height' | 'width' = 'height') {
  const r = el.getBoundingClientRect()
  const { width: w, height: h } = size
  if (r.width === 0 || r.height === 0 || r.bottom < -h * 0.5 || r.top > h * 1.5) return 0
  if (!screenToWorld(r.left + r.width / 2, r.top + r.height / 2, w, h, camera, center)) return 0
  if (measure === 'height') {
    if (!screenToWorld(r.left + r.width / 2, r.bottom, w, h, camera, _a)) return 0
    return Math.abs(center.y - _a.y) * 2
  }
  if (!screenToWorld(r.right, r.top + r.height / 2, w, h, camera, _b)) return 0
  return Math.abs(_b.x - center.x) * 2
}

/** Half-height / half-width of the camera frustum at world depth z (perspective camera looking down -z). */
export function frustumAt(camera: THREE.PerspectiveCamera, z: number, aspect: number) {
  const dist = Math.max(0.1, camera.position.z - z)
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  return { halfH, halfW: halfH * aspect }
}

export const seg = (t: number, a: number, b: number) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export const BASIC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

/** Comet-trail line material for rings / arcs / tubes (uv.x runs along the curve). */
const COMET_FRAG = /* glsl */ `
  uniform float uTime; uniform float uSpeed; uniform float uOpacity; uniform float uBase; uniform float uDash;
  uniform vec3 uColorA; uniform vec3 uColorB;
  varying vec2 vUv;
  void main() {
    float u = fract(vUv.x - uTime * uSpeed);
    float comet = pow(u, 7.0);
    float dash = uDash > 0.0 ? 0.55 + 0.45 * step(0.5, fract(vUv.x * uDash)) : 1.0;
    float a = (uBase * dash + comet * 1.6) * uOpacity;
    vec3 col = mix(uColorA, uColorB, comet);
    gl_FragColor = vec4(col * a, a);
  }
`

export function cometMaterial(colorA: THREE.Color | string, colorB: THREE.Color | string, speed: number, base: number, dash = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: BASIC_VERT,
    fragmentShader: COMET_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uOpacity: { value: 0 },
      uBase: { value: base },
      uDash: { value: dash },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}
