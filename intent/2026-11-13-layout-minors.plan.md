status: planned (owner approval 2026-11-13, "xử lý luôn") # draft → planned → building → verified

# Plan: layout parity MINORs

Intent: `intent/2026-11-13-layout-minors.md` (approved). Branch: `layout-minors`. Plane: LPP-3.

## Files
1. `scripts/probe-media.mjs`: the new and tighter tests first, so each fix is seen failing before it is fixed.
2. `site.css` (and `index.html` only if a fix needs markup): the fixes.
3. `CLAUDE.md`, `CONTENT.md`, this plan: docs and Result.

## Risks
- A heading or sticker fix moves a box at the default root: `parity.mjs` at all 5 widths catches it.
- A stricter squeeze or overlap test flags correct layout (false alarm): it must pass at HEAD with the fixes, and the
  builder reports every exemption added, with its reason.
- A test that cannot fail: each new test is shown failing once on a scratch copy without the fix (bite test).

## Tasks

### T1 (builder) Tests and fixes
- allow: `site.css` `index.html` `scripts/probe-media.mjs`
- check: `node scripts/check.mjs`
- check: `node scripts/probe-media.mjs`
- check: `systemd-run --user --scope -q -p MemoryMax=4G node scripts/parity.mjs`

The items (review notes from the layout parity run):
1. `--fs-h1: clamp(2.75rem, 6.6vw, 5.94rem)` (site.css:28): the vw term wins above about 1333 px, so the h1 is 95.04 px
   at 1440 at 16, 24 and 32 px roots. Keep every size at the 16 px root; make the h1 grow with the root at every width
   (at 1440 / 32 px root at least 1.5× its 16 px size). `--fs-h2` and `--fs-h2-xl` are px clamps with the same fault:
   same fix. A probe case measures the headings at 16 and 32 px roots at the 5 widths.
2. `ZOOM_EDGE_SKIP` has `.hero .ph`, which also exempts the pause control (`.video-ctl`) and the tags. Narrow it to the
   phone frames. The edge test also runs at 360 and 320 px; at a 32 px root the control ran to 370 of 360 and 350 of
   320: keep it inside the page.
3. At 701–900 px with the default root the pause control covers the ▶ of "see how it works" (`elementFromPoint` at 10%
   of the link's width returns `BUTTON.video-ctl`). New probe case: for every link and button in the hero,
   `elementFromPoint` at 10%, 50% and 90% of its width (vertical centre) returns it or a child, at the 5 widths plus
   701 and 900, at 16/24/32 px roots. Fix the control's place within parity's tolerance.
4. The zoom check never opens the FAQ answers (closed `details` are skipped) and has no `badge` block: run it with every
   `details` open (remove `name` first so they can all be open), and add `badge` to `ZOOM_BLOCKS`.
5. The zoom check compares only text with text. Add: a decorative box (the price sticker `.mascot-money`, the hero
   mascot and tags) must not cover a pill, a button or a link of its block (box intersection over 2 px either way,
   using the visible box). Today the sticker's box overlaps a pill edge by 7×12 px at 950 px even at the 16 px root.
   Fix within parity's tolerance.
6. The squeeze test fails only text narrower than 4 px. Tighten it so it fails the T6 styles squeeze (revert the
   `#styles .wrap` container query of 3aa9de9 in a scratch copy: the styles text column is about 287 px at 950 px with a
   32 px root, about 13 characters a line) and passes at HEAD. Say the rule chosen (for example a column under N
   characters of its own font size that wraps).
7. At 390 px with a 32 px root each how step's check circle sits alone on a row and its label wraps below it
   (site.css about 395–398, the label's `flex: 1 1 auto`). Keep circle and first line on one row; a probe case checks
   it at every width and root.
8. Dead rule: `.faq-col:first-child details:last-child { border-bottom: 0; }` in the 900 px block loses to
   `.faq-grid .faq-col:first-child details:last-child` (site.css about 593). Remove the dead one and keep the result
   the same (check what the 900 px layout should show at the end of the first column).

For each new test: show it failing on a scratch copy without the fix (outside the tree), then passing. Report the
counts, each exemption with its reason, and the bite results.

### T2 (main) Docs and Result
- allow: `CLAUDE.md` `CONTENT.md` `intent/2026-11-12-layout-parity.plan.md`
- check: `python3 -c "print('docs')"`

`CLAUDE.md` Verify names the new zoom-check cases; the old plan's Result points its MINORs to this plan and records the
owner's copy confirmation.

## Proof
1. `systemd-run --user --scope -q -p MemoryMax=4G node scripts/parity.mjs` exits 0 at all 5 widths.
2. `node scripts/check.mjs` exits 0.
3. `node scripts/probe-media.mjs` exits 0, with the new cases (headings, hit test, decorative boxes, open FAQ, badge,
   step row, tighter squeeze, edge at 360/320).
4. Bite tests: each new or tighter test fails on a scratch copy without its fix.
5. Preview deploy of the merged `main`; `node scripts/deploy-check.mjs <preview> --header …` exits 0.
6. `sdlc-check.py converge` passes.

## Result
