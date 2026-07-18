// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://meiskinstudio.co',
  // We're using Vercel for static hosting + serverless functions in api/
  // No SSR adapter needed — output is fully static HTML.
  output: 'static',
  build: {
    // Keep file structure simple — no client-side hydration for this site
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Avoid asset hashing on our public assets so the URLs in main.js / main.css stay stable
      assetsInlineLimit: 0,
    },
  },
});
