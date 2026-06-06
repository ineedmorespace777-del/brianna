// GitHub OAuth proxy for Decap CMS — step 1: redirect to GitHub.
//
// Decap opens a popup pointing here. We redirect to GitHub's authorize URL.
// After the user accepts, GitHub redirects to /api/callback with a code,
// which the callback exchanges for an access_token and posts back to Decap.
//
// Required Vercel env vars:
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET   (used in callback only)
//   OAUTH_REDIRECT_URI     (optional — defaults to https://<host>/api/callback)

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GITHUB_CLIENT_ID env var is not set on Vercel.');
    return;
  }

  // Build callback URL based on the actual request host (works for previews + prod)
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || `${proto}://${host}/api/callback`;

  // CSRF-style state token, validated in the callback
  const state = cryptoRandom(24);

  // 5-minute expiry, scoped to /api so cookies don't leak elsewhere
  res.setHeader('Set-Cookie', [
    `oauth_state=${state}; Path=/api; Max-Age=300; HttpOnly; Secure; SameSite=Lax`,
  ]);

  const url =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('repo,user')}` +
    `&state=${encodeURIComponent(state)}`;

  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}

function cryptoRandom(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // Vercel runtime has globalThis.crypto.getRandomValues
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}
