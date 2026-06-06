// quick playwright verification — opens the local site at desktop and iphone 14 viewports,
// reports layout measurements, saves screenshots.
//
// run from project root:
//   npx --yes playwright install chromium  (one-time)
//   node scripts/verify.mjs

import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'verify-output');
await mkdir(outDir, { recursive: true });

const URL = process.env.URL || 'http://localhost:5500/';

const measureScript = `
  const grab = sel => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    return { h: Math.round(r.height), w: Math.round(r.width), display: c.display };
  };
  const displayOf = sel => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).display : 'missing';
  };
  ({
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    nav: {
      navToggle: displayOf('.nav-toggle'),
      bookBtn: displayOf('.book-btn'),
      overlayHidden: !!document.querySelector('.overlay-nav[hidden]'),
    },
    grids: {
      triad: getComputedStyle(document.querySelector('.triad')).gridTemplateColumns,
      menu: getComputedStyle(document.querySelector('.menu-grid')).gridTemplateColumns,
      reflections: getComputedStyle(document.querySelector('.reflections')).gridTemplateColumns,
      locations: getComputedStyle(document.querySelector('.loc-grid')).gridTemplateColumns,
      newsletter: getComputedStyle(document.querySelector('.newsletter-grid')).gridTemplateColumns,
      expSplit: getComputedStyle(document.querySelector('.experience-split')).gridTemplateColumns,
      footer: getComputedStyle(document.querySelector('.footer-grid')).gridTemplateColumns,
    },
    sizes: {
      header: grab('.site-header'),
      hero: grab('.hero'),
      heroTitleSize: getComputedStyle(document.querySelector('.hero-title')).fontSize,
      atmosSize: getComputedStyle(document.querySelector('.atmosphere-title')).fontSize,
      menu: grab('.menu'),
      atmosphere: grab('.atmosphere'),
      newsletter: grab('.newsletter'),
      footer: grab('.site-footer'),
    },
    total: document.documentElement.scrollHeight,
  });
`;

async function run(name, contextOpts) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(contextOpts);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  // small wait so fonts settle
  await page.waitForTimeout(400);

  // capture the coming-soon gate first if it's present
  const gateVisible = await page.evaluate(() => {
    const g = document.getElementById('coming-soon-gate');
    return g && !document.documentElement.classList.contains('unlocked');
  });
  if (gateVisible) {
    await page.screenshot({ path: join(outDir, `${name}-gate.png`), fullPage: false });
    // unlock so the rest of the screenshots can capture the site
    await page.evaluate(() => {
      localStorage.setItem('mei-unlocked', 'true');
      document.documentElement.classList.add('unlocked');
    });
    await page.waitForTimeout(200);
  }

  const measurements = await page.evaluate(measureScript);

  // top-of-page screenshot first (clean hero)
  await page.screenshot({ path: join(outDir, `${name}-top.png`), fullPage: false });

  // scroll through the whole page to trigger every IntersectionObserver-driven reveal
  const totalH = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  const step = Math.floor(vh * 0.6);
  for (let y = 0; y < totalH; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // full-page screenshot — all reveals have now fired
  await page.screenshot({ path: join(outDir, `${name}-full.png`), fullPage: true });

  // mid-page section screenshots so we can inspect each one — reset to top first
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const sections = await page.$$eval('section', els => els.map(el => ({
    cls: (el.className || '').split(' ')[0],
    top: Math.round(el.getBoundingClientRect().top + window.scrollY),
  })));
  for (const s of sections) {
    await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y - 20), behavior: 'instant' }), s.top);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(outDir, `${name}-section-${s.cls}.png`), fullPage: false });
  }

  // test overlay nav open on every viewport now (dots menu is universal)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const toggle = await page.$('#nav-toggle');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(outDir, `${name}-nav-open.png`), fullPage: false });
  }

  await browser.close();
  return measurements;
}

console.log('▸ desktop (1440×900)…');
const desktop = await run('desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
console.log(JSON.stringify(desktop, null, 2));

console.log('\n▸ iphone 14 (390×844)…');
const phone = await run('iphone14', devices['iPhone 14']);
console.log(JSON.stringify(phone, null, 2));

console.log('\n▸ screenshots saved to:', outDir);
