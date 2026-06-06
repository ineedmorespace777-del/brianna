// GitHub OAuth callback — step 2: exchange code for access_token, hand back to Decap.
//
// GitHub redirects here with ?code=...&state=... after the user accepts.
// We validate the state cookie, POST the code to GitHub for a token, then
// render a tiny HTML page that postMessages the token back to the parent
// window (the Decap CMS popup opener).

export default async function handler(req, res) {
  const { code, state, error, error_description } = req.query || {};

  if (error) {
    return sendResult(res, 'error', `${error}: ${error_description || 'unknown'}`);
  }
  if (!code) {
    return sendResult(res, 'error', 'missing authorization code');
  }

  // Validate state cookie set by /api/auth
  const cookies = parseCookies(req.headers.cookie || '');
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return sendResult(res, 'error', 'invalid oauth state');
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return sendResult(res, 'error', 'server is missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
  }

  let tokenJson;
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'mei-skin-decap-proxy',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    tokenJson = await tokenResponse.json();
  } catch (e) {
    return sendResult(res, 'error', `token exchange failed: ${e.message}`);
  }

  if (tokenJson.error || !tokenJson.access_token) {
    return sendResult(res, 'error', tokenJson.error_description || tokenJson.error || 'no access_token in response');
  }

  // Clear the state cookie
  res.setHeader('Set-Cookie', [
    'oauth_state=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
  ]);

  return sendResult(res, 'success', { token: tokenJson.access_token, provider: 'github' });
}

function parseCookies(header) {
  const out = {};
  header.split(/;\s*/).forEach(p => {
    if (!p) return;
    const idx = p.indexOf('=');
    if (idx === -1) return;
    out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1));
  });
  return out;
}

// Decap CMS expects a postMessage with this exact shape:
//   authorization:<provider>:<status>:<payload>
function sendResult(res, status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  // Escape any backslashes / quotes / scripty bits for safe embedding
  const safeMessage = message
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/<\/script>/gi, '<\\/script>');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>signing you in…</title>
  <style>
    body { background: #f5f0e8; color: #2d2622; font-family: system-ui, sans-serif;
           display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; padding: 24px; }
    h1 { font-weight: 300; font-size: 22px; margin: 0 0 8px; }
    p { color: #5a4f47; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>signing you in…</h1>
    <p>this window should close automatically.</p>
  </div>
  <script>
    (function() {
      var msg = ${JSON.stringify(safeMessage)};
      function handshake(e) {
        if (e && e.data === 'authorizing:github' && window.opener) {
          window.opener.postMessage(msg, e.origin);
          window.removeEventListener('message', handshake);
        }
      }
      window.addEventListener('message', handshake);
      if (window.opener) {
        window.opener.postMessage('authorizing:github', '*');
        // fallback if Decap missed the listener: send the message and close after a tick
        setTimeout(function() {
          try { window.opener.postMessage(msg, '*'); } catch (_) {}
          setTimeout(function() { window.close(); }, 800);
        }, 1500);
      } else {
        document.body.innerHTML = '<div class="box"><h1>missing parent window</h1><p>this page should have been opened by the cms.</p></div>';
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
