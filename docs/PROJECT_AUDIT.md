# Project Audit Report — Sheak Fahad Digital Universe

_Audit date: 2026-11-11 · Scope: repository `e:\Downloads\sheak-website (1)` plus a name-only scan of `e:\Downloads` for the owner's assets._

## 1. Repository state
| Item | Finding |
|---|---|
| Git | Repo root = `sheak-website (1)/`, branch `main`, 7 commits (all 2026-10-31), clean except new `.claude/`, `docs/`, `kkkkk.png` (storyboard). |
| Legacy site | `sheak-website/` — static HTML/CSS/JS, no build, GitHub Pages (`.nojekyll`). Files: `index.html` (114 lines), `style.css` (257), `script.js` (169), `data.js` (140), `setup-photos.js`, `PHOTO-GUIDE.txt`, `README.md`. |
| Dependencies | None installed (no `package.json`). CDN: Leaflet 1.9.4, Google Fonts (Plus Jakarta Sans, Playfair Display). |
| Tooling on machine | Node 24.22.1, npm 11.19.1. **Not available:** Python, ffmpeg/ffprobe, ImageMagick → image/video processing must use Node (`sharp`) or online tools; video transcoding needs ffmpeg installed by the owner (or hosting on YouTube/Vimeo). |
| Claude skills | `.claude/skills/` — `r3f-3d`, `gsap-motion`, `react-bits-ui`, `portfolio-3d-upgrade` (created earlier this session; moved to repo root). |

## 2. Legacy site — feature inventory (to carry forward)
11 sections in one page: Home (typing roles, particle canvas, floating badges), About, Career, Education (tabs), Projects, Research, Skills (marquee), Travel Journal (BD districts → spots, countries → spots, folder-based photo discovery, Leaflet map for spots with lat/lng, DEMO data flag), Memories, Hobbies (bento), Contact form (Formspree or mailto + WhatsApp), footer socials.
Extras: dark/light theme (localStorage), lightbox, image-extension fallback, `?edit` in-browser photo replacement, scroll progress, custom cursor, tilt cards, magnetic buttons, back-to-top, skip link.
**All carry forward**, except the `?edit` localStorage trick, which the real admin CMS + Storage replaces.

## 3. Content quality findings
- Most text fields in `data.js` are placeholders ("Add dates", "Add a one-line summary", "Add verified result").
- Travel and Memories hold only DEMO data. **No real travel location exists anywhere in the assets.**
- The 5 project covers look like AI-generated marketing mock-ups, not real UI screenshots (see ASSET_INVENTORY §3).
- `UniNest` cover says *"Your University Life, All in One Place"* (classes, study groups). The master brief says *"Student Housing & Roommate Finder"*. **These conflict and the owner must confirm which is right.**
- `images/edu/hsc.jpg` appears AI-generated (stylised gold title "M.A. Majid Science College, Gaz…"), not a real photo.
- `images/uni/1.jpg` looks like an official GUB promotional photo (Sheak is not identifiable in it). Usage rights should be confirmed.

