# Technical Architecture

## 1. Stack (versions verified on npm, 2026-11-11)
| Layer | Choice | Version | Why / notes |
|---|---|---|---|
| Framework | **Next.js App Router** + **TypeScript** | next 16.4.x, react 19.3.x | SSR/ISR for SEO, route handlers, server actions, image optimisation |
| Styling | **Tailwind CSS v4** + CSS variables (tokens) | 4.3.x | Tokens in `app/globals.css` via `@theme` |
| 3D | three + **@react-three/fiber 9** + **drei 10** + **@react-three/postprocessing** + maath | three 0.187, r3f 9.8.2 (React ≥19 <19.4), drei 10.7.9, pp 3.2.2 | See the `r3f-3d` skill |
| Globe | **three-globe** (inside R3F via `<primitive>`) | 2.45.x | Arcs, points, labels; one WebGL context |
| Motion | **GSAP 3.15** (+ScrollTrigger, SplitText, Flip, all free) + **@gsap/react** + **Lenis** | gsap 3.15.1, lenis 1.3.27 | See the `gsap-motion` skill |
| UI micro-motion | **motion** (Framer Motion) — only for `AnimatePresence` route/modal transitions and React Bits pieces that need it | 14.12.x | |
| Creative UI | **React Bits** components copied into `components/bits/` (TS-TW variants) | — | MIT + Commons Clause, see the `react-bits-ui` skill |
| Backend | **Supabase**: Postgres, Auth, Storage, RLS; `@supabase/ssr` + `@supabase/supabase-js` | ssr 0.12.x, js 2.119.x | |
| Validation | **zod 4** (shared client/server schemas) | 4.6.x | |
| i18n | **next-intl** (`en` default, `bn` at `/bn/...`) | 4.15.x | |
| Command palette | **cmdk** | 1.1.x | Ctrl/⌘+K |
| Email | **Resend** (optional) | 6.38.x | |
| AI | **@anthropic-ai/sdk**, model `claude-opus-5-5` (default; see §6) | 1.8.x | Optional |
| Maps (2D fallback) | Leaflet + react-leaflet + OSM/CARTO tiles | 1.9.4 / 5.0 | Used where WebGL is off |
| Images | next/image (+ `sharp` at build) | 0.35.x | |
| Hosting | **Vercel** + GitHub | — | |

**Deliberately not added:** Theatre.js (GSAP timelines + camera rigs cover our needs; avoids a 300 KB editor runtime), Upstash (rate limiting lives in Postgres), shadcn CLI (Radix primitives only where needed), a state library (React context + `zustand`-free refs; R3F reads refs).

## 2. Repository layout (Next.js app at repo root; legacy site preserved)
```
/                       repo root
├─ app/
│  ├─ [locale]/                 public site (en | bn)
│  │  ├─ layout.tsx             shell: nav, cursor, Lenis, transitions, assistant, Ctrl+K
│  │  ├─ page.tsx               /
│  │  ├─ about/ career/ education/ projects/ projects/[slug]/
│  │  ├─ video-studio/ research/ skills/ travel/ memories/ hobbies/ contact/
│  │  └─ stories/               approved visitor stories (public)
│  ├─ admin/                    NOT localised, noindex
│  │  ├─ login/  (auth)/dashboard/ messages/ stories/ projects/ experience/ education/
│  │  │          research/ skills/ achievements/ travel/ memories/ videos/ media/ social/ settings/
│  ├─ api/
│  │  ├─ assistant/route.ts     streaming AI (Node runtime)
│  │  ├─ search/route.ts        full-text search
│  │  ├─ contact/route.ts       message submit → RPC → email
│  │  ├─ stories/route.ts       story submit (+ upload) → RPC → email
│  │  └─ revalidate/route.ts    on-demand ISR after CMS edits
│  ├─ sitemap.ts robots.ts manifest.ts opengraph-image.tsx
├─ components/ layout/ navigation/ hero/ 3d/ animations/ bits/ projects/ video/ travel/
│              research/ contact/ admin/ shared/ ui/
├─ lib/ supabase/{server,client,middleware,admin}.ts  database/queries.ts  validations/*.ts
│        i18n/  ai/  email/  utils/  seo/
├─ messages/ en.json bn.json   UI strings
├─ public/ images/ videos/ models/ textures/ icons/ fonts/
├─ supabase/ migrations/*.sql  seed.sql  config.toml
├─ content/fallback.json        build-time snapshot used when Supabase env is absent
├─ docs/  .claude/skills/
├─ middleware.ts                next-intl + Supabase session refresh + /admin guard
└─ sheak-website/               LEGACY static site (kept until the owner approves archiving)
```

