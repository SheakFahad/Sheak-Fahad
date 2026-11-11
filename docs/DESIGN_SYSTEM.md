# Design System — "Digital Universe"

Direction: immersive 3D universe × futuristic minimalism × premium editorial. Dark-first; the light theme is a "daylight observatory" variant.

## Color tokens
| Token | Dark (default) | Light | Use |
|---|---|---|---|
| `--bg` | `#08090D` | `#F5F7FF` | page |
| `--bg-2` | `#101A35` | `#E8ECFA` | sections, panels |
| `--surface` | `rgb(16 26 53 / .55)` + blur 20px | `rgb(255 255 255 / .7)` | glass cards |
| `--line` | `rgb(245 247 255 / .10)` | `rgb(16 26 53 / .12)` | borders |
| `--text` | `#F5F7FF` | `#0B1020` | primary text |
| `--text-2` | `#A9B1D6` | `#3D4766` | secondary (AA on bg) |
| `--blue` | `#4263FF` | `#3550E6` | primary action |
| `--cyan` | `#51E5FF` | `#0B8FB0` | links, focus, data |
| `--violet` | `#A678FF` | `#7A4DE0` | accent, highlights |
| `--grad` | `linear-gradient(120deg,#4263FF,#51E5FF 50%,#A678FF)` | same, darker stops | hero type, CTAs |
| `--success` `--warn` `--danger` | `#3DDC97` `#FFC857` `#FF5C7A` | darker variants | admin statuses |
Contrast: body text ≥ 7:1, secondary ≥ 4.5:1 in both themes. Cyan on `--bg` passes AA for text ≥ 14px.

## Typography (next/font/google, self-hosted)
| Role | Font | Notes |
|---|---|---|
| Display | **Unbounded** (600–800) | wide, futuristic; hero, section titles |
| Body / UI | **Manrope** (400–700) | readable, geometric |
| Mono / labels | **JetBrains Mono** (400–500) | eyebrows, metadata, code, admin IDs |
| Bangla | **Anek Bangla** (variable) for display + **Noto Sans Bengali** for body | auto-applied with `:lang(bn)` |
Scale (fluid, `clamp`): display 56→128px · h1 40→72 · h2 30→48 · h3 22→30 · body 16→18 · small 14 · micro 12 (mono, +0.12em tracking, uppercase).
Experimental typography: masked split-line reveals, variable-weight hover on display words, outline/fill swap, kinetic marquee of roles.

## Spacing, grid, radius, depth
- 4px base: 4 8 12 16 24 32 48 64 96 128 160.
- Grid: 12 columns, max-width 1320px, gutter 24px (16px mobile side gutter), section padding 120px desktop / 72px mobile.
- Radius: 8 (inputs) · 16 (cards) · 28 (panels) · 999 (pills).
- Elevation: glass panels with `backdrop-filter: blur(20px) saturate(140%)`, 1px `--line` border, inner highlight `inset 0 1px 0 rgb(255 255 255 / .06)`, glow shadow `0 0 40px -10px var(--blue)`.

## Breakpoints
`sm 480` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`. 3D quality tiers: **high** (≥1280 + fine pointer + no low-power), **medium** (tablet), **low** (mobile: simplified scene, no postprocessing), **off** (reduced motion / no WebGL / Save-Data).

## Components (each with default, hover, focus-visible, active, disabled, loading states)
- **Buttons:** `primary` (gradient fill, magnetic), `secondary` (glass), `ghost`, `icon`, `link`. Sizes sm/md/lg. Minimum tap target 44px.
- **Cards:** `GlassCard`, `ProjectCard` (3D tilt + spotlight), `StatCard`, `TimelineCard`, `MediaCard` (focal-point crop), `BentoTile`.
- **Navigation:** top bar (blur, shrinks on scroll), mega menu (fullscreen, staggered), breadcrumbs, section index (sticky), bottom dock on mobile, Ctrl+K palette.
- **Overlays:** `Modal`, `Drawer`, `Lightbox` (zoom, swipe, keyboard), `VideoPlayer` (fullscreen, captions, poster), `Toast`.
- **Forms:** `Input`, `Textarea` (counter), `Select`, `Segmented`, `FileDrop` (preview, progress), `Checkbox/Consent`, with inline errors via `aria-describedby`.
- **Data display:** `Chip`, `Badge(status)`, `Tabs`, `Accordion`, `Timeline`, `Table` (admin), `EmptyState`.
- **Brand:** `SFMark` (logo), `Starfield`, `OrbitRing`, `GradientText`.

## Motion presets (`lib/motion/presets.ts`)
| Name | Spec |
|---|---|
| `reveal.up` | y 60→0, autoAlpha, 0.9s `expo.out`, stagger 0.08 |
| `reveal.mask` | SplitText lines, yPercent 110→0, 1.1s `expo.out`, stagger 0.09 |
| `reveal.clip` | clip-path inset 100%→0 + inner scale 1.3→1, 1.2s `expo.inOut` |
| `hover.lift` | y −6, 0.35s `power3.out`, `overwrite:'auto'` |
| `magnetic` | quickTo 0.6s `elastic.out(1,.35)`, strength 0.35 |
| `page.curtain` | 2 panels, 0.7s `power4.inOut`, 0.08s offset |
| `camera.fly` | 1.6s `power3.inOut` on position + target |
| `scrub.soft` | `scrub: 1` |
Durations ≤ 1.2s for UI, ≤ 2s for camera. Reduced motion → opacity-only, 0.2s, or none.

## Iconography & imagery
Line icons (Lucide, 1.5px stroke). Photos sit inside cinematic frames (thin gradient border, corner ticks, subtle scanline overlay **outside** the face area), glass panels, or 3D planes in the scene. **No filter, warp, or generative effect is ever applied to the face.** Effects go on the frame, the background and the lighting only.

## Voice
Confident, warm, concise. Short sentences. The Bangla copy is a translation the owner has approved, not machine output left unedited.
