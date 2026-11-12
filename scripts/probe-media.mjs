#!/usr/bin/env node
// Media probe: the hero loop, the 60-second watch video and the proof video dialog.
// Usage: node scripts/probe-media.mjs   (exit 0 when every check passes, 1 on any FAIL, 2 when it cannot run)
//
// Real pointer clicks only: each click goes to the element's centre with page.mouse.click, after asserting
// that elementFromPoint there is the element (or inside it). There is no autoplay-bypass flag, so the
// browser's own gesture rules apply. Desktop (1440) and mobile (390) are covered.
// Also a generic text-zoom check (root font size 24 and 32 px) over the blocks in ZOOM_BLOCKS; `--zoom-only` runs just that.
// Replaces the gitignored .check/probe-video.mjs and .check/probe-reels.mjs.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { homedir } from 'node:os';

// Blocks (the data-p names) the text-zoom check covers. Each layout task adds its own blocks here.
const ZOOM_BLOCKS = ['header', 'hero', 'ticker', 'watch', 'proof', 'night', 'how', 'styles', 'check'];
// Text that hangs outside its data-p box on purpose (the phone labels sit above and beside the phone): checked against its block instead.
const ZOOM_HANG = ['.hero .ph .tag'];
// Cropped by design: the phone mock-ups (aria-hidden, they run off the page edge at big text sizes, the centre one is the video's
// frame) and the typewriter line of the prompt bar (aria-hidden; its full text is the sr-only line next to it, and it is clipped
// at the bar's edge while it types; making it wrap would change the hero's prompt height, which T3's parity rows pin).
const ZOOM_SKIP = ['.hero .ph[aria-hidden="true"]', '.hero .ph .bar', '.hero .prompt-text'];
const ZOOMS = (process.env.ZOOMS || '24,32').split(',').map(Number); // ZOOMS=16 looks at the default size
const ZOOM_ONLY = process.argv.includes('--zoom-only');

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm' };

async function loadChromium() {
  try { return (await import('playwright-core')).chromium; } catch {}
  console.error('playwright-core not installed: run `npm install` first'); process.exit(2);
}
function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return undefined;
  for (const d of readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()) {
    const p = join(base, d, 'chrome-linux64', 'chrome'); if (existsSync(p)) return p;
  }
}

