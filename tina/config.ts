// TinaCMS schema for mei skin studio
//
// One document — content/site/index.json — that mirrors the
// site's existing structure. Sections are nested objects so the
// editor sidebar groups them cleanly without freezing.
//
// Local dev:  npx tinacms dev -c "npm run astro -- dev"
// Build:      npx tinacms build && npx astro build
// Admin URL:  /admin/index.html

import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "master";

// Tint dropdown is intentionally NOT a field — placeholders are uniform now.
// If we ever bring back per-section tints, add a `tint` field to the
// relevant objects.

export default defineConfig({
  branch,
  clientId: process.env.PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  search: {
    tina: { indexerToken: process.env.TINA_SEARCH_TOKEN || "", stopwordLanguages: ["eng"] },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },

  schema: {
    collections: [
      {
        name: "site",
        label: "Site content",
        path: "src/content",
        format: "json",
        match: { include: "site" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/",
          filename: { readonly: true, slugify: () => "site" },
        },
        fields: [
          // ───────────────── meta / seo ─────────────────
          {
            type: "object", name: "meta", label: "Meta & SEO",
            description: "Browser tab title, social share previews, theme color.",
            fields: [
              { type: "string", name: "title", label: "Browser tab title", required: true },
              { type: "string", name: "description", label: "Search engine description", ui: { component: "textarea" } },
              { type: "string", name: "og_title", label: "Social share — title" },
              { type: "string", name: "og_description", label: "Social share — description", ui: { component: "textarea" } },
              { type: "string", name: "twitter_title", label: "Twitter — title" },
              { type: "string", name: "twitter_description", label: "Twitter — description" },
              { type: "string", name: "theme_color", label: "Theme color (browser UI tint)", description: "e.g. #f7f2ea" },
            ],
          },

          // ───────────────── coming soon gate ─────────────────
          {
            type: "object", name: "comingSoon", label: "Coming Soon splash",
            description: "Pre-launch password gate. Turn off to launch publicly.",
            fields: [
              { type: "boolean", name: "enabled", label: "Show the splash?" },
              { type: "string", name: "password", label: "Password", description: "What visitors type to get past the splash. Lowercase, no spaces." },
              { type: "string", name: "eyebrow", label: "Top label" },
              { type: "string", name: "title", label: "Big title", description: "Wrap italic word in *asterisks*. e.g. '*coming* soon.'" },
              { type: "string", name: "sub", label: "Subtitle paragraph", ui: { component: "textarea" } },
              { type: "string", name: "ig_label", label: "Instagram link label" },
            ],
          },

          // ───────────────── brand ─────────────────
          {
            type: "object", name: "brand", label: "Brand & socials",
            fields: [
              { type: "string", name: "name", label: "Brand name" },
              { type: "string", name: "ig_url", label: "Instagram URL" },
              { type: "string", name: "tiktok_url", label: "TikTok URL" },
            ],
          },

          // ───────────────── overlay nav ─────────────────
          {
            type: "object", name: "overlayNav", label: "Overlay menu",
            description: "The full-screen nav that opens from the three dots.",
            fields: [
              {
                type: "object", name: "items", label: "Menu items", list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "—" }) },
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "anchor", label: "Anchor or URL", description: "Like #menu, #book, or a full URL." },
                ],
              },
              { type: "string", name: "book_label", label: "Book button label" },
              { type: "string", name: "foot_left", label: "Footer left text" },
              { type: "string", name: "foot_right", label: "Footer right text" },
            ],
          },

          // ───────────────── hero ─────────────────
          {
            type: "object", name: "hero", label: "Hero (first thing visitors see)",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              {
                type: "string", name: "title", label: "Big title",
                ui: { component: "textarea" },
                description: "Each new line becomes a new line on screen. Wrap italic words in *asterisks*.",
              },
              { type: "string", name: "sub", label: "Subtitle paragraph", ui: { component: "textarea" } },
              { type: "string", name: "cta_primary_label", label: "Primary button label" },
              { type: "string", name: "cta_secondary_label", label: "Secondary button label" },
              { type: "string", name: "frame_label", label: "Image caption (optional)", description: "Small italic text that appears inside the placeholder image. Leave blank for none." },
              { type: "string", name: "chip_label", label: "Hero chip (e.g., 'now booking')", description: "Floating chip on the hero image. Leave blank to hide." },
              {
                type: "object", name: "meta", label: "Proof points under CTAs", list: true,
                ui: { itemProps: (item) => ({ label: item?.dt ? `${item.dt} · ${item.dd}` : "—" }) },
                fields: [
                  { type: "string", name: "dt", label: "Number/word", description: "e.g. 'one', '60 min+', 'no'" },
                  { type: "string", name: "dd", label: "Caption", description: "e.g. 'face at a time, by appointment'" },
                ],
              },
            ],
          },

          // ───────────────── marquee ─────────────────
          {
            type: "object", name: "marquee", label: "Marquee (scrolling text under hero)",
            fields: [
              {
                type: "string", name: "items", label: "Phrases", list: true,
                ui: { itemProps: (item) => ({ label: item || "—" }) },
              },
            ],
          },

          // ───────────────── philosophy ─────────────────
          {
            type: "object", name: "philosophy", label: "Philosophy section",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title", ui: { component: "textarea" }, description: "Newlines = new lines. *italic* allowed." },
              { type: "string", name: "lede", label: "Intro paragraph", ui: { component: "textarea" } },
              {
                type: "object", name: "triad", label: "Three pillars", list: true,
                ui: { itemProps: (item) => ({ label: item?.title ? item.title.replace(/[*]/g, "") : "—" }) },
                fields: [
                  { type: "string", name: "num", label: "Number" },
                  { type: "string", name: "title", label: "Pillar title", description: "*italic* allowed" },
                  { type: "string", name: "body", label: "Pillar body", ui: { component: "textarea" } },
                ],
              },
            ],
          },

          // ───────────────── studio split ─────────────────
          {
            type: "object", name: "studioSplit", label: "Studio (image + about copy)",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title", description: "*italic* allowed" },
              { type: "string", name: "body_p1_before_link", label: "Paragraph 1 — text before link", ui: { component: "textarea" } },
              { type: "string", name: "body_p1_link_text", label: "Paragraph 1 — link text" },
              { type: "string", name: "body_p1_link_url", label: "Paragraph 1 — link URL" },
              { type: "string", name: "body_p1_after_link", label: "Paragraph 1 — text after link", ui: { component: "textarea" } },
              { type: "string", name: "body_p2", label: "Paragraph 2", ui: { component: "textarea" } },
              { type: "string", name: "cta_label", label: "Button label" },
              { type: "string", name: "frame_label", label: "Image caption (optional)" },
            ],
          },

          // ───────────────── services menu ─────────────────
          {
            type: "object", name: "services", label: "Services menu",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "note", label: "Small caption at the top of the menu" },
              {
                type: "object", name: "items", label: "Services", list: true,
                ui: { itemProps: (item) => ({ label: item?.name ? `${item.name} · ${item.duration || ""}` : "—" }) },
                fields: [
                  { type: "string", name: "img_key", label: "Image key (internal slug)" },
                  { type: "string", name: "name", label: "Service name" },
                  { type: "string", name: "duration", label: "Duration", description: "e.g. '90 min'" },
                  { type: "string", name: "price", label: "Price", description: "e.g. '$215'. Shown as a tag on the image. Leave blank to hide." },
                  { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                ],
              },
              { type: "string", name: "footnote", label: "Footnote paragraph", ui: { component: "textarea" } },
              { type: "string", name: "footnote_cta_label", label: "Footnote button label" },
            ],
          },

          // ───────────────── atmosphere ─────────────────
          {
            type: "object", name: "atmosphere", label: "Atmosphere (the editorial pull)",
            fields: [
              { type: "string", name: "title", label: "Title", description: "*italic* allowed" },
              { type: "string", name: "body", label: "Body paragraph", ui: { component: "textarea" } },
            ],
          },

          // ───────────────── testimonials ─────────────────
          {
            type: "object", name: "testimonials", label: "Testimonials",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title" },
              {
                type: "object", name: "items", label: "Quotes", list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "—" }) },
                fields: [
                  { type: "string", name: "name", label: "Client name (first name only)" },
                  { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
                ],
              },
            ],
          },

          // ───────────────── locations ─────────────────
          {
            type: "object", name: "locations", label: "Visit / Location",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title", description: "*italic* allowed" },
              {
                type: "object", name: "items", label: "Location cards", list: true,
                ui: { itemProps: (item) => ({ label: item?.city_tag || "—" }) },
                fields: [
                  { type: "string", name: "city_tag", label: "City tag (small all-caps label)" },
                  { type: "string", name: "name", label: "Location name", description: "*italic* allowed" },
                  { type: "string", name: "address", label: "Address", ui: { component: "textarea" }, description: "New lines = visual line breaks." },
                  { type: "string", name: "frame_label", label: "Image caption (optional)" },
                  {
                    type: "object", name: "hours", label: "Hours", list: true,
                    ui: { itemProps: (item) => ({ label: item?.label && item?.value ? `${item.label}: ${item.value}` : "—" }) },
                    fields: [
                      { type: "string", name: "label", label: "Days label", description: "e.g. tue — fri" },
                      { type: "string", name: "value", label: "Hours value", description: "e.g. 10:00a — 7:00p" },
                    ],
                  },
                  { type: "string", name: "cta_primary_label", label: "Primary button label" },
                  { type: "string", name: "cta_primary_url", label: "Primary button URL" },
                  { type: "string", name: "cta_secondary_label", label: "Secondary button label" },
                  { type: "string", name: "cta_secondary_url", label: "Secondary button URL" },
                ],
              },
              { type: "string", name: "contact_line_label", label: "Contact line label" },
              { type: "string", name: "contact_email", label: "Contact email" },
            ],
          },

          // ───────────────── newsletter ─────────────────
          {
            type: "object", name: "newsletter", label: "Newsletter signup",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow" },
              { type: "string", name: "title", label: "Title", description: "*italic* allowed" },
              { type: "string", name: "body", label: "Body paragraph", ui: { component: "textarea" } },
              { type: "string", name: "name_placeholder", label: "Name field placeholder" },
              { type: "string", name: "email_placeholder", label: "Email field placeholder" },
              { type: "string", name: "submit_label", label: "Submit button label" },
            ],
          },

          // ───────────────── footer ─────────────────
          {
            type: "object", name: "footer", label: "Footer",
            fields: [
              { type: "string", name: "tagline", label: "Tagline (under brand logo)" },
              {
                type: "object", name: "columns", label: "Nav columns", list: true,
                ui: { itemProps: (item) => ({ label: item?.heading || "—" }) },
                fields: [
                  { type: "string", name: "heading", label: "Column heading" },
                  {
                    type: "object", name: "items", label: "Links", list: true,
                    ui: { itemProps: (item) => ({ label: item?.label || "—" }) },
                    fields: [
                      { type: "string", name: "label", label: "Label" },
                      { type: "string", name: "url", label: "URL" },
                    ],
                  },
                ],
              },
              { type: "string", name: "copyright_name", label: "Copyright name" },
              {
                type: "object", name: "legal_links", label: "Legal links", list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "—" }) },
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "url", label: "URL" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
