---
status: approved  # draft → approved → planned → building → verified → shipped (PR #n)
---
# Layout parity: the review MINORs

## Problem
The layout parity work (`intent/2026-11-12-layout-parity.md`, shipped) left MINOR review items open: the h1 stops
growing with the user's text size above about 1333 px; the zoom check skips the hero pause control, never opens the
FAQ answers, does not cover the badge, compares only text with text (the price sticker's box can sit on a pill) and
calls text "squeezed" only below 4 px; the hero pause control covers the ▶ of "see how it works" at 701–900 px; the how
step circle sits alone on a row at 390 px with a 32 px root; a dead rule is left in `site.css`.

## Outcome
- At the default 16 px root every width measures as before: `scripts/parity.mjs` passes at all 5 widths.
- Headings grow with the root at every width: at 1440 px with a 32 px root the h1 is at least 1.5 times its 16 px size.
- The zoom check covers the pause control and tags, the open FAQ answers and the badge; it fails a squeezed column that
  reads badly (it fails on the T6 styles squeeze when that fix is reverted) and a decorative box that covers a pill or
  a button; every such test passes at HEAD.
- Nothing covers the hero links: each of the hero's links and buttons answers a click at its left, centre and right.
- The how step circle and the first line of its label share a row at every width and root size.
- The dead rule is gone.

## Constraints
Breakpoints 1100/900/700 and the rem rule stay (`CLAUDE.md`); Baseline Widely available; no new dependency; no change
to `<html data-*>`, prices, the checkout link or the copy.

## Out of scope
New content, real product information and the real videos (the owner sends them later); production deploy (the site
goes public only with that content); the centre tag over the CTA corners at 768 px (the reference does the same).

## Open questions
None. Owner decision 2026-11-13: "xử lý luôn" (fix the MINORs now); the copy claims are confirmed ("no problem").
- Tracker: Plane LPP-3.
