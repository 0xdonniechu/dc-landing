# CONTENT: every editable string, number and setting

All copy lives in `index.html`. Prices, deadline and checkout come from data attributes on the `<html>` tag and are read by `site.js`; edit them there, nowhere else. Every number shown as a claim (views, task counts) is a **sample** until launch, and the footer says so.

## Settings (on `<html>`)

| Section | Field | Current value | Where in index.html |
|---|---|---|---|
| Settings | Early price (number, no `$`) | `19` | `<html data-price>` (line 2) |
| Settings | Later price | `39` | `<html data-price-later>` |
| Settings | Early-price deadline (must be real) | `2026-11-30T23:59:59+07:00` | `<html data-deadline>` |
| Settings | Checkout URL (CTA links) | `#price` | `<html data-checkout>` |

Derived by `site.js`: the static HTML shows the **regular** price (`$39`) and keeps every early-price piece (badge, ticker, countdowns, receipt early lines, FAQ early answer) `hidden` with a `data-early` mark; `data-late` pieces are visible. `site.js` reveals the early pieces, swaps the price spans to the early price, and computes "save" (later minus early) only while `data-price` and `data-price-later` are valid numbers and `data-deadline` is a valid date in the future. A missing or invalid price keeps the HTML's static text; a missing or invalid deadline means no early price at all. At expiry (even with the page open) the early pieces hide again, the prices show the regular price, and the screen-reader status line says only that the price is now the regular price. The float badge and ticker accessible names are built from the same data in every state, never hard-coded. No-JS visitors and crawlers therefore never see early pricing.

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
| Hero | Subcopy | DC Agent Kit is a folder of Claude Code skills and agents. Type one line and get back finished work that has checked itself. | `#top .lead` |
| Hero | Typed prompts (3) | build me a landing page for my newsletter / review this repo and fix what is weak / turn my notes into a weekly report | `site.js` `prompts`; first one also in `#typed` and the `.sr-only` line in `.prompt` |
| Hero | Prompt chip | RUN | `.run-chip` |
| Hero | CTA | GET THE KIT + price pill | `#top .btn-lg` |
| Hero | Early badge | EARLY PRICE, SAVE $20, ends in countdown | `.badge-early` |
| Hero | Small line | Download right away, one payment, see how it works (#how) | `#top .fine` |
| Fan | View tags (samples) | 12,345 / 23,456 / 67,890 / 34,567 VIEWS (four phones: left, inner left, centre, inner right) | `.fan .tag` |
| Fan | Scene text | terminal lines, launch checklist, self-check 6/8 (the centre phone plays the video instead) | `.fan .scene` |
| Hero | Mascot | waving, `assets/mascot/wave-tall.webp`, at the right of the fan | `.mascot-wave` |
| Fan | Centre phone video | 12 s muted loop, 540x960, no audio: typed prompt, plan ticks, self-check 6/8 to 8/8, blue SHIPPED card with the mascot. Files `assets/video/hero-loop.webm` (VP9), `hero-loop.mp4` (H.264), `hero-loop-poster.webp` (frame 0). Plays only in view and never under reduced motion; toggle chip "Pause"/"Play"; screen-reader line in `figcaption`. Re-render below. | `#hero-video`, `#hero-video-ctl`, `.phone-c figcaption`; `site.js` "hero video" |
| Ticker | Phrases | THEN price-later, SAVE x TODAY, EARLY PRICE price, ENDS IN countdown; its `aria-label` is built in `site.js` from the price and deadline data; a "Pause ticker" button | `.ticker-group` (three copies, two `aria-hidden`), `#ticker-ctl` |
| Watch (#watch) | Kicker / H2 | watch it / THE WHOLE KIT, EXPLAINED IN 60 SECONDS | `.watch .kicker`, `h2#watch-title` |
| Watch | Video (click to play, with sound) | The owner's video 1: the SuperAgent.Social promo, 63 s, Vietnamese voice-over and burned-in subtitles, `assets/video/reels/reel-1.mp4` with `reel-1-poster.webp`; it plays centred in the landscape frame on the brand background. `aria-label` on the `<video>` and on the button (name, length, language); button text "Play with sound". | `#watch-video`, `#watch-play`; `site.js` "media" |
| Watch | CTA | GET THE KIT + price pill | `.watch .btn-lg` |
| Doubts band | Kicker / H2 | hmm... / YOU MIGHT BE THINKING... | `.think .kicker`, `h2#think-title` |
| Doubts band | Index links | 01 THEY NEVER FINISH, 02 IT'S HARD TO SET UP, 03 IT ALL LOOKS THE SAME (to `#myth-1..3`) | `.idx` |
| Doubts band | Mascot | thinking, `assets/mascot/thinking.webp` | `.think-pres` |
| Proof (#proof, #myth-1) | Struck quote | "AGENTS NEVER FINISH THE JOB." | `#myth-1 .strike` |
| Proof | Claim (sample number) | MINE SHIPPED 1,234+ CHECKED TASKS IN A WEEK. | `h2#proof-title` |
| Proof | Subcopy | Every one came out of this folder from a single prompt, and passed its own checks before I saw it. Here are three of them. | `#proof .lead` |
| Proof | 3 tickets (sample numbers) | 612 / 415 / 207 TASKS DONE with the tags build / review / write style, a 100x173 thumbnail (the video's poster) and "PLAY" | `.tickets .big-num`, `.num-label`, `.card-tag` |
| Proof | Ticket videos (open in a dialog) | A plain click opens the modal `<dialog>`: ticket 1 plays `assets/video/reels/reel-2.mp4` (SuperAgent.Social promo 2, 62 s), ticket 2 `reel-3.mp4` (promo 3, 52 s), both with sound, Vietnamese voice-over and subtitles; ticket 3 the hero loop (no sound, the dialog says so). Each ticket's `data-label` names the video; without JS the link opens the mp4. | `.tickets a.vt[href][data-poster][data-label]`, `#media-dialog`; `site.js` "media" |
| Proof | Footnote + handle | Sample numbers until launch. Follow the real ones on @donniechublog (https://x.com/donniechublog) | `.footnote` |
| How (#how, #myth-2) | Struck quote | "IT'S HARD TO SET UP." | `#myth-2 .strike` |
| How | H2 / subcopy | YOU TYPE ONE LINE. / A plan, the build, a self-review and the hand-over... | `h2#how-title`, `#how .lead` |
| How | Terminal prompt, 6 steps, result line | Read the brief; Write the plan; Build the pieces; Run the checks; Review its own work; Hand it back (each with a mono note); "finished folder and report, ready to read" | `#terminal` |
| How | Phone mock | set up once | `.phone-tall` |
| How | 3-step row | LOAD THE FOLDER / SAY WHAT YOU NEED / SHIP THE RESULT, each with one sentence | `.three-steps` |
| Styles (#styles, #myth-3) | Struck quote | "IT ALL LOOKS THE SAME." | `#myth-3 .strike` |
| Styles | H2 | THREE STYLES. YOUR RULES. | `h2#styles-title` |
| Styles | Style cards (3) | BUILD, WRITE, RESEARCH | `.style-cards` |
| Styles | Descriptions + "Best for" chips | one block per style | `[data-style-desc]` |
| Styles | Preview panels | one per style | `[data-style-preview]` |
| Styles | Swatch line | Blue, ink, yellow, paper or your own colour. One setting, and your handle goes on every report. | `.swatch-row` |
| Checks | H2 / paragraph | IT PLANS FIRST, THEN CHECKS ITS OWN WORK / Ask an agent for a job on its own and you end up being the checker... | `h2#check-title`, `.check-grid .lead` |
| Checks | 3 checklist items | A plan before the build; Two gates: scope and quality; A reviewer that is not the builder | `.checklist` |
| Checks | Report card | file name, FIXING chip, gauge 6/8 (ring in `site.css` `.ring-fg`), 6 rows (4 pass, "2 found", "too low") | `#report` |
| Kit | H2 | WHAT'S IN THE KIT | `h2#kit-title` |
| Kit | 8 items | PLAN SKILL, BUILDER AGENT, REVIEW AGENT, CHECK SCRIPTS, TASK CONTRACTS, MEMORY NOTES, PROJECT TEMPLATE, GUIDED SETUP, each with one line (two columns of four) | `.kit-list` |
| Price (#price) | Receipt | title, 8 checked items, price, countdown, "you save today", "then", "pay once, no subscription", barcode, "thank you, now go build" | `.receipt` |
| Price | H2 / paragraph / CTA | SET IT GOING, COME BACK TO DONE WORK / Start a job, make dinner, come back to a finished folder and a report... | `h2#price-title`, `.price-copy` |
| Price | Requirement pills | Claude Code on your machine; Any plan that runs Claude; Mac, Windows or Linux | `.req` |
| FAQ (#faq) | 9 questions and answers | what you do; brief; which app/plan; coding; file timing; languages; client work; price; numbers | `.faq-grid details` |
| Final band | H2 / line | STOP PROMPTING. START SHIPPING. / One folder, three styles, and work you never had to check twice. | `h2#final-title`, `.final .lead` |
| Final band | Countdown boxes, note | DAYS/HRS/MIN/SEC, "left at $19. Then it's $39." | `.cd-row` |
| Footer | Product and handle | DC Agent Kit, @donniechublog | `.foot-l` |
| Footer | Honesty note | Every number on this page is a sample until launch. Results depend on what you ask. | `.foot-r` |
| Floating badge | Ring text | GET THE KIT (repeated); accessible name "Get the kit, [early price] $N" is built in `site.js` | `#float-badge textPath` |

## Re-rendering the hero video

The HyperFrames source lives in `video/` and is not published. After changing it:

```sh
cd video && npx hyperframes render -o renders/promo-master.mp4 -q delivery
ffmpeg -i renders/promo-master.mp4 -an -vf scale=540:960 -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -pix_fmt yuv420p ../assets/video/hero-loop.webm
ffmpeg -i renders/promo-master.mp4 -an -vf scale=540:960 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart ../assets/video/hero-loop.mp4
ffmpeg -i renders/promo-master.mp4 -vf scale=540:960 -frames:v 1 -c:v libwebp -quality 80 ../assets/video/hero-loop-poster.webp
```

Keep the video 540x960 (9:16) with no audio track, and the last frame matching frame 0 so the loop is seamless. The `width`/`height` on `<video>` must stay 540/960.

## Re-encoding the promo videos

`reel-1.mp4` plays in the watch section, `reel-2.mp4` and `reel-3.mp4` in the proof dialog. Keep each 720x1280 (9:16) with an AAC audio track; the `width`/`height` on the watch and dialog `<video>` must stay 720/1280. When a video changes, update its length in the watch `aria-label`s or the ticket's `data-label`, and its poster (the ticket thumbnail uses it too).

```sh
ffmpeg -i <src> -vf scale=720:1280:flags=lanczos -c:v libx264 -preset slow -crf 28 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 96k -ac 2 -movflags +faststart assets/video/reels/reel-N.mp4
ffmpeg -ss <t> -i <src> -frames:v 1 -vf scale=360:640 -c:v libwebp -quality 78 assets/video/reels/reel-N-poster.webp
```

## Before launch

- Replace the sample numbers (fan tags, proof claim and tickets, the report card) with real ones or remove them.
- Set `data-checkout` to the real checkout URL and `data-deadline` to a real deadline. Do not extend the deadline to keep urgency alive.

## Modern Web Guidance used

Looked up with `npx -y modern-web-guidance@latest search` and `retrieve`.

| Guide id | What it changed |
|---|---|
| `accordion` | FAQ is native `<details name="faq">` (exclusive), summary without a heading inside, custom `+`/`−` box drawn in `summary::after`, slide animation on `::details-content` only inside `@supports` and `prefers-reduced-motion: no-preference`. No arrow-key handling added. |
| `motion` | Animations only inside `prefers-reduced-motion: no-preference` (ticker, caret blink, badge spin, reveal, ring fill), static state otherwise; transform/opacity/translate only; a visible Pause/Play button for the ticker (WCAG 2.2.2). |
| `scroll-entry-exit-effects` | Read for scroll reveal. Not used as written: a view-timeline hides items again below the viewport after a scroll-up, so reveal is a one-way `IntersectionObserver` (`.reveal` / `.in`) with everything visible without JS or under reduced motion. |
| `optimize-image-priority` | Only the wave mascot has `fetchpriority="high"` and no `loading`; every other mascot is `loading="lazy"` with no `fetchpriority`; all images have width/height. |
| `accessibility` | Toggle cards are `<button aria-pressed>`; the countdown sits in no live region, one polite hourly message in a single `aria-live` region; decorative fan phones, tags and the hero video are `aria-hidden` (the pause chip and the one `figcaption` of the centre phone are not, so `.fan` itself is not hidden); visible focus. |
| `performance` (web fonts) | One Google Fonts `<link>` with `preconnect` (+ `crossorigin` for gstatic) and `display=swap`; only the weights used. Self-hosted preload of the fonts was not done (no external files in the repo). |
| `visually-stable-font-fallbacks` | `font-size-adjust: from-font` on `body`, with metric-close fallback stacks (Impact for Anton, system UI for Inter, ui-monospace for JetBrains Mono). |
| `lazy-load-video-and-audio` | Watch and dialog videos: `preload="none"`, nothing requested before a click. Hero video: `preload="none"`, explicit `width`/`height` (no layout shift), poster, no `autoplay`; playback starts from an `IntersectionObserver` in `site.js`. `loading="lazy"` was not added (Chrome/Edge only, and the video is near the fold). |
| `efficient-background-processing` | Read for pausing off-screen work. Not used as written (`content-visibility` event); the video pauses when it leaves the viewport via `IntersectionObserver`, which the guide names for logic tied to visibility. |

The `countdown timer live region` search returned `accessibility` (live regions) and `calculate-event-differentials` (Temporal); Temporal is not Widely available, so the countdown uses plain `Date` arithmetic.

## Legacy-patterns checklist (webdev-playbook) walk

No hand-built modal or tooltip, no float/table layout, no jQuery or polyfill, no `var`/XHR, no inline script or style block, no `innerHTML` (only `textContent`). New controls (style cards, ticker button, FAQ summaries, CTAs) have names, keyboard paths and visible focus. Images and fonts have size hints and lazy loading below the fold. Newer CSS (`::details-content`, `interpolate-size`) sits inside `@supports`. Not run: screen-reader pass, Lighthouse, cross-browser (Safari/Firefox) check.

## Baseline notes

Features used that are Newly available, not Widely available. Each is guarded or degrades harmlessly:

- `<details name="faq">` (exclusive accordion): in a browser without it each question simply opens independently; every answer stays reachable.
- `font-size-adjust: from-font`: inside `@supports (font-size-adjust: from-font)`; without it the fallback font stacks just reflow a little more when the web font loads.
- `text-wrap: pretty` (final headline): inside `@supports (text-wrap: pretty)`; without it the headline wraps as normal text.
- `::details-content` and `interpolate-size` (accordion slide): inside `@supports` and `prefers-reduced-motion: no-preference`; without them the answer opens instantly.
