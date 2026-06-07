/* mei skin studio — main.js (redesign port)
   - coming-soon soft gate (password from window.__MEI_PWD, set by Astro from site.json)
   - header scroll state + sticky mobile book bar
   - overlay nav (three-dots)
   - scroll reveals + hero line-mask reveals
   - subtle parallax on image frames
   - magnetic CTAs (pointer devices only)
   - newsletter form validation
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

  /* newsletter form */
  const form = document.getElementById('newsletter-form');
  if (form) {
    const msg = form.querySelector('.form-msg');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#nl-name').value.trim();
      const email = form.querySelector('#nl-email').value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailOk) {
        msg.hidden = false;
        msg.style.color = '#c08968';
        msg.textContent = !name ? 'please add your first name.' : "that email doesn't look right.";
        return;
      }
      msg.hidden = false;
      msg.style.color = '';
      msg.textContent = `thanks, ${name.toLowerCase()}. we'll write when there's news from the studio.`;
      form.reset();
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
