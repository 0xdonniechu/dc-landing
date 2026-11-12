status: building# draft → planned → building → verified

# Plan: layout parity with the reference site

Intent: `intent/2026-11-12-layout-parity.md` (approved). Branch: `layout-parity`. Repo: 0xdonniechu/dc-landing. No tracker ticket (see the intent).

## How parity is measured
- `scripts/parity.mjs` loads the reference and our page in the same local Chromium, with reduced motion so reveal transforms are settled. It runs at 1440, 1100, 950, 768 and 390 px, 900 px tall. Before measuring it waits for `document.fonts.ready` and scrolls the page once so lazy and revealed content is laid out.
- **Reference snapshot.** The reference's numbers are stored in `scripts/parity-ref.json` (boxes, breakpoints, heading font sizes, page height, with the date measured). The gate compares against that file, so it does not depend on the network or on the reference changing. `node scripts/parity.mjs --refresh` re-measures the live reference and rewrites the file; a refresh is a reviewed change of its own. Only numbers are stored, no code, text or images of the reference.
- **Component map.** `scripts/parity-map.json` pairs each block and component: `{ "block": "hero", "name": "fan centre phone", "ref": ".hero .ph.f0 .phone", "ours": "#top .phone-c" }`. Blocks are header, hero, ticker, watch, night, proof, how, styles, check, inside, price, faq, final, footer and badge.
- **Two kinds of position.** A component's position is measured relative to its block's top-left corner, so a block can be checked on its own (`--only hero,watch`). The full run also checks every block's absolute top and the page height.
- **Tolerances** (from the intent):
  - Block top and height, and page height: ±3% or ±24 px, whichever is larger.
  - Component position: ±12 px. Component width and height: ±4%.
  - Heading font size: ±2%.
  - Breakpoints: the same `max-width` values as the reference.
  - Blocks: the same list in the same order.
- **Output.**
  - Exit 0 when every check passes, 1 otherwise.
  - Writes `.check/parity/<width>.md`: a table of every row with the reference value, ours, the difference and PASS/FAIL.
  - Writes `.check/parity/<width>-ref.png` and `<width>-ours.png`: full-page screenshots, side by side, for the owner.
  - `--report-only` always exits 0, for use while building.

## Files (in the order of work)
1. `scripts/parity.mjs`, `scripts/parity-map.json`, `scripts/parity-ref.json` (new, T1)
2. `index.html`, `site.css`, `site.js` (T2–T8)
3. `assets/video/reels/*` (T4: video 1 moves to the watch section; posters for the thumbs)
4. `scripts/probe-media.mjs` (new, T4; replaces the gitignored `.check/probe-video.mjs` and `.check/probe-reels.mjs` so the media checks are part of Verify)
5. `CONTENT.md`, `CLAUDE.md` (T9)
6. this plan and its intent

## Risks
- **Our fonts are wider or narrower than the reference's**, so headings wrap to a different number of lines. Caught by: the component height rows of the parity table. Fix the copy length first; a font-size change only within the ±2% rule.
- **Block tops drift because of an earlier block.** Caught by: relative positions per block, so each task is judged on its own blocks. The absolute tops are checked in the full run (Proof 1).
- **The reference changes between measurements.** Caught by: the stored snapshot; `--refresh` is deliberate and reviewed.
- **Text, accessibility or behaviour regress while layout moves.** Caught by: `scripts/check.mjs` in every task's checks.
- **The hero video, the watch video or the proof dialog break.** Caught by: `scripts/probe-media.mjs`. It covers play in view, pause out of view, reduced motion, one-at-a-time, dialog focus in and out, Escape closing the dialog, and a slow-load abort with no scroll jump.
- **A published file goes missing, or a repo-only file goes public.** Caught by: `scripts/deploy-check.mjs`, run on a local published-only server and on the preview.
- **The gate itself is wrong** and passes a page that drifts. Caught by Proof 6: break one breakpoint and one component size on purpose, and the gate must fail.
- **The ticker moves out of the hero.** At the reference it is a separate block over the hero/watch join. Caught by: the block-list check.

## Task details
What each task builds; the contract bullets are under `## Tasks`.

### T1 Parity gate, reference snapshot and component map
Write the gate described under "How parity is measured". Fill the component map for every block, and store the reference snapshot for the 5 widths. Its first run reports today's drift; it is expected to fail until T2–T8 are done.

### T2 Page frame: breakpoints, container, header, ticker, heading scale, myth row
Breakpoints 1100/900/700; `.wrap` 1180 wide with the reference's side gutters at each width; header 83 px (93 at 390); the h2 (58/41.8/32 px) and big h2 (84/57/40 px) scales; the myth row (number disc and struck line); the ticker as its own block after the hero.

