# Sheak Fahad — Personal Website

A static website (HTML + CSS + JavaScript). No build step, no server.

## Run on your computer
Open the folder in VS Code → right-click `index.html` → **Open with Live Server** (or just double-click `index.html`).

## Where to change things
| What | File |
|---|---|
| Home text, floating role badges, typing roles | `data.js` → `HERO`, `ROLES` |
| About, Career, Education, Projects, Research, Skills, Hobbies | `data.js` |
| Travel (districts, spots, countries) | `data.js` → `TRAVEL_BD`, `TRAVEL_WORLD` |
| Email, WhatsApp, Facebook, Instagram, LinkedIn… | `data.js` → `CONTACT` |
| Colors, fonts, spacing | `style.css` (colors are at the top, in `:root`) |
| All photos | `images/` — see `PHOTO-GUIDE.txt` |

After adding a new travel spot run `node setup-photos.js` to create its photo folders.

## Publish on GitHub Pages (free link)
1. Push this folder to a GitHub repository (see below).
2. GitHub → your repo → **Settings → Pages**.
3. *Build and deployment* → Source: **Deploy from a branch** → Branch: **main** → folder **/ (root)** → **Save**.
4. After ~1 minute your site is live at `https://<your-username>.github.io/<repo-name>/`.

Every time you push a change, the live site updates automatically.

## Push to GitHub (first time)
```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Later changes: `git add .` → `git commit -m "what changed"` → `git push`.

> Only put information on the site that you are happy to make public.
