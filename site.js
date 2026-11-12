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
  const early = Number(root.dataset.price);
  const later = Number(root.dataset.priceLater);
  const checkout = (root.dataset.checkout || '#price').trim() || '#price';
  const deadline = new Date(root.dataset.deadline).getTime();
  const hasDeadline = Number.isFinite(deadline);
  const money = n => `$${n}`;
  let expired = hasDeadline && Date.now() >= deadline;

  const bindings = () => ({
    'price': money(expired ? later : early),
    'price-later': money(later),
    'save': money(Math.max(0, later - early)),
  });
  function applyBindings() {
    const values = bindings();
    $$('[data-bind]').forEach(el => {
      const v = values[el.dataset.bind];
      if (v !== undefined) el.textContent = v;
    });
  }
  function applyCheckout() {
    $$('a[data-cta]').forEach(a => {
      a.setAttribute('href', checkout);
      if (/^https?:/i.test(checkout)) a.setAttribute('rel', 'noopener');
    });
  }
  function applyExpiry() {
    $$('[data-early]').forEach(el => { el.hidden = expired; });
    $$('[data-late]').forEach(el => { el.hidden = !expired; });
  }

  /* ---------- countdown ---------- */
  // Visible timers never sit in a live region. One polite, hourly message is the
  // only thing a screen reader announces (never one per second).
  const status = $('#deadline-status');
  let lastHourSaid = -1;
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    if (!hasDeadline) return;
    const left = deadline - Date.now();
    if (left <= 0) {
      if (!expired) { expired = true; applyBindings(); applyExpiry(); }
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
  applyBindings();
  applyCheckout();
  applyExpiry();
  tick();
  if (hasDeadline && !expired) setInterval(tick, 1000);

  /* ---------- hero prompt typing ---------- */
  const typed = $('#typed');
  const prompts = [
    'build me a landing page for my newsletter',
    'review this repo and fix what is weak',
    'turn my notes into a weekly report',
  ];
  if (typed && !reduced.matches) {
    let i = 0, n = 0, dir = 1, timer;
    const step = () => {
      const full = prompts[i];
      n += dir;
      typed.textContent = full.slice(0, n);
      let wait = dir === 1 ? 55 + Math.random() * 45 : 22;
      if (dir === 1 && n === full.length) { dir = -1; wait = 2200; }
      else if (dir === -1 && n === 0) { dir = 1; i = (i + 1) % prompts.length; wait = 400; }
      timer = setTimeout(step, wait);
    };
    typed.textContent = '';
    timer = setTimeout(step, 600);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(timer); else { clearTimeout(timer); timer = setTimeout(step, 300); }
    });
  }

  /* ---------- ticker pause control (WCAG 2.2.2) ---------- */
  const ticker = $('.ticker');
  const tickerBtn = $('#ticker-ctl');
  if (ticker && tickerBtn) {
    tickerBtn.addEventListener('click', () => {
      const paused = ticker.classList.toggle('paused');
      tickerBtn.textContent = paused ? 'Play ticker' : 'Pause ticker';
    });
  }

  /* ---------- steps tick when the terminal scrolls into view ---------- */
  const steps = $$('.step');
  const terminal = $('#terminal');
  const tickAll = () => steps.forEach(s => s.classList.add('done'));
  if (steps.length && terminal) {
    if (reduced.matches || !('IntersectionObserver' in window)) tickAll();
    else {
      const io = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        io.disconnect();
        steps.forEach((s, k) => setTimeout(() => s.classList.add('done'), 450 + k * 520));
      }, { threshold: 0.35 });
      io.observe(terminal);
    }
  }

  /* ---------- ring gauge fills when visible ---------- */
  const ring = $('.ring');
  if (ring) {
    if (reduced.matches || !('IntersectionObserver' in window)) ring.classList.add('is-in');
    else {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) { ring.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(ring);
    }
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
    if (reduced.matches || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('in'));
    else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
      reveals.forEach(el => io.observe(el));
    }
  }

  /* ---------- floating badge shows once the hero has scrolled away ---------- */
  const badge = $('#float-badge');
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
