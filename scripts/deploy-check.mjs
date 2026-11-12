#!/usr/bin/env node
// Deploy check: GETs a deployed URL and verifies that the site files are published
// and the repo-only files are not.
// Usage: node scripts/deploy-check.mjs <base-url> [--header "Name: value"]...
// Exit 0 ok, 1 problems, 2 usage or network error. Node 22, built-in fetch only.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const MUST_PUBLISH = ['/', '/index.html', '/site.css', '/site.js', '/favicon.svg'];
const MUST_NOT_PUBLISH = ['/CLAUDE.md', '/CONTENT.md', '/README.md', '/package.json', '/package-lock.json',
  '/scripts/check.mjs', '/scripts/deploy-check.mjs', '/.claude/settings.json', '/.vercelignore', '/HANDOFF.md', '/.env'];

function usage(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node scripts/deploy-check.mjs <base-url> [--header "Name: value"]...');
  process.exit(2);
}

const args = process.argv.slice(2);
const headers = {};
let base;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--header') {
    const v = args[++i];
    const k = v === undefined ? -1 : v.indexOf(':');
    if (k < 1) usage('--header needs "Name: value"');
    headers[v.slice(0, k).trim()] = v.slice(k + 1).trim();
  } else if (args[i].startsWith('--')) usage(`unknown flag ${args[i]}`);
  else if (base === undefined) base = args[i];
  else usage('only one base URL allowed');
}
if (!base) usage('missing <base-url>');
let baseUrl;
try { baseUrl = new URL(base); } catch { usage(`not a URL: ${base}`); }
if (!/^https?:$/.test(baseUrl.protocol)) usage('base URL must be http or https');

// assets/... paths referenced locally in index.html and site.css (src, href, url())
function assetPaths() {
  const found = new Set();
  const re = /(?:\b(?:src|href)\s*=\s*|url\(\s*)["']?(?:\.\/)?(assets\/[^"')\s?#]+)/gi;
  for (const f of ['index.html', 'site.css']) {
    const text = readFileSync(resolve(ROOT, f), 'utf8');
    for (const m of text.matchAll(re)) found.add('/' + m[1]);
  }
  return [...found].sort();
}

async function status(path) {
  const res = await fetch(new URL(path, baseUrl), { headers, redirect: 'manual' });
  await res.arrayBuffer();
  return res.status;
}

const checks = [
  ...[...MUST_PUBLISH, ...assetPaths()].map(p => ({ path: p, want: 200 })),
  ...MUST_NOT_PUBLISH.map(p => ({ path: p, want: 404 })),
];
let bad = 0;
for (const { path, want } of checks) {
  let got;
  try { got = await status(path); }
  catch (e) { console.error(`network error for ${path}: ${e.cause?.code || e.message}`); process.exit(2); }
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${got} ${path} (want ${want})`);
}
console.log(`${checks.length - bad}/${checks.length} ok, ${bad} problem${bad === 1 ? '' : 's'}`);
process.exit(bad ? 1 : 0);
