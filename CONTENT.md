# CONTENT: every editable string, number and setting

All copy lives in `index.html`. Prices, deadline and checkout come from data attributes on the `<html>` tag and are read by `site.js`; edit them there, nowhere else. Every number shown as a claim (views, task counts) is a **sample** until launch, and the footer says so.

## Settings (on `<html>`)

| Section | Field | Current value | Where in index.html |
|---|---|---|---|
| Settings | Early price (number, no `$`) | `19` | `<html data-price>` (line 2) |
| Settings | Later price | `39` | `<html data-price-later>` |
| Settings | Early-price deadline (must be real) | `2026-11-30T23:59:59+07:00` | `<html data-deadline>` |
| Settings | Checkout URL (CTA links) | `#price` | `<html data-checkout>` |

Derived by `site.js`: "save" = later minus early; after the deadline the price shows the later price and every `data-early` element (badge, ticker, countdowns, receipt early lines) is hidden and every `data-late` element shown. Each price span in the HTML has a fallback text (`$19`, `$39`, `$20`) that `site.js` overwrites.

## Copy

| Section | Field | Current value | Where in index.html |
|---|---|---|---|
| Head | Title | DC Agent Kit: one prompt, finished and checked work | `<title>` |
| Head | Meta description | DC Agent Kit is a folder of Claude Code skills and agents that turns one prompt into finished work that has already checked itself. | `meta[name=description]`, `og:*` |
| Header | Wordmark / chip | DONNIECHU / AGENT KIT | `.site-header .brand` |
| Header | Nav links | Proof, Styles, FAQ | `.site-header .nav` |
| Header | CTA | GET IT + price pill | `.site-header .btn` |
| Hero | Kicker | one prompt in, checked work out | `.kicker` in `#top` |
| Hero | H1 | ONE PROMPT. / REAL WORK DONE. (highlight on REAL WORK) | `h1#hero-title` |
| Hero | Subcopy | DC Agent Kit is a folder of Claude Code skills and agents. Type one line and it plans the job, builds it, checks its own work and hands back something finished. | `#top .lead` |
| Hero | Typed prompts (3) | build me a landing page for my newsletter / review this repo and fix what is weak / turn my notes into a weekly report | `site.js` `prompts`; first one also in `#typed` and the `.sr-only` line in `.prompt` |
| Hero | Prompt chip | RUN | `.run-chip` |
| Hero | CTA | GET THE KIT + price pill | `#top .btn-lg` |
| Hero | Early badge | EARLY PRICE, SAVE $20, ends in countdown | `.badge-early` |
| Hero | Small line | Download right away, one payment, see how it works (#how) | `#top .fine` |
| Fan | View tags (samples) | 12,345 / 23,456 / 67,890 / 34,567 / 45,678 VIEWS | `.fan .tag` |
| Fan | Scene text | terminal lines, checklist, "ONE PROMPT" folder, self-check 6/8, skill cards | `.fan .scene` |
| Ticker | Phrases | THEN price-later, SAVE x TODAY, EARLY PRICE price, ENDS IN countdown | `.ticker-group` (three copies, two `aria-hidden`) |
| Doubts band | H2 | YOU MIGHT BE THINKING... | `h2#think-title` |
| Doubts band | Pills | 01 THEY NEVER FINISH, 02 IT'S HARD TO SET UP, 03 IT ALL LOOKS THE SAME | `.pills` |
| Proof (#proof, #myth-1) | Struck quote | "AGENTS NEVER FINISH THE JOB." | `#myth-1 .strike` |
| Proof | Claim (sample number) | MINE SHIPPED 1,234+ CHECKED TASKS IN A WEEK. | `h2#proof-title` |
| Proof | Subcopy | Every one came out of this folder from a single prompt... | `#proof .lead` |
| Proof | 3 cards (sample numbers) | 612 A landing page, start to ship (build style); 415 A repo review with fixes (review style); 207 Notes into a weekly report (write style) | `.proof-cards` |
| Proof | Footnote + handle | Sample numbers until launch. Follow the real ones on @donniechublog (https://x.com/donniechublog) | `.footnote` |
| How (#how, #myth-2) | Struck quote | "IT'S HARD TO SET UP." | `#myth-2 .strike` |
| How | H2 / subcopy | YOU TYPE ONE LINE. / A plan, the build, a self-review and the hand-over... | `h2#how-title`, `#how .lead` |
| How | Terminal prompt and 6 steps | Read the brief; Write the plan; Build the pieces; Run the checks; Review its own work; Hand it back (each with a mono note) | `#terminal` |
| How | Phone mock | set up once | `.phone-tall` |
| How | 3-step row | LOAD THE FOLDER / SAY WHAT YOU NEED / SHIP THE RESULT, each with one sentence | `.three-steps` |
| Styles (#styles, #myth-3) | Struck quote | "IT ALL LOOKS THE SAME." | `#myth-3 .strike` |
| Styles | H2 | THREE STYLES. YOUR RULES. | `h2#styles-title` |
| Styles | Style cards (3) | BUILD, WRITE, RESEARCH | `.style-cards` |
| Styles | Descriptions + "Best for" chips | one block per style | `[data-style-desc]` |
| Styles | Preview panels | one per style | `[data-style-preview]` |
| Styles | Swatch line | Blue, ink, yellow, paper or your own colour. One setting, and your handle goes on every report. | `.swatch-row` |
| Checks | H2 / paragraph | IT PLANS FIRST, THEN CHECKS ITS OWN WORK / Ask an agent for a job... | `h2#check-title`, `.check-grid .lead` |
| Checks | 3 checklist items | A plan before the build; Two gates: scope and quality; A reviewer that is not the builder | `.checklist` |
| Checks | Report card | file name, FIXING chip, gauge 6/8 (ring in `site.css` `.ring-fg`), 6 rows (4 pass, "2 found", "too low") | `#report` |
| Kit | H2 | WHAT'S IN THE KIT | `h2#kit-title` |
| Kit | 8 items | PLAN SKILL, BUILDER AGENT, REVIEW AGENT, CHECK SCRIPTS, TASK CONTRACTS, MEMORY NOTES, PROJECT TEMPLATE, GUIDED SETUP, each with one line | `.kit-list` |
| Price (#price) | Receipt | title, 8 checked items, price, countdown, "you save today", "then", "pay once, no subscription", barcode, "thank you, now go build" | `.receipt` |
| Price | H2 / paragraph / CTA | SET IT GOING, COME BACK TO DONE WORK / Start a job, make dinner... | `h2#price-title`, `.price-copy` |
| Price | Requirement pills | Claude Code; A Claude plan; Mac, Windows or Linux | `.req` |
| FAQ (#faq) | 9 questions and answers | what you do; brief; which app/plan; coding; file timing; languages; client work; price; numbers | `.faq-grid details` |
| Final band | H2 / line | STOP PROMPTING. START SHIPPING. / One folder, three styles, and work you never had to check twice. | `h2#final-title`, `.final .lead` |
| Final band | Countdown boxes, note | DAYS/HRS/MIN/SEC, "left at $19. Then it's $39." | `.cd-row` |
| Footer | Product and handle | DC Agent Kit, @donniechublog | `.foot-l` |
| Footer | Honesty note | Every number on this page is a sample until launch. What you get out of the kit depends on what you ask it to do. | `.foot-r` |
| Footer | Line | >_ vibe working & agentic AI | `.foot-line` |
| Floating badge | Ring text | GET THE KIT (repeated) | `#float-badge textPath` |

## Before launch

- Replace the sample numbers (fan tags, proof claim and cards) with real ones or remove them.
- Set `data-checkout` to the real checkout URL and `data-deadline` to a real deadline. Do not extend the deadline to keep urgency alive.

## Modern Web Guidance used

Looked up with `npx -y modern-web-guidance@latest search` and `retrieve`.

| Guide id | What it changed |
|---|---|
| `accordion` | FAQ is native `<details name="faq">` (exclusive), summary without a heading inside, custom `+`/`−` box drawn in `summary::after`, slide animation on `::details-content` only inside `@supports` and `prefers-reduced-motion: no-preference`. No arrow-key handling added. |
| `motion` | Animations only inside `prefers-reduced-motion: no-preference` (ticker, caret blink, badge spin, reveal, ring fill), static state otherwise; transform/opacity/translate only; a visible Pause/Play button for the ticker (WCAG 2.2.2). |
| `scroll-entry-exit-effects` | Read for scroll reveal. Not used as written: a view-timeline hides items again below the viewport after a scroll-up, so reveal is a one-way `IntersectionObserver` (`.reveal` / `.in`) with everything visible without JS or under reduced motion. |
| `optimize-image-priority` | Only the wave mascot has `fetchpriority="high"` and no `loading`; every other mascot is `loading="lazy"` with no `fetchpriority`; all images have width/height. |
| `accessibility` | Toggle cards are `<button aria-pressed>`; the countdown sits in no live region, one polite hourly message in a single `aria-live` region; decorative fan and mock scenes are `aria-hidden`; visible focus. |
| `performance` (web fonts) | One Google Fonts `<link>` with `preconnect` (+ `crossorigin` for gstatic) and `display=swap`; only the weights used. Self-hosted preload of the fonts was not done (no external files in the repo). |
| `visually-stable-font-fallbacks` | `font-size-adjust: from-font` on `body`, with metric-close fallback stacks (Impact for Anton, system UI for Inter, ui-monospace for JetBrains Mono). |

The `countdown timer live region` search returned `accessibility` (live regions) and `calculate-event-differentials` (Temporal); Temporal is not Widely available, so the countdown uses plain `Date` arithmetic.

## Legacy-patterns checklist (webdev-playbook) walk

No hand-built modal or tooltip, no float/table layout, no jQuery or polyfill, no `var`/XHR, no inline script or style block, no `innerHTML` (only `textContent`). New controls (style cards, ticker button, FAQ summaries, CTAs) have names, keyboard paths and visible focus. Images and fonts have size hints and lazy loading below the fold. Newer CSS (`::details-content`, `interpolate-size`) sits inside `@supports`. Not run: screen-reader pass, Lighthouse, cross-browser (Safari/Firefox) check.
