'use client'

import * as THREE from 'three'

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** Draws once into an offscreen canvas and returns an sRGB texture. */
export function makeCanvasTexture(w: number, h: number, draw: Draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

const displayFont = () => {
  if (typeof document === 'undefined') return 'sans-serif'
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-unbounded').trim()
  return v || 'sans-serif'
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function glassPanel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, 'rgba(81,229,255,0.30)')
  g.addColorStop(0.5, 'rgba(66,99,255,0.16)')
  g.addColorStop(1, 'rgba(166,120,255,0.28)')
  roundRect(ctx, 6, 6, w - 12, h - 12, 22)
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(140,240,255,0.95)'
  ctx.shadowColor = 'rgba(81,229,255,0.9)'
  ctx.shadowBlur = 14
  ctx.stroke()
  ctx.shadowBlur = 0
  // header dots
  ;['#ff5cf0', '#51e5ff', '#a678ff'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(30 + i * 18, 28, 5, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** SF monogram for the platform disc (transparent background). */
export const drawSFLogo: Draw = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h)
  const g = ctx.createLinearGradient(w * 0.3, h * 0.3, w * 0.7, h * 0.7)
  g.addColorStop(0, '#51e5ff')
  g.addColorStop(0.5, '#7aa2ff')
  g.addColorStop(1, '#ff5cf0')
  ctx.font = `italic 800 ${Math.round(h * 0.2)}px ${displayFont()}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(81,229,255,0.9)'
  ctx.shadowBlur = 18
  ctx.fillStyle = g
  ctx.fillText('SF', w / 2, h / 2)
}

const drawVideo: Draw = (ctx, w, h) => {
  glassPanel(ctx, w, h)
  // player area
  roundRect(ctx, 26, 48, w - 52, h - 100, 12)
  ctx.fillStyle = 'rgba(8,12,40,0.55)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(81,229,255,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
  // play button
  const cx = w / 2
  const cy = 48 + (h - 100) / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 9, cy - 14)
  ctx.lineTo(cx + 15, cy)
  ctx.lineTo(cx - 9, cy + 14)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  // timeline
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(26, h - 36, w - 52, 6)
  const tg = ctx.createLinearGradient(26, 0, w - 26, 0)
  tg.addColorStop(0, '#51e5ff')
  tg.addColorStop(1, '#ff5cf0')
  ctx.fillStyle = tg
  ctx.fillRect(26, h - 36, (w - 52) * 0.62, 6)
  ctx.beginPath()
  ctx.arc(26 + (w - 52) * 0.62, h - 33, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
}

const drawDesign: Draw = (ctx, w, h) => {
  glassPanel(ctx, w, h)
  // vector path with anchor handles (pen tool)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(34, h - 40)
  ctx.bezierCurveTo(w * 0.3, 40, w * 0.6, h, w - 40, 60)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(81,229,255,0.9)'
  ctx.lineWidth = 2
  ;[
    [34, h - 40],
    [w - 40, 60],
  ].forEach(([x, y]) => {
    ctx.strokeRect(x! - 8, y! - 8, 16, 16)
  })
  ctx.beginPath()
  ctx.moveTo(w * 0.3, 40)
  ctx.lineTo(w * 0.48, h * 0.55)
  ctx.lineTo(w * 0.6, h)
  ctx.stroke()
  ;[
    [w * 0.3, 40, '#ff5cf0'],
    [w * 0.6, h - 8, '#a678ff'],
    [w * 0.48, h * 0.55, '#51e5ff'],
  ].forEach(([x, y, c]) => {
    ctx.fillStyle = c as string
    ctx.beginPath()
    ctx.arc(x as number, y as number, 8, 0, Math.PI * 2)
    ctx.fill()
  })
}

const drawChart: Draw = (ctx, w, h) => {
  glassPanel(ctx, w, h)
  const bars = [0.35, 0.55, 0.42, 0.7, 0.6, 0.86, 0.74]
  const bw = (w - 70) / bars.length
  bars.forEach((v, i) => {
    const bh = (h - 90) * v
    const x = 32 + i * bw
    const g = ctx.createLinearGradient(0, h - 30 - bh, 0, h - 30)
    g.addColorStop(0, '#51e5ff')
    g.addColorStop(1, 'rgba(66,99,255,0.35)')
    ctx.fillStyle = g
    roundRect(ctx, x, h - 30 - bh, bw * 0.6, bh, 4)
    ctx.fill()
  })
  ctx.strokeStyle = '#ff5cf0'
  ctx.lineWidth = 3
  ctx.beginPath()
  bars.forEach((v, i) => {
    const x = 32 + i * bw + bw * 0.3
    const y = h - 40 - (h - 90) * v
    if (i) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  })
  ctx.stroke()
}

/**
 * Floating glass panels around the portrait, in portrait units (plane height = 1, centre = 0).
 * All sit beside or below the shoulders (|x| ≥ 0.48 or y ≤ -0.2) — never over the face.
 */
export const HOLO_CARDS = [
  { key: 'video', w: 320, h: 200, size: [0.32, 0.2] as const, pos: [-0.5, -0.45, 0.12] as const, rot: [0, 0.45, 0.04] as const, draw: drawVideo },
  { key: 'design', w: 280, h: 200, size: [0.24, 0.17] as const, pos: [0.58, -0.08, 0.1] as const, rot: [0, -0.45, -0.05] as const, draw: drawDesign },
  { key: 'chart', w: 320, h: 200, size: [0.3, 0.19] as const, pos: [0.5, -0.4, 0.2] as const, rot: [0, -0.35, 0] as const, draw: drawChart },
]
