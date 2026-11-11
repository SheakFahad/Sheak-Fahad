# Sheak Fahad — Digital Universe

Multi-page, CMS-driven personal portfolio: Next.js 16 · TypeScript · Tailwind 4 · GSAP/Lenis · (Phase 6) React Three Fiber · (Phase 7+) Supabase.

```bash
npm install
cp .env.example .env.local   # optional until Supabase is set up
npm run dev                  # http://localhost:3000  (Bangla: /bn)
npm run lint && npm run typecheck && npm run build
```

- All public content comes from `lib/content/repository.ts` (Supabase when configured, otherwise `content/fallback.json`). Don't hard-code content in components.
- Plans and decisions: [`docs/`](docs/README.md). Project rules for Claude Code: `.claude/skills/portfolio-3d-upgrade`.
- The previous static site is preserved untouched in `sheak-website/`.