### T3 Hero
Four phones (left, inner-left, centre, inner-right) with their labels and the reference's boxes. The mascot stands at the right like the reference's presenter image. Kicker, h1, lead, prompt bar, CTA row and launch tape take the reference's boxes. The centre phone keeps the HyperFrames loop.

### T4 Watch section and proof tickets
- **Watch section.** A new 60-second block: kicker, h2, a 980×561 frame at 1440, a play button and a CTA row. Video 1 (with sound) plays centred inside the frame on a brand background, only on the user's click.
- **Proof tickets.** Three horizontal cards (about 353×208 at 1440) with a 100×173 thumbnail. A tap opens the video in a `<dialog>`: card 1 plays video 2, card 2 plays video 3, card 3 plays the hero loop.
- **Media probe.** Write `scripts/probe-media.mjs` covering the hero, watch and dialog behaviour listed under Risks, the slow-load case included.

### T5 "You might be thinking" and how
- **Night block:** h2 770 wide, the index links row and the mascot at right (300×386).
- **How block:**
  - The terminal is 681×384 and the phone 250×461, side by side down to 900 px.
  - The three-step chain uses links of 300 px with arrows between them.

### T6 Styles and self-check
- **Styles:** the 766-wide column (heading, picks, panel, paint row) and the 270×498 phone.
- **Self-check:** the 518-wide copy column, the 526×444 report card and the mascot at its bottom right.

### T7 Inside and price
- **Inside:** two columns of four items, each 514×114.
- **Price:** the 318×608 receipt and the 710-wide buy side.

### T8 FAQ, final, footer, badge
- **FAQ:** two columns of `<details>` items, 522×60 each.
- **Final:** the 780-wide copy column with its countdown box, the button and the fine print, plus the mascot at 300×371.
- **Footer:** 90 px tall.
- **Badge:** the floating badge takes the reference's box.

### T9 Docs and the whole gate
`CLAUDE.md` Verify gains the parity gate and the media probe; its "owner visual check" line points to the parity screenshots. `CONTENT.md` lists the new watch block and the dialog. Run the full gate.

## Tasks

### T1 (main) Parity gate, reference snapshot and component map
- allow: `scripts/parity.mjs` `scripts/parity-map.json` `scripts/parity-ref.json`
- check: `node --check scripts/parity.mjs`
- check: `node scripts/parity.mjs --report-only`

### T2 (builder) Page frame: breakpoints, container, header, ticker, heading scale, myth row
- allow: `index.html` `site.css` `site.js`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only header,ticker`

### T3 (builder) Hero
- allow: `index.html` `site.css` `site.js` `assets/mascot/**`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only hero`

### T4 (builder) Watch section and proof tickets
- allow: `index.html` `site.css` `site.js` `assets/video/**` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `node scripts/parity.mjs --only watch,proof`

### T5 (builder) "You might be thinking" and how
- allow: `index.html` `site.css` `site.js`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only night,how`

### T6 (builder) Styles and self-check
- allow: `index.html` `site.css` `site.js`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only styles,check`

### T7 (builder) Inside and price
- allow: `index.html` `site.css` `site.js`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only inside,price`

### T8 (builder) FAQ, final, footer, badge
- allow: `index.html` `site.css` `site.js`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only faq,final,footer,badge`

### T9 (main) Docs and the whole gate
- allow: `CLAUDE.md` `CONTENT.md`
- check: `node scripts/parity.mjs`
- check: `node scripts/check.mjs`

## Proof

1. `node scripts/parity.mjs` exits 0. It covers 5 widths, the block list, block tops and heights, component boxes, heading sizes, breakpoints and page height. The table for each width is in `.check/parity/`.
2. `node scripts/check.mjs` exits 0.
3. `node scripts/probe-media.mjs` exits 0.
4. `node scripts/deploy-check.mjs` reports 0 problems on a local published-only server (`.check/static-server.mjs`).
5. `node scripts/deploy-check.mjs <preview-url>` reports 0 problems on a Vercel preview, with the protection-bypass header.
6. The gate bites. With the 900 px breakpoint changed to 960 px, and separately with the how terminal 10% wider, `node scripts/parity.mjs` exits 1 and names the failing rows. After both are restored it exits 0.
7. `python3 ~/work/ambysto/coding-playbook/scripts/sdlc-check.py converge intent/2026-11-12-layout-parity.plan.md` passes.
8. The owner looks at the side-by-side screenshots in `.check/parity/` for every width.

## Result
