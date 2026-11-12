'use client'

/**
 * Tiny shared store between the DOM hero and the WebGL universe (no React re-renders per frame).
 * - stage: the DOM element the 3D portrait is locked to
 * - intro: 0 → 1 cinematic reveal progress (driven by GSAP)
 * - activeSkill / hoverSkill: index of the highlighted skill node (lighting accent)
 * - pointer: normalized mouse position (-1..1)
 */
export const heroStore = {
  stage: null as HTMLElement | null,
  intro: 0,
  activeSkill: -1,
  hoverSkill: -1,
  /** Set by the WebGL scene once the portrait texture is on screen. */
  glReady: false,
}

export const SKILL_ACCENTS = ['#4263ff', '#a678ff', '#51e5ff', '#7aa2ff', '#c08bff', '#3fd2ff'] as const
