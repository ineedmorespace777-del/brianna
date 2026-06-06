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
    return sendErrorPage(
      res,
      'Server is not configured for GitHub OAuth.',
      'GITHUB_CLIENT_ID environment variable is missing on Vercel.\n\nAdd it via:  vercel env add GITHUB_CLIENT_ID\n\nThen redeploy.'
    );
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
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// Sends an HTML page that BOTH shows the error in the popup AND postMessages
// it to the opener (Decap CMS), so the main window shows a usable error too.
function sendErrorPage(res, headline, detail) {
  const message = `authorization:github:error:${JSON.stringify({ message: headline, detail })}`;
  const safeMessage = message
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/<\/script>/gi, '<\\/script>');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(headline)}</title>
  <style>
    body { background:#f5f0e8; color:#2d2622; font-family:system-ui,sans-serif;
           display:grid; place-items:center; min-height:100vh; margin:0; padding:24px; }
    .box { max-width: 520px; text-align:center; }
    h1 { font-weight:300; font-size:22px; margin:0 0 12px; color:#2d2622; }
    pre { background:#ebe3d6; padding:16px; border-radius:6px; text-align:left;
          white-space:pre-wrap; font-size:13px; color:#5a4f47; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${escapeHtml(headline)}</h1>
    <pre>${escapeHtml(detail)}</pre>
  </div>
  <script>
    (function() {
      var msg = ${JSON.stringify(safeMessage)};
      if (window.opener) {
        try { window.opener.postMessage('authorizing:github', '*'); } catch (_) {}
        setTimeout(function() {
          try { window.opener.postMessage(msg, '*'); } catch (_) {}
        }, 300);
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(html);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
