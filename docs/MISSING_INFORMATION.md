# Missing Information & Owner Decisions

Everything below stays an **editable placeholder** in the CMS. Placeholders are never shown publicly as fact.

## A. Conflicts to resolve (high priority)
1. **WhatsApp number:** the brief says `0179450663` (10 digits). The CV and wa.me link say `01794506663`. → Using **01794506663** unless told otherwise.
2. **UniNest:** cover art says "University Life app" (classes, study groups, events). The brief says "Student Housing & Roommate Finder". Which is correct?
3. **Thesis title:** cover = "A Federated Digital Twin Framework with Multimodal Data Integration for Personalized Healthcare Monitoring". The brief uses a shorter title. Use the full cover title?
4. **IoT architecture / "MXBoost Hybrid AI":** not visible in any asset. Please share the thesis PDF or describe them; until then those blocks stay hidden.
5. **CV headline** ("IT Executive | Technical Support | Software Operations") differs from the portfolio identity. Offer the CV for download as-is, or provide an updated CV?
6. **Publish GPA / CGPA publicly?** (SSC 4.11, HSC 4.25, CGPA 3.01)
7. **Degree status/year:** CV says "2026"; thesis says Fall 2025. Graduation year, and is it completed?

## B. Career (per company: Zensoft Lab, Golden Harvest Infotech, All Sheba Limited)
- Start/end month-year, employment type (full-time/intern/contract), location
- 3–5 responsibilities, projects worked on, measurable achievements
- Work photos (office, team, events) — optional
- Permission to show company work (videos, designs)

## C. Projects (each of the 5)
- Real screenshots / Figma exports (final screens), wireframes, user flows, design-system snippets
- Your role, year, duration, team size, tools
- Problem, goals, research done, challenges, results
- Live/prototype/Behance links (only Healthcare has a live link today)
- Whether the current covers (AI-looking mock-ups) may stay as "concept visuals"

## D. Video & Motion Studio
- Which of the ~19 videos in Downloads are yours and publishable (All Sheba reels likely need company OK)
- Title, year, client, role, tools (Premiere Pro? After Effects? CapCut? AI tools?), short description per video
- Hosting choice: **YouTube/Vimeo unlisted (recommended)**, or compressed self-hosting (needs ffmpeg installed)
- A showreel cut, if one exists

## E. Research
- Thesis PDF (or abstract), objectives, problem statement, methodology
- Datasets, models, evaluation metrics and **exact verified results**
- Architecture diagram (image or description), publications/links
- Whether co-authors' names may be shown (recommended: yes, as credit)

## F. Skills & achievements
- Confirm the 8 skill categories and the tools for each (only real ones)
- Other certificates (PDF/images), awards, competitions, trainings

## G. Travel (currently zero real data)
- Places visited: name, district/country, month-year, 1–3 line memory, photos, optional coordinates
- Which photos may be public

## H. Life & Memories / Hobbies
- Events with dates, short notes, photos, category (university, village, friends, family)
- Consent for friends' faces (uni/5, 8, 10), or permission to blur
- Hobby photos (football, gaming setup, village)

## I. Brand & copy
- About text, design philosophy and values (3–5 statements)
- Bangla translations (I can draft them; you approve)
- Favourite colour adjustments to the given palette (none needed by default)

## J. Accounts & keys (owner action — never send keys in chat; put them in `.env.local` / Vercel)
| Service | Needed for | Required? |
|---|---|---|
| GitHub repo | Source + Vercel deploy | Yes |
| Supabase project | DB, Auth, Storage | Yes (site falls back to seed JSON without it) |
| Vercel | Hosting | Yes |
| Resend (+ verified domain or onboarding sender) | Email notifications | Optional |
| Anthropic API key | AI assistant | Optional (assistant falls back to search) |
| Cloudflare Turnstile | Bot protection on forms | Optional |
| Custom domain | Branding | Optional |