## 4. Verified facts discovered in assets (owner documents)
Source: `e:\Downloads\Cv-1.pdf` (owner's CV), thesis cover in `images/uni/7.jpg`, certificate `e:\Downloads\UX 47-C41584.pdf`.
| Fact | Value | Source |
|---|---|---|
| Phone / WhatsApp | +88 01794506663 | CV (matches `wa.me/8801794506663`) |
| Location (city) | Gazipur, Dhaka, Bangladesh | CV |
| SSC | 2018, Union High School (Hailjor), Science, GPA 4.11/5.00 | CV |
| HSC | 2020, M. A. Majid Science College, Science, GPA 4.25/5.00 | CV |
| B.Sc. | CSE, Green University of Bangladesh, CGPA 3.01/4.00, "2026" | CV |
| Thesis title | "A Federated Digital Twin Framework with Multimodal Data Integration for Personalized Healthcare Monitoring" | thesis cover photo |
| Thesis team | Sourav Debnath, Nur Hasan Hasib, Sheak Fahad | thesis cover |
| Supervisor / co-supervisor | Mr. Md. Jahidul Islam / Ms. Shamima Islam | thesis cover |
| Thesis term | Capstone thesis, Dept. of CSE, GUB, Fall 2025 | thesis cover |
| Batch | CSE 221 (Graduation Day banner) | `uni/10.jpg` |
| Certificate | Ostad — UI UX Design Career Track Program, ID C41584 | PDF |
| CV headline | "IT Executive \| Technical Support \| Software Operations" | CV — differs from the portfolio identity (UI/UX etc.) |

⚠️ The CV lists **no employment history**. Career details (dates, duties) must still come from the owner.
⚠️ The master brief gives WhatsApp as `0179450663`, which has 10 digits. The CV and the wa.me link both give `01794506663` (11 digits). **We use 01794506663.**
⚠️ The brief calls the thesis "Federated Digital Twin for Healthcare Monitoring" and mentions "IoT architecture" and "MXBoost Hybrid AI". The bound cover gives the longer title above, and IoT/MXBoost cannot be verified from any asset. They stay as editable placeholders until the thesis PDF is provided.
⚠️ Student IDs are printed on the thesis cover. They will **not** be published (privacy).

## 5. Assets outside the repo (name-level scan of `e:\Downloads`)
`e:\Downloads` has 616 entries, including 18 `.mp4` + 2 `.mov` videos (~1.4 GB total, e.g. *All Sheba Digital Lab final.mp4* 161 MB, *Vox Style Ai Agent Reel - All Sheba.mp4* 150 MB, *Github Reel - All Sheba Ltd.mp4*, *paper craft ai reel.mp4*, *Ai Reel Paper College*), 33 `.ai`, 6 `.psd`, the owner's CV, the Ostad certificate, and two requirement docs (`Sheak_Fahad_Personal_Website_Project_Requirements(_EN).docx`, read and folded into this plan).
It also contains **other people's CVs and documents** (client work). These are excluded and will never be used.
**Nothing was copied, moved or modified.** Importing videos and certificates needs the owner's approval and classification (see MISSING_INFORMATION.md).

## 6. Reference sites — what could actually be studied
| Site | Accessible | Facts |
|---|---|---|
| eneanushi.space/resume | HTML shell + meta only (client-rendered SPA) | Vite build (`/assets/index-*.js`), Three.js, PWA manifest, heavy SEO/JSON-LD comments; the HTML says it is a cloneable template. **Rendered 3D could not be experienced from this environment.** |
| samsy.ninja | HTML shell + meta only (WebGL canvas) | Meta: "WebGPU, WebGL, three.js". Awwwards *Site of the Day* 16 Oct 2025 (Gen-02 SMSY Portfolio, Samuel Honigstein): "An immersive world where visitors can explore SMSY creative projects… navigate through interactive spaces"; tags WebGL, GSAP, Vue.js; Dev score 7.66 (Animations 8.80, Accessibility 7.00). |
Takeaways used in this plan: (a) Enea → recruiter-friendly resume structure, strong SEO and PWA. (b) Samsy → a world you navigate (spaces = sections), camera-led transitions, but lower accessibility and usability scores. **Our differentiator:** the same immersion with a parallel Quick-Navigation and accessible DOM layer. No layout, asset or code is copied.

## 7. Key risks
1. **Content gap:** most sections lack verified content. Mitigation: the CMS plus a clear MISSING_INFORMATION list. Empty sections are hidden publicly rather than showing fake data.
2. **Video weight:** source files are 13–161 MB. The Supabase free plan has 1 GB storage and a 50 MB per-file limit. Mitigation: YouTube/Vimeo (unlisted) embeds or ffmpeg-compressed ≤ 25 MB MP4 with posters.
3. **Scope:** 13 public routes, 15 admin routes, 20 tables, AI, i18n, 3D. Mitigation: phased delivery, each phase shippable.
4. **External accounts** (Supabase, Vercel, Resend, Anthropic API) need owner action. Everything degrades gracefully without them.
