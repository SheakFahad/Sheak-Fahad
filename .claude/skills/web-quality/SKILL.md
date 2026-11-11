---
name: web-quality
description: Performance, accessibility, SEO, responsive design and reduced-motion standards for a heavily animated Next.js + WebGL site. Use when building or reviewing any page/component, optimizing Core Web Vitals or bundle size, writing metadata/sitemaps/structured data, or running QA (Lighthouse, keyboard, screen reader, responsive checks).
---

# Web quality: performance · accessibility · SEO · responsive

## Performance budgets (this project)
LCP < 2.5s (4G mobile) · INP < 200ms · CLS < 0.1 · public initial JS ≤ 200 KB gz · 3D chunk ≤ 450 KB gz (lazy) · images via `next/image` with `sizes` · fonts via `next/font` (subset, `display: swap`) · total 3D assets ≤ 2 MB desktop / 800 KB mobile.

Techniques:
- LCP element = HTML text or a `priority` `next/image`; never a canvas.
- `next/dynamic(() => import(...), { ssr:false })` for canvas, globe, video player, assistant, Ctrl+K; mount on idle/visibility.
- Server Components by default; `"use client"` only for interactive islands; keep providers thin.
- Video: posters, `preload="none"`, YouTube/Vimeo lite embeds (thumbnail first, iframe on click).
- Avoid layout thrash in animations: transform/opacity only; `ScrollTrigger.batch`; one rAF via `gsap.ticker`.
- Analyse with `ANALYZE=true` (@next/bundle-analyzer) when budgets slip.

## Accessibility (WCAG 2.2 AA)
- Semantic landmarks (`header/nav/main/footer`), one `h1` per page, ordered headings, skip link.
- Focus visible on everything (`:focus-visible` ring in `--cyan`), logical tab order, focus trap in modals/drawers, Esc closes, return focus on close.
- Target size ≥ 24px (we use 44px). Contrast AA in both themes.
- Images: meaningful `alt` (EN/BN from media_assets), decorative `alt=""`. Canvas `aria-hidden` with DOM equivalents.
- Motion: honour `prefers-reduced-motion` (no smooth scroll, no parallax/scrub, no camera flights, opacity-only); provide a manual "Reduce motion" toggle too. Nothing flashes > 3/s.
- Forms: visible labels, `aria-describedby` errors, `aria-live="polite"` status, don't rely on colour.
- Media: captions for videos with speech; pause/stop controls; no autoplay with sound.
- Language: `<html lang="en|bn">`, `lang` on mixed-language snippets.

## SEO
- `generateMetadata` per route: unique title (≤ 60 chars), description (≤ 160), canonical, `alternates.languages` (en, bn), Open Graph + Twitter image (`opengraph-image.tsx`).
- `app/sitemap.ts` (published + public only, both locales), `app/robots.ts` (disallow `/admin`, `/api`).
- JSON-LD: `Person` (name, jobTitle, sameAs socials, alumniOf GUB), `CreativeWork` per project, `VideoObject` per video, `ScholarlyArticle`/`Thesis` for research, `BreadcrumbList` on inner pages.
- Content rendered server-side (3D is enhancement). Clean slugs. No duplicate content between locales without hreflang.

## Responsive
Mobile-first; breakpoints 480/768/1024/1280/1536; 16px side gutter on phones; no horizontal page scroll; touch: no hover-only info, swipe for galleries, bottom dock nav; 3D tier "low" on mobile; pinned horizontal sections become vertical < 1024px.

## QA checklist (run before calling a phase done)
1. `npm run lint && npm run typecheck && npm run build` clean.
2. Crawl all routes (en + bn) → no 404/500, no console errors.
3. 375 / 768 / 1024 / 1440 widths, dark + light.
4. Keyboard-only walkthrough; screen reader spot check (NVDA/VoiceOver) on home, a case study, contact form, admin form.
5. Reduced motion + WebGL disabled (chrome://flags or `?nowebgl`) still fully usable.
6. Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.
7. Forms: valid, invalid, rate-limited, offline states.
