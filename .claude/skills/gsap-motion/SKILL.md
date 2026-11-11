---
name: gsap-motion
description: Advanced motion design with GSAP 3 — timelines, ScrollTrigger (pin/scrub/snap), SplitText text reveals, quickTo cursor followers, Flip layout transitions, gsap.matchMedia responsive/reduced-motion, and the @gsap/react useGSAP hook. Use for any scroll animation, page-load intro, cinematic transition, text animation, magnetic/cursor effect, or smooth scrolling (Lenis) work.
---

# GSAP — motion graphics for the web

## Versions & licensing (verified Nov 2026)
- `gsap` **3.15.x**, `@gsap/react` **2.1.x**, `lenis` 1.3.x.
- Since Webflow's acquisition **GSAP and all former "Club" plugins are free incl. commercial use** (SplitText, ScrollSmoother, MorphSVG, DrawSVG, ScrambleText, Inertia, Physics2D…). They ship inside the normal `gsap` npm package: `import { SplitText } from 'gsap/SplitText'`. No `gsap-trial`, no auth token.
- CDN (no build): `https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js` (+ `/dist/ScrollTrigger.min.js`, `/dist/SplitText.min.js`).

## Core API in 60 seconds
```js
gsap.to(target, { x: 100, duration: 1, ease: 'power3.out' })   // to
gsap.from(target, { autoAlpha: 0, y: 40 })                       // from current
gsap.fromTo(t, { scale: .8 }, { scale: 1 })
gsap.set(t, { xPercent: -50 })
```
- Prefer transform shorthands (`x, y, xPercent, scale, rotation, rotationX, skewX`) and `autoAlpha` (opacity + visibility). Never animate `top/left/width` for motion.
- `stagger: 0.05` or `{ each: .05, from: 'center'|'end'|'random'|index, grid: 'auto', ease }`.
- Eases: `none, power1-4 (.in/.out/.inOut), back(1.7), elastic(1,.3), expo, circ, sine, steps(n)`; premium feel = `power3.out` / `expo.out` for entrances, `power2.inOut` for transitions.
- Function-based values: `x: (i, el) => i * 20`; random: `x: 'random(-100,100)'`.
- `overwrite: 'auto'` kills conflicting tweens on the same props (use for hover in/out).
- `immediateRender` — `from()` tweens render immediately; set `false` when stacking `from()`s on the same prop.
- `gsap.utils`: `clamp, mapRange, interpolate, wrap, snap, toArray, distribute, random, pipe`.

## Timelines (the main tool for "cinematic")
```js
const tl = gsap.timeline({ defaults: { duration: .9, ease: 'power3.out' } })
tl.from('.eyebrow', { y: 20, autoAlpha: 0 })
  .from(split.chars, { yPercent: 110, stagger: .02 }, '<.1')   // .1s after previous START
  .from('.cta a', { y: 20, autoAlpha: 0, stagger: .08 }, '-=.5') // overlap end by .5s
  .addLabel('three').from(canvas, { autoAlpha: 0, scale: .95 }, 'three')
```
Position: `3` absolute · `'+=1'`/`'-=1'` relative to end · `'<'` start of prev · `'>'` end of prev · `'<0.2'`, `'>-0.1'` · `'label+=.5'`.
Control: `play/pause/reverse/restart/seek/progress/timeScale/tweenTo('label')`, `tl.then()`.
Build long sequences as functions that return timelines and `master.add(intro()).add(outro(), '+=.2')`.

## ScrollTrigger
```js
gsap.registerPlugin(ScrollTrigger)
gsap.timeline({ scrollTrigger: {
  trigger: '.section', start: 'top top', end: '+=150%',
  pin: true, scrub: 1, snap: { snapTo: 'labels', duration: { min: .2, max: .8 }, ease: 'power1.inOut' },
  anticipatePin: 1, invalidateOnRefresh: true, // markers: true while debugging
}})
```
- `start/end`: `"<trigger point> <viewport point>"`, e.g. `'top 80%'`, `'center center'`, `'bottom top'`, `'+=500'`, `'clamp(top bottom)'`.
- `toggleActions: 'play none none reverse'` (onEnter onLeave onEnterBack onLeaveBack) for non-scrubbed reveals. `once: true` for one-shot.
- `scrub: true` = locked; `scrub: 1` = 1s smoothing (feels premium).
- `ScrollTrigger.batch('.card', { onEnter: els => gsap.from(els, { y: 40, autoAlpha: 0, stagger: .1 }), start: 'top 85%' })` — best way to reveal grids.
- Horizontal scroll section:
  ```js
  const track = gsap.to('.track', { x: () => -(track.scrollWidth - innerWidth), ease: 'none',
    scrollTrigger: { trigger: '.h-wrap', pin: true, scrub: 1, end: () => '+=' + track.scrollWidth, invalidateOnRefresh: true } })
  // children: scrollTrigger: { containerAnimation: track, trigger: '.panel', start: 'left center' }
  ```
  `containerAnimation` requires `ease:'none'`, no pin/snap on the children.

