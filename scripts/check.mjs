#!/usr/bin/env node
// Site check: serves the repo root, loads index.html in Chromium at desktop and
// mobile width, and fails on what a reviewer would otherwise catch by eye.
// Usage: node scripts/check.mjs   (exit 0 ok, 1 problems, 2 could not run)
// Screenshots land in .check/ (gitignored).
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { homedir } from 'node:os';
import { existsSync, readdirSync } from 'node:fs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = join(ROOT, '.check');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain' };
const ALLOWED_EXTERNAL = [/^https:\/\/fonts\.googleapis\.com\//, /^https:\/\/fonts\.gstatic\.com\//];

async function loadPlaywright() {
  try { return (await import('playwright-core')).chromium; } catch {}
  console.error('playwright-core not installed: run `npm install` first');
  process.exit(2);
}

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return undefined;
  const dirs = readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) { const p = join(base, d, 'chrome-linux64', 'chrome'); if (existsSync(p)) return p; }
  return undefined;
}

function serve() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT) || file.includes(`${ROOT}/.git`)) { res.writeHead(403).end(); return; }
      const s = await stat(file);
      if (!s.isFile()) throw new Error('not a file');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const chromium = await loadPlaywright();
const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });

const runs = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, mobile: false, motion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, mobile: true, motion: 'no-preference' },
  { name: 'reduced-motion', viewport: { width: 1440, height: 900 }, mobile: false, motion: 'reduce' },
];

for (const run of runs) {
  const ctx = await browser.newContext({ viewport: run.viewport, isMobile: run.mobile, deviceScaleFactor: 1, reducedMotion: run.motion });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') fail(run.name, `console error: ${m.text()}`); });
  page.on('pageerror', e => fail(run.name, `page error: ${e.message}`));
  page.on('requestfailed', r => { if (!ALLOWED_EXTERNAL.some(x => x.test(r.url()))) fail(run.name, `request failed: ${r.url()}`); });
  page.on('response', r => { if (r.status() >= 400) fail(run.name, `HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith('data:') && !ALLOWED_EXTERNAL.some(x => x.test(u))) fail(run.name, `external request: ${u}`);
  });
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  // scroll through so lazy content and reveal-on-scroll code runs
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += run.viewport.height * 0.8) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const r = await page.evaluate(() => {
    const out = {};
    out.overflow = document.documentElement.scrollWidth - window.innerWidth;
    out.lang = document.documentElement.getAttribute('lang');
    out.viewport = !!document.querySelector('meta[name="viewport"]');
    out.title = document.title;
    out.description = document.querySelector('meta[name="description"]')?.content || '';
    out.h1 = document.querySelectorAll('h1').length;
    out.imgNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src'));
    out.imgNoSize = [...document.querySelectorAll('img')].filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).map(i => i.getAttribute('src'));
    const named = el => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent || el.querySelector('img[alt]')?.alt || el.title || '').trim().length > 0;
    out.unnamed = [...document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea')]
      .filter(el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        ? !(el.labels?.length || el.getAttribute('aria-label')) : !named(el))
      .map(el => el.outerHTML.slice(0, 80));
    out.externalScripts = [...document.scripts].filter(s => s.src && new URL(s.src).origin !== location.origin).map(s => s.src);
    out.ids = (() => { const seen = {}, dup = []; document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) dup.push(e.id); seen[e.id] = 1; }); return dup; })();
    out.brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(h.slice(1)));
    out.infinite = document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity)
      .map(a => a.animationName || a.effect?.target?.className || 'animation');
    return out;
  });

  if (r.overflow > 1) fail(run.name, `horizontal overflow ${r.overflow}px`);
  if (!r.lang) fail(run.name, 'missing <html lang>');
  if (!r.viewport) fail(run.name, 'missing <meta name="viewport">');
  if (!r.title) fail(run.name, 'missing <title>');
  if (!r.description) fail(run.name, 'missing meta description');
  if (r.h1 !== 1) fail(run.name, `expected one <h1>, found ${r.h1}`);
  r.imgNoAlt.forEach(s => fail(run.name, `img without alt: ${s}`));
  r.imgNoSize.forEach(s => fail(run.name, `img without width/height: ${s}`));
  r.unnamed.forEach(s => fail(run.name, `control without accessible name: ${s}`));
  r.externalScripts.forEach(s => fail(run.name, `external script: ${s}`));
  r.ids.forEach(s => fail(run.name, `duplicate id: ${s}`));
  r.brokenAnchors.forEach(s => fail(run.name, `anchor to missing id: ${s}`));
  if (run.motion === 'reduce') r.infinite.forEach(s => fail(run.name, `infinite animation runs under reduced motion: ${s}`));

  await page.screenshot({ path: join(OUT, `${run.name}-fold.png`) });
  await page.screenshot({ path: join(OUT, `${run.name}-full.png`), fullPage: true });
  await ctx.close();
}

await browser.close();
server.close();
const uniq = [...new Set(problems)];
uniq.forEach(p => console.log('FAIL', p));
console.log(uniq.length ? `${uniq.length} problem(s)` : 'ok');
console.log(`screenshots: ${OUT}`);
process.exit(uniq.length ? 1 : 0);
