/* DC Agent Kit landing: vanilla JS, no dependencies.
   Config comes from data attributes on <html>: data-deadline, data-price, data-price-later, data-checkout. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- config: prices, checkout, deadline ---------- */
  // The static HTML shows the regular price and keeps every early-price piece
  // `hidden` (data-early). Early wording is revealed here only while a valid early
  // price, a valid regular price and a future deadline all exist; anything missing or
  // invalid leaves the static regular-price text in place.
  const num = s => {
    if (s == null || String(s).trim() === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  };
  const early = num(root.dataset.price);
  const later = num(root.dataset.priceLater);
  const checkout = (root.dataset.checkout || '#price').trim() || '#price';
  const deadline = new Date(root.dataset.deadline || '').getTime();
  const hasDeadline = Number.isFinite(deadline);
  const pricesOk = Number.isFinite(early) && Number.isFinite(later);
  const money = n => `$${n}`;
  let earlyActive = pricesOk && hasDeadline && Date.now() < deadline;

  const bindings = () => {
    const v = {};
    if (Number.isFinite(later)) { v['price'] = money(later); v['price-later'] = money(later); }
    if (earlyActive) { v['price'] = money(early); v['save'] = money(Math.max(0, later - early)); }
    return v;
  };
  const badge = $('#float-badge');
  const ticker = $('.ticker');
  function applyAll() {
    const values = bindings();
    $$('[data-bind]').forEach(el => {
      const v = values[el.dataset.bind];
      if (v !== undefined) el.textContent = v;
    });
    $$('[data-early]').forEach(el => { el.hidden = !earlyActive; });
    $$('[data-late]').forEach(el => { el.hidden = earlyActive; });
    // Accessible names come from the same data, in every state.
    if (badge && values.price) badge.setAttribute('aria-label', `Get the kit, ${earlyActive ? 'early price ' : ''}${values.price}`);
    if (ticker) {
      if (earlyActive) {
        const ends = new Date(deadline).toLocaleDateString('en', { month: 'long', day: 'numeric' });
        ticker.setAttribute('aria-label', `Early price ${values.price}: save ${values.save} today, then ${values['price-later']}. Ends ${ends}.`);
      } else ticker.removeAttribute('aria-label');
    }
  }
  function applyCheckout() {
    $$('a[data-cta]').forEach(a => {
      a.setAttribute('href', checkout);
      if (/^https?:/i.test(checkout)) a.setAttribute('rel', 'noopener');
    });
  }

  /* ---------- countdown ---------- */
  // Visible timers never sit in a live region. One polite, hourly message is the
  // only thing a screen reader announces (never one per second).
  const status = $('#deadline-status');
  let lastHourSaid = -1;
  let interval;
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    if (!earlyActive) return;
    const left = deadline - Date.now();
    if (left <= 0) {
      earlyActive = false;
      clearInterval(interval);
      applyAll();
      if (status) status.textContent = Number.isFinite(later) ? `The price is now ${money(later)}.` : '';
      return;
    }
    const s = Math.floor(left / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const text = `${d}d ${h}h ${pad(m)}m ${pad(sec)}s`;
    $$('[data-countdown]').forEach(el => { el.textContent = text; });
    const parts = { d: String(d), h: pad(h), m: pad(m), s: pad(sec) };
    $$('[data-cd]').forEach(el => { el.textContent = parts[el.dataset.cd]; });
    const hourKey = Math.floor(s / 3600);
    if (status && hourKey !== lastHourSaid) {
      lastHourSaid = hourKey;
      status.textContent = `Early price ends in ${d} days and ${h} hours.`;
    }
  }
  applyAll();
  applyCheckout();
  tick();
  if (earlyActive) interval = setInterval(tick, 1000);

  /* ---------- reduced motion is live: every effect follows the setting while the page is open ---------- */
  const motionHooks = [];
  reduced.addEventListener('change', () => motionHooks.forEach(fn => fn(reduced.matches)));

  /* ---------- hero prompt typing ---------- */
  const typed = $('#typed');
  const prompts = [
    'build me a landing page for my newsletter',
    'review this repo and fix what is weak',
    'turn my notes into a weekly report',
  ];
  if (typed) {
    let i = 0, n = 0, dir = 1, timer, running = false;
    const step = () => {
      if (!running) return;
      const full = prompts[i];
      n += dir;
      typed.textContent = full.slice(0, n);
      let wait = dir === 1 ? 55 + Math.random() * 45 : 22;
      if (dir === 1 && n === full.length) { dir = -1; wait = 2200; }
      else if (dir === -1 && n === 0) { dir = 1; i = (i + 1) % prompts.length; wait = 400; }
      timer = setTimeout(step, wait);
    };
    const start = () => {
      if (running) return;
      running = true; i = 0; n = 0; dir = 1;
      typed.textContent = '';
      timer = setTimeout(step, 600);
    };
    const stop = () => { running = false; clearTimeout(timer); typed.textContent = prompts[0]; };
    document.addEventListener('visibilitychange', () => {
      if (!running) return;
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(step, 300);
    });
    motionHooks.push(isReduced => (isReduced ? stop() : start()));
    if (!reduced.matches) start();
  }

  /* ---------- ticker pause control (WCAG 2.2.2) ---------- */
  const tickerBtn = $('#ticker-ctl');
  if (ticker && tickerBtn) {
    tickerBtn.addEventListener('click', () => {
      const paused = ticker.classList.toggle('paused');
      tickerBtn.textContent = paused ? 'Play ticker' : 'Pause ticker';
    });
  }

  /* ---------- hero video: plays only in view, never under reduced motion (WCAG 2.2.2 toggle) ---------- */
  const heroVideo = $('#hero-video');
  const videoBtn = $('#hero-video-ctl');
  if (heroVideo && videoBtn && 'IntersectionObserver' in window) {
    let inView = false, userPaused = false;
    const label = $('.vc-txt', videoBtn), icon = $('.vc-ico', videoBtn);
    const sync = () => {
      const want = inView && !userPaused && !reduced.matches && !document.hidden;
      if (want) { const p = heroVideo.play(); if (p) p.catch(() => {}); }
      else if (!heroVideo.paused) heroVideo.pause();
      if (reduced.matches && heroVideo.currentTime > 0) heroVideo.currentTime = 0;
    };
    const paintBtn = () => {
      videoBtn.hidden = reduced.matches;
      label.textContent = userPaused ? 'Play' : 'Pause';
      icon.textContent = userPaused ? '\u25B6' : '\u275A\u275A';
    };
    videoBtn.addEventListener('click', () => { userPaused = !userPaused; paintBtn(); sync(); });
    new IntersectionObserver(entries => {
      inView = entries[entries.length - 1].isIntersecting;
      sync();
    }, { threshold: 0.25 }).observe(heroVideo);
    document.addEventListener('visibilitychange', sync);
    motionHooks.push(() => { paintBtn(); sync(); });
    paintBtn();
  }

  /* ---------- steps tick when the terminal scrolls into view ---------- */
  const steps = $$('.step');
  const terminal = $('#terminal');
  if (steps.length && terminal) {
    let stepIO, stepTimers = [];
    const tickAll = () => { stepTimers.forEach(clearTimeout); stepTimers = []; steps.forEach(s => s.classList.add('done')); };
    if (reduced.matches || !('IntersectionObserver' in window)) tickAll();
    else {
      stepIO = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        stepIO.disconnect();
        steps.forEach((s, k) => stepTimers.push(setTimeout(() => s.classList.add('done'), 450 + k * 520)));
      }, { threshold: 0.35 });
      stepIO.observe(terminal);
    }
    motionHooks.push(isReduced => { if (isReduced) { if (stepIO) stepIO.disconnect(); tickAll(); } });
  }

  /* ---------- ring gauge fills when visible ---------- */
  const ring = $('.ring');
  if (ring) {
    let ringIO;
    if (reduced.matches || !('IntersectionObserver' in window)) ring.classList.add('is-in');
    else {
      ringIO = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) { ring.classList.add('is-in'); ringIO.disconnect(); }
      }, { threshold: 0.5 });
      ringIO.observe(ring);
    }
    motionHooks.push(isReduced => { if (isReduced) { if (ringIO) ringIO.disconnect(); ring.classList.add('is-in'); } });
  }

  /* ---------- selectable style cards (toggle buttons) ---------- */
  const cards = $$('.style-card');
  const previewTitle = $('#preview-title');
  function selectStyle(name) {
    cards.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.style === name)));
    $$('[data-style-desc]').forEach(el => { el.hidden = el.dataset.styleDesc !== name; });
    $$('[data-style-preview]').forEach(el => { el.hidden = el.dataset.stylePreview !== name; });
    if (previewTitle) previewTitle.textContent = `style · ${name}`;
  }
  cards.forEach(c => c.addEventListener('click', () => selectStyle(c.dataset.style)));

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    let revealIO;
    const showAll = () => reveals.forEach(el => el.classList.add('in'));
    if (reduced.matches || !('IntersectionObserver' in window)) showAll();
    else {
      revealIO = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
      reveals.forEach(el => revealIO.observe(el));
    }
    motionHooks.push(isReduced => { if (isReduced) { if (revealIO) revealIO.disconnect(); showAll(); } });
  }

  /* ---------- floating badge shows once the hero has scrolled away ---------- */
  const hero = $('#top');
  if (badge && hero) {
    if (!('IntersectionObserver' in window)) badge.classList.add('show');
    else {
      new IntersectionObserver(entries => {
        entries.forEach(e => badge.classList.toggle('show', !e.isIntersecting));
      }, { threshold: 0 }).observe(hero);
    }
  }
})();