### ScrollTrigger rules that prevent 90% of bugs
1. Register plugins once at app entry.
2. Create triggers **top-to-bottom in page order** (or `refreshPriority`).
3. **Never animate the pinned element itself** — animate its children.
4. No `transform`/`will-change`/`filter` on ancestors of a pinned element (breaks `position:fixed`).
5. After images/fonts/layout change → `ScrollTrigger.refresh()` (e.g. on `document.fonts.ready`, after lazy images load).
6. Kill/revert on unmount (useGSAP does it automatically).
7. `content-visibility:auto` breaks measurements.
8. Debug with `markers: true` + `id`.

## SplitText (v3.13+ rewrite, free)
```js
SplitText.create('.headline', {
  type: 'lines, words', mask: 'lines', autoSplit: true, aria: 'auto',
  onSplit: self => gsap.from(self.lines, { yPercent: 100, duration: 1, stagger: .08, ease: 'expo.out' })
})
```
- `mask: 'lines'` wraps each line with overflow clip → classic "text rises from behind a line" reveal.
- `autoSplit: true` re-splits on font load / resize; **return the animation from `onSplit`** so progress carries over.
- Avoid `type:'chars'` alone (bad wrapping) — use `'words, chars'` or `smartWrap: true`.
- Accessibility: default `aria:'auto'` puts `aria-label` on parent and hides pieces.
- Wait for fonts: `document.fonts.ready.then(...)` before splitting (React Bits SplitText does this).

## React: useGSAP (always use this, never raw useEffect)
```jsx
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

function Section() {
  const root = useRef()
  useGSAP(() => {
    gsap.from('.card', { y: 60, autoAlpha: 0, stagger: .1, scrollTrigger: { trigger: root.current, start: 'top 75%' } })
  }, { scope: root, dependencies: [items.length], revertOnUpdate: true })

  const { contextSafe } = useGSAP({ scope: root })
  const onEnter = contextSafe(e => gsap.to(e.currentTarget, { scale: 1.04, overwrite: 'auto' }))
  return <section ref={root}>...</section>
}
```
- `scope` limits selector text to the component. Everything created inside is auto-reverted on unmount (StrictMode-safe).
- Code that runs later (event handlers, timeouts) must be wrapped in `contextSafe`.
- `revertOnUpdate: true` when dependencies change the DOM.

## Responsive & accessibility: gsap.matchMedia
```js
const mm = gsap.matchMedia()
mm.add({ isDesktop: '(min-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, ctx => {
  const { isDesktop, reduce } = ctx.conditions
  if (reduce) { gsap.set('.reveal', { autoAlpha: 1 }); return }
  gsap.from('.reveal', { y: isDesktop ? 80 : 30, autoAlpha: 0 })
})
```
Auto-reverts when conditions stop matching. `ScrollTrigger.matchMedia` is **deprecated** — use this.

## Cursor / magnetic / follower (60fps without GC)
```js
const xTo = gsap.quickTo('.cursor', 'x', { duration: .45, ease: 'power3' })
const yTo = gsap.quickTo('.cursor', 'y', { duration: .45, ease: 'power3' })
addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY) })
```
Magnetic button: on `pointermove` inside, `xTo((e.clientX - cx) * .35)`; on leave `xTo(0)` with `ease:'elastic.out(1,.4)'`.
Only on `(hover:hover) and (pointer:fine)`.

## Flip (layout transitions — filters, grid↔list, modal open)
```js
const state = Flip.getState('.card')
container.classList.toggle('grid')          // change layout
Flip.from(state, { duration: .6, ease: 'power2.inOut', absolute: true, stagger: .03,
  onEnter: els => gsap.fromTo(els, { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1 }),
  onLeave: els => gsap.to(els, { autoAlpha: 0, scale: .9 }) })
```
Perfect for travel/project filter chips.

## Smooth scroll: Lenis + ScrollTrigger (standard pairing)
```js
const lenis = new Lenis({ lerp: .1, anchors: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(t => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
```
React: `import { ReactLenis } from 'lenis/react'` → `<ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>` and drive it from `gsap.ticker`. Add `data-lenis-prevent` to inner scroll areas (modals, maps). Disable for reduced motion. Alternative: GSAP `ScrollSmoother` (needs `#smooth-wrapper > #smooth-content` structure; harder with fixed canvases).

## Performance
- Animate only `transform` and `opacity` (and `filter` sparingly — blur is expensive on big areas).
- `will-change: transform` only during animation (GSAP's `force3D:'auto'` handles layers).
- Don't create hundreds of ScrollTriggers — use `batch`.
- `gsap.ticker` is a single rAF; hook custom loops into it instead of separate rAFs.

See [references/recipes.md](references/recipes.md) for portfolio-ready recipes (preloader, hero intro, pinned project stack, counter, marquee with velocity, page transition curtain, image reveal mask, text scramble).
