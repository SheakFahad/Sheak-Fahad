'use client'

/**
 * Tiny shared store between the DOM hero and the WebGL portrait (no React re-renders per frame).
 * - stage: the DOM element the 3D portrait is locked to
 * - intro: 0 → 1 cinematic reveal progress (driven by GSAP)
 * - glReady: set by the WebGL scene once the portrait texture is on screen
 */
export const heroStore = {
  stage: null as HTMLElement | null,
  intro: 0,
  glReady: false,
}
