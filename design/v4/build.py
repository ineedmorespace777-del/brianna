"""Build the v4 design preview.

    python design/v4/build.py                  # -> public/mockup/index.html
    python design/v4/build.py --artifact X     # also write an Artifact fragment to X

Needs Python 3 + Pillow. Photos are read from public/uploads, cropped and
compressed, then inlined as data URIs so the preview is one self-contained
file. The copy is hard-coded in template.html (a snapshot of site.json),
so re-sync it by hand if Brianna's Tina edits need to show here.

The /mockup page gets a password gate. It is a soft lock only: it keeps casual
visitors and search engines out, but the content is in the page source.
"""
import base64
import io
import pathlib
import re
import sys

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
UP = ROOT / 'public' / 'uploads'
OUT = ROOT / 'public' / 'mockup' / 'index.html'
PASSWORD = 'meiskin'


def load(name):
    im = Image.open(UP / name)
    im.draft('RGB', (2400, 2400))
    return ImageOps.exif_transpose(im).convert('RGB')


def ratio(im, r, cx=0.5, cy=0.5):
    w, h = im.size
    if w / h > r:
        nw = int(h * r)
        x = int(min(max(cx * w - nw / 2, 0), w - nw))
        return im.crop((x, 0, x + nw, h))
    nh = int(w / r)
    y = int(min(max(cy * h - nh / 2, 0), h - nh))
    return im.crop((0, y, w, y + nh))


def trim(im, top, bottom):
    w, h = im.size
    return im.crop((0, int(h * top), w, int(h * bottom)))


def webp(im, width, q=78):
    im = im.copy()
    im.thumbnail((width, width * 3))
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def logo():
    im = Image.open(ROOT / 'public' / 'assets' / 'mei-logo.png').convert('RGBA')
    im = im.crop(im.getbbox())
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


IMAGES = {
    'hero': lambda: webp(trim(load('20251013-DSC_8810.JPG'), 0.06, 0.94), 1300, 80),
    'roombw': lambda: webp(load('Copy-of-Black-and-White-Minimalist-Summer-Quotes-Instagram-Post-(1).png'), 1000),
    'bowl': lambda: webp(load('3860x.webp'), 900),
    'glow': lambda: webp(ratio(load('Mei-Skin-Light.JPG'), 4 / 5, 0.52), 520),
    'reset': lambda: webp(ratio(load('20251013-DSC_9110.JPG'), 4 / 5, 0.5, 0.55), 520),
    'cica': lambda: webp(load('edited.png'), 520),
    'portrait': lambda: webp(ratio(load('DSC08505.jpg'), 4 / 5, 0.5, 0.0), 1000),
    'shelves': lambda: webp(ratio(load('Screenshot-2026-07-31-at-2.13.10-PM.png'), 4 / 5), 800),
    'logo': logo,
}


def entities(text):
    return ''.join(c if ord(c) < 128 else '&#x%X;' % ord(c) for c in text)


def encode(page):
    # Non-ASCII outside <script> becomes HTML entities; scripts must stay ASCII.
    head, _, rest = page.partition('<script>')
    js, _, tail = rest.partition('</script>')
    assert all(ord(c) < 128 for c in js), 'non-ASCII inside <script>'
    return entities(head) + '<script>' + js + '</script>' + entities(tail)


GATE_CSS = """
<style>
html:not(.unlocked) body > :not(.gate){display:none!important}
html.unlocked .gate{display:none}
.gate{min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding-inline:20px;background:var(--paper)}
.gate form{width:min(360px,100%);display:grid;gap:14px;text-align:center}
.gate img{width:150px;height:auto;margin:0 auto 18px}
.gate p{font-size:15px;color:var(--ink-2)}
.gate input{font:inherit;font-size:17px;text-align:center;color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--ink-3);border-radius:0;padding:10px 0;margin-top:10px}
.gate input:focus{outline:none;border-bottom-color:var(--ox)}
.gate .btn{justify-content:center;margin-top:8px}
.gate .err{color:var(--ox);font-size:14px}
</style>
"""

GATE_HTML = """
<div class="gate">
  <form id="gate-form" autocomplete="off">
    <img src="{logo}" alt="mei skin" width="976" height="481">
    <p>A design preview of the new website. Enter the password to view it.</p>
    <label class="vh" for="gate-pw">Password</label>
    <input id="gate-pw" type="password" placeholder="Password" autofocus>
    <button class="btn" type="submit">View the preview</button>
    <p class="err" id="gate-err" hidden>That password doesn't match. Try again.</p>
  </form>
</div>
<script>
(function () {
  var f = document.getElementById('gate-form');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (document.getElementById('gate-pw').value.trim().toLowerCase() === '%s') {
      try { localStorage.setItem('mei-mockup', 'ok'); } catch (err) {}
      document.documentElement.classList.add('unlocked');
      window.scrollTo(0, 0);
    } else {
      document.getElementById('gate-err').hidden = false;
    }
  });
})();
</script>
""" % PASSWORD


def main():
    page = (HERE / 'template.html').read_text(encoding='utf-8')
    for key, make in IMAGES.items():
        token = '{{IMG_' + key + '}}'
        if token in page:
            page = page.replace(token, make())
    left = re.findall(r'\{\{IMG_\w+\}\}', page)
    assert not left, left

    if '--artifact' in sys.argv:
        dest = pathlib.Path(sys.argv[sys.argv.index('--artifact') + 1])
        dest.write_text(encode(page), encoding='ascii')
        print('artifact ->', dest)

    # Full document for the site: template's <title>/<meta>/<style> go in <head>.
    head, sep, body = page.partition('</style>')
    logo_uri = IMAGES['logo']()
    site = (
        '<!doctype html>\n<html lang="en">\n<head>\n'
        '<meta name="robots" content="noindex, nofollow">\n'
        '<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">\n'
        "<script>try{if(localStorage.getItem('mei-mockup')==='ok')document.documentElement.classList.add('unlocked')}catch(e){}</script>\n"
        + head + sep + GATE_CSS + '</head>\n<body>\n'
        + GATE_HTML.replace('{logo}', logo_uri)
        + body + '\n</body>\n</html>\n'
    )
    # encode() only guards the first <script>; check every one before entity-encoding.
    for js in re.findall(r'<script>(.*?)</script>', site, re.S):
        assert all(ord(c) < 128 for c in js), 'non-ASCII inside <script>'
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(entities(site), encoding='ascii')
    print('site ->', OUT.relative_to(ROOT), OUT.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
