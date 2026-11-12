# Phase 1 checklist — personal portfolio refinement (2026-11-12)

Owner brief: personal portfolio under **SHEAK FAHAD** (not a fictional universe). Keep the futuristic 3D direction; NEXUS is only the internal name of the 3D homepage environment.

| # | Item | Status |
|---|---|---|
| 1 | Branding → SHEAK FAHAD (wordmark, site title, copy; remove "Digital Universe") | ✅ |
| 2 | Welcome screen: "HELLO, I'M SHEAK FAHAD", Explore My Portfolio / Skip Intro, remembered, replay link | ✅ |
| 3 | Hero: SHEAK FAHAD · UI/UX Designer & Creative Professional · intro · Explore My Work / Download CV / Let's Connect · tagline | ✅ |
| 4 | Navigation: clear labels + creative names; bar About/Experience/Projects/Research/Skills/Travel/Contact + More + AI | ✅ |
| 5 | Privacy: email + WhatsApp number never in HTML, RSC payload, tooltips or metadata (encoded, decoded on click) | ✅ |
| 6 | Fahad AI Assistant: floating button on every page, chat window, homepage 3D orb, server-side API, honest unavailable state | ✅ |
| 7 | ATLAS: globe markers, destination panel, timeline, gallery; unverified places unpublished | ✅ |
| 8 | Milestones detail view; video viewer | ✅ |
| 9 | Phase 1 test pass + completion report | ✅ |

Admin dashboard work is out of scope until Phase 2 passes.

## Verification (2026-11-12)
- 114 page loads (19 routes × en/bn × 1440/820/390): 200, one h1, no overflow, no broken images, no unnamed controls, no console errors.
- Email address / WhatsApp number: 0 occurrences in served HTML + RSC payload on every route (icons resolve the address only on hover/focus/click).
- Fahad AI Assistant: no `ANTHROPIC_API_KEY` → `/api/assistant` returns 503 `not_configured`; widget shows "Guide mode" with an explicit notice and answers only from verified data; unknown questions get an honest "not published yet".
- ATLAS tested with `ATLAS_PREVIEW=1` (DEMO rows, badge on every item): marker click, card click, globe turns to the selection, region filter, timeline. Production build shows labelled placeholders (0 demo rows).
- Perf (local): `/` LCP 0.26 s, JS 604 KB compressed incl. lazy 3D chunk; `/about` LCP 2.3 s — JS above the 200 KB target (to optimise).
