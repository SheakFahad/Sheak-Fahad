# 3D & Animation Plan

## Concept: "The Sheak Fahad Universe"
One persistent scene: a calm deep-space volume (`#08090D` → `#101A35` fog) with a starfield, slow nebula shader, and **12 stations** (one per section). Each station is a distinct, simple geometric object with its own character, lit with the brand colours:
| Station | Object | Why |
|---|---|---|
| Home / Hero | Glass portal ring framing the **original portrait plane** + orbiting glass shards | Identity at the centre, face untouched |
| About | Floating paper-like layers (story pages) | Narrative |
| Career | Three linked orbit rings (3 companies) | Connection/timeline |
| Education | Stacked glowing platforms (SSC → HSC → B.Sc.) | Progress |
| Projects | Floating device frames showing project covers | Work |
| Video Studio | Film-strip helix / projector beam | Motion |
| Research | Node graph (digital twin network) | Thesis |
| Skills | Icosahedron cluster, one face per category | Capabilities |
| Travel | Earth globe (three-globe) | Journeys |
| Memories | Polaroid cloud | Archive |
| Hobbies | Football + controller low-poly | Personality |
| Contact | Signal beacon / antenna | Reach out |
Assets are procedural (three primitives + shaders) or small optimised GLBs (< 300 KB each, Draco/Meshopt via `gltf-transform`), so heavy downloads are avoided. No character model is used, and **the owner's face is never modelled**.

## Hero sequence (home)
1. **Loader (≤ 1.6s, skipped on repeat visits / reduced motion):** "SF" mark draws in (stroke), particles converge into the ring, a percentage counter shows real asset-loading progress (`useProgress`).
2. Camera dolly-in through the portal. The portrait plane fades in **inside** the ring as a textured plane: no shader on the face, light only around it (rim glow on the frame).
3. Name: SplitText masked line rise. Roles: rotating text (6 identities). Tagline blur-in. CTAs: magnetic.
4. Idle: shards orbit, mouse parallax rig (damped), cursor-reactive particles, gentle `Float`.
5. Scroll: the camera pulls back to reveal the universe, and "Explore My World" pulses.

## Explore Mode
Camera rig with predefined poses per station. GSAP `camera.fly` tweens position + `lookAt` target. Hover: station glows plus an HTML label (drei `<Html>` with occlusion off for accessibility). Click/Enter: fly in, then the route changes and the content panel slides up. A mini-map of 12 dots is the keyboard-accessible equivalent.

## Per-page 3D (drei `<View>` on the same canvas)
- Projects: device-frame cards with cover textures, tilt to the pointer, Flip-animated filters.
- Research: interactive architecture graph (nodes: data sources → edge devices → federated clients → aggregator → digital twin → dashboard). Nodes are clickable and show the **verified** description only. The structure comes from `research.architecture` JSON.
- Travel: three-globe with points and labels for verified locations, arcs from Gazipur, auto-rotate pause on hover, "Focus Bangladesh" button, and a Leaflet 2D map fallback.
- Skills: icosahedron cluster where clicking a face selects a category.

## Postprocessing (high tier only)
`EffectComposer` with Bloom (mipmapBlur, threshold 1, so only emissive parts glow), subtle Noise 0.025, Vignette. Off on medium/low tiers.

## Performance rules (from the `r3f-3d` skill)
One WebGL context. dpr `[1, 1.5]` (mobile 1–1.25). `PerformanceMonitor` drops tier on decline. `frameloop` → `never` when the tab is hidden or the canvas is off-screen. Instancing for particles/stars (≤ 1 draw call each). No allocation in `useFrame`. 3D bundle loaded via `next/dynamic({ ssr:false })` after first paint; the LCP element is the HTML hero heading. Budgets: initial JS ≤ 200 KB gz (public pages), 3D chunk ≤ 450 KB gz, total GLB/textures ≤ 2 MB desktop / 800 KB mobile.

## Motion system (DOM)
- Lenis smooth scroll driven by `gsap.ticker` (off for reduced motion; `data-lenis-prevent` in modals, maps and admin).
- Section headings: SplitText masked reveal. Body/cards: `ScrollTrigger.batch` fade-up. Images: clip-path reveal + parallax.
- Career: horizontal pinned timeline on desktop (≥1024), vertical on mobile.
- Projects gallery: Flip filtering. Case study: sticky index, progress line.
- Marquee: velocity-reactive roles/tools strip.
- Cursor: custom ring + dot (quickTo), with states for link/view/drag/play. Fine-pointer only; the native cursor stays visible for accessibility (the custom one is decorative).
- Magnetic buttons, spotlight cards (React Bits SpotlightCard pattern), tilt cards.
- Page transitions: curtain + camera move (ARCHITECTURE §5).
- Optional sound (off by default): soft UI ticks and an ambient pad via Web Audio. Toggle persisted. Never autoplays before user interaction.

## React Bits shortlist (adapted to tokens)
SplitText, RotatingText, ScrollReveal (About story), SpotlightCard, MagicBento (Hobbies), LogoLoop (tools), CountUp (stats), Stack (memories), DomeGallery or CircularGallery (memories/travel gallery, desktop), TargetCursor-style cursor (custom), Magnet. At most one "wow" effect per viewport.

## Accessibility of motion
`prefers-reduced-motion` → no Lenis, no camera flights (instant cut), no parallax/scrub, opacity-only reveals, the loader is skipped, and Explore Mode is disabled by default. All 3D information is duplicated in DOM text. The canvas is `aria-hidden`. Every interactive 3D affordance has a DOM button equivalent.
