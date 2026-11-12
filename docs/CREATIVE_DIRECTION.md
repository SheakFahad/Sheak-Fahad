# Creative Direction — "SHEAK FAHAD · Digital Universe" (v2, full redesign)

_2026-11-11 · Supersedes the v1 page compositions. The content model, database, security rules and identity rules stay; the visual layout of every page is redesigned._

## 1. Core idea
**The website is a personal universe made of stations.** One persistent WebGL space surrounds every page. Each page is a *station* with its own light, geometry and composition, and moving between pages is a camera journey.
- From **Enea Nushi** we take clarity: recruiter-readable structure, real facts first, strong SEO and PWA, resume-grade information hierarchy.
- From **Samsy Gen-02** we take immersion: a world you travel through, camera-led transitions, art-directed lighting.
- Our own layer is **accessibility and honesty**. Every 3D idea also exists as readable DOM, and nothing is invented.

Brand line: **BEYOND DESIGN. BEYOND IMAGINATION.**

## 2. Visual language
- **Space:** deep black `#08090D` → midnight `#101A35`. Light is the material: electric blue `#4263FF`, cyan `#51E5FF`, violet `#A678FF`. Text `#F5F7FF`.
- **Signature motifs:** (a) *orbits* (thin rings with travelling light comets), (b) *glass slabs* (frosted panels with edge light), (c) *mono readouts* (JetBrains Mono labels like instrument UI), (d) *the portrait* (real photo cutouts floating in depth, never altered).
- **Type:** Unbounded (oversized display, uppercase for names and titles) · Manrope (reading) · JetBrains Mono (data, labels) · **Instrument Serif italic** (editorial accents in story pages) · Anek Bangla / Noto Sans Bengali.
- **Motion principles:** (1) light before form (environments reveal through light, then objects), (2) masks over fades (text rises from masks, images open by clip-path), (3) the camera moves, the content stays readable, (4) calm idle (slow orbits, no constant jitter), (5) reduced motion means instant, static and complete.

## 3. Page stations (each has its own composition, not a shared card grid)
| Page | Station name | 3D environment (shared canvas) | DOM composition | Signature interaction |
|---|---|---|---|---|
| Home | **Arrival** | Portal around the real portrait cutout, orbit rings with light trails, converging particles | Oversized name, tagline, six floating skill stations, social dock, CTAs; then an orbit map of all stations and a featured-work reel | Cinematic intro; skill stations light the portal |
| About | **Origin** | Constellation drawing lines between life chapters | Horizontal pinned "chapters" (Gazipur → school → GUB → work) with layered real photos and serif pull-quotes | Scroll scrubs the constellation |
| Career | **Trajectory** | A 3D orbital track; three company planets with logos | Pinned timeline: the camera travels the track; each stop opens a glass dossier (role, dates, duties: shown only when verified) | Scroll-driven camera path |
| Education | **Foundations** | Three stacked light platforms rising | Vertical ascent SSC → HSC → B.Sc.; GPA only if enabled; campus film strip | Platforms rise with scroll |
| Projects | **Hangar** | Curved WebGL image wall (project covers on bent planes) | Drag/scroll horizontal gallery + list view toggle; filters with Flip | Hover distorts and previews; click flies into the case study |
| Case study | **Mission Log** | Cover plane recedes into depth | Editorial long-form: sticky index, full-bleed media, serif quotes, meta rail | "Next mission" portal transition |
| Studio | **Projection Room** | Film-strip helix + projector beam | Cinema layout: showreel stage, category reels, vertical shorts carousel, fullscreen player | Lite embeds; theatre dims on play |
| Research | **Laboratory** | Node-graph network (sources → clients → aggregator → digital twin) | Lab-sheet typography, fact readouts, team, topics; diagram uses verified structure only | Hover a node to read it |
| Skills | **Instruments** | Constellations per skill area | Instrument panel of eight areas, verified tools, certificate holo-card | Selecting an area highlights its constellation |
| Travel | **Atlas** | Interactive 3D globe (three-globe) with Bangladesh focus | Region switch, year filter, place drawers; honest empty state until real places exist | Drag globe, click marker |
| Memories | **Archive** | Floating photo constellation | Contact-sheet masonry + timeline scrubber + lightbox; approved visitor stories; "Share your story" | Scrub through years |
| Hobbies | **Playground** | Playful low-poly objects (ball, controller, film) | Asymmetric interactive bento | Objects react to the pointer |
| Contact | **Transmission** | Signal beacon pulsing outward | Terminal-style form, direct channels, social dock, CV | Beacon pulses on send |

Global: animated glass nav with active-station indicator, fullscreen station map menu, custom cursor (fine pointer only, native cursor kept), page transitions = curtain plus camera fly, Ctrl+K palette (later phase).

## 4. Admin — "Mission Control"
Separate, calm, highly usable interface: no WebGL, light/dark, dense tables, drawers. Overview → Media Library (folders, multi-upload, metadata, publish/private, replace, "Use in…") → content managers → Messages/Stories inbox → Sections & visibility → Settings. Details: ADMIN_DASHBOARD_PLAN.md.

## 5. Non-negotiables carried over
Original face untouched (background removal changes alpha only; verified pixel-identical RGB). No invented facts; unverified content hidden. GPA hidden by default. All Sheba videos private until permission. Legacy `sheak-website/` untouched. One WebGL canvas with adaptive tiers and a full DOM fallback. Supabase RLS and private-by-default storage.

## 6. Redesign phases (replaces Phase 5–6 visuals; backend phases unchanged)
| Phase | Scope |
|---|---|
| **R1** | Home "Arrival" hero: portrait cutout, portal, skill stations, dock, CTAs, intro sequence |
| **R2** | Global shell v2: nav, station-map menu, cursor, camera-aware transitions, station system in the shared canvas |
| **R3** | Origin (About), Trajectory (Career), Foundations (Education) |
| **R4** | Hangar (Projects) + Mission Log (case study) |
| **R5** | Projection Room (Studio), Laboratory (Research), Instruments (Skills) |
| **R6** | Atlas (Travel globe), Archive (Memories + stories), Playground (Hobbies), Transmission (Contact) |
| **7–8** | Supabase backend + Mission Control admin (as planned) |
| **9–11** | Search/PWA, QA (Lighthouse, a11y, RLS tests), deploy |
Each phase: build, lint and typecheck clean; Playwright crawl at 375/768/1440 px; dark and light; reduced motion; WebGL off; commit.
