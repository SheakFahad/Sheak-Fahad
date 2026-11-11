# Phased Implementation Roadmap

Each phase ends with: `npm run build` passing, lint/typecheck clean, manual check at 375px and 1440px in both themes, a git checkpoint commit, and a short report to the owner. **Nothing is called "done" untested.**

| Phase | Deliverables | Depends on owner? |
|---|---|---|
| **1. Audit** ✅ | PROJECT_AUDIT, ASSET_INVENTORY (+ contact sheet), CONTENT_MAPPING, MISSING_INFORMATION | — |
| **2. Research** ✅ | Skills (`r3f-3d`, `gsap-motion`, `react-bits-ui`, project skills); reference-site findings (audit §6) | — |
| **3. Architecture & design** ✅ | ARCHITECTURE, SITEMAP + wireframes, DATABASE_SCHEMA, SECURITY, DESIGN_SYSTEM, 3D_ANIMATION_PLAN, ADMIN plan, this roadmap, DEPLOYMENT_GUIDE | Approve plan |
| **4. Foundation** ✅ (2026-11-11: build/lint/typecheck clean; 26 static pages; smoke-tested en/bn, 404s, admin headers; Playwright at 375 & 1440, dark & light, reduced motion, no console errors) | Git checkpoint → Next.js 16 + TS + Tailwind 4 scaffold at repo root (legacy `sheak-website/` untouched) · tokens & fonts · **content repository layer** (`lib/content`, typed, Supabase-or-fallback, section registry driving nav) · layout shell (nav from `site_sections`, mega menu, footer from `social_links`, breadcrumbs) · theme + i18n plumbing · TransitionLink + curtain · Lenis + GSAP setup · UI kit (buttons, cards, modal, lightbox, toast, forms) · generic section route (renders any enabled section, including future custom ones) · copy legacy images into `public/images` (copy, not move) · `content/fallback.json` from verified data · `.env.example` | — |
| **5. Public pages** ✅ (2026-11-11: 12 section pages + project case studies; crawl at 375 & 1440 px, en/bn — no overflow, no hidden content, one h1 each, no console errors) | All 13 routes + `/projects/[slug]` with real verified content, empty states for missing data, SEO metadata, sitemap, OG images | Content answers improve quality |
| **6. 3D & motion** | Persistent SceneRoot, quality tiers, hero sequence + loader, stations + Explore Mode, Views (projects, research graph, skills), travel globe, postprocessing (high tier), cursor, magnetic, React Bits adaptations, reduced-motion paths | — |
| **7. Backend** | Supabase migrations (enums, 22 tables, functions, triggers, RLS, storage buckets & policies), seed.sql, typed queries, `/api/contact`, `/api/stories` (+ upload pipeline), `/api/search`, Resend notifications + `notification_logs`, rate limits | **Supabase project + keys** |
| **8. Admin** | Login, guard, dashboard · **Media Library / File Manager** (folders, multi-upload, metadata, replace, publish/private, "Use in…", usage) · **Sections & Pages** (toggle/reorder/add sections, block builder) · 15 content managers · GPA visibility toggle · preview tokens · revalidation · export backup · first-admin guide | Supabase |
| **9. Advanced** | Ctrl+K, Bangla translations (drafts for approval), PWA, optional sound, video studio player (YouTube/Vimeo/self-host). AI assistant **interface + settings toggle only** (disabled; a model is plugged in later on request) | Video approvals |
| **10. QA & optimisation** | Route/link crawl, form + DB tests, RLS tests (anon / non-admin / admin), storage permission tests, keyboard & screen-reader pass, reduced-motion pass, console-error sweep, Lighthouse (targets: Perf ≥ 85 mobile, A11y ≥ 95, SEO 100), bundle analysis | — |
| **11. Deployment** | GitHub repo, Vercel project + env vars, Supabase prod config (auth URLs, SMTP optional), domain (optional), post-deploy smoke test, DEPLOYMENT_GUIDE finalised | **GitHub/Vercel accounts** |

## Order of work inside Phase 4–6 (vertical slices)
Home → Projects (+case study) → About → Career → Education → Research → Skills → Video Studio → Travel → Memories → Hobbies → Contact. Each slice ships DOM first, then motion, then 3D.

## Git strategy
`main` stays deployable. Each phase is developed on a branch (`phase-4-foundation`, …), committed in small checkpoints, and merged after review. The legacy site stays in `sheak-website/` until the owner approves moving it to `legacy/` (non-destructive).

## Definition of Done (project)
Live public URL · all public routes render real verified content or tasteful empty states · admin can CRUD/publish every content type and upload media · messages & stories flow end-to-end (DB + email if configured) · RLS/storage tests pass · responsive + accessible + reduced-motion verified · Lighthouse targets met · docs complete (setup, env, first admin, backup/restore, limitations).