## 3. Rendering & data flow
- **Public pages = Server Components** that read published rows through the anon key (RLS returns only `status='published' AND visibility='public'`). Cached with `revalidate` tags (`projects`, `career`, …). A CMS save calls `revalidateTag()` so changes appear in seconds without redeploying.
- **Fallback mode:** if `NEXT_PUBLIC_SUPABASE_URL` is missing (e.g. a local preview), queries read `content/fallback.json` (generated from seed). The site still renders.
- **Client islands only where needed:** 3D canvas, GSAP sections, Ctrl+K, assistant, forms, globe.
- **One persistent WebGL canvas** in the root layout (`<SceneRoot/>`, `position:fixed`, behind content, `eventSource=document.body`). Pages register their 3D "space" via a scene store; route changes animate the camera between spaces (Explore Mode). drei `<View>` covers in-flow 3D (project cards, research diagram) on the same context.
- **Admin = client + server actions** using the **user's session** (RLS `is_admin()`), never the service-role key in the browser. The service-role key is used server-only for: email/notification logs and the storage cleanup job.

```
Visitor ──► Vercel Edge (middleware: locale, session refresh)
          ├─► RSC page ──► Supabase (anon, RLS: published only) ──► HTML (SEO)
          ├─► /api/contact|stories ──► zod ──► RPC submit_* (SECURITY DEFINER, rate-limit) ──► Resend (optional)
          ├─► /api/search ──► Postgres FTS (published only)
          └─► /api/assistant ──► published-content snapshot (cached) ──► Claude (stream) ──► SSE to client
Admin ──► /admin/login (Supabase Auth) ──► RLS is_admin() ──► CRUD + Storage uploads ──► revalidateTag
```

## 4. Navigation model
- **Quick Navigation Mode (default, accessible):** top bar plus a full-screen menu with all 12 sections, breadcrumbs on inner pages, Ctrl+K palette, footer sitemap.
- **Explore Mode (toggle "Explore My World"):** the 3D universe becomes primary. Each section is a "planet/station" in one scene; hover shows a label card, click flies the camera there, and the page content slides in as a glass panel. Keyboard: arrow keys cycle stations, Enter opens, Esc returns. Disabled automatically on reduced-motion, low-power or no-WebGL devices. Mode is stored in localStorage.

## 5. Page transitions
GSAP curtain (two-panel wipe in brand gradient) + camera move in the persistent canvas. Implemented with a `TransitionLink` that runs the exit timeline, then `router.push`, and the next page's entrance timeline runs on mount. Under reduced motion it becomes an instant cross-fade.

## 6. AI Portfolio Assistant
- **Route:** `app/api/assistant/route.ts` (Node runtime), streams text to the client.
- **Model:** `claude-opus-5-5` (current default). A cheaper option is `claude-haiku-5-5` ($0.10/$0.50 per MTok vs $4/$20). **The owner decides** (see MISSING_INFORMATION J). Model ID lives in `ASSISTANT_MODEL` env.
- **Knowledge:** a deterministic text snapshot of **published, public** rows only (profile, experiences, education, projects + case studies, videos, research, skills, achievements, hobbies, social links). Built server-side, sorted by stable keys, cached 10 minutes, and placed in the `system` prompt with `cache_control` (prompt caching makes repeated questions ~90% cheaper on that prefix). No visitor stories, messages or private data are ever included.
- **Guardrails:** the system prompt says to answer only from the snapshot, say "I don't have that information — you can ask Sheak directly via the contact page" otherwise, never guess personal details, and keep answers short. Refusals: `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`, and `stop_reason` checked before reading content.
- **Abuse limits:** 20 questions/IP/hour (Postgres rate-limit table), max 500 characters per question, last 6 turns kept, `max_tokens` ~1,024 for chat answers.
- **Graceful degradation:** with no `ANTHROPIC_API_KEY`, the widget switches to "Smart search" mode, answering with matching content cards from `/api/search` plus contact links. The UI labels which mode is active.

## 7. Search (Ctrl/⌘+K)
Postgres `tsvector` generated columns on searchable tables, unioned in a `search_content(q, locale)` SQL function (SECURITY INVOKER, so RLS applies). Static routes and actions (toggle theme, language, Explore Mode, copy email) come from the client. Results are grouped by type.

## 8. i18n
next-intl, `localePrefix: 'as-needed'` (`/about`, `/bn/about`). UI strings in `messages/*.json`. DB content: base columns are English, plus a `translations jsonb` column (`{"bn": {"title": "...", "summary": "..."}}`), falling back to English per field. The admin panel has EN | বাংলা tabs per form. Fonts: Latin and Bengali stacks (see DESIGN_SYSTEM). `hreflang` alternates are emitted.

## 9. PWA
`app/manifest.ts` + icons, `theme_color #08090D`. A minimal service worker (static-asset cache and offline page only). No aggressive caching of HTML, so CMS edits show immediately.

## 10. Environment variables (`.env.example`)
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never NEXT_PUBLIC_
RESEND_API_KEY=                     # optional
NOTIFY_EMAIL_TO=fahadsheak222@gmail.com
NOTIFY_EMAIL_FROM=                  # e.g. "Portfolio <noreply@yourdomain>"
ANTHROPIC_API_KEY=                  # optional
ASSISTANT_MODEL=claude-opus-5-5
NEXT_PUBLIC_TURNSTILE_SITE_KEY=     # optional
TURNSTILE_SECRET_KEY=               # optional
IP_HASH_SALT=                       # random 32+ chars
REVALIDATE_SECRET=
```
