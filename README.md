# FitQuest

FitQuest matches people with the right gym in Miami: a landing page plus a four-question quiz that ranks gyms.

Built with [Vite](https://vite.dev) and [Vue](https://vuejs.org). The landing, thank-you and 404 pages are plain HTML; the quiz is a Vue app.

## Files

- `index.html`: the landing page, with the Netlify Forms waitlist
- `thanks.html`: the page people see after joining the waitlist
- `404.html`: shown by Netlify for any address that doesn't exist
- `quiz/index.html` + `src/quiz/`: the quiz
  - `data.js`: the gyms, neighborhoods and price levels. **Review before launch** (see below)
  - `questions.js`: the four questions and their answer options
  - `scoring.js`: how gyms are scored and ranked, and the shareable-link format
  - `App.vue`, `Results.vue`: the quiz steps and the ranked results
- `tests/scoring.test.js`: tests for the data, scoring and shareable links
- `public/`: files served as-is:
  - `styles.css`: design tokens (Barlow / Barlow Condensed, steel-blue accent), light and dark themes, shared styles
  - `theme.js`: the Light / System / Dark switch (the choice is remembered in the browser)
  - `fonts/`: Barlow and Barlow Condensed, hosted with the site (no Google Fonts request)
  - `og-image.png`, `favicon.svg`, `robots.txt`, `sitemap.xml`
- `netlify.toml`: build settings, security headers and cache headers

## Gym data

The 20 gyms in `src/quiz/data.js` come from public listings and press (each has a source link). None has been confirmed with the gym, so:

- Prices are price levels ($ to $$$$) with estimated monthly ranges, not quoted prices
- Distances are approximate, measured between neighborhood centers
- There are no star ratings or opening hours, because no reliable figures were available

The results page tells visitors this. Check the list before you promote the quiz.

## How scoring works

Each gym gets up to 100 points: goal 35, budget 25, what matters most 20, schedule 10, distance 10. The weights are at the top of `src/quiz/scoring.js`.

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # run the tests
npm run build    # production build into dist/
```

## Deploy to Netlify

Netlify reads `netlify.toml`: it runs `npm run build` on Node 22 and publishes `dist/`. Nothing to change in the dashboard.

Waitlist signups show up under **Forms** in your Netlify dashboard.

`.npmrc` sets `legacy-peer-deps=true` to work around an npm bug ("Cannot read properties of null (reading 'edgesOut')") when installing vitest.

## Changing the site address

The full address `https://fitq2026.netlify.app` appears in `index.html` and `quiz/index.html` (canonical link and share tags), and in `public/robots.txt` and `public/sitemap.xml`. Search for it and replace it when you add a custom domain.
