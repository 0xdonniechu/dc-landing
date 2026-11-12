#!/usr/bin/env node
// Layout parity gate: compares our page with the reference site's stored geometry.
// See intent/2026-11-12-layout-parity.plan.md, "How parity is measured".
//
// Usage:
//   node scripts/parity.mjs                    full gate at every width (exit 0 pass, 1 fail, 2 could not run)
//   node scripts/parity.mjs --only hero,watch  only those blocks: their heights and their components
//   node scripts/parity.mjs --report-only      write the report, always exit 0
//   node scripts/parity.mjs --widths 1440,390  only those widths
//   node scripts/parity.mjs --refresh          re-measure the live reference into scripts/parity-ref.json
//
// Our page needs a `data-p="<block>"` attribute on each block and `data-p="<block>.<name>"` on each
// component listed in scripts/parity-map.json. Reports and screenshots go to .check/parity/ (gitignored).
// Only numbers of the reference are stored: no code, text or images.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { homedir } from 'node:os';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = join(ROOT, '.check', 'parity');
const REF_FILE = join(ROOT, 'scripts', 'parity-ref.json');
const MAP = JSON.parse(readFileSync(join(ROOT, 'scripts', 'parity-map.json'), 'utf8'));
const REF_URL = 'https://www.itsflxkzy.com/';
const ALL_WIDTHS = [1440, 1100, 950, 768, 390];
const HEIGHT = 900;
// topPct: block tops and page height, ±1% (owner decision 2026-11-12, tightened from the intent's ±3%).
const TOL = { blockPct: 0.03, blockPx: 24, topPct: 0.01, posPx: 12, sizePct: 0.04, sizePx: 2, fontPct: 0.02 };

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const ONLY = opt('--only') ? opt('--only').split(',').map(s => s.trim()).filter(Boolean) : null;
const WIDTHS = opt('--widths') ? opt('--widths').split(',').map(Number) : ALL_WIDTHS;
const REPORT_ONLY = flag('--report-only');
const REFRESH = flag('--refresh');

if (opt('--only') !== undefined && !ONLY?.length) { console.error('--only needs at least one block name'); process.exit(2); }
if (ONLY) {
  const known = new Set(MAP.blocks.map(b => b.name));
  const bad = ONLY.filter(n => !known.has(n));
  if (bad.length) { console.error(`unknown block(s): ${bad.join(', ')}`); process.exit(2); }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm' };

async function chromium() {
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
function serve() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT) || file.includes(`${ROOT}/.git`)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// Waits for fonts and scrolls the whole page once so lazy and revealed content is laid out.
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(80); }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
}

