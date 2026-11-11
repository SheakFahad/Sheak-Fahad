# Sitemap & Page Wireframes

## Public (all also under `/bn/...`)
| Route | Purpose | Key blocks |
|---|---|---|
| `/` | Cinematic intro + previews | Loader → Hero (portrait in 3D frame) → Identity strip → Featured projects (3) → Career snapshot → Studio teaser → Research teaser → Explore grid (all sections) → Quick contact |
| `/about` | Story | Chapter hero → Story timeline (school → GUB → work) → Values & design philosophy → Interests (travel, village) → Photo strip → CTA |
| `/career` | Experience | Role chips → Interactive timeline (3 companies) → Company detail panels (logo, role, dates, duties, projects, achievements, photos) |
| `/education` | Academics | Timeline SSC → HSC → B.Sc. → GUB life (activities) → Memory mosaic |
| `/projects` | Gallery | Filter chips (type/tool/year) + Flip → Project cards (3D tilt, spotlight) |
| `/projects/[slug]` | Case study | Hero → Overview/meta (role, year, tools, links) → Problem → Objectives → Research → User flow → Wireframes → UI → Design system → Prototype → Final screens (lightbox) → Challenges → Results → Next/prev project. **Empty sections are skipped.** |
| `/video-studio` | Motion work | Showreel (fullscreen player) → Category tabs (editing, motion, 2D, 3D, promo, commercial, reels) → Grid → Video modal → Tools |
| `/research` | Thesis | Title & team → Abstract → Problem/objectives → Interactive architecture diagram → Method (FL, Digital Twin, …) → Data & metrics → Results → Documents |
| `/skills` | Capability | 8 category panels (tools, description, evidence links) → Certificates (viewer) → Achievements |
| `/travel` | Journal | 3D globe (BD focus button) → Region tabs (Bangladesh districts / countries) → Year filter → Place cards → Place drawer (story, gallery, map) |
| `/memories` | Archive | Year + category filters → Timeline → Masonry gallery → Fullscreen viewer → Approved visitor stories → "Share your story" |
| `/hobbies` | Personality | Interactive bento (travel, village, PUBG, eFootball, movies, Turkish series, football) |
| `/contact` | Reach out | Form (name, email, subject, category, message) → Direct channels (email, WhatsApp) → Socials → Download CV → Share your story (tab) |
| `/stories` | Approved visitor stories | List + detail modal |
| `/sitemap.xml` `/robots.txt` `/manifest.webmanifest` | SEO/PWA | |
| `/404` `/500` | Errors | "Lost in space" scene + Quick Nav |

## Private (noindex, auth-gated in middleware **and** RLS)
`/admin/login`, `/admin/dashboard`, `/admin/messages`, `/admin/stories`, `/admin/projects` (+ case studies, media), `/admin/experience`, `/admin/education`, `/admin/research`, `/admin/skills`, `/admin/achievements`, `/admin/travel`, `/admin/memories`, `/admin/videos`, `/admin/media`, `/admin/social`, `/admin/settings`.

## Wireframes (desktop · mobile collapses to one column)
### Home
```
┌──────────────────────────────────────────────────────────────┐
│ SF◉  About Career Education Projects Studio … [⌘K][EN|বা][◐][Explore]│
├──────────────────────────────────────────────────────────────┤
│  UI/UX · GRAPHICS · DATA ART · RESEARCH · MOTION              │
│  SHEAK                              ╭───────────╮  ✦ orbiting  │
│  FAHAD   (split-text reveal)        │ portrait  │  glass       │
│  "An Immersive Journey Through…"    │ (original)│  shards      │
│  [Explore My World] [View Projects] ╰───────────╯  particles   │
│  ✉ WhatsApp  in  gh        ↓ scroll                           │
├──────────────────────────────────────────────────────────────┤
│ FEATURED WORK  [card][card][card]  → All projects              │
│ CAREER  ●──Zensoft──●──GHIT──●──All Sheba  → Career            │
│ STUDIO  ▶ showreel strip     RESEARCH  ◇ diagram teaser        │
│ EXPLORE THE UNIVERSE  12 tiles (3D icons)                      │
│ CONTACT  big line + form CTA                                   │
└──────────────────────────────────────────────────────────────┘
```
### Project case study
```
breadcrumb: Home / Projects / Healthcare Web App
┌ hero: cover (parallax) + title + type + [Live ↗][Behance ↗] ┐
│ meta: Role | Year | Duration | Tools                         │
├ sticky left index (Overview, Problem, …) │ content column    ┤
│                                           │ section blocks   │
└ next project ▶ (Flip transition) ─────────────────────────────┘
```
### Travel
```
┌ globe (drag/rotate, markers, arcs from Gazipur) ┐┌ side panel ┐
│ [Bangladesh] [World]   year: 2023 2024 2025      ││ place card │
└──────────────────────────────────────────────────┘└───────────┘
place grid (cards) → drawer: story + gallery + mini map
```
### Admin
```
┌ sidebar ─┐┌ topbar: search · view site · user ┐
│ Overview ││ KPI tiles: new messages, pending stories, drafts │
│ Messages ││ table (filters, bulk actions) / edit drawer      │
│ Stories  ││                                                   │
│ Content… ││ form: EN | বাংলা tabs, media picker, status      │
└──────────┘└───────────────────────────────────────────────────┘
```
