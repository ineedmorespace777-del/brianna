# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing site for **mei skin studio** (Kitsilano, Vancouver). Live at https://meiskinstudio.co. The client (Brianna) edits text through `/admin/`; that's the whole point of the stack. Code-side work is mostly layout/CSS/JS tweaks and schema changes to expose new editable fields.

> **Heads up:** `README.md` is the original Decap-era doc and is **stale** (mentions Decap, OAuth proxy, `api/auth.js`). The site now runs on **TinaCMS** — see `SETUP.md` for the current setup, `FOR-BRIANNA.md` for the client-facing daily workflow.

## Commands

```bash
npm run dev          # tinacms dev + astro dev together → http://localhost:4321 + admin at /admin/
npm run dev:astro    # astro only (skip tina) if you're just editing markup/CSS
npm run build        # production build — runs tina:build:if-cloud (conditional) then astro build
npm run build:local  # local-test build — tinacms build --local + astro build (no cloud creds needed)
npm run preview      # serve dist/ on http://localhost:4321
npm run verify       # Playwright screenshot test, desktop + iPhone
```

The `build` script's first stage is **inlined as a `node -e` one-liner** in `package.json` (the `tina:build:if-cloud` script). It checks `PUBLIC_TINA_CLIENT_ID && TINA_TOKEN`, runs the Tina build if both are set, skips with a warning otherwise. This lets Vercel deploy the site even when Tina creds aren't configured yet. **Don't try to externalize this into `tools/build.mjs`** — see the `.vercelignore` note below.

## Architecture

### Content flow

```
Brianna edits at /admin/  →  TinaCMS commits to src/content/site.json on master
                             ↓
                  GitHub webhook fires
                             ↓
                  Vercel auto-deploys (npm run build, ~60s)
                             ↓
                  meiskinstudio.co updated
```

The Astro page does a **build-time** `import site from '../content/site.json'`. No runtime fetching from Tina — content is baked at build time. This is why every edit requires a redeploy.

### Three pillars

1. **`src/pages/index.astro`** — the whole site is one page. Frontmatter computes `bizName`, `jsonLd` (BeautySalon schema from `site.json`), and inline-markdown helpers (`em()`, `titleLines()`, `inline()`, `nl2br()`). The `*asterisks*` → `<em>` convention is used in title fields throughout `site.json`. Cache-bust query params: `cssVer`, `jsVer` — **bump these when CSS/JS changes**, otherwise users see stale assets.

2. **`tina/config.ts`** — singleton schema, one document mapped to `src/content/site.json`. Every section is a nested `object` field; lists are `object` with `list: true`. The singleton has `allowedActions: { create: false, delete: false }` and **no `router`** — without `useTina()` in the page, a router makes the form panel stay empty. Don't re-add the router until index.astro is converted to use `useTina()`.

3. **`src/content/site.json`** — the source of truth for all editable content. When adding a new section, **update three places in sync**: the JSON (add the keys), `tina/config.ts` (add fields under the same object name), and `index.astro` (render it). Optional sections use an `enabled: true` boolean toggle pattern (see `aboutMei`, `faq`).

### Media slots

Every photo placeholder in `index.astro` ternary-renders: `image` field set → `<img class="media-img">`, otherwise `<div class="frame">` (arch-topped CSS placeholder with diagonal stripes + corner brackets). To wire a new image slot, add `image` + `image_alt` fields to the schema + JSON, then add the ternary in the markup. Hero image gets `loading="eager"` + `fetchpriority="high"`; everything else is lazy.

### Coming-soon gate

`src/pages/index.astro` renders the gate as an `<aside>` when `site.comingSoon.enabled !== false`. Password lives in `window.__MEI_PWD` (inlined from `site.json`). Successful unlock writes `localStorage['mei-unlocked'] = 'true'` and adds `.unlocked` to `<html>`. To bypass during dev: `localStorage.setItem('mei-unlocked','true')`.

## Deploy & infra

- **GitHub repo:** `ineedmorespace777-del/brianna` (public)
- **Vercel project:** `brianna` under `ineedmorespace777-dels-projects`. Project ID `prj_FxLw23f9se9A7JoyFNelFbLysfoZ`, org `team_gQXzBbGVttv8W3hn4seJlbtY`.
- **Tina Cloud project:** ID `3de1965e-4e2a-4dc2-83f0-f34b7b85e093` (https://app.tina.io/projects/3de1965e-4e2a-4dc2-83f0-f34b7b85e093)
- **Required env vars** (set on Vercel for production, preview, development): `PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`, `TINA_SEARCH_TOKEN`.
- **Manual deploy:** `npx vercel --prod`

## Landmines (read before changing build/deploy stuff)

- **`.vercelignore` excludes `tools/`** historically — re-adding `tools/build.mjs` as the build entry point breaks Vercel ("Cannot find module"). The inline `node -e` script in `package.json` is the workaround. If you remove `tools` from `.vercelignore`, the externalized helper is fine.
- **`tina-lock.json` must be committed.** Generated by `tinacms dev`, not by `tinacms build --local`. Tina Cloud refuses to index master without it ("Branch is not on TinaCloud"). If you bump the schema, regenerate by running `npm run dev` briefly, then commit the new `tina/tina-lock.json`.
- **`npx vercel env add NAME env` with `echo val | …` stores empty values** on Windows PowerShell. Always use `--value "..."` flag: `npx vercel env add NAME production --value "actual-value"`.
- **Vercel pulls env vars as `""` when they're marked sensitive** (default for production/preview). `vercel env pull .env.production.local` won't reveal them. They work fine inside Vercel builds — only the local pull is opaque.
- **Auto-deploy needs the Vercel GitHub App to have access to the `brianna` repo.** If pushes don't trigger deploys, check https://github.com/settings/installations → Vercel → add `brianna` to Repository access, then `npx vercel git connect`.
- **Deploys take ~60 seconds.** When testing a Tina save → live flow, wait a full minute before declaring the chain broken. Hard-refresh with `Ctrl+Shift+R` to bypass browser cache.
- **Tina commits land as "TinaCMS content update"** — these are client/editor saves, not noise. Don't squash them.
- **`public/admin/` and `tina/__generated__/` are gitignored** and regenerated on every build. Don't commit them; don't reference them as sources of truth.

## Adding a new editable section (the loop)

1. Add the section's keys (with sensible defaults) to `src/content/site.json`.
2. Add a matching `object` field in `tina/config.ts` — use `description:` on every field to give Brianna context. If the section should be toggleable, add a `boolean` `enabled` field first.
3. Render it in `src/pages/index.astro`, gated on `site.X.enabled !== false` if applicable. Use `inline()` for fields where `*italic*` markdown is expected.
4. Style in `public/styles/main.css`. Bump `cssVer` in `index.astro` frontmatter.
5. `npm run build:local` to validate. Commit + push. Vercel deploys; the new fields appear in `/admin/` for Brianna.

## Don't

- Don't add `useTina()` partially. Either fully convert `index.astro` to a hydrated Tina-aware component (and re-add `router: () => "/"` in the schema), or leave both off. The current form-only admin works.
- Don't introduce a Tina `image` field as `required: true` — empty/missing image fields are part of the placeholder fallback strategy.
- Don't manually edit `tina/tina-lock.json` or `package-lock.json`.
- Don't commit `.env.production.local` or anything generated by `vercel env pull` — they may leak OIDC tokens.