// Runs in the page. side: 'ref' uses the map's selectors, 'ours' uses data-p attributes.
async function measure(page, side) {
  await settle(page);
  const data = await page.evaluate(({ map, side }) => {
    const pick = (sel, i) => document.querySelectorAll(sel)[i || 0] || null;
    const sel = (item, full) => side === 'ref' ? [item.ref, item.i] : [`[data-p="${full}"]`, 0];
    const opacity = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    const box = el => {
      if (!el) return null;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || r.height === 0) return { hidden: true };
      // Invisible (transparent) or entirely off the sides of the page counts as hidden, not as present.
      if (opacity(el) < 0.05 || r.right <= 0 || r.left >= innerWidth) return { hidden: true };
      return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    };
    // Fonts: a fallback font changes every text box, so a page whose own fonts did not load is not measured.
    const fam = el => (getComputedStyle(el).fontFamily.split(',')[0] || '').trim().replace(/^["']|["']$/g, '');
    const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-\w+)$/;
    // A family counts as present only when one of its FontFaces actually loaded: offline, the web-font stylesheet
    // fails, no FontFace exists, and document.fonts.check() would wrongly say yes.
    const loaded = new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/^["']|["']$/g, '')));
    // Every family the page actually uses (first family of each rendered element), not only body and headings.
    const used = new Set();
    for (const el of document.body.querySelectorAll('*')) { if (el.getClientRects().length && el.textContent.trim()) used.add(fam(el)); }
    used.add(fam(document.body));
    const fontsMissing = [...used].filter(f => f && !generic.test(f) && !loaded.has(f));
    // Unmapped blocks (ours only): a top-level box that is not a mapped block, not inside one and not a container of them.
    const unmapped = [];
    if (side === 'ours') {
      // Every data-p must be a mapped name, and each used once: a typo or a duplicate block is an extra block.
      const known = new Set([...map.blocks.map(b => b.name), ...map.components.map(c => `${c.block}.${c.name}`)]);
      const seen = {};
      for (const e of document.querySelectorAll('[data-p]')) { const n = e.getAttribute('data-p'); seen[n] = (seen[n] || 0) + 1; }
      for (const [n, k] of Object.entries(seen)) {
        if (!known.has(n)) unmapped.push(`data-p="${n}" (not in the map)`);
        else if (k > 1) unmapped.push(`data-p="${n}" (used ${k} times)`);
      }
      const cands = new Set([...document.querySelectorAll('body > *, main > *, section, header, footer')].filter(e => !e.parentElement.closest('section')));
      for (const e of cands) {
        if (e.hasAttribute('data-p') || e.closest('[data-p]') || e.querySelector('[data-p]:not([data-p*="."])')) continue;
        const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        if (/^(SCRIPT|STYLE|TEMPLATE|DIALOG|NOSCRIPT|LINK|META)$/.test(e.tagName) || cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
        // Above the page (a skip link parked off-screen until focused) is not a block.
        if (r.bottom + scrollY <= 0) continue;
        if (r.height > 40 && r.width > 0 && opacity(e) >= 0.05) unmapped.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && e.className.baseVal === undefined ? '.' + e.className.trim().split(/\s+/).join('.') : ''} (${Math.round(r.height)}px)`);
      }
    }
    const blocks = {}; const comps = {};
    for (const b of map.blocks) {
      if (b.fixed) continue;
      const [s, i] = sel(b, b.name); blocks[b.name] = box(pick(s, i));
    }
    for (const c of map.components) {
      const [s, i] = sel(c, `${c.block}.${c.name}`); const el = pick(s, i); const bx = box(el);
      const blk = blocks[c.block];
      let v = bx;
      if (bx && !bx.hidden && blk && !blk.hidden) v = { x: bx.x - blk.x, y: bx.y - blk.y, w: bx.w, h: bx.h };
      if (v && !v.hidden && c.font) v.fs = +parseFloat(getComputedStyle(el).fontSize).toFixed(2);
      comps[`${c.block}.${c.name}`] = v;
    }
    const bps = new Set();
    const walk = rules => { for (const r of rules) {
      if (r.media) {
        const t = r.media.mediaText; const px = (n, u) => +(u === 'px' ? n : n * 16).toFixed(2);
        // (max-width: N) / (min-width: N), in px, em or rem
        for (const m of t.matchAll(/(max|min)-width\s*:\s*([\d.]+)(px|em|rem)/g)) bps.add(`${m[1]}-width:${px(+m[2], m[3])}`);
        // range syntax: (width <= N), (width < N), (N <= width) …; strict forms stay distinct strings
        for (const m of t.matchAll(/width\s*(<=|<|>=|>)\s*([\d.]+)(px|em|rem)/g))
          bps.add({ '<=': 'max-width:', '>=': 'min-width:', '<': 'max-width:<', '>': 'min-width:>' }[m[1]] + px(+m[2], m[3]));
        for (const m of t.matchAll(/([\d.]+)(px|em|rem)\s*(<=|<|>=|>)\s*width/g))
          bps.add({ '<=': 'min-width:', '>=': 'max-width:', '<': 'min-width:>', '>': 'max-width:<' }[m[3]] + px(+m[1], m[2]));
      }
      if (r.cssRules) walk(r.cssRules);
    } };
    for (const ss of document.styleSheets) { try { walk(ss.cssRules); } catch {} }
    return { docH: document.documentElement.scrollHeight, breakpoints: [...bps].sort(), blocks, comps, fontsMissing, unmapped };
  }, { map: MAP, side });
  // Fixed blocks (the floating badge): scroll down, let it appear, measure against the viewport.
  await page.evaluate(() => scrollTo(0, 1600)); await page.waitForTimeout(900);
  for (const b of MAP.blocks.filter(b => b.fixed)) {
    data.blocks[b.name] = await page.evaluate(([s, i]) => {
      const el = document.querySelectorAll(s)[i || 0]; if (!el) return null;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity;
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || o < 0.05) return { hidden: true };
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), fixed: true };
    }, side === 'ref' ? [b.ref, b.i] : [`[data-p="${b.name}"]`, 0]);
  }
  await page.evaluate(() => scrollTo(0, 0));
  return data;
}

// Our early-price pieces show only before `data-deadline`, so our page is measured at a fixed time before it:
// the same layout as the reference's launch state, whatever day the gate runs.
const OUR_CLOCK = new Date('2026-11-12T12:00:00+07:00');

async function load(browser, url, w, fixedClock) {
  const page = await browser.newPage({ viewport: { width: w, height: HEIGHT }, reducedMotion: 'reduce' });
  if (fixedClock) await page.clock.setFixedTime(fixedClock);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  return page;
}

const within = (a, b, pct, px) => Math.abs(a - b) <= Math.max(Math.abs(b) * pct, px);

function compare(ref, ours, w) {
  const rows = [];
  const row = (kind, name, r, o, ok, note = '') => rows.push({ kind, name, r, o, ok, note });
  const inScope = blk => !ONLY || ONLY.includes(blk);
  const fmt = b => !b ? 'missing' : b.hidden ? 'hidden' : `${b.x},${b.y} ${b.w}×${b.h}`;

  // Page-wide rows that cost nothing run in every mode, so no task can break them unseen.
  const rb = ref.breakpoints.join(' '), ob = ours.breakpoints.join(' ');
  row('breakpoints', 'media', rb, ob, rb === ob);
  row('blocks', 'unmapped', 'none', ours.unmapped.length ? ours.unmapped.join(', ') : 'none', ours.unmapped.length === 0,
    'every top-level box must be a mapped block');
  if (!ONLY) {
    const order = d => MAP.blocks.filter(b => !b.fixed && d.blocks[b.name] && !d.blocks[b.name].hidden)
      .sort((a, b) => d.blocks[a.name].y - d.blocks[b.name].y).map(b => b.name).join(' > ');
    const ro = order(ref), oo = order(ours);
    row('order', 'blocks', ro, oo, ro === oo);
    row('page', 'height', ref.docH, ours.docH, within(ours.docH, ref.docH, TOL.topPct, TOL.blockPx));
  }
  for (const b of MAP.blocks) {
    if (!inScope(b.name)) continue;
    const r = ref.blocks[b.name], o = ours.blocks[b.name];
    if (!r || r.hidden) { row('block', b.name, fmt(r), fmt(o), !o || !!o.hidden, 'hidden in the reference'); continue; }
    if (!o || o.hidden) { row('block', b.name, fmt(r), fmt(o), false, 'missing in ours'); continue; }
    if (b.fixed) {
      for (const k of ['x', 'y']) row('badge', `${b.name}.${k}`, r[k], o[k], within(o[k], r[k], 0, TOL.posPx));
      for (const k of ['w', 'h']) row('badge', `${b.name}.${k}`, r[k], o[k], within(o[k], r[k], TOL.sizePct, TOL.sizePx));
      continue;
    }
    // A thin block that is itself a component (header, ticker: "tight" in the map) takes the component tolerance.
    row('block', `${b.name}.h`, r.h, o.h, b.tight ? within(o.h, r.h, TOL.sizePct, TOL.sizePx) : within(o.h, r.h, TOL.blockPct, TOL.blockPx));
    row('block', `${b.name}.x`, r.x, o.x, within(o.x, r.x, 0, TOL.posPx));
    row('block', `${b.name}.w`, r.w, o.w, within(o.w, r.w, TOL.sizePct, TOL.sizePx));
    if (!ONLY) row('block', `${b.name}.top`, r.y, o.y, within(o.y, r.y, TOL.topPct, TOL.blockPx));
  }
  for (const c of MAP.components) {
    if (!inScope(c.block)) continue;
    const key = `${c.block}.${c.name}`; const r = ref.comps[key], o = ours.comps[key];
    if (!r || r.hidden) { row('comp', key, fmt(r), fmt(o), !o || !!o.hidden, 'hidden in the reference'); continue; }
    if (!o || o.hidden) { row('comp', key, fmt(r), fmt(o), false, o ? 'hidden in ours' : `no [data-p="${key}"]`); continue; }
    for (const k of ['x', 'y']) row('comp', `${key}.${k}`, r[k], o[k], within(o[k], r[k], 0, TOL.posPx));
    for (const k of ['w', 'h']) row('comp', `${key}.${k}`, r[k], o[k], within(o[k], r[k], TOL.sizePct, TOL.sizePx));
    if (c.font) row('font', `${key}.fs`, r.fs, o.fs, within(o.fs, r.fs, TOL.fontPct, 0.01));
  }
  return rows;
}

async function main() {
  const cr = await chromium();
  const executablePath = chromePath();
  if (!executablePath) { console.error('no local Chromium found (set CHROME)'); process.exit(2); }
  const browser = await cr.launch({ executablePath });
  await mkdir(OUT, { recursive: true });

  if (REFRESH) {
    const snap = { url: REF_URL, measured: new Date().toISOString().slice(0, 10), tolerances: TOL, widths: {} };
    for (const w of ALL_WIDTHS) {
      const page = await load(browser, REF_URL, w);
      const m = await measure(page, 'ref');
      await page.close();
      // A selector that matches nothing would be stored as null and then let a missing component pass: refuse.
      const nulls = [...Object.entries(m.blocks), ...Object.entries(m.comps)].filter(([, v]) => v === null).map(([k]) => k);
      if (nulls.length) { console.error(`${w}px: no reference element for ${nulls.join(', ')}; nothing written`); await browser.close(); return 2; }
      if (m.fontsMissing.length) { console.error(`${w}px: reference fonts did not load (${m.fontsMissing.join(', ')}); nothing written`); await browser.close(); return 2; }
      delete m.unmapped; delete m.fontsMissing;
      snap.widths[w] = m;
      console.log(`measured reference at ${w}px`);
    }
    await writeFile(REF_FILE, JSON.stringify(snap, null, 1) + '\n');
    console.log(`wrote ${REF_FILE}`);
    await browser.close(); return 0;
  }

  if (!existsSync(REF_FILE)) { console.error('no scripts/parity-ref.json: run with --refresh first'); await browser.close(); process.exit(2); }
  const REF = JSON.parse(await readFile(REF_FILE, 'utf8'));
  const server = await serve();
  const ourUrl = `http://127.0.0.1:${server.address().port}/`;
  let failed = 0;
  for (const w of WIDTHS) {
    const ref = REF.widths[w];
    if (!ref) { console.error(`no reference numbers for ${w}px`); failed++; continue; }
    const page = await load(browser, ourUrl, w, OUR_CLOCK);
    const ours = await measure(page, 'ours');
    if (ours.fontsMissing.length) {
      console.error(`${w}px: our fonts did not load (${ours.fontsMissing.join(', ')}), offline? Not measured.`);
      await page.close(); server.close(); await browser.close(); return 2;
    }
    await page.screenshot({ path: join(OUT, `${w}-ours.png`), fullPage: true });
    await page.close();
    let refShot = 'taken (live site, for looking only; the numbers come from the snapshot)';
    try {
      const rp = await load(browser, REF_URL, w);
      await settle(rp);
      await rp.screenshot({ path: join(OUT, `${w}-ref.png`), fullPage: true }); await rp.close();
    } catch (e) { refShot = `not taken: ${e.message.split('\n')[0]}`; }
    const rows = compare(ref, ours, w);
    if (!rows.length) { console.error(`${w}px: no rows compared`); server.close(); await browser.close(); return 2; }
    const bad = rows.filter(r => !r.ok);
    failed += bad.length;
    const md = [`# Parity at ${w}px (${ONLY ? 'blocks: ' + ONLY.join(', ') : 'full'})`, '',
      `Reference numbers measured ${REF.measured}. Reference screenshot: ${refShot}.`, '',
      `${rows.length - bad.length}/${rows.length} rows pass.`, '',
      '| | kind | name | reference | ours | diff | note |', '|---|---|---|---|---|---|---|',
      ...rows.map(r => `| ${r.ok ? 'PASS' : 'FAIL'} | ${r.kind} | ${r.name} | ${r.r} | ${r.o} | ${typeof r.r === 'number' && typeof r.o === 'number' ? (r.o - r.r > 0 ? '+' : '') + +(r.o - r.r).toFixed(2) : ''} | ${r.note} |`)];
    await writeFile(join(OUT, `${w}.md`), md.join('\n') + '\n');
    console.log(`${w}px: ${rows.length - bad.length}/${rows.length} rows pass`);
    for (const r of bad.slice(0, 40)) console.log(`  FAIL ${r.kind} ${r.name}: reference ${r.r}, ours ${r.o}${r.note ? ' (' + r.note + ')' : ''}`);
    if (bad.length > 40) console.log(`  … ${bad.length - 40} more in .check/parity/${w}.md`);
  }
  server.close(); await browser.close();
  console.log(failed ? `parity: ${failed} failing row(s)` : 'parity: ok');
  return REPORT_ONLY ? 0 : failed ? 1 : 0;
}

main().then(code => process.exit(code)).catch(e => { console.error(e); process.exit(2); });
