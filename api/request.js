// api/request.js
//
// Appointment request form → email, via Resend.
//
// This is a Vercel serverless function living at the project root, which
// works alongside the static Astro build (same pattern the old Decap OAuth
// proxy used). The site itself stays fully static; only this endpoint runs
// server-side, so the API key is never exposed to the browser.
//
// Required env vars on Vercel:
//   RESEND_API_KEY  — from resend.com/api-keys
//   RESEND_FROM     — sender, e.g. "mei skin <hello@meiskinstudio.co>".
//                     Must be a domain verified in Resend. Until the domain
//                     is verified, Resend's shared "onboarding@resend.dev"
//                     works for testing.
//   CONTACT_TO      — where requests land. Defaults to contact@meiskinstudio.co
//
// Deliberately does NOT ask for health information. Skin history, medications
// and pregnancy are gone through in person at the first visit — collecting
// them through a web form would put sensitive health data in an inbox for no
// good reason.

const LIMITS = {
  name: 100,
  email: 200,
  phone: 40,
  service: 140,
  timing: 200,
  message: 2000,
};

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // honeypot — a hidden field no human ever fills in. bots do.
  // return 200 so they don't learn they were caught.
  if (clean(body.company, 100)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const phone = clean(body.phone, LIMITS.phone);
  const service = clean(body.service, LIMITS.service);
  const timing = clean(body.timing, LIMITS.timing);
  const message = clean(body.message, LIMITS.message);

  if (!name || !isEmail(email)) {
    return res.status(400).json({
      ok: false,
      error: 'please add your name and a valid email so we can reply.',
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[request] RESEND_API_KEY is not set — see SETUP.md');
    return res.status(500).json({
      ok: false,
      error: "the form isn't finished being set up. please email us directly for now.",
    });
  }

  const to = process.env.CONTACT_TO || 'contact@meiskinstudio.co';
  const from = process.env.RESEND_FROM || 'mei skin studio <onboarding@resend.dev>';

  const fields = [
    ['name', name],
    ['email', email],
    ['phone', phone],
    ['service', service],
    ['preferred timing', timing],
  ].filter(([, value]) => value);

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2a2320;line-height:1.6;">
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8d8177;margin:0 0 18px;">
        appointment request · meiskinstudio.co
      </p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
        ${fields
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:6px 20px 6px 0;color:#8d8177;font-size:13px;vertical-align:top;white-space:nowrap;">${esc(label)}</td>
            <td style="padding:6px 0;font-size:15px;">${esc(value)}</td>
          </tr>`
          )
          .join('')}
      </table>
      ${
        message
          ? `<p style="color:#8d8177;font-size:13px;margin:0 0 6px;">message</p>
             <div style="background:#f7f2ea;border-left:2px solid #7a8a6e;padding:14px 16px;font-size:15px;white-space:pre-wrap;">${esc(message)}</div>`
          : ''
      }
      <p style="margin-top:24px;font-size:13px;color:#8d8177;">
        Reply straight to this email to reach ${esc(name)}.
      </p>
    </div>
  `;

  const text = [
    'appointment request — meiskinstudio.co',
    '',
    ...fields.map(([label, value]) => `${label}: ${value}`),
    message ? `\nmessage:\n${message}` : '',
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `appointment request — ${name}`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[request] resend rejected:', response.status, detail);
      return res.status(502).json({
        ok: false,
        error: "we couldn't send that just now. please email us directly.",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[request] send failed:', err);
    return res.status(502).json({
      ok: false,
      error: "we couldn't send that just now. please email us directly.",
    });
  }
}
