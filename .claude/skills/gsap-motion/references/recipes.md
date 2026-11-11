# GSAP portfolio recipes

All assume `gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP)` and run inside `useGSAP` (or `gsap.context`) and inside `mm.add('(prefers-reduced-motion: no-preference)', ...)`.

## 1. Preloader → hero hand-off
```js
const tl = gsap.timeline()
tl.to('.pre-count', { innerText: 100, snap: { innerText: 1 }, duration: 1.4, ease: 'power2.inOut' })
  .to('.pre', { yPercent: -100, duration: .9, ease: 'expo.inOut' })
  .add(heroIntro(), '-=.35')   // heroIntro returns a timeline
```
Keep preloader ≤ 1.5s, skippable, and skip entirely on repeat visits (sessionStorage) and for reduced motion.

## 2. Hero intro (masked lines + stagger)
```js
function heroIntro() {
  const split = SplitText.create('.hero h1', { type: 'lines,words', mask: 'lines' })
  return gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.1 } })
    .from(split.lines, { yPercent: 110, stagger: .09 })
    .from('.hero .eyebrow, .hero .lead', { y: 24, autoAlpha: 0, stagger: .1 }, '<.2')
    .from('.hero .btn', { y: 20, autoAlpha: 0, stagger: .08 }, '<.15')
    .from('.hero-canvas', { autoAlpha: 0, scale: .92, duration: 1.6 }, 0)
}
```

## 3. Section heading reveal (reusable)
```js
gsap.utils.toArray('section h2').forEach(h => {
  SplitText.create(h, { type: 'words', mask: 'words', autoSplit: true,
    onSplit: s => gsap.from(s.words, { yPercent: 100, stagger: .06, duration: .9, ease: 'power4.out',
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } }) })
})
```

## 4. Grid / card batch reveal
```js
ScrollTrigger.batch('.reveal', {
  start: 'top 88%', once: true,
  onEnter: els => gsap.fromTo(els, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .08, duration: .9, ease: 'power3.out' })
})
```
Set `.reveal { visibility:hidden }` in CSS only when JS+motion is on (add class `js-motion` to `<html>`), otherwise content would be invisible without JS.

## 5. Pinned stacking project cards
```js
const cards = gsap.utils.toArray('.pj')
cards.forEach((c, i) => {
  if (i === cards.length - 1) return
  gsap.to(c, { scale: .9, autoAlpha: .4, ease: 'none',
    scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 20%', scrub: true } })
  ScrollTrigger.create({ trigger: c, start: 'top 15%', endTrigger: '.pj-list', end: 'bottom bottom', pin: true, pinSpacing: false })
})
```
(Animate the card's inner wrapper if the card itself is pinned — rule #3.)

## 6. Horizontal timeline (career / education)
```js
const track = document.querySelector('.h-track')
const tween = gsap.to(track, { x: () => -(track.scrollWidth - innerWidth + 48), ease: 'none',
  scrollTrigger: { trigger: '.h-wrap', start: 'top top', end: () => '+=' + track.scrollWidth, pin: true, scrub: 1, invalidateOnRefresh: true } })
gsap.utils.toArray('.h-item').forEach(el => gsap.from(el.querySelector('.inner'), { y: 60, autoAlpha: 0,
  scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 80%' } }))
```
Only on desktop via matchMedia; mobile gets a vertical list.

## 7. Image clip-path reveal + parallax
```js
gsap.utils.toArray('.img-reveal').forEach(w => {
  const img = w.querySelector('img')
  gsap.timeline({ scrollTrigger: { trigger: w, start: 'top 80%' } })
    .fromTo(w, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' })
    .from(img, { scale: 1.3, duration: 1.6, ease: 'expo.out' }, 0)
  gsap.to(img, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: w, scrub: true } })
})
```

## 8. Count-up stats
```js
gsap.from('.stat b', { textContent: 0, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 }, stagger: .15,
  scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true } })
```

## 9. Velocity-reactive marquee
```js
const loop = gsap.to('.marq-inner', { xPercent: -50, ease: 'none', duration: 30, repeat: -1 })
ScrollTrigger.create({ onUpdate: self => {
  const v = gsap.utils.clamp(-4, 4, self.getVelocity() / 300)
  gsap.to(loop, { timeScale: v || 1, duration: .3, overwrite: true })
  gsap.to(loop, { timeScale: Math.sign(v) || 1, duration: 1, delay: .3 })
}})
```
Content must be duplicated twice inside `.marq-inner`.

## 10. Magnetic button
```js
document.querySelectorAll('.magnetic').forEach(b => {
  const xTo = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1,.35)' })
  const yTo = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1,.35)' })
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .35); yTo((e.clientY - r.top - r.height / 2) * .35) })
  b.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
})
```

## 11. Filter chips with Flip (travel / projects)
```js
function filter(key) {
  const st = Flip.getState('.spot')
  document.querySelectorAll('.spot').forEach(el => el.hidden = key && el.dataset.g !== key)
  Flip.from(st, { duration: .5, ease: 'power2.inOut', scale: true, absolute: true,
    onEnter: e => gsap.fromTo(e, { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1, duration: .4 }),
    onLeave: e => gsap.to(e, { autoAlpha: 0, scale: .9, duration: .3 }) })
}
```

## 12. Text scramble on hover (ScrambleTextPlugin, free)
```js
el.addEventListener('pointerenter', () => gsap.to(el, { duration: .6, scrambleText: { text: el.dataset.text, chars: 'upperCase', speed: .6 } }))
```

## 13. Section colour/theme shift on scroll
```js
gsap.utils.toArray('[data-bg]').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 50%', end: 'bottom 50%',
  onToggle: self => self.isActive && gsap.to('body', { '--bg': s.dataset.bg, duration: .6, overwrite: 'auto' }) }))
```

## 14. Drive a three.js object from scroll (see r3f-3d skill)
```js
gsap.to(meshRef.current.rotation, { y: Math.PI * 2, ease: 'none', scrollTrigger: { trigger: '#about', scrub: 1 } })
```
or store progress in a ref via `onUpdate: s => progress.current = s.progress` and damp in `useFrame`.
