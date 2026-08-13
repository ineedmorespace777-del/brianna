// tools/optimize-images.mjs
//
// Runs AFTER `astro build`, against dist/ only. Source files in public/uploads
// are never touched, so Tina's media library keeps working exactly as before.
//
// Why this exists: Tina writes uploads to the repo untouched. A photo dragged
// straight off a camera lands as a 15–20 MB JPEG and gets served to visitors
// as-is. That happened three times in a week, each time silently. Relying on
// whoever uploads to remember to resize first doesn't hold, so it happens here
// where it can't be forgotten.
//
// Two passes:
//   1. Images referenced by the built HTML  -> WebP, and rewrite the references.
//      This is what actually affects page speed.
//   2. Everything else in dist/uploads      -> re-encoded in place, same path
//      and format. Shrinks the deploy without changing any URL, so media-library
//      thumbnails in /admin/ don't break.
//
// Deliberately never throws. A failure here degrades to "images are big",
// which is far better than a failed deploy.

import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const UPLOADS = path.join(DIST, 'uploads');
const MAX_DIM = 1800;      // longest edge; hero slot is ~700px, 2x for retina
const QUALITY = 82;
const SKIP_UNDER = 150 * 1024;  // already lean enough to leave alone
const RASTER = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const kb = (n) => `${Math.round(n / 1024)} KB`;

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

async function main() {
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    console.warn('  [images] sharp unavailable — skipping optimisation');
    return;
  }
  // libvips caches open file descriptors, which on Windows leaves handles on
  // the source files and makes a later open/overwrite fail with "UNKNOWN".
  // Everything here is a one-shot read, so the cache buys nothing anyway.
  sharp.cache(false);

  const all = await walk(DIST);
  const htmlFiles = all.filter((f) => f.endsWith('.html'));
  if (!htmlFiles.length) return;

  // ---- which uploads does the built site actually reference? ----
  const htmlSources = new Map();
  for (const f of htmlFiles) htmlSources.set(f, await readFile(f, 'utf8'));

  const referenced = new Set();
  for (const html of htmlSources.values()) {
    for (const m of html.matchAll(/\/uploads\/[^"'\s)>]+/g)) {
      referenced.add(decodeURIComponent(m[0]));
    }
  }

  let savedBytes = 0;
  const rewrites = new Map();

  // ---- pass 1: referenced images -> webp + rewrite refs ----
  for (const ref of referenced) {
    const src = path.join(DIST, ref.replace(/^\//, ''));
    if (!RASTER.test(src)) continue;

    let before;
    try { before = (await stat(src)).size; } catch { continue; }
    if (before < SKIP_UNDER) continue;

    const outRel = ref.replace(/\.[^.]+$/, '') + '.opt.webp';
    const out = path.join(DIST, outRel.replace(/^\//, ''));

    try {
      // read to a buffer first so sharp never holds the path open
      const input = await readFile(src);
      const encoded = await sharp(input)
        .rotate()                                   // honour EXIF orientation
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toBuffer();
      await writeFile(out, encoded);

      const after = encoded.length;
      if (after >= before) { await unlink(out).catch(() => {}); continue; }

      rewrites.set(ref, outRel);
      savedBytes += before - after;
      console.log(`  [images] ${kb(before).padStart(8)} -> ${kb(after).padStart(7)}  ${path.basename(ref)}`);
      await unlink(src).catch(() => {});           // original is now unreferenced
    } catch (err) {
      console.warn(`  [images] skipped ${path.basename(ref)}: ${err.message}`);
    }
  }

  // ---- rewrite references in the HTML ----
  if (rewrites.size) {
    for (const [file, html] of htmlSources) {
      let next = html;
      for (const [from, to] of rewrites) {
        next = next.split(from).join(to);
        next = next.split(encodeURI(from)).join(encodeURI(to));
      }
      if (next !== html) await writeFile(file, next, 'utf8');
    }
  }

  // ---- pass 2: unreferenced uploads, shrunk in place (URLs unchanged) ----
  for (const f of await walk(UPLOADS)) {
    const rel = '/' + path.relative(DIST, f).split(path.sep).join('/');
    if (rewrites.has(rel) || referenced.has(rel)) continue;
    if (!RASTER.test(f)) continue;

    let before;
    try { before = (await stat(f)).size; } catch { continue; }
    if (before < 400 * 1024) continue;

    try {
      const ext = path.extname(f).toLowerCase();
      const input = await readFile(f);
      let pipe = sharp(input).rotate()
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
      if (ext === '.png') pipe = pipe.png({ compressionLevel: 9, palette: true });
      else if (ext === '.webp') pipe = pipe.webp({ quality: QUALITY });
      else pipe = pipe.jpeg({ quality: QUALITY, mozjpeg: true });

      const buf = await pipe.toBuffer();
      if (buf.length < before) {
        await writeFile(f, buf);
        savedBytes += before - buf.length;
        console.log(`  [images] ${kb(before).padStart(8)} -> ${kb(buf.length).padStart(7)}  ${path.basename(f)} (unused)`);
      }
    } catch (err) {
      console.warn(`  [images] could not shrink ${path.basename(f)}: ${err.message}`);
    }
  }

  console.log(savedBytes > 0
    ? `  [images] total saved: ${(savedBytes / 1048576).toFixed(2)} MB`
    : '  [images] nothing to optimise');
}

main().catch((err) => {
  console.warn('  [images] optimisation skipped:', err?.message ?? err);
});
