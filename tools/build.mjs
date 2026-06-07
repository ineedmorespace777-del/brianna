// tools/build.mjs
//
// Cross-platform production build script. Runs Tina + Astro on Vercel and
// locally without caring about shell or env-var quirks.
//
// Decision logic:
//   - If PUBLIC_TINA_CLIENT_ID + TINA_TOKEN are set in env → run Tina build
//     (admin UI generates to public/admin/, validated against Tina Cloud).
//   - Otherwise → skip the Tina step with a warning. The Astro site still
//     deploys; /admin/ just won't exist until the env vars are added.
//
// This lets us push the migration and keep Vercel deploys green while
// Brianna sets up her Tina Cloud project at her own pace.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const has = (k) => typeof process.env[k] === 'string' && process.env[k].length > 0;

function run(line) {
  console.log(`\x1b[2m→ ${line}\x1b[0m`);
  const r = spawnSync(line, { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\x1b[31m✗ failed: ${line}\x1b[0m`);
    process.exit(r.status || 1);
  }
}

const tinaOk = has('PUBLIC_TINA_CLIENT_ID') && has('TINA_TOKEN');

if (tinaOk) {
  console.log('\x1b[32m✓ Tina Cloud creds present — building admin\x1b[0m');
  run('npx tinacms build --content=local');
} else {
  console.warn('\x1b[33m⚠ PUBLIC_TINA_CLIENT_ID or TINA_TOKEN missing — skipping admin build\x1b[0m');
  console.warn('  Set both in Vercel project Settings → Environment Variables to enable /admin/');
  console.warn('  See SETUP.md for the walkthrough.');
}

run('npx astro build');

// Sanity: warn (don't fail) if admin folder is missing post-build
if (!existsSync('dist/admin/index.html')) {
  console.log('\x1b[2m  (no /admin/ in output — expected if Tina creds not set)\x1b[0m');
}
