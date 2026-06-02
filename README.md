# mei skin studio — site mock

A static HTML/CSS/JS site mock for **mei skin studio** — a boutique restorative skin care practice in Kitsilano, Vancouver. Built from scratch, no framework, no build step.

## What's here

```
brianna/
├── index.html           single-page, scroll-driven layout
├── 404.html             themed not-found page
├── styles/main.css      tokens, typography, layout, responsive
├── scripts/main.js      header scroll state, mobile drawer, scroll reveals, form
├── assets/
│   ├── mei-logo.jpg     the brand mark
│   ├── logo.svg         (legacy circle mark — unused)
│   └── og.svg           social preview placeholder
├── vercel.json          security headers + static caching
├── preview.bat          double-click to preview locally
└── verify-output/       playwright screenshots (gitignored)
```

## Local preview

**Easiest:** double-click `preview.bat`. It kills any stale server on port 5500, opens `http://127.0.0.1:5500` in your browser, and serves the project folder.

Manual alternative:

```powershell
cd E:\claude\brianna
python -m http.server 5500 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5500`.

## Design language

- **Palette:** cream `#f5f0e8` + dark warm brown `#2d2622` + soft sage `#7a8a6e` (echoes the botanical line illustration in the logo)
- **Type:** Cormorant Garamond for display, Inter for body — high-contrast serif paired with a clean modern sans
- **Voice:** lowercase, restrained, considered. No marketing buzzwords.

## Sections (in scroll order)

1. **hero** — serif headline, two CTAs, cream right-side image slot
2. **philosophy** — read / treat / tend triad
3. **studio split** — image + editorial about the practice
4. **services menu** — six service cards with duration metadata
5. **atmosphere** — center-aligned editorial pull
6. **testimonials** — eight guest words (4×2 grid)
7. **visit** — studio + traveling service cards with hours
8. **newsletter** — split form with interest radio
9. **footer** — brand, three nav columns, social, legal

## Swapping in real images

Every image slot is a blank cream block (`#ebe3d6`). To use real photos, set `background-image: url(...)` on:

| element                                | css selector                          |
|----------------------------------------|---------------------------------------|
| Hero right-side photo                  | `.hero-img`                           |
| Studio split photo                     | `.exp-img`                            |
| Service card photo (per service)       | `.menu-card-img[data-img="signature"]` etc. |
| Atmosphere full-bleed                  | `.atmosphere-img`                     |
| Visit card photo (per card)            | `.loc-img[data-img="studio"]` etc.    |

## Deploy to Vercel

No build step. Plain static.

1. `git init && git add . && git commit -m "mei skin mock"`
2. Push to GitHub.
3. Vercel → Add New → Import the repo.
4. **Framework:** Other. **Build:** empty. **Output:** `./`.
5. Deploy. URL in ~10 seconds.

The included `vercel.json` ships security headers (HSTS, X-Frame-Options, Referrer-Policy) and a one-year immutable cache on CSS/JS/SVG.

## Adding Supabase later

Same pattern as the `homebase` project — install `@supabase/supabase-js`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel env vars, wire the newsletter form (`#newsletter-form`) to insert a row in a `subscribers` table. The form already validates client-side.

## License

Code: MIT. Copy and imagery placeholders: replace with your real content before launch.
