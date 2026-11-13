# dc-landing: one-page static landing site for DC Agent Kit (donniechu / @donniechublog)

## What it does
A static page (`index.html`, `site.css`, `site.js`, the `assets` folder) that sells the DC Agent Kit: price and countdown, checkout link, sample claims. It deploys to Vercel as static files. It must never show a fake deadline or a made-up number as fact. A bug here costs money (a wrong price or checkout link) or trust (a false claim), not data.

## Verify
- `npm install` once, then `node scripts/check.mjs` (exit 0): desktop, mobile (390px) and reduced-motion runs; fails on horizontal overflow, console errors, failed or external requests, missing alt/size/names, duplicate ids, broken anchors, more than one `<h1>`, infinite animations under reduced motion. Screenshots go to `.check/` (gitignored).
- `node scripts/probe-media.mjs` (exit 0): the hero loop (plays in view, pauses out of view, never under reduced motion, its Pause/Play control by pointer and keyboard), the watch video (no request before a click, plays video 1 with sound, fits its frame at all 5 widths, pauses out of view), the proof dialog (each ticket opens a modal `<dialog>` with its video, one video at a time, Escape and Close return focus, Ctrl/Shift-click follows the link) and the text-zoom check: at a 24 and 32 px root, in every block listed in `ZOOM_BLOCKS`, no text is clipped, spills, is squeezed or overlaps other text, and no box runs past the page edge (also at 360 and 320 px). It also opens every FAQ answer, covers the floating badge, checks that headings grow with the root, that no decorative box (sticker, mascot, tag) covers a pill, button or link, that every hero link and button answers a click at 10/50/90% of its width (5 widths plus 701 and 900), that a how step's circle shares a row with its label, and that a long text column keeps at least 55% of its default width (`ZOOM_KEEP`). `DECOR_OK` lists the decorative overlaps the reference has too. A new block joins `ZOOM_BLOCKS`; an exemption goes in `ZOOM_SKIP`, `ZOOM_HANG` or `ZOOM_EDGE_SKIP` with its reason. `--zoom-only` runs just the zoom check.
- `systemd-run --user --scope -q -p MemoryMax=4G node scripts/parity.mjs` (exit 0; a few minutes per run): layout parity with the reference site at 1440, 1100, 950, 768 and 390 px. It compares the block list and order, block tops and heights, the components in `scripts/parity-map.json` (each carries `data-p="<block>.<name>"` in `index.html`), heading font sizes, the breakpoints (1100/900/700) and the page height against the stored numbers in `scripts/parity-ref.json`; tolerances and method in `intent/2026-11-12-layout-parity.plan.md`. `--only <blocks>` while building, `--report-only` for the table without failing; `--refresh` re-measures the live reference and is a reviewed change of its own. Tables and side-by-side screenshots go to `.check/parity/<width>.md`, `<width>-ref.png`, `<width>-ours.png`. Exit 2 means it could not measure (a font did not load, no snapshot).
- After every deploy (preview or production): `node scripts/deploy-check.mjs <deployment-url>` must exit 0 (it checks that the site files return 200 and the repo-only files 404; add `--header "Name: value"` for a Vercel protection-bypass header on protected previews). `.check/static-server.mjs [--all]` is its local test server.
- Owner visual check (the side-by-side pairs in `.check/parity/` at every width) and a screen-reader pass: "not run" unless the owner did it.

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
- Publish scope: only what `.vercelignore` re-includes is published (index.html, site.css, site.js, favicon.svg and the `assets` folder); adding a public file means adding it there. Re-includes in `.vercelignore` must name folders without a trailing slash (`!/assets`, not `!/assets/`): the Vercel CLI tests the bare folder path, so a trailing-slash rule never matches and the folder is skipped. CLAUDE.md, CONTENT.md, README.md, scripts/, package files, `.claude/`, `.check/`, `HANDOFF.md` and `.env*` stay out.
- Static HTML shows the regular price; every early-price piece is `hidden` and marked `data-early`, and `site.js` reveals it only while a valid `data-price`, `data-price-later` and a future `data-deadline` all exist.
- The hero video (centre phone) plays only in view and never under reduced motion; the HyperFrames source lives in `video/` and is not published (re-render steps in `CONTENT.md`).
- The watch video (`#watch-video`, the owner's video 1, `assets/video/reels/reel-1.mp4`, with sound) plays only on a user click, inside its frame, and pauses when scrolled out of view; `preload="none"`, no autoplay. The proof tickets (`.tickets a.vt`) open a modal `<dialog>` on a plain click only (a modified click follows the link): ticket 1 plays `reel-2.mp4`, ticket 2 `reel-3.mp4`, ticket 3 the hero loop (no sound). One video plays at a time. `site.js` "media: the 60-second watch video and the proof dialog"; `scripts/probe-media.mjs` checks all of it.
- Layout follows the reference site's geometry (owner rule 2026-11-12: media and copy are ours, but every component's size and position must match): breakpoints 1100/900/700 only, sizes in rem so boxes grow with the user's text size while keeping their size at the default root. A layout change passes `scripts/parity.mjs` and the zoom check of `scripts/probe-media.mjs`.
- Deploy: Vercel via the `vercel` wrapper (0xdonniechu login). Check `.vercel/project.json` `orgId` first. Preview first; production only with the owner's approval; never one deploy per edit.
- Git: identity `0xdonniechu` (the machine default), repo public on GitHub at `0xdonniechu/dc-landing`. A merge to `main` publishes the source there and deploys nothing (no Vercel git link), so ask the owner before it. Keep private paths and names out; the repo is public.

## Read when
- Touching `<html data-*>`, `site.js` countdown or price code, or any editable copy: read `CONTENT.md` first (settings table, what `site.js` derives, baseline notes).
- Touching `.vercelignore` or anything about deploying: read the Rules above on publish scope and deploy before you start.

## Session state
- Work in progress lives in `HANDOFF.md` (gitignored). If it exists at session start, read it before anything else. Update it with `/handoff` before `/clear`; delete it once the goal is finished and recorded.
- Durable facts go in this file; tasks in the tracker. `HANDOFF.md` holds only where the current goal stands.
