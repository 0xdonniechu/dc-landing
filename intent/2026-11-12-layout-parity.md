---
status: shipped (merged to main 2026-11-13, no PR: fast-forward on the owner's approval)  # draft → approved → planned → building → verified → shipped (PR #n)
---
# Layout parity with the reference site

## Problem
The owner asked for a page "like https://www.itsflxkzy.com/" with our brand, mascot and products.
The first build was made from screenshots described in words. No measurement of the reference was taken, and no check compared the two. The result passed every gate but drifts from the reference:
- Breakpoints were invented (ours 960/720/560 px, the reference 1100/900/700 px).
- A whole section is missing: the reference's "The whole kit in 60 seconds" video with sound.
- At 950 px our page is 11 137 px tall, against the reference's 7 705 px. The "how" section stacks into one column where the reference keeps two.
- The proof cards became tall video cards (section 1 245 px against 674 px at 1440).
- The hero side phones are 289×604 against the reference's 267×394 and 271×442.

The owner's rule: the media can be illustrative, but every component's size and position must match the reference.

## Outcome
The page has the reference's structure and geometry, with our brand, copy, mascot and media.

Success criteria, all measured by one script (`scripts/parity.mjs`) that loads the reference and our page in the same local Chromium at the widths 1440, 1100, 950, 768 and 390 px:
1. **Sections:** the same list of top-level blocks in the same order at every width. There are 14: header, hero, ticker, watch, myth/night, proof, how, styles, self-check, inside, price, FAQ, final, footer (the plan made the ticker its own block), plus the floating badge.
2. **Section heights:** the height of every section is within ±3% of the reference (or ±24 px, whichever is larger), and its top within ±1% (or ±24 px), at every width. The ±1% on tops is an owner decision of 2026-11-12, tightened from ±3%.
3. **Components:** a named map pairs each of our components with the reference's. It covers headings, prompt bar, CTA, phones, mascot, ticker, terminal, step list, cards, video frame, price box, FAQ items and badge. Each paired box is within ±12 px in position and ±4% in width and height at every width. The heading font size is within ±2%.
4. **Breakpoints:** our layout changes at the same widths as the reference (1100, 900, 700 px).
5. **Page height:** within ±1% of the reference at every width (owner decision 2026-11-12, tightened from ±3%).
6. **Existing gates:** `node scripts/check.mjs` (overflow, accessibility, reduced motion, no external requests), the video probes and `deploy-check` still pass.
7. **Report:** the script writes a side-by-side screenshot pair and a table of differences for every width. The owner looks at the pairs before the merge.

## Constraints
- **Geometry only.** The reference is measured for geometry (boxes, breakpoints, font sizes) only. Its code, images, text and fonts are not copied. Our colours, fonts (Anton, Inter, JetBrains Mono, Caveat), copy and mascot stay.
- **Text length.** Our copy may differ in wording, but each text block's length is kept close to the reference's (about ±10% characters), so it wraps to the same number of lines. Where a font's width makes a heading wrap differently, the component box rule (criterion 3) decides.
- **Media placement:**
  - The 60-second section plays the owner's video 1 (63 s, vertical, with sound) inside a frame of the reference's size.
  - The proof thumbnails play videos 2 and 3. The third card's thumbnail plays the hero loop.
  - A tap on a thumbnail opens the video large in a `<dialog>`.
  - The centre hero phone keeps the HyperFrames loop.
- **Unchanged rules:**
  - The web rules from CLAUDE.md still hold: baseline Widely available, no external scripts, every animation static under reduced motion, and the publish scope in `.vercelignore`.
  - Prices, the deadline and the checkout link stay in `<html data-*>`.
  - The sample numbers stay marked as samples.
- **Deploys:** preview first; production only with the owner's approval.
- **Process:** this chain (intent → plan with Tasks and Proof → build → verify) is the process. Every builder dispatch takes its contract from the plan (`dispatch.py … --task`).

## Out of scope
- Matching colours, fonts, illustrations or wording of the reference.
- Animation timing parity: motion exists where the reference has it, but its curves and durations are not measured.
- Real launch content (product name, prices, deadline, checkout URL, real numbers).
- A production deploy.
- Fixing the reference's own behaviour or mirroring its third-party scripts.

## Decisions taken by default (the owner's approval of this intent accepts them)
- Tolerances as in criteria 2, 3 and 5 (±3% section heights, ±1% section tops and page height, ±12 px / ±4% components, ±2% heading size).
- Video 1 is vertical, but the reference's 60-second frame is landscape. The frame keeps the reference's size, and the vertical video plays centred in it on a brand-coloured background.
- The proof card 3 thumbnail uses the hero loop, as there are only three owner videos and video 1 is in the 60-second section.
- No tracker ticket: this repo has no tracker project.

## Open questions
None.
