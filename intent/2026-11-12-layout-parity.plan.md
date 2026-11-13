status: verified (one-prompt run, started by the owner 2026-11-12) # draft → planned → building → verified

# Plan: layout parity with the reference site

Intent: `intent/2026-11-12-layout-parity.md` (approved). Branch: `layout-parity`. Repo: 0xdonniechu/dc-landing. Plane: LPP-2.

## How parity is measured
- `scripts/parity.mjs` loads the reference and our page in the same local Chromium, with reduced motion so reveal transforms are settled. It runs at 1440, 1100, 950, 768 and 390 px, 900 px tall. Before measuring it waits for `document.fonts.ready` and scrolls the page once so lazy and revealed content is laid out.
- **Reference snapshot.** The reference's numbers are stored in `scripts/parity-ref.json` (boxes, breakpoints, heading font sizes, page height, with the date measured). The gate compares against that file, so it does not depend on the network or on the reference changing. `node scripts/parity.mjs --refresh` re-measures the live reference and rewrites the file; a refresh is a reviewed change of its own. Only numbers are stored, no code, text or images of the reference.
- **Component map.** `scripts/parity-map.json` pairs each block and component: `{ "block": "hero", "name": "fan centre phone", "ref": ".hero .ph.f0 .phone", "ours": "#top .phone-c" }`. Blocks are header, hero, ticker, watch, night, proof, how, styles, check, inside, price, faq, final, footer and badge.
- **Two kinds of position.** A component's position is measured relative to its block's top-left corner, so a block can be checked on its own (`--only hero,watch`). The full run also checks every block's absolute top and the page height.
- **Tolerances** (from the intent):
  - Block height: ±3% or ±24 px, whichever is larger. Block top and page height: ±1% or ±24 px (owner decision 2026-11-12).
  - Block x and width: ±12 px and ±4%. Thin blocks that are themselves components (header, ticker: `tight` in the map) take ±4% on height too.
  - Every `data-p` is a mapped name used once, and no top-level box is left unmapped.
  - Component position: ±12 px. Component width and height: ±4%.
  - Heading font size: ±2%.
  - Breakpoints: the same `max-width` values as the reference.
  - Blocks: the same list in the same order.
- **Output.**
  - Exit 0 when every check passes, 1 otherwise.
  - Writes `.check/parity/<width>.md`: a table of every row with the reference value, ours, the difference and PASS/FAIL.
  - Writes `.check/parity/<width>-ref.png` and `<width>-ours.png`: full-page screenshots, side by side, for the owner.
  - `--report-only` exits 0 whatever the rows say, for use while building; like every mode it exits 2 when it cannot measure (our fonts did not load, no snapshot).
  - Known limits (review of T1, accepted): breakpoints are read from `@media` rules only, not from `media` attributes or script; a font counts per family, not per weight; a hidden duplicate of a `data-p` counts as a duplicate; sizes have a 2 px floor.

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

Fix round 3 (owner approval 2026-11-13): hero geometry in rem so it scales with the user's text size, and a text-zoom case (150% and 200% root size: the CTA, prompt bar and launch tape are not painted over by a phone) in `scripts/probe-media.mjs`.

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

Every task from T5 on (owner rule on text size, from the T3 and T4 reviews): the task's blocks join `ZOOM_BLOCKS` in `scripts/probe-media.mjs`, so at 150% and 200% text no text spills out of its box in them; boxes grow with text (rem or content-sized) while keeping their parity size at the default root.

T8 also moves the h1 scale (`--fs-h1`) to rem (T3 review, MINOR: it stays 44/95 px when the user's text size grows).
T8 also takes the T4 review's MINORs: the watch CTA's `min-width` makes it 444 px wide at 390 px with 200% text (it runs past the page edge); the zoom check also fails a box that runs past the page edge and runs at 1100 too; a probe case for a Ctrl/Shift click on a ticket (it follows the link, no dialog).

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
- allow: `index.html` `site.css` `site.js` `assets/mascot/**` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/parity.mjs --only hero`

### T4 (builder) Watch section and proof tickets
- allow: `index.html` `site.css` `site.js` `assets/video/**` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `node scripts/parity.mjs --only watch,proof`

### T5 (builder) "You might be thinking" and how
- allow: `index.html` `site.css` `site.js` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `node scripts/parity.mjs --only night,how`

### T6 (builder) Styles and self-check
- allow: `index.html` `site.css` `site.js` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `node scripts/parity.mjs --only styles,check`

### T7 (builder) Inside and price
- allow: `index.html` `site.css` `site.js` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `node scripts/parity.mjs --only inside,price`

### T8 (builder) FAQ, final, footer, badge
- allow: `index.html` `site.css` `site.js` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
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
7. `sdlc-check.py converge intent/2026-11-12-layout-parity.plan.md` passes.
8. The owner looks at the side-by-side screenshots in `.check/parity/` for every width.

## Result

1. PASS at d0bfe88: `node scripts/parity.mjs` exit 0; rows 363/363 at 1440, 1100 and 950, 357/357 at 768 and 390 (block list, tops, heights, components, heading sizes, breakpoints, page height). Tables and pairs in `.check/parity/`.
2. PASS at d0bfe88: `node scripts/check.mjs` exit 0.
3. PASS at d0bfe88: `node scripts/probe-media.mjs` exit 0, 545 PASS, 0 FAIL (hero, watch, dialog, modified clicks, text zoom at 24/32 px roots over 14 blocks at 5 widths).
4. PASS, `node scripts/deploy-check.mjs` against `.check/static-server.mjs` serving the T9 tree (layout-parity at cd5955a plus the docs): 31/31 ok, 0 problems.
5. PASS: preview https://dc-landing-pxtkgb58h-chuu3112s-projects.vercel.app (built from d0bfe88, team chuu3112s-projects); `node scripts/deploy-check.mjs <preview> --header "x-vercel-protection-bypass: …"` 31/31 ok, 0 problems (without the header the preview's protection answers 302, as expected).
6. PASS, on two scratch copies of the same tree: with the shared `@media (max-width: 900px)` block changed to 960px the gate exits 1 with 83 failing rows (the breakpoint row at every width, page height +1826 px at 950, block tops and heights); with `.terminal { width: 110% }` it exits 1 with 5 failing rows, `how.terminal.w` at every width (+35 to +70 px). Unchanged, the same tree exits 0 (Proof 1).
7. PASS: `sdlc-check.py converge` (run after this Result was written; see the commit that records it).
8. PASS: the owner looked at the result and accepted it on 2026-11-13 ("đạt yêu cầu").

Reviews: every task T1–T8 has a reviewer PASS (T1 at 4b920f1 and T2 at 138bc7e were recorded as `none` by the loop hook before coding-playbook PR #72/#73 fixed it; T3–T8 are on record in the run). FAILs fixed: T2 r1, T3 r1–r2, T4 r1, T5 r1, T7 r1.

Open MINOR items from the reviews, left for a follow-up: the h1 still does not grow with text size above about 1333 px (the vw term wins); `ZOOM_EDGE_SKIP` `.hero .ph` also exempts the pause control and tags; the zoom check never opens the FAQ answers and does not cover the badge; the price sticker box and the how step circle at 390 px / 200%; dead rules at site.css (the T8 review's line 723); squeeze threshold of 4 px.
Owner to confirm the copy: kit items 02, 03, 05, 08 and the styles/self-check lines describe what the kit does ("never touches a file that is not on the list", "nothing ships until all three pass", ...).

