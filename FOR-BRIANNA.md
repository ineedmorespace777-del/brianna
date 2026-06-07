# for brianna — how to edit your site

Hey! This is your cheat sheet. Bookmark it. It covers everything you need to update text, swap a service price, add a testimonial, or flip the "coming soon" sign when you're ready to launch.

You never need a developer for any of this. No terminal, no GitHub, no code. Just your browser.

---

## getting in

1. Go to **https://brianna.philipngo.ca/admin/**
2. Click **"Log in with Tina Cloud"**
3. Log in with the email I invited you with — a magic-link code arrives in your inbox, paste it in, you're in
4. You'll see your site's sections in a sidebar on the left

That's it. No password to remember. The login lasts a few days before it asks you to re-do the magic link.

---

## the rhythm of an edit

1. Click a section in the left sidebar (e.g. **"Services menu"**)
2. The fields for that section open on the right
3. Type your change
4. Click **"Save"** at the top right
5. Wait ~30 seconds — your change goes live at brianna.philipngo.ca

Behind the scenes, every save commits to GitHub, GitHub tells the host (Vercel) to rebuild, Vercel publishes. You don't have to think about any of that. Just: edit → save → wait half a minute → refresh the live site.

---

## the sections, in plain words

The sidebar groups every editable thing on your site. From top to bottom:

| Section | What it controls |
| --- | --- |
| **Meta & SEO** | The browser tab title, the preview that shows when someone shares your link on instagram, the search-engine description. One-time setup mostly. |
| **Coming Soon splash** | The password-locked landing page that's up now. Turn off the **"Show the splash?"** toggle when you're ready to launch. |
| **Brand & socials** | Your brand name, instagram URL, tiktok URL. |
| **Overlay menu** | The full-screen menu that pops out from the three dots in the top-right. |
| **Hero** | The first thing visitors see: title, subtitle, the two buttons, the three little "one face at a time" stats. |
| **Marquee** | The scrolling line of service names below the hero. |
| **Philosophy** | The "read / treat / tend" three-pillar block. |
| **Studio** | The split section with the image of the room + the paragraph about the studio. |
| **About / Meet Mei** | Your bio, credentials, pull quote. Hide the whole section with the toggle if you ever want to. |
| **Services menu** | Your six services with prices, durations, and descriptions. |
| **Atmosphere** | The big editorial pull-quote section. |
| **Testimonials** | The grid of client quotes. |
| **Visit / Location** | The studio address, hours, location image. |
| **FAQ accordion** | The eight question/answer pairs near the bottom. Hide the whole section with the toggle if you want. |
| **SEO / structured data** | The data that Google's "knowledge panel" pulls from. Price range, address, lat/lng. One-time setup. |
| **Newsletter signup** | Headings + placeholders for the email form. |
| **Footer** | The bottom of the page — three columns of nav links, copyright line, legal links. |

---

## a few editor tricks

### italic words (the *like this* style)
When you see a field description that says "wrap italic words in `*asterisks*`," it means:
- Type `meet *mei.*` → on the site it shows: **meet *mei.***
- Type `your skin, *considered.*` → on the site it shows: **your skin, *considered.***

The asterisks become italic styling. They never appear on the site.

### line breaks
In big title fields (Hero, Philosophy, Studio title, etc.), pressing **Enter** creates a new line on the site. So:
```
your skin,
considered.
```
shows up as two lines, not one.

### lists (Services, FAQ, Testimonials, Hours, etc.)
Anywhere you see a list of cards:
- **Add a new item** → scroll to the bottom of the list, click the **"+ Add Item"** button
- **Reorder items** → drag the little handle on the left of each item
- **Delete an item** → click the three-dot menu on an item, choose Delete
- **Hide an item without deleting** → no built-in toggle for individual items, but you can drag it to the end and just don't reference it. Or delete it; the site keeps a history in case you change your mind.

