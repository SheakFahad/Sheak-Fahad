# Asset Inventory

Visual contact sheet: open [asset-contact-sheet.html](asset-contact-sheet.html) in a browser. It references the files in place and copies nothing.

Legend: **ORIG** = original personal photo (face must never be altered) · **ORIG-ENV** = original photo, no identifiable owner · **AI?** = looks AI-generated or a stock mock-up · **LOGO** · **DEMO** = placeholder · **DOC** · **VID**

## 1. Repository images (`sheak-website/images/`) — 28 real + 51 placeholder
| File | Size | Dim | Type | What it shows | Notes |
|---|---|---|---|---|---|
| `profile.jpg` | 286 KB | 1254² | ORIG | Formal head-and-shoulders, navy blazer, maroon shirt, edited blue-violet gradient background | Primary hero portrait. The background already matches the new palette. |
| `about.jpg` | 505 KB | 900×1100 | ORIG | Holding the bound thesis on campus, white shirt, navy blazer | About / Research hero |
| `edu/ssc.jpg` | 178 KB | 800×600 | ORIG-ENV | School field and 5-storey building | Assumed Union High School (confirm) |
| `edu/hsc.jpg` | 205 KB | 800×600 | AI? | Stylised college render, gold title "M.A. Majid Science College, Gaz…" | Replace with a real photo if possible |
| `work/zensoft.jpg` | 37 KB | 800×600 | LOGO | Zensoft Lab logo (ZSL) | Has a black edge artefact on the left; crop it |
| `work/goldenharvest.jpg` | 13 KB | 800×600 | LOGO | "GHIT" wordmark | Golden Harvest Infotech |
| `work/allsheba.jpg` | 177 KB | 1448×1086 | LOGO | All Sheba Limited, "One app all service" | |
| `projects/pos.jpg` | 189 KB | 1200×750 | AI? | Desk mock-up: POS dashboard, tablet, card reader | Not a real screenshot |
| `projects/salon.jpg` | 224 KB | 1200×750 | AI? | Salon interior, tablet showing calendar | Not a real screenshot |
| `projects/islamichub.jpg` | 276 KB | 1200×750 | AI? | "Islamic Hub App — Your Daily Islamic Companion", phone mock-up | Mobile UI visible |
| `projects/healthcare.jpg` | 239 KB | 1200×750 | AI? | "Healthcare Web App", laptop + phone dashboard | A live site exists: advance-healthcare-sd246.web.app |
| `projects/uninest.jpg` | 247 KB | 1200×750 | AI? | "UniNest — Your University Life, All in One Place" | Conflicts with the "Student Housing" description |
| `uni/1.jpg` | 347 KB | 1200×800 | ORIG-ENV | GUB main building, students on the lawn | Possibly an official GUB photo; check rights |
| `uni/2.jpg` | 201 KB | 1200×800 | ORIG | Standing portrait, blazer, campus garden | Blurred side pillars (portrait inside a landscape frame) |
| `uni/3.jpg` | 194 KB | 1200×800 | ORIG | Sitting cross-legged on the lawn in front of the GUB building | Great for About / Education hero |
| `uni/4.jpg` | 113 KB | 1200×800 | ORIG-ENV | GUB building silhouette at sunset | Atmospheric; a section divider |
| `uni/5.jpg` | 306 KB | 1200×800 | ORIG | Selfie with 2 friends on campus | Friends' faces: consent |
| `uni/6.jpg` | 172 KB | 1200×800 | ORIG | Holding the thesis, thumbs up | Research page |
| `uni/7.jpg` | 168 KB | 1200×800 | ORIG-ENV | Thesis cover close-up (full title, team, supervisors, Fall 2025) | Research proof; blur student IDs if shown large |
| `uni/8.jpg` | 353 KB | 1200×800 | ORIG | Group selfie with 7 classmates in formal wear | Friends: consent |
| `uni/9.jpg` | 201 KB | 1200×800 | ORIG | Arms-crossed portrait, blazer, brick wall | Strong professional portrait |
| `uni/10.jpg` | 307 KB | 1200×800 | ORIG | Graduation Day, CSE 221 banner, with 4 friends | Memories / Education |
| `uni/11.jpg` | 244 KB | 1200×800 | ORIG | Casual portrait, striped shirt, GUB lanyard | Hobbies / About (casual) |
| `uni/12.jpg` | 201 KB | 1200×800 | ORIG-ENV | Brick corridor, blue sky (GUB architecture) | Texture / background |
| `_placeholder.jpg` | 27 KB | 960×640 | DEMO | "REPLACE THIS PHOTO" | Do not migrate |
| `travel/**/N.jpg` (50 files) | ~25 KB each | 960×640 | DEMO | "Demo Spot X #n" | **Never** show as real visits; do not migrate |

