# mei skin studio

Static site for [mei skin studio](https://meiskinstudio.co) — a boutique restorative skin studio in Kitsilano, Vancouver. Built with Astro + a small JSON content file that's edited via Decap CMS at `/admin/`.

## Project layout

```
brianna/
├── src/
│   ├── pages/
│   │   ├── index.astro      ← main page template
│   │   └── 404.astro
│   └── content/
│       └── site.json        ← all editable text (THE file Decap commits to)
├── public/
│   ├── assets/              ← logo + uploaded images
│   ├── styles/main.css      ← all styling
│   ├── scripts/main.js      ← header, overlay menu, scroll reveals, gate
│   ├── admin/
│   │   ├── index.html       ← Decap CMS loader
│   │   └── config.yml       ← schema (what shows up as editable fields)
│   ├── robots.txt
│   └── sitemap.xml
├── api/                     ← Vercel serverless functions
│   ├── auth.js              ← starts GitHub OAuth flow
│   └── callback.js          ← receives token, hands back to CMS
├── tools/
│   └── verify.mjs           ← Playwright screenshot tests (dev only)
├── astro.config.mjs
├── package.json
├── vercel.json
└── SETUP.md                 ← one-time setup steps (read this first)
```

## First-time setup

See **[SETUP.md](./SETUP.md)** — covers creating the GitHub repo, the OAuth App, the Vercel env vars, and connecting auto-deploy.

## Local development

```powershell
npm install
npm run dev        # → http://localhost:4321 (Astro dev server, hot reload)
npm run build      # → builds to dist/
npm run preview    # → serves the built dist/
npm run verify     # → Playwright screenshots, desktop + iPhone
```

Or for the quick local preview (without npm), the old `preview.bat` still works — it just serves `dist/` after you've run `npm run build` once.

## Editing content

**Via the CMS (recommended for content people):**
Go to `https://meiskinstudio.co/admin/` → Login with GitHub → edit → publish.

**Via direct JSON edit (recommended for devs):**
Edit `src/content/site.json` → `git commit` → `git push` → Vercel auto-deploys.

## Where to edit what

- **Text content** → `src/content/site.json`
- **Design / layout** → `public/styles/main.css`
- **Interactions (menu, gate, forms)** → `public/scripts/main.js`
- **Page structure** → `src/pages/index.astro`
- **CMS field labels & hints** → `public/admin/config.yml`

## Deploy

Connected to Vercel via GitHub. Push to `master` → auto-deploys. CMS saves are commits, so they auto-deploy too.

For manual deploys:
```powershell
npx vercel deploy --prod --yes
```
