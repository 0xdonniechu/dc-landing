# dc-landing

One-page static landing site for DC Agent Kit by donniechu (@donniechublog): plain `index.html`, `site.css` and `site.js`, no framework, no build step, deployed as static files on Vercel.

- `npm install` once (installs the check's browser driver only).
- `npm run dev` serves the folder at http://localhost:4173.
- `npm run check` loads the page at desktop, mobile and reduced-motion settings and fails on overflow, console errors, missing alt text and similar; screenshots land in `.check/`.
- Prices, deadline and checkout URL are data attributes on `<html>`; every other editable string is listed in `CONTENT.md`.
