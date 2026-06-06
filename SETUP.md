# mei skin studio — admin CMS setup

This site uses **Astro** (static site generator) + **Decap CMS** (browser-based content editor at `/admin/`) + **GitHub OAuth** (real authentication, no passwords stored anywhere on the site).

When Brianna edits text in `/admin/` → it commits to GitHub → Vercel rebuilds → live in ~30 seconds.

You have to do the four steps below **once** to wire it up. After that, the workflow is just "edit in the browser, save, done."

---

## 1 — Create the GitHub repo

In a browser, go to **https://github.com/new** and create a repo:

- **Repository name:** `brianna` (or `mei-skin-studio`, whatever)
- **Owner:** your GitHub account (or an org you control)
- **Public or Private:** Private is fine — Decap doesn't need it public
- **Don't** add a README / .gitignore / license (we already have files locally)

After creating, GitHub shows the remote URL. Copy it. Should look like:
`https://github.com/YOURNAME/brianna.git`

Then in PowerShell:

```powershell
cd E:\claude\brianna
git remote add origin https://github.com/YOURNAME/brianna.git
git branch -M master   # or 'main' if you prefer
git push -u origin master
```

That pushes the whole codebase to GitHub.

---

## 2 — Update `public/admin/config.yml` with your repo path

Open `public/admin/config.yml` and find:

```yaml
backend:
  name: github
  repo: REPLACE_WITH_OWNER/REPLACE_WITH_REPO
```

Change `REPLACE_WITH_OWNER/REPLACE_WITH_REPO` to your actual repo, like:
`ineedmorespace777-del/brianna`

Save, commit, push.

---

## 3 — Create a GitHub OAuth App

This is what makes "Login with GitHub" work in `/admin/`.

1. Go to **https://github.com/settings/developers**
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** `mei skin admin`
   - **Homepage URL:** `https://brianna.philipngo.ca`
   - **Authorization callback URL:** `https://brianna.philipngo.ca/api/callback`
4. Click **Register application**
5. On the next page:
   - Copy the **Client ID** (visible)
   - Click **Generate a new client secret**, copy that too (only shown once — save it)

---

## 4 — Add the OAuth credentials to Vercel

In Vercel, project → **Settings → Environment Variables**:

| Name                   | Value                          | Environments               |
| ---------------------- | ------------------------------ | -------------------------- |
| `GITHUB_CLIENT_ID`     | (paste Client ID from step 3)  | Production + Preview + Dev |
| `GITHUB_CLIENT_SECRET` | (paste secret from step 3)     | Production + Preview + Dev |

Save. **Then redeploy** so the env vars take effect (Deployments → ⋯ → Redeploy on the latest deploy).

---

## 5 — Connect Vercel to the GitHub repo (auto-deploy on commit)

So that Decap saves trigger redeploys:

1. Vercel project → **Settings → Git**
2. Click **Connect Git Repository**
3. Pick the GitHub repo you created in step 1
4. Confirm

Now every push to `master` (including saves from Decap) auto-deploys in ~30s.

---

## Adding Brianna later (when she's ready)

1. She makes a free GitHub account: https://github.com/signup
2. Send her username to you
3. In your repo on GitHub: **Settings → Collaborators → Add people** → enter her username
4. She accepts the email invite
5. She bookmarks `brianna.philipngo.ca/admin/` and logs in with GitHub from there

Done. She has edit access to all the text without touching code.

---

## Testing the flow yourself

After steps 1–5 above:

1. Visit `brianna.philipngo.ca/admin/`
2. Click **Login with GitHub**
3. Authorize the app (one-time popup)
4. You'll see the editor — all editable fields organized by section
5. Make a tiny change (e.g., the hero subtitle), hit **Publish**
6. Wait ~30s, refresh `brianna.philipngo.ca` — change is live

---

## Troubleshooting

**"401 Unauthorized" after clicking Login with GitHub:**
- Check that `GITHUB_CLIENT_ID` is set in Vercel env vars and the project was redeployed after adding them

**"Configuration error" in the CMS:**
- `public/admin/config.yml` still has the placeholder `REPLACE_WITH_OWNER/REPLACE_WITH_REPO` — update it

**"Invalid OAuth state":**
- Cookies were blocked or the callback URL in the OAuth App doesn't match `/api/callback` exactly

**Login works but "Saving failed":**
- The logged-in GitHub user isn't a collaborator on the repo. Add them in repo Settings → Collaborators.

**The site builds locally with `npm run build` but Vercel fails:**
- Make sure Vercel detects `astro` as the framework and runs `npm install` then `npm run build`. The `vercel.json` in this repo handles that.

---

## File map for editors

When Brianna asks "where does X live?":

| Section on the site | Field in CMS                |
| ------------------- | --------------------------- |
| Coming Soon splash  | "Coming Soon Splash"        |
| Hero (big "your skin, considered") | "Hero"          |
| Three pillars (read/treat/tend)    | "Philosophy"    |
| About the studio                   | "Studio Split"  |
| Services menu (facials etc.)       | "Services Menu" |
| "an hour that's actually yours"    | "Atmosphere"    |
| Guest quotes                       | "Testimonials"  |
| Location card + hours              | "Visit / Location card" |
| Newsletter form copy               | "Newsletter signup" |
| Footer links + copyright           | "Footer"        |

Everything else (logo, colors, fonts, layout, animations) is hand-coded and stays put.
