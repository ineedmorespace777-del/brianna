/* halo wellness — main.js
   small interactions:
   - scroll state on the header
   - mobile nav drawer
   - intersection-observer scroll reveals
   - newsletter form (client-side validation only — wire to supabase later)
*/

(() => {
  'use strict';

  /* mark js available so reveal styles activate (no-js users see all content) */
  document.documentElement.classList.add('js');

  /* year stamp in the footer */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* header gets a hairline divider after scrolling past the hero crest */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile nav drawer */
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('mobile-nav');

  const setOpen = (open) => {
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'close menu' : 'open menu');
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add('open'));
      document.body.classList.add('nav-open');
    } else {
      drawer.classList.remove('open');
      document.body.classList.remove('nav-open');
      // delay hidden until transition finishes so it's animatable
      setTimeout(() => { if (!drawer.classList.contains('open')) drawer.hidden = true; }, 500);
    }
  };

  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });
    // close when a link is clicked
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });
    // close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* mark the hero in-view immediately so its image animates in */
  const hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(() => hero.classList.add('in-view'));

  /* scroll reveals */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 10% 0px' });
    reveals.forEach(el => io.observe(el));

    /* safety net — anything still hidden after 6s gets shown
       (covers fast scrollers, headless browsers, broken IO) */
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
    }, 6000);
  }

  /* newsletter form — client-side only, swap submission target later */
  const form = document.getElementById('newsletter-form');
  if (form) {
    const msg = form.querySelector('.form-msg');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#nl-name').value.trim();
      const email = form.querySelector('#nl-email').value.trim();
      const loc = form.querySelector('input[name="loc"]:checked')?.value;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk) {
        msg.hidden = false;
        msg.style.color = '#e6a37a';
        msg.textContent = !name ? 'please add your first name.' : 'that email doesn\'t look right.';
        return;
      }

      msg.hidden = false;
      msg.style.color = '';
      const lookup = { studio: 'studio visits', bridal: 'bridal & editorial', both: 'studio + bridal' };
      msg.textContent = `thanks, ${name.toLowerCase()}. we'll write when there's news on ${lookup[loc] || 'mei skin'}.`;
      form.reset();
    });
  }

  /* smooth scroll already handled by css `scroll-behavior`; intercept only to close drawer */
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