Notes: `uni/2,3,4,5,6,7,8,9,10,11,12` are portrait shots padded into 1200×800 with blurred side bars. The new site crops them back to portrait using focal-point crops; **the face itself is never touched**.

## 2. Other files in the repository
| File | Type | Use |
|---|---|---|
| `kkkkk.png` (1672×941, 2.9 MB) | Design storyboard (AI-generated illustration) | Planning reference only. **The face in it is AI-drawn. Never use it on the site.** |
| `sheak-website/data.js` | Content | Seed source for the database |
| `sheak-website/README.md`, `PHOTO-GUIDE.txt`, `setup-photos.js` | Docs/tool | Superseded by the CMS |

## 3. Owner assets outside the repo (`e:\Downloads`, not imported yet)
| File | Type | Proposed use | Status |
|---|---|---|---|
| `Cv-1.pdf` (944 KB) | DOC: owner's CV | "Download CV" (after owner updates the headline to match the portfolio) | Needs approval |
| `UX 47-C41584.pdf` (303 KB) | DOC: Ostad UI UX Design Career Track certificate | Skills → Certificates | Needs approval |
| `All Sheba Digital Lab final.mp4` 161 MB, `All Sheba 2.mp4` 161 MB, `All Sheba 5.mp4` 141 MB, `all sheba final 01.mp4` 90 MB, `Vox Style Ai Agent Reel - All Sheba.mp4` 150 MB, `Github Reel - All Sheba Ltd.mp4` 63 MB, `AllSheba_Dear_Name_Reel_v3_1080x1920.mp4` 33 MB, `All Sheba Learning Hub.mov` 66 MB, `ALL .mov` 67 MB | VID: likely work made for All Sheba Ltd | Video Studio (company permission needed) | Owner to confirm authorship & permission |
| `Ads Final.mp4` 87 MB, `paper craft ai reel.mp4` 51 MB, `Ai Reel Paper College 60fps 1080p.mp4` 19 MB (+ duplicate), `project 1.mp4` 74 MB, `film 7 2026-11-10 18.16.mp4` 87 MB | VID: reels/ads | Video Studio | Owner to classify |
| `WhatsApp Video 2026-…` ×4 (13–15 MB) | VID | Unknown (possibly personal) | Owner to classify |
| `All Sheba — AI Engineering Course (Reels Ad).mp4` | 0 MB | Broken/empty file | Skip |
| `Fahad card/*.ai`, `New card Design Fahad.ai`, many `.ai/.psd/.png` posters | Graphic design work | Graphics Design gallery (export as WebP) | Owner to pick the best 6–12 |
| `Sheak_Fahad_Personal_Website_Project_Requirements(_EN).docx` | Requirements | Incorporated into this plan | — |
| `Sheak Fahad Digital Universe Storyboard.png` | Storyboard (same image as kkkkk.png) | Reference | — |
| `Modern Minimalist…CV.pdf`, `Shaila_Afroz_*`, `Joba_Akter_*`, `Forhad Cv.pdf`, etc. | **Other people's documents** | **Excluded. Never used.** | — |

## 4. Totals
- Original photos usable on the site: **17** (11 with the owner's face, 6 environment shots), plus **3 logos**.
- AI-looking or mock-up imagery: **6** (5 project covers + HSC). Usable as temporary covers, labelled as concept visuals in the admin panel.
- Videos available (pending approval): **~19**. CV: **1**. Certificates: **1**.
- Missing entirely: real project screenshots and wireframes, travel photos, hobby photos, the thesis PDF and diagrams.


## Generated / third-party textures (R2)
- `public/textures/earth-data.webp`, `earth-data-sm.webp` — packed data maps (R = land mask, G = city lights, B = relief) built from the three.js example planet textures (NASA Blue Marble / Black Marble derived imagery, public domain) via a sharp script; ~200 KB / ~58 KB.
- `public/textures/earth-fallback.webp` — stylised equirectangular Earth for the no-WebGL CSS globe, generated from the same data.
- Holographic panel graphics and the platform SF mark are drawn at runtime on canvas (no external assets). No AI-generated imagery is used; the NEXUS mockups and `kkkkk.png` remain planning references only.
