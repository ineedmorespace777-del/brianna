# mei skin studio — admin (Tina CMS) setup

This site uses **Astro** (static site generator) + **Tina CMS** (browser-based content editor at `/admin/`) + **Tina Cloud** (free hosted backend, email login — no GitHub account needed for the editor).

Edit text in `/admin/` → Save → it commits to GitHub → Vercel rebuilds → live in ~30 seconds.

You do the five steps below **once** to wire it up. After that the workflow for Brianna is just "open /admin/, edit, save, done."

---

## 0 — What's already done

- ✅ GitHub repo wired (`ineedmorespace777-del/brianna`)
- ✅ Vercel project deployed to `brianna.philipngo.ca`
- ✅ Tina schema written (`tina/config.ts`) — every field on the site is editable
- ✅ Build pipeline updated (`npm run build` runs Tina + Astro together)
- ✅ Old Decap CMS + GitHub OAuth removed (silent-save bug)

What you still need to do: register the project on Tina Cloud and add two env vars to Vercel.

---

## 1 — Sign up for Tina Cloud

In a browser, go to **https://app.tina.io/register** and create an account.

- Use the email you want to administer with (e.g. `ineedmorespace777@gmail.com`)
- Verify the email
- No credit card needed — the free tier covers solo editors

Brianna does **not** need to do this step. When you're ready to hand off, you'll invite her to the project from inside Tina Cloud (Settings → Collaborators → add her email).

---

## 2 — Register the project on Tina Cloud

After login, click **"Create new project"** and fill in:

| Field | Value |
| --- | --- |
| **Project name** | `mei skin studio` |
| **Git provider** | GitHub |
| **Repository** | `ineedmorespace777-del/brianna` |
| **Branch** | `master` |
| **Working directory** | *(leave blank — repo root)* |

Tina Cloud will redirect you to GitHub to authorize the Tina Cloud app on this repo. Approve it. That's how Save → Commit works under the hood — no OAuth proxy needed.

After approval you land on the project dashboard.

---

## 3 — Grab the Client ID + Token

On the project dashboard, click **"Overview"** then **"Configuration"**.

You'll see two values to copy:

1. **Client ID** — looks like `00000000-aaaa-bbbb-cccc-111111111111`
   This goes in the env var `PUBLIC_TINA_CLIENT_ID` (note the `PUBLIC_` prefix — Astro exposes it to the client).

2. **Token** — click **"Tokens"** → **"Generate token"** → name it `vercel-prod`, scope `Content` (read), click create.
   This goes in the env var `TINA_TOKEN`.

Keep the token tab open — you can only view it once.

---

## 4 — Add the env vars to Vercel

In PowerShell from `E:\claude\brianna`:

```powershell
vercel env add PUBLIC_TINA_CLIENT_ID production --value "PASTE_CLIENT_ID_HERE"
vercel env add PUBLIC_TINA_CLIENT_ID preview    --value "PASTE_CLIENT_ID_HERE"
vercel env add PUBLIC_TINA_CLIENT_ID development --value "PASTE_CLIENT_ID_HERE"

vercel env add TINA_TOKEN production --value "PASTE_TOKEN_HERE"
vercel env add TINA_TOKEN preview    --value "PASTE_TOKEN_HERE"
```

(Or paste them into the Vercel dashboard → project Settings → Environment Variables. Same result.)

Use `--value "..."` not piping — piping adds a UTF-8 BOM on Windows PowerShell.

---

## 5 — Redeploy

```powershell
vercel --prod
```

After deploy:
1. Open `https://brianna.philipngo.ca/admin/`
2. Click "Log in with Tina Cloud"
3. Authorize with your tina.io account
4. You land in the editor — sidebar shows every section of the site
5. Tweak a string, click **"Save"** (top right)
6. Tina commits to GitHub → Vercel rebuilds → live in ~30 seconds

---

## Daily workflow (Brianna)

After you invite her as a collaborator in Tina Cloud:

1. She visits `brianna.philipngo.ca/admin/`
2. Logs in with her email (Tina Cloud sends a magic-link code — no password)
3. Edits any text on the site
4. Hits Save
5. Done — change is live in ~30 seconds

No git, no GitHub, no terminal, no markdown. The form sidebar mirrors the site structure 1:1.

---

## Local development

```powershell
npm run dev
```

This runs Tina's local backend + Astro dev server together. Open `http://localhost:4321/` for the site, `http://localhost:4321/admin/` for the editor. Changes save to the local JSON file — no cloud round-trip while you're developing.

If you want to validate the Tina schema without cloud auth:

```powershell
npm run build:local
```

---

## Troubleshooting

**Admin shows "Client not configured"** → env vars missing or wrong. Re-check Vercel.

**Save button does nothing** → Tina Cloud doesn't have GitHub permission on the repo. Go to GitHub → Settings → Applications → Tina Cloud → grant access to `ineedmorespace777-del/brianna`.

**Build fails on Vercel with cloud error** → token expired (rare). Regenerate in Tina Cloud, update `TINA_TOKEN` in Vercel, redeploy.

**Changes don't show on the live site** → check Vercel Deployments tab. Tina commits to `master`, Vercel auto-deploys. If the deploy is queued but not built, give it 30s.
