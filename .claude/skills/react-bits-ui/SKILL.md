---
name: react-bits-ui
description: Use React Bits (reactbits.dev, DavidHDev/react-bits) premium animated React components — text animations, cursor/hover effects, WebGL backgrounds (Aurora, Silk, Particles…), animated cards, galleries, docks, menus. Use when choosing, installing, adapting, theming, or writing a new React Bits–style animated component, and when deciding which component fits a portfolio section.
---

# React Bits — premium animated React components

## What it is
- 215+ copy-in components (not an npm dependency). You own the code after install → edit freely.
- 5 categories: **TextAnimations (33), Animations (38), Components (48), Micro (34), Backgrounds (63)**.
- 4 variants per component: `JS-CSS`, `JS-TW`, `TS-CSS`, `TS-TW` (JS/TS × plain CSS/Tailwind).
- License: **MIT + Commons Clause** — free for personal & commercial use in your sites; you may not resell the components themselves.

## Install
```bash
npx shadcn@latest add @react-bits/SplitText-JS-CSS        # needs components.json (shadcn init)
npx jsrepo@latest add https://reactbits.dev/r/SplitText-JS-CSS
```
Or copy from the site's Code tab / repo `src/content/<Category>/<Name>/<Name>.jsx(+ .css)` (TS: `src/ts-default`, Tailwind: `src/tailwind`, `src/ts-tailwind`). Registry JSON: `https://reactbits.dev/r/{Name}-{VARIANT}.json`.
Then install the component's peer libs (see catalog). Always read the file after installing — props differ per component.

## Libraries they depend on (from source scan)
| lib | used by (examples) |
|---|---|
| `motion` (`motion/react`, formerly framer-motion) | BlurText, CountUp, RotatingText, TrueFocus, ScrollVelocity, CircularText, DecryptedText, Stack, most Micro |
| `gsap` (+ScrollTrigger/SplitText/@gsap/react) | SplitText, ScrollReveal, ScrollFloat, AnimatedContent, FadeContent, TextType, ScrambledText, Shuffle, StaggeredMenu, BubbleMenu, ImageTrail, MaskedHeading |
| **no deps** (plain React / raw WebGL2) | Aurora, Silk, Particles, CircularGallery, ScrollStack, LogoLoop, PillNav, TiltedCard, TargetCursor, SpotlightCard, Magnet |
| `@use-gesture/react` | DomeGallery |
| `@hugeicons/react` | ProfileCard, MagicBento (icons only — easy to swap out) |
| `ogl` (tiny WebGL lib) | EvilEye, MorphSlider, FlexCarousel, WarpText, RippleDistortion, CrystalizedBall, DitherVeil, ElectricLogo, MicroSlats, PatternWaves |
| `three` / `@react-three/fiber` / `drei` | ModelViewer, Lanyard, Hyperspeed, ColorBends, BlobCursor, PaperCrumple |
| `matter-js` | FallingText, Ballpit-style physics |
Prefer components whose engine you already ship (GSAP + R3F/three) to keep bundle small.

## Patterns observed in the source (copy these when writing your own)
1. **Sleep/wake rAF loop** — a `wake()` starts rAF only when something changes; the loop stops itself once values settle (SpotlightCard, SplitText hover springs). No idle CPU.
2. **Frame-rate-independent smoothing**: `follow = 1 - Math.exp(-dt / tau)`; clamp `dt` to ≤ 0.05.
3. **Reduced motion everywhere**: `matchMedia('(prefers-reduced-motion: reduce)')` → skip intro, set final state, call completion callbacks.
4. **IntersectionObserver** to stop work off-screen.
5. **Wait for fonts** (`document.fonts.ready`) before splitting text; hide (`visibility:hidden`) until ready to avoid FOUC.
6. **Settings in a ref** (`settingsRef.current = settings` every render) so the effect is mounted once and props update live without re-subscribing.
7. **Full cleanup**: remove listeners, `cancelAnimationFrame`, kill ScrollTriggers whose trigger is the element, `split.revert()`.
8. `useGSAP({ scope, dependencies, revertOnUpdate:true })` for GSAP components; `gsap.matchMedia` for reduced-motion branches.
9. Theme props (`theme="dark"|"light"`) map to CSS custom properties — make components follow the site's tokens rather than hard-coded colors.
10. Shaders convert colors in **OKLab/OKLCH** for smooth gradients and include dithering (`hash(frag)/255`) to kill banding.
11. Keyboard parity: focus-visible drives the same effect as hover (SpotlightCard tracks the focused element).
12. `'use client'` at top → safe for Next.js; harmless in Vite.

## Adapting a component to a site
- Replace hard-coded colors with `var(--accent)` etc.; for WebGL read `getComputedStyle(document.documentElement).getPropertyValue('--accent')` once and on theme change.
- Wrap heavy backgrounds in `lazy()` + `<Suspense>` and render only when visible.
- Cap DPR (`Math.min(devicePixelRatio, 1.5)`) for shader backgrounds.
- Keep at most **one** full-screen WebGL background active at a time; share with the R3F canvas if possible.
- Disable cursor effects on touch (`(pointer:coarse)`).
- Never let an effect hide content for no-JS / reduced motion users.

See [references/catalog.md](references/catalog.md) for the full component list and a portfolio-fit shortlist.
