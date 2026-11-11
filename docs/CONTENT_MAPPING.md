# Content Mapping — asset & fact → route

✅ verified (from owner documents) · 📝 from the owner's brief/data.js (owner-stated) · ⏳ missing → editable placeholder, hidden publicly until filled

| Route | Content | Assets | Status |
|---|---|---|---|
| `/` Home | Name, 6 identities 📝, tagline 📝, intro 📝, CTA buttons, featured projects (3), career snapshot, quick contact ✅ | `profile.jpg` (hero frame), `uni/4.jpg` (atmosphere), project covers | Ready |
| `/about` | Intro 📝, GUB CSE journey ✅, professional journey 📝, background (Gazipur ✅), travel/village 📝, values & design philosophy ⏳ | `about.jpg`, `uni/3.jpg`, `uni/9.jpg`, `uni/11.jpg` | Partial |
| `/career` | Zensoft Lab — UI/UX Designer 📝 · Golden Harvest Infotech — Data Artist 📝 · All Sheba Limited — Graphics & UI/UX 📝; dates ⏳, responsibilities ⏳, achievements ⏳, work photos ⏳ | 3 logos; All Sheba videos (link to `/video-studio`) | Roles only |
| `/education` | SSC 2018 Union High School (Hailjor), Science, GPA 4.11 ✅ · HSC 2020 M. A. Majid Science College, Science, GPA 4.25 ✅ · B.Sc. CSE GUB, CGPA 3.01 ✅, years ⏳ (CV shows "2026"; thesis Fall 2025), batch CSE 221 ✅, activities ⏳ | `edu/ssc.jpg`, `edu/hsc.jpg` (replace), `uni/1,4,5,8,10,12` | Mostly ready (owner must OK publishing GPA/CGPA) |
| `/projects` + `/projects/[slug]` | 5 projects 📝; per case study: overview/problem/objectives/research/flows/wireframes/UI/design system/prototype/final screens/challenges/results/tools ⏳; Healthcare live link ✅ (owner-stated); Behance profile ✅ | 5 covers (AI-looking, flagged as concept visuals) | Shell only. Case-study sections with no content are hidden. |
| `/video-studio` | Showreel ⏳, video projects (All Sheba reels/ads, paper-craft AI reel…) ⏳ pending approval, tools ⏳ | ~19 videos in Downloads | Blocked on approval + hosting choice |
| `/research` | Title ✅ (full cover title), team ✅, supervisors ✅, Fall 2025 ✅, abstract/objectives/problem/method/IoT/MXBoost/FL/DT/dataset/metrics/results ⏳, architecture diagram ⏳ (interactive diagram built from verified structure only), documents ⏳ | `about.jpg`, `uni/6.jpg`, `uni/7.jpg` | Partial |
| `/skills` | Categories: UI/UX, Graphic Design, Data Art, Research, Video Editing, Motion Graphics, 3D Design, Frontend Development 📝; CV-verified skills ✅ (Figma, UI design, wireframing & prototyping, HTML/CSS/JS, Python basic, Java basic, C, MySQL); certificate: Ostad UI UX Design Career Track (C41584) ✅; achievements ⏳; evidence links → projects/videos | certificate PDF → render page 1 to WebP | Partial. **No skill percentages.** |
| `/travel` | Visited places ⏳ (**none verified, 0 real photos**) | — | Globe renders with an empty state ("Journeys coming soon") until real entries exist. Demo data is never published. |
| `/memories` | Graduation Day CSE 221 ✅ (photo), thesis submission ✅, friends on campus | `uni/5,8,10,6` | Partial (dates ⏳) |
| `/hobbies` | Travel, Village life, PUBG Mobile, eFootball, Movies, Turkish series, Football 📝 | `uni/11.jpg` (casual); hobby photos ⏳ | Text ready |
| `/contact` | Email ✅, WhatsApp +880 1794 506663 ✅, GitHub/LinkedIn/Facebook/Instagram 📝 (brief), Behance 📝, CV download ⏳ (approval) | — | Ready |
| Footer | All social links from `social_links` table | — | Ready |

## Seed plan
`supabase/seed.sql` will insert only ✅ and 📝 values. ⏳ fields are left NULL and rendered as hidden or empty-state publicly, and as highlighted "Needs info" in the admin panel.
