# Public website — Phase 2 review (2026-11-12)

Workflow (owner decision, 2026-11-12): **Phase 1** public website → **Phase 2** review (this file) → **Phase 3** admin dashboard UI → **Phase 4** database / storage / email integration → final end-to-end tests. No admin work starts before this review passes.

## Completed sections
| Station | Route | Notes |
|---|---|---|
| Welcome gateway | `/` (first visit) | Portal rings, NEXUS wordmark, Enter (warp) / Skip, quick links, EN/বাংলা. Remembered per browser; `?nogate` bypasses. |
| NEXUS | `/` | Original portrait (owner's IMG_9217 cutout) as native `<img>`, holographic structure + platform, 3D Earth with 12 stations, featured projects, NEXUS AI (local, verified data only). |
| ORIGIN … TRANSMISSION | `/about` … `/contact` | Station header (code, icon, name), signature 3D object, section content, prev/next pager. |
| MILESTONES | `/achievements` | Verified certificate list. |
| HANGAR case studies | `/projects/[slug]` | 5 published projects; covers labelled "Concept visual". |

## Working interactions (tested)
Navigation bar + MORE dropdown · sliding active pill · search (Ctrl K / button) · Explore Mode (orbit map, arrow keys, focus trap, Esc) · Quick-navigation rail (≥1536 px) · station pager · mobile drawer · language switch · theme switch · gateway Enter/Skip · NEXUS stations hover/focus/click · Earth drag + arrow keys (NEXUS + ATLAS) · featured carousel (arrows, drag, swipe) · NEXUS AI (suggestions, free text, honest "no verified information") · contact form (opens email app / WhatsApp until the database is connected) · icon-only contact & social tiles · CV download · skip link + visible focus.

## Automated results
- 108 page loads (18 routes × en/bn × 1440/820/390 px): all 200, exactly one h1, no horizontal overflow, no broken images, no unnamed controls, no console errors, **no contact detail printed as text**.
- 37 distinct internal links: all resolve.
- Light theme, reduced motion, `?nowebgl`: nothing above the fold left hidden; CSS fallbacks for portrait ring, Earth and platform.
- `npm run lint`, `typecheck`, `build`: pass.

## Performance (local production build, headless SwiftShader)
| Page | LCP | JS (compressed, incl. lazy 3D chunk) | Images | Requests |
|---|---|---|---|---|
| `/` | 0.2 s | 586 KB | 568 KB | 68 |
| `/about` | 1.6 s | 521 KB | 78 KB | 40 |
- The three.js chunk (~270 KB gz) loads after idle and only with WebGL on; initial JS is still above the 200 KB target → Phase 10 work (route-level splitting of GSAP plugins, Lenis, drei).
- Real-GPU frame rate not measured yet (headless only).

## Remaining content requirements (owner)
See `MISSING_INFORMATION.md`. Most visible gaps: career dates and responsibilities; project summaries, case-study text and genuine screenshots (current covers are concept visuals); showreel and videos (Motion Studio shows labelled placeholders); verified travel places + own photos (Atlas shows labelled placeholders); more certificates/achievements; a sound asset if the gateway sound toggle is wanted (hidden for now).

## Known issues
- Tested only in headless Chromium with software WebGL; verify on a real phone and desktop GPU.
- Contact form uses mailto/WhatsApp until Supabase + Resend are connected (Phase 4).
- Trajectory planets drift behind the station title (decorative, low opacity).
- Gateway sound toggle omitted (no approved audio asset).