// Local server with byte ranges (Chromium needs them to seek in an mp4) and an optional delay on mp4 responses.
let mp4Delay = 0;
const server = createServer(async (q, r) => {
  try {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT) || file.includes(`${ROOT}/.git`)) { r.writeHead(403).end(); return; }
    if (mp4Delay && p.endsWith('.mp4')) await new Promise(x => setTimeout(x, mp4Delay));
    const body = await readFile(file);
    const h = { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'accept-ranges': 'bytes' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(q.headers.range || '');
    if (m && (m[1] || m[2])) {
      const start = m[1] ? +m[1] : Math.max(0, body.length - +m[2]);
      const end = m[1] && m[2] ? Math.min(+m[2], body.length - 1) : body.length - 1;
      r.writeHead(206, { ...h, 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1 });
      r.end(body.subarray(start, end + 1));
    } else { r.writeHead(200, { ...h, 'content-length': body.length }); r.end(body); }
  } catch { r.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const chromium = await loadChromium();
let browser;
try { browser = await chromium.launch({ executablePath: chromePath() }); }
catch (e) { console.error(`cannot launch Chromium: ${e.message}`); server.close(); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${info === undefined ? '' : ' ' + JSON.stringify(info)}`); if (!cond) bad++; };

// Polls a page function until it returns something truthy or the time is up; returns the last value.
async function until(pg, fn, arg, ms = 6000) {
  let v;
  for (const end = Date.now() + ms; Date.now() < end;) {
    v = await pg.evaluate(fn, arg);
    if (v) return v;
    await wait(100);
  }
  return v;
}
const scrollTo = (pg, y) => pg.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
const toCentre = (pg, sel) => pg.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
// Scrolls the element to the middle of the view, asserts the pointer would hit it, then clicks its centre.
async function pointerClick(pg, sel, label) {
  await toCentre(pg, sel);
  await wait(250);
  const box = await (await pg.$(sel)).boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const hit = await pg.evaluate(([s, x, y]) => { const el = document.querySelector(s), h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); }, [sel, x, y]);
  ok(`${label}: pointer hits the element at its centre`, hit, { sel, x: Math.round(x), y: Math.round(y) });
  await pg.mouse.click(x, y);
}
const newPage = async (ctx, errs, reqs) => {
  const pg = await ctx.newPage();
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push(e.message));
  if (reqs) pg.on('request', r => { const m = /\/assets\/video\/([^?]*\.(?:mp4|webm))/.exec(r.url()); if (m) reqs.push(m[1]); });
  return pg;
};

const hero = pg => pg.evaluate(() => {
  const v = document.querySelector('#hero-video'), c = document.querySelector('#hero-video-ctl');
  return { paused: v.paused, t: +v.currentTime.toFixed(2), btn: c.hidden ? 'hidden' : c.textContent.trim().replace(/\s+/g, ' ') };
});
const watchState = pg => pg.evaluate(() => {
  const v = document.querySelector('#watch-video'), b = document.querySelector('#watch-play');
  return { paused: v.paused, muted: v.muted, vol: v.volume, t: +v.currentTime.toFixed(2), controls: v.hasAttribute('controls'), btnHidden: b.hidden, src: v.currentSrc.split('/').pop() };
});
const dialogState = pg => pg.evaluate(() => {
  const d = document.querySelector('#media-dialog'), v = d.querySelector('video');
  return { open: d.open, modal: d.matches(':modal'), inside: d.contains(document.activeElement), active: document.activeElement.className, paused: v.paused, muted: v.muted,
    vol: v.volume, t: +v.currentTime.toFixed(2), src: v.currentSrc.split('/').pop(), attr: v.getAttribute('src') };
});
const tState = (pg, n) => pg.evaluate(n => document.activeElement === document.querySelectorAll('.vt')[n - 1], n);
const TICKET = n => `.tickets li:nth-child(${n}) .vt`;
const EXPECT = { 1: ['reel-2.mp4', false], 2: ['reel-3.mp4', false], 3: ['hero-loop.mp4', true] };

if (!ZOOM_ONLY) {
for (const [vp, label] of [[{ width: 1440, height: 900 }, 'desktop'], [{ width: 390, height: 844 }, 'mobile']]) {
  const errs = [], reqs = [];
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference' });
  const pg = await newPage(ctx, errs, reqs);
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);

  /* ---- hero video ---- */
  await toCentre(pg, '#hero-video');
  let s = await until(pg, () => { const v = document.querySelector('#hero-video'); return !v.paused && v.currentTime > 0 && { t: v.currentTime }; });
  ok(`${label} hero: plays in view`, !!s, s);
  await scrollTo(pg, await pg.evaluate(() => document.documentElement.scrollHeight));
  s = await until(pg, () => document.querySelector('#hero-video').paused);
  ok(`${label} hero: pauses out of view`, s === true);
  await toCentre(pg, '#hero-video');
  s = await until(pg, () => !document.querySelector('#hero-video').paused);
  ok(`${label} hero: resumes back in view`, s === true);
  await pointerClick(pg, '#hero-video-ctl', `${label} hero pause control`);
  s = await hero(pg);
  ok(`${label} hero: pointer click on the control pauses and relabels it Play`, s.paused && /Play/.test(s.btn), s);
  await scrollTo(pg, await pg.evaluate(() => document.documentElement.scrollHeight)); await wait(400);
  await toCentre(pg, '#hero-video'); await wait(1000);
  ok(`${label} hero: stays paused after leaving and re-entering`, (await hero(pg)).paused);
  await pg.focus('#hero-video-ctl');
  await pg.keyboard.press('Enter');
  s = await until(pg, () => !document.querySelector('#hero-video').paused);
  ok(`${label} hero: keyboard Enter on the control plays`, s === true, await hero(pg));
  await pg.keyboard.press('Space'); await wait(400);
  s = await hero(pg);
  ok(`${label} hero: keyboard Space on the control pauses`, s.paused && /Play/.test(s.btn), s);

  /* ---- watch: nothing loads before the click ---- */
  const h = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += vp.height * 0.8) { await scrollTo(pg, y); await wait(80); }
  await wait(400);
  const early = reqs.filter(f => f.startsWith('reels/'));
  ok(`${label} watch: no reel mp4 requested before any click`, early.length === 0, early);
  const d0 = await dialogState(pg);
  ok(`${label} dialog: closed, and its video has no source before any click`, !d0.open && !d0.attr && d0.src === '', d0);
  const meta = await pg.evaluate(() => { const v = document.querySelector('#watch-video'); return { preload: v.preload, autoplay: v.autoplay, loop: v.loop, defMuted: v.defaultMuted, controls: v.hasAttribute('controls'), btn: !document.querySelector('#watch-play').hidden }; });
  ok(`${label} watch: preload none, no autoplay, not muted, play button instead of controls`, meta.preload === 'none' && !meta.autoplay && !meta.loop && !meta.defMuted && !meta.controls && meta.btn, meta);

  /* ---- watch: click plays with sound; scrolling away pauses it ---- */
  await pointerClick(pg, '#watch-play', `${label} watch play button`);
  s = await until(pg, () => { const v = document.querySelector('#watch-video'); return !v.paused && v.currentTime > 0.5 && { t: v.currentTime }; }, undefined, 10000);
  const w = await watchState(pg);
  ok(`${label} watch: click plays video 1 with sound`, !!s && !w.paused && !w.muted && w.vol > 0 && /reel-1\.mp4$/.test(w.src), w);
  ok(`${label} watch: button hidden, native controls on`, w.btnHidden && w.controls, w);
  ok(`${label} watch: only video 1 was requested`, reqs.filter(f => f.startsWith('reels/')).every(f => f === 'reels/reel-1.mp4'), reqs.filter(f => f.startsWith('reels/')));
  await scrollTo(pg, 0);
  s = await until(pg, () => document.querySelector('#watch-video').paused);
  ok(`${label} watch: pauses when scrolled out of view`, s === true, await watchState(pg));
  await ctx.close();

  /* ---- dialog: each ticket, Escape and the close button ---- */
  const ctx2 = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference' });
  const pg2 = await newPage(ctx2, errs, reqs);
  await pg2.goto(url, { waitUntil: 'networkidle' });
  await pg2.evaluate(() => document.fonts.ready);
  const rects = await pg2.evaluate(() => [...document.querySelectorAll('.vt')].map(t => Math.round(t.getBoundingClientRect().top + scrollY)));
  ok(`${label} dialog: three tickets`, rects.length === 3, rects);
  for (const n of [1, 2, 3]) {
    const [file, silent] = EXPECT[n];
    const how = n === 2 ? 'keyboard Enter' : 'pointer click';
    if (n === 2) { await toCentre(pg2, TICKET(2)); await pg2.focus(TICKET(2)); await pg2.keyboard.press('Enter'); }
    else await pointerClick(pg2, TICKET(n), `${label} ticket ${n}`);
    const o = await until(pg2, () => { const d = document.querySelector('#media-dialog'), v = d.querySelector('video'); return d.open && !v.paused && v.currentTime > 0.3; }, undefined, 8000);
    const st = await dialogState(pg2);
    ok(`${label} ticket ${n} (${how}): opens the modal dialog and plays ${file}`, !!o && st.open && st.modal && st.src === file, st);
    ok(`${label} ticket ${n}: focus is inside the dialog`, st.inside, st);
    ok(`${label} ticket ${n}: ${silent ? 'muted (the clip has no sound)' : 'plays with sound'}`, silent ? st.muted : (!st.muted && st.vol > 0), st);
    if (n === 2) {
      await pointerClick(pg2, '.vd-close', `${label} ticket 2 close button`);
      await wait(300);
      const c = await dialogState(pg2);
      ok(`${label} ticket 2: close button closes, video paused and unloaded, focus back on the ticket`, !c.open && c.paused && !c.attr && await tState(pg2, 2), c);
    } else {
      await pg2.keyboard.press('Escape');
      await wait(300);
      const c = await dialogState(pg2);
      ok(`${label} ticket ${n}: Escape closes, video paused and unloaded, focus back on the ticket`, !c.open && c.paused && !c.attr && await tState(pg2, n), c);
    }
  }
  await pg2.screenshot({ path: join(ROOT, '.check', `media-${label}.png`) }).catch(() => {});
  await ctx2.close();

  /* ---- dialog while the watch video plays: the viewport holds both, so the scroll-out pause is not the cause ---- */
  const ctx3 = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference' });
  const pg3 = await newPage(ctx3, errs, reqs);
  await pg3.goto(url, { waitUntil: 'networkidle' });
  await pg3.evaluate(() => document.fonts.ready);
  const geo = await pg3.evaluate(() => {
    const f = document.querySelector('.vframe').getBoundingClientRect(), t = document.querySelector('.vt').getBoundingClientRect();
    return { frameBottom: f.bottom + scrollY, ticketBottom: t.bottom + scrollY };
  });
  await pg3.setViewportSize({ width: vp.width, height: Math.min(4000, Math.ceil(geo.ticketBottom - geo.frameBottom + 300)) });
  await scrollTo(pg3, geo.frameBottom - 150);
  await wait(300);
  await pointerClick(pg3, '#watch-play', `${label} watch play (tall view)`);
  s = await until(pg3, () => { const v = document.querySelector('#watch-video'); return !v.paused && v.currentTime > 0.5; }, undefined, 10000);
  ok(`${label} dialog: watch video is playing before the ticket click`, !!s, await watchState(pg3));
  await scrollTo(pg3, geo.frameBottom - 150); // keep the same view: the pointer click below must not scroll
  await wait(200);
  const box = await (await pg3.$(TICKET(1))).boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const hit = await pg3.evaluate(([x, y]) => { const el = document.querySelector('.vt'), h = document.elementFromPoint(x, y); return !!h && el.contains(h); }, [x, y]);
  ok(`${label} dialog: pointer hits ticket 1 in the tall view`, hit, { x: Math.round(x), y: Math.round(y) });
  await pg3.mouse.click(x, y);
  await until(pg3, () => document.querySelector('#media-dialog').open, undefined, 4000);
  const wf = await watchState(pg3);
  ok(`${label} dialog: opening it pauses the watch video`, wf.paused, wf);
  const dv = await until(pg3, () => !document.querySelector('#media-dialog video').paused, undefined, 6000);
  ok(`${label} dialog: its own video plays`, dv === true, await dialogState(pg3));
  const back = await pg3.evaluate(async () => { try { await document.querySelector('#watch-video').play(); } catch (e) { return `rejected: ${e.name}`; } return 'playing'; });
  await wait(300);
  const ds = await dialogState(pg3);
  ok(`${label} dialog: starting the watch video pauses the dialog video`, back === 'playing' && ds.paused, { back, ds });
  await pg3.keyboard.press('Escape'); await wait(300);
  await ctx3.close();

  ok(`${label}: no console errors`, errs.length === 0, errs);
}

/* ---- slow load: scrolling away right after the click must not scroll back or steal focus ---- */
{
  mp4Delay = 3000;
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const pg = await newPage(ctx, errs);
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pointerClick(pg, '#watch-play', 'slow load watch play button');
  await wait(200);
  await scrollTo(pg, 0);
  await wait(4500);
  const r = await pg.evaluate(() => ({ scrollY: Math.round(scrollY), active: document.activeElement.id || document.activeElement.className || document.activeElement.tagName,
    paused: document.querySelector('#watch-video').paused, btnHidden: document.querySelector('#watch-play').hidden, controls: document.querySelector('#watch-video').hasAttribute('controls') }));
  ok('slow load: scroll-away keeps scrollY near the top', r.scrollY < 100, r);
  ok('slow load: focus is not on the watch video or its button', !/watch-video|watch-play/.test(r.active), r);
  ok('slow load: video paused and the play button is back, no controls', r.paused && !r.btnHidden && !r.controls, r);
  ok('slow load: no console errors', errs.length === 0, errs);
  await ctx.close();
  mp4Delay = 0;
}

/* ---- reduced motion: the hero never plays (the watch video and the dialog stay click-only) ---- */
{
  const errs = [], reqs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pg = await newPage(ctx, errs, reqs);
  await pg.goto(url, { waitUntil: 'networkidle' });
  await toCentre(pg, '#hero-video'); await wait(1800);
  const s = await hero(pg);
  ok('reduced motion: hero video paused at 0, control hidden, no video file requested', s.paused && s.t === 0 && s.btn === 'hidden' && reqs.length === 0, { ...s, reqs });
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  const p = await until(pg, () => !document.querySelector('#hero-video').paused);
  ok('reduced motion: switching the setting off lets it play', p === true);
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await wait(600);
  const q = await hero(pg);
  ok('reduced motion: switching it on again stops it at 0', q.paused && q.t === 0 && q.btn === 'hidden', q);
  ok('reduced motion: no console errors', errs.length === 0, errs);
  await ctx.close();
}

}

/* ---- watch video fit: after the click the video (and so its native controls) lies inside the frame box, centred, at every width ---- */
for (const width of ZOOM_ONLY ? [] : [1440, 1100, 950, 768, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
  const pg = await newPage(ctx, []);
  await pg.goto(url, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pointerClick(pg, '#watch-play', `fit ${width} watch play button`);
  await until(pg, () => { const v = document.querySelector('#watch-video'); return !v.paused && v.currentTime > 0.5; }, undefined, 10000);
  await wait(300);
  const g = await pg.evaluate(() => {
    const v = document.querySelector('#watch-video').getBoundingClientRect(), f = document.querySelector('[data-p="watch.frame"]').getBoundingClientRect();
    const round = r => ({ l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
    return { video: round(v), frame: round(f), inside: v.left >= f.left - 1 && v.right <= f.right + 1 && v.top >= f.top - 1 && v.bottom <= f.bottom + 1,
      centred: Math.abs((v.left + v.right) / 2 - (f.left + f.right) / 2) <= 1.5 && Math.abs((v.top + v.bottom) / 2 - (f.top + f.bottom) / 2) <= 1.5,
      controls: document.querySelector('#watch-video').hasAttribute('controls'), playing: !document.querySelector('#watch-video').paused };
  });
  ok(`watch fit at ${width}: after play the video and its controls are inside the frame box, centred`, g.playing && g.controls && g.inside && g.centred && g.video.h > 100, g);
  await ctx.close();
}

/* ---- text zoom: a bigger root font size (a browser's text-size setting) must not paint a phone or the mascot over the
   hero text, and the page must not scroll sideways. Boxes are intersected as rectangles: .fan-wrap is
   pointer-events: none, so elementFromPoint would not see an overlap. ---- */
for (const width of ZOOM_ONLY ? [] : [1440, 950, 768, 390]) {
  for (const [pct, px] of [[150, 24], [200, 32]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    const pg = await newPage(ctx, []);
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    const r = await pg.evaluate(px => {
      document.documentElement.style.fontSize = `${px}px`;
      const launch = document.querySelector('[data-p="hero.launch"]');
      launch.hidden = false; // the early-price tape shown, the widest the CTA row gets
      const rect = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      const live = els => [...els].map(el => [el, rect(el)]).filter(([, b]) => b.r - b.l > 0 && b.b - b.t > 0);
      const label = el => el.getAttribute('data-p') || el.className || el.tagName;
      const text = live(document.querySelectorAll('.hero [data-p="hero.kicker"], .hero [data-p="hero.h1"], .hero [data-p="hero.lead"], .hero [data-p="hero.prompt"], .hero [data-p="hero.cta"], .hero [data-p="hero.launch"], .hero .fine, .hero .fine a'));
      const art = live(document.querySelectorAll('.hero .ph, .hero .phone, .hero .tag, .hero [data-p="hero.mascot"]'));
      const hits = [];
      for (const [a, ab] of art) for (const [t, tb] of text) {
        const w = Math.min(ab.r, tb.r) - Math.max(ab.l, tb.l), h = Math.min(ab.b, tb.b) - Math.max(ab.t, tb.t);
        if (w > 0.5 && h > 0.5) hits.push(`${label(a)} x ${label(t)} ${Math.round(w)}x${Math.round(h)}`);
      }
      const de = document.documentElement;
      return { hits, shown: text.length, art: art.length, over: Math.max(de.scrollWidth, document.body.scrollWidth) - de.clientWidth,
        hasCta: text.some(([e]) => label(e) === 'hero.cta'), hasLaunch: text.some(([e]) => label(e) === 'hero.launch') };
    }, px);
    ok(`text zoom ${pct}% at ${width}: no phone or mascot box overlaps the hero text, CTA, launch tape or prompt`, r.hits.length === 0 && r.hasCta && r.hasLaunch && r.art >= 3, r);
    ok(`text zoom ${pct}% at ${width}: no horizontal overflow`, r.over <= 0, { over: r.over });
    await ctx.close();
  }
}

/* ---- text zoom, generic: at a root font size of 24 and 32 px no text may be clipped or spill out of its box. For every
   element under a data-p block that holds text itself: if it clips (overflow other than visible) its content must fit
   (scrollWidth/Height <= client + 1), and the text's own range rect must lie inside the box of its nearest data-p
   ancestor (itself included) and inside every ancestor that clips, 1 px slack. Text inside ZOOM_SKIP parts (decoration) is skipped. Early-price pieces are shown (the widest the page gets) and motion is
   reduced so the ticker and the tilts hold still. One line per width x zoom x block. ---- */
for (const width of [1440, 950, 768, 390]) {
  for (const px of ZOOMS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const pg = await newPage(ctx, []);
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    const res = await pg.evaluate(([px, blocks, hang, skip]) => {
      document.documentElement.style.fontSize = `${px}px`;
      document.querySelectorAll('[data-early]').forEach(e => { e.hidden = false; });
      void document.body.offsetHeight;
      const out = Object.fromEntries(blocks.map(b => [b, { elements: 0, bad: [] }]));
      const name = el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      for (const el of document.querySelectorAll('body *')) {
        const host = el.closest('[data-p]');
        if (!host) continue;
        const block = host.getAttribute('data-p').split('.')[0];
        if (!out[block]) continue;
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim());
        if (!own.length) continue;
        if (el.closest(skip)) continue;
        const cs = getComputedStyle(el), eb = el.getBoundingClientRect();
        if (el.offsetWidth <= 1 || el.offsetHeight <= 1 || eb.width <= 0 || cs.visibility === 'hidden') continue; // hidden, or a screen-reader-only clip
        const rec = out[block];
        rec.elements++;
        const bad = why => rec.bad.push(`${name(el)} ${why}`);
        if ((cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) {
          if (el.scrollWidth > el.clientWidth + 1) bad(`clips: scrollWidth ${el.scrollWidth} > ${el.clientWidth}`);
          if (el.scrollHeight > el.clientHeight + 1) bad(`clips: scrollHeight ${el.scrollHeight} > ${el.clientHeight}`);
        }
        const box = (el.matches(hang) ? document.querySelector(`[data-p="${block}"]`) : host).getBoundingClientRect();
        // The test is on line boxes, not glyph boxes: a range rect is as tall as the font's ascent plus descent, which for a
        // tight line-height (1 or 1.04) is more than the room the layout gives the line. Half-leading is applied to each rect.
        const lh = parseFloat(cs.lineHeight);
        for (const n of own) {
          const r = document.createRange(); r.selectNodeContents(n);
          let worst = null;
          for (const t of r.getClientRects()) {
            if (t.width === 0 && t.height === 0) continue;
            const lead = Number.isFinite(lh) ? (t.height - lh) / 2 : 0;
            const d = { l: box.left - t.left, t: box.top - (t.top + lead), r: t.right - box.right, b: (t.bottom - lead) - box.bottom };
            if (d.l > 1 || d.t > 1 || d.r > 1 || d.b > 1) { worst = d; break; }
          }
          if (!worst) { // also inside every ancestor that clips on that axis (a frame with overflow: hidden, the page's clip)
            for (const t of r.getClientRects()) {
              if (t.width === 0 && t.height === 0) continue;
              for (let a = el.parentElement; a && a !== document.documentElement && !worst; a = a.parentElement) {
                const ac = getComputedStyle(a), ab = a.getBoundingClientRect(), cx = ac.overflowX !== 'visible', cy = ac.overflowY !== 'visible';
                const d = { l: cx ? ab.left - t.left : 0, t: cy ? ab.top - t.top : 0, r: cx ? t.right - ab.right : 0, b: cy ? t.bottom - ab.bottom : 0 };
                if (d.l > 1 || d.t > 1 || d.r > 1 || d.b > 1) worst = { ...d, clip: name(a) };
              }
            }
          }
          if (worst) { bad(`text spills out of ${worst.clip || name(host)} by ${['l', 't', 'r', 'b'].filter(k => worst[k] > 1).map(k => `${k}${Math.round(worst[k])}`).join(' ')}`); break; }
        }
      }
      return out;
    }, [px, ZOOM_BLOCKS, ZOOM_HANG.join(','), ZOOM_SKIP.join(',')]);
    for (const b of ZOOM_BLOCKS) ok(`text zoom ${px}px root at ${width}: ${b} text is not clipped or spilling`, res[b].bad.length === 0 && res[b].elements > 0, { elements: res[b].elements, bad: res[b].bad.slice(0, 6) });
    await ctx.close();
  }
}

/* ---- text zoom, readable: the generic check above tests text against its data-p host; this one tests text against other text.
   (1) No text element that holds words is squeezed to near-zero width (boxes of any size count; display: none and the
   screen-reader-only clip are not "squeezed"). (2) No two text elements of one block have overlapping line rects (1 px slack;
   an element and its ancestor or descendant are not a pair; ZOOM_SKIP and ZOOM_HANG elements are left out). Line rects are
   trimmed by the half-leading like above, so a tight line-height does not count as an overlap. ---- */
for (const width of [1440, 1100, 950, 768, 390]) {
  for (const px of ZOOMS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const pg = await newPage(ctx, []);
    await pg.goto(url, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    const res = await pg.evaluate(([px, blocks, hang, skip]) => {
      document.documentElement.style.fontSize = `${px}px`;
      document.querySelectorAll('[data-early]').forEach(e => { e.hidden = false; });
      void document.body.offsetHeight;
      const out = Object.fromEntries(blocks.map(b => [b, { elements: 0, squeezed: [], overlaps: [] }]));
      const name = el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      const items = {};
      for (const el of document.querySelectorAll('body *')) {
        const host = el.closest('[data-p]');
        if (!host) continue;
        const block = host.getAttribute('data-p').split('.')[0];
        if (!out[block] || el.closest(skip) || el.matches(hang)) continue;
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim());
        if (!own.length || !el.getClientRects().length) continue; // no text of its own, or display: none
        const cs = getComputedStyle(el), eb = el.getBoundingClientRect();
        if (cs.visibility === 'hidden' || (cs.clipPath !== 'none' && eb.width <= 2 && eb.height <= 2)) continue; // hidden, or a screen-reader-only clip
        out[block].elements++;
        if (eb.width < 4) out[block].squeezed.push(`${name(el)} is ${eb.width.toFixed(1)}px wide`);
        const lh = parseFloat(cs.lineHeight), lines = [];
        for (const n of own) {
          const r = document.createRange(); r.selectNodeContents(n);
          for (const t of r.getClientRects()) {
            if (t.width === 0 && t.height === 0) continue;
            const lead = Number.isFinite(lh) ? Math.max(0, (t.height - lh) / 2) : 0;
            lines.push({ l: t.left, t: t.top + lead, r: t.right, b: t.bottom - lead });
          }
        }
        (items[block] ||= []).push({ el, lines });
      }
      for (const [block, list] of Object.entries(items)) {
        for (let i = 0; i < list.length && out[block].overlaps.length < 6; i++) for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          let hit = null;
          for (const p of a.lines) { for (const q of b.lines) {
            const w = Math.min(p.r, q.r) - Math.max(p.l, q.l), h = Math.min(p.b, q.b) - Math.max(p.t, q.t);
            if (w > 1 && h > 1) { hit = `${Math.round(w)}x${Math.round(h)}`; break; }
          } if (hit) break; }
          if (hit) { out[block].overlaps.push(`${name(a.el)} x ${name(b.el)} ${hit}`); if (out[block].overlaps.length >= 6) break; }
        }
      }
      return out;
    }, [px, ZOOM_BLOCKS, ZOOM_HANG.join(','), ZOOM_SKIP.join(',')]);
    for (const b of ZOOM_BLOCKS) {
      ok(`text zoom ${px}px root at ${width}: ${b} has no squeezed text`, res[b].squeezed.length === 0 && res[b].elements > 0, { elements: res[b].elements, squeezed: res[b].squeezed.slice(0, 6) });
      ok(`text zoom ${px}px root at ${width}: ${b} text does not overlap other text`, res[b].overlaps.length === 0, { overlaps: res[b].overlaps });
    }
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(bad ? `${bad} FAILED` : 'all passed');
process.exit(bad ? 1 : 0);
