'use client'

import type { HomeConfig } from '@/lib/content/types'

/**
 * Shared, mutable state between the DOM NEXUS homepage and the WebGL universe (no React re-renders per frame).
 * - globe: DOM element the 3D Earth is locked to (null → globe hidden)
 * - intro: 0 → 1 environment/globe activation (driven by GSAP)
 * - scroll: 0 → 1 progress of the hero leaving the viewport
 * - spin: extra globe rotation velocity from dragging / keyboard (rad/s, decays)
 * - hoverStation: index of the hovered/focused station (-1 = none) — drives the globe beam + accent
 */
export const nexusStore = {
  globe: null as HTMLElement | null,
  intro: 0,
  scroll: 0,
  spin: 0,
  hoverStation: -1,
  stationCount: 0,
  env: null as HomeConfig['environment'] | null,
  /** ATLAS: published destinations shown as markers on the Earth, the selected one, and their screen positions. */
  markers: [] as { id: string; lat: number; lng: number }[],
  selected: null as string | null,
  markerScreen: {} as Record<string, { x: number; y: number; front: boolean }>,
}

export const STATION_ACCENTS = ['#51e5ff', '#4263ff', '#a678ff', '#ff5cf0', '#3fd2ff', '#7aa2ff'] as const
