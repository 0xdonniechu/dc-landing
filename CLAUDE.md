# dc-landing: one-page static landing site for DC Agent Kit (donniechu / @donniechublog)

## What it does
A static page (`index.html`, `site.css`, `site.js`, `assets/`) that sells the DC Agent Kit: price and countdown, checkout link, sample claims. It deploys to Vercel as static files. It must never show a fake deadline or a made-up number as fact. A bug here costs money (a wrong price or checkout link) or trust (a false claim), not data.

## Verify
- `npm install` once, then `node scripts/check.mjs` (exit 0): desktop, mobile (390px) and reduced-motion runs; fails on horizontal overflow, console errors, failed or external requests, missing alt/size/names, duplicate ids, broken anchors, more than one `<h1>`, infinite animations under reduced motion. Screenshots go to `.check/` (gitignored).
- Owner visual check against the reference and a screen-reader pass: "not run" unless the owner did it.

## HARD: the main session does it directly, then hard-reviewer
- Anything that deploys or publishes (Vercel deploy, creating or pushing the public GitHub repo).
- The checkout link, the prices and the deadline (`<html data-*>`): they move money.
- Claims shown as facts (view counts, task counts, "left at" lines).

## MEDIUM: builder builds, reviewer reviews
- Layout, sections, CSS and JS changes.

## EASY: transcriber or builder, no review
- Copy typos and wording that changes no number, price or claim.

## Rules
- Web rules from webdev-playbook: baseline Widely available (newer features only inside `@supports` with a working fallback); prefer the platform to a library.
- No external scripts or trackers without the owner's approval (only Google Fonts is allowed). Every animation stops or becomes static under `prefers-reduced-motion: reduce`.
- No fake urgency: the deadline in `data-deadline` must be a real one, and expired countdowns and "early price" wording must disappear (`site.js` does this).
- Every number that is a claim stays an obvious sample until launch; the footer says so. Editable strings live in `CONTENT.md`.
- Publish scope: only what `.vercelignore` re-includes is published (index.html, site.css, site.js, favicon.svg, assets/); adding a public file means adding it there. CLAUDE.md, CONTENT.md, README.md, scripts/, package files, `.claude/`, `.check/`, `HANDOFF.md` and `.env*` stay out.
- Static HTML shows the regular price; every early-price piece is `hidden` and marked `data-early`, and `site.js` reveals it only while a valid `data-price`, `data-price-later` and a future `data-deadline` all exist.
- Deploy: Vercel via the `vercel` wrapper (0xdonniechu login). Check `.vercel/project.json` `orgId` first. Preview first; production only with the owner's approval; never one deploy per edit.
- Git: identity `0xdonniechu` (the machine default), repo public on GitHub under 0xdonniechu (not yet created). No Ambysto rules here. Keep private paths and names out; the repo is public.

## Read when
- Touching `<html data-*>`, `site.js` countdown or price code, or any editable copy: read `CONTENT.md` first (settings table, what `site.js` derives, baseline notes).
- Touching `.vercelignore` or anything about deploying: read the Rules above on publish scope and deploy before you start.

## Session state
- Work in progress lives in `HANDOFF.md` (gitignored). If it exists at session start, read it before anything else. Update it with `/handoff` before `/clear`; delete it once the goal is finished and recorded.
- Durable facts go in this file; tasks in the tracker. `HANDOFF.md` holds only where the current goal stands.