### images
The current site uses arch-topped placeholder frames everywhere photos would go. When you're ready to add real photos:
- In any section with an image, look for the "Image" or "Frame Label" field
- Drag an image into the upload area, or click to browse
- Save — your image will replace the placeholder on the live site

(I'll add the image upload fields in a follow-up — they're not wired yet. For now, just edit text and we'll handle photos together when you're ready.)

---

## launching: turning off "coming soon"

1. In the sidebar, click **"Coming Soon splash"**
2. Untick **"Show the splash?"**
3. Click **Save**
4. ~30 seconds later, brianna.philipngo.ca shows your real homepage to everyone — no password needed

Your coming-soon content is still saved. If you ever want to put the gate back up (renovating, on vacation, etc.) just tick the toggle on again.

---

## the testimonials shortcut

A pattern that'll come up a lot: a new client raves, you want their quote on the site.

1. Sidebar → **Testimonials**
2. Scroll to **Quotes** list, click **+ Add Item**
3. Type the quote (no quote marks needed — the site adds the typographic styling)
4. Type their first name (no last names — keeps it personal + private)
5. Drag the new item to wherever you want it to appear in the grid
6. Save

Five testimonials is enough. Eight feels considered. Twelve feels desperate. Curate.

---

## if something looks wrong

### "I saved but the change isn't showing"
- Hard refresh the live site: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac). Browsers cache aggressively.
- Wait a full 90 seconds. The rebuild takes 30–60s after a save.
- If still nothing — text me / DM me. I'll check the deploy log.

### "I broke a section"
You can't actually break it. Every save is a commit in git, which means every version is recoverable. Worst case, I roll back to the previous version in 30 seconds. Edit fearlessly.

### "I can't log in"
- Check the email I invited you with — it's the only one Tina Cloud knows about
- Magic links expire fast (15 min). If yours timed out, just request a new one
- Still stuck? Message me, I'll resend the invite

### "The whole site is down"
Almost never happens. If it does, message me with a screenshot. The previous working version restores in under a minute.

---

## what's saved where (in case you're curious)

- Your content lives in a file called `site.json` in our GitHub repo
- Every save = a new commit (git history), so we can see exactly when each line of text changed and who changed it
- Photos (when we add them) live in a folder called `uploads` in the same repo
- Nothing is on your computer. Everything's in the cloud, accessible from any browser, any device

---

## quick tour of where everything appears

If you scroll the live site top to bottom and match it to the sidebar:

1. **Hero** (the big "your skin, considered.") → sidebar: Hero
2. **Scrolling line of services** → sidebar: Marquee
3. **"slow skin care. honest results."** → sidebar: Philosophy
4. **"a single room. one face at a time."** → sidebar: Studio
5. **"meet mei."** → sidebar: About / Meet Mei
6. **"the menu." (six services)** → sidebar: Services menu
7. **Big "an hour that's actually yours."** → sidebar: Atmosphere
8. **Grid of client quotes** → sidebar: Testimonials
9. **Studio address + hours** → sidebar: Visit / Location
10. **"commonly asked." (FAQ)** → sidebar: FAQ accordion
11. **"stay close" (newsletter)** → sidebar: Newsletter signup
12. **Footer at the bottom** → sidebar: Footer

---

## what NOT to touch

These are advanced fields that affect how Google sees your site or how the page actually renders. Leave them alone unless I told you to change them:

- **SEO / structured data** — latitude, longitude, country code. Set once.
- **Meta & SEO** → theme color, OG image. These are fine for now.
- **Coming Soon splash** → password — only change if you're rotating who has the preview link.
- **Footer** → legal_links URLs — they're placeholders right now.

If you're not sure, ask.

---

## anything else?

If a field is confusing, hover over its label — there's a small description for almost every field that explains what it does on the site.

When in doubt: save, refresh the live site, see what happened. Nothing's permanent. We can always undo.

— philip
