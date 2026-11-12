---
name: portfolio-3d-upgrade
description: Project rules for "Sheak Fahad — Digital Universe" (this repo) — a Next.js + Supabase + R3F/GSAP multi-page portfolio with an admin CMS. Use for ANY change to this website: pages, components, 3D, motion, database, admin, AI assistant, i18n, build or deploy. Ties together r3f-3d, gsap-motion, react-bits-ui, supabase-backend and web-quality skills and records non-negotiable content, identity and security rules.
---

# Sheak Fahad — Digital Universe: project rules

Read first: `docs/PROJECT_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/DATABASE_SCHEMA.md`, `docs/SECURITY.md`, `docs/IMPLEMENTATION_PLAN.md` (current phase). Load skills: **r3f-3d**, **gsap-motion**, **react-bits-ui**, **supabase-backend**, **web-quality**.

## Stack (do not swap without a documented reason in docs/)
Next.js 16 App Router + TypeScript + Tailwind 4 · three 0.187 / @react-three/fiber 9 / drei 10 / @react-three/postprocessing / three-globe · gsap 3.15 (+ScrollTrigger, SplitText, Flip) + @gsap/react + lenis · motion (route/modal presence only) · Supabase (@supabase/ssr) · zod 4 · next-intl (en default, bn) · cmdk · Resend (optional) · Vercel. AI assistant = provider-agnostic interface, **off by default, no AI SDK dependency** until the owner enables one.

## CMS-first (owner requirement)
Everything public comes from the DB via `lib/content/*`: sections (`site_sections`: enabled/show_in_nav/order/visibility), custom pages + `page_blocks`, profile, socials, settings. Media Library: uploads land in the private bucket; only the admin "Publish" action copies to `media-public`. New content/media default to draft/private. GPA/CGPA hidden unless `education.show_result`. All Sheba videos stay private until the owner confirms permission. Do not import files from `e:\Downloads` — the owner uploads through the admin panel.
Legacy static site lives in `sheak-website/`. **Never delete or modify it**; copy assets out of it.

## Identity & content (non-negotiable)
- **Never alter the owner's face**: no AI regeneration, filters, beauty effects, warping, shader distortion, avatar/cartoon/3D-face conversion. Photos may be cropped, framed, placed on 3D planes, relit *around* them. `media_assets.is_original_photo=true` ⇒ only resize/re-encode.
- **Nothing may pass in front of the face** in any composition: 3D rings keep their front arcs below the chin (negative X tilt), particles stay behind the photo plane (z < 0), DOM chips/tooltips sit beside or below the head. Check every hero/portrait screenshot at 1280, 1440 and 390 px.
- Hero portrait = `public/images/hero/portrait-cutout*.webp`: background removed, alpha only; RGB verified identical to `profile.jpg` (max diff 0). Shown with meshBasicMaterial, toneMapped=false, sRGB; reveal by clipping plane only.
- Visual direction: `docs/CREATIVE_DIRECTION.md` (stations, phases R1–R6).
- `kkkkk.png` / the storyboard face is AI-drawn → planning reference only, never published.
- **Never invent facts.** Only ✅ verified / 📝 owner-stated data from `docs/CONTENT_MAPPING.md`. Missing ⇒ NULL + hidden publicly + "Needs info" in admin. No fake projects, testimonials, metrics, skill percentages, travel visits.
- Demo rows (`is_demo`) can never be published.
- Never publish student IDs, addresses, other people's documents; friends' faces need consent.
- Official contacts: email fahadsheak222@gmail.com · WhatsApp +880 1794 506663 (`https://wa.me/8801794506663`) · GitHub/LinkedIn/Facebook/Instagram/Behance from `social_links` table (never hard-coded in components).

## Architecture rules
- Public pages = Server Components reading published rows (anon key + RLS) with tag-based revalidation; fallback to `content/fallback.json` when Supabase env is absent.
- Content comes from the DB, not component literals (UI strings go in `messages/{en,bn}.json`).
- One persistent WebGL canvas (`components/3d/SceneRoot`), loaded with `next/dynamic({ssr:false})`; extra 3D via drei `<View>`. Quality tiers high/medium/low/off.
- Admin: server actions → `requireAdmin()` → user-session Supabase client → RLS. Service-role key only in `lib/supabase/admin.ts` (`import 'server-only'`).
- Public writes only via `/api/contact` & `/api/stories` → zod → SECURITY DEFINER RPC with rate limits. Stories always `pending`.

## Design
Tokens in `app/globals.css` (`--bg #08090D`, `--bg-2 #101A35`, `--blue #4263FF`, `--cyan #51E5FF`, `--violet #A678FF`, `--text #F5F7FF`) + light theme. Fonts: Unbounded (display), Manrope (body), JetBrains Mono (labels), Anek Bangla / Noto Sans Bengali (bn). Motion presets in `lib/motion/presets.ts` — reuse, don't invent new timings. Max one "wow" effect per viewport.

## Quality gates per change
`npm run lint && npm run typecheck && npm run build` · check 375px + 1440px, dark + light, en + bn · reduced-motion on · WebGL off · keyboard only · no console errors. Commit in small checkpoints on a phase branch; never force-push; never commit `.env*` (except `.env.example`).
