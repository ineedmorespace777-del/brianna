/* mei skin studio — main.js (redesign port)
   - coming-soon soft gate (password from window.__MEI_PWD, set by Astro from site.json)
   - header scroll state + sticky mobile book bar
   - overlay nav (three-dots)
   - scroll reveals + hero line-mask reveals
   - subtle parallax on image frames
   - magnetic CTAs (pointer devices only)
   - appointment request form (posts to /api/request)
*/
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ─── coming-soon soft gate ─────────────────────────────── */
  const gate = document.getElementById('coming-soon-gate');
  const csForm = document.getElementById('cs-form');
  if (gate && csForm) {
    const input = csForm.querySelector('input');
    const msg = csForm.querySelector('.cs-msg');
    if (!document.documentElement.classList.contains('unlocked')) {
      setTimeout(() => input.focus(), 120);
    }
    csForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim().toLowerCase().replace(/\s+/g, '');
      const expected = (window.__MEI_PWD || 'meiskin').toLowerCase();
      if (val === expected) {
        try { localStorage.setItem('mei-unlocked', 'true'); } catch (_) {}
        msg.hidden = true;
        gate.classList.add('unlocking');
        setTimeout(() => { document.documentElement.classList.add('unlocked'); }, 600);
      } else {
        csForm.classList.add('shake');
        msg.hidden = false;
        msg.textContent = "that's not it. try again?";
        setTimeout(() => csForm.classList.remove('shake'), 450);
        input.value = '';
        input.focus();
      }
    });
  }

  /* year stamp */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* header scroll state + sticky book bar */
  const header = document.getElementById('site-header');
  const bookBar = document.getElementById('book-bar');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (bookBar) bookBar.classList.toggle('show', y > 640);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* overlay nav */
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('overlay-nav');
  const setOpen = (open) => {
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'close menu' : 'open menu');
    document.body.classList.toggle('nav-open', open);
    if (open) { drawer.hidden = false; drawer.classList.add('open'); }
    else {
      drawer.classList.remove('open');
      setTimeout(() => { if (!drawer.classList.contains('open')) drawer.hidden = true; }, 650);
    }
  };
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    drawer.addEventListener('click', (e) => { if (!e.target.closest('a, button')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* scroll reveals + line-mask reveals */
  const revealEls = document.querySelectorAll('.reveal, .line-mask');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
    // Safety net for fast scrollers / headless browsers
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in), .line-mask:not(.in)').forEach(el => el.classList.add('in'));
    }, 6000);
  }
  /* fire the hero immediately so it animates on load */
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .line-mask, .hero .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 80 + i * 90);
    });
  });

  /* subtle parallax on image frames */
  if (!reduce) {
    const parEls = [...document.querySelectorAll('[data-parallax]')];
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const center = r.top + r.height / 2;
        const off = (center - vh / 2) / vh;          // -1 .. 1
        const strength = parseFloat(el.dataset.parallax) || 18;
        const inner = el.querySelector('.frame');
        if (inner) inner.style.transform = `translateY(${(-off * strength).toFixed(1)}px) scale(1.08)`;
      });
      ticking = false;
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  }

  /* magnetic CTAs — pointer devices only */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = 0.32;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* appointment request form → /api/request → email */
  const form = document.getElementById('booking-form');
  if (form) {
    const msg = form.querySelector('.form-msg');
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button ? button.textContent : '';
    const ERROR_TONE = '#b04a4a';

    const say = (text, isError) => {
      msg.hidden = false;
      msg.style.color = isError ? ERROR_TONE : '';
      msg.textContent = text;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const value = (sel) => (form.querySelector(sel).value || '').trim();
      const name = value('#bk-name');
      const email = value('#bk-email');

      if (!name) return say('please add your first name.', true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return say("that email doesn't look right.", true);
      }

      const payload = {
        name,
        email,
        phone: value('#bk-phone'),
        service: value('#bk-service'),
        // timing is a set of tick boxes — send whichever are ticked
        timing: Array.from(form.querySelectorAll('input[name="timing"]:checked'))
          .map(el => el.value)
          .join(', '),
        message: value('#bk-message'),
        company: value('#bk-company'), // honeypot
      };

      if (button) { button.disabled = true; button.textContent = 'sending…'; }
      say('sending your request…', false);

      try {
        const res = await fetch('/api/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'send failed');
        }

        const template =
          form.dataset.success ||
          'thank you, {name} — your request is in. we will reply to {email} shortly.';
        say(
          template.replace('{name}', name.toLowerCase()).replace('{email}', email),
          false
        );
        form.reset();
      } catch (err) {
        const fallback =
          form.dataset.error ||
          'something went wrong sending that. please email us directly.';
        say(err && err.message && err.message !== 'send failed' ? err.message : fallback, true);
      } finally {
        if (button) { button.disabled = false; button.textContent = buttonLabel; }
      }
    });
  }

  /* smooth scroll to top for #/#top */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });
})();
