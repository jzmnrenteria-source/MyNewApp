# FitQuest

FitQuest matches people with the right gym in Miami: a landing page, a four-question quiz that ranks gyms, a map to explore them, gym pages, a side-by-side compare and a saved shortlist.

Built with [Vite](https://vite.dev), [Vue](https://vuejs.org) and [Leaflet](https://leafletjs.com) (map). The landing, thank-you and 404 pages are plain HTML; each app page is a small Vue app.

## Files

- `index.html`: the landing page, with the Netlify Forms waitlist
- `thanks.html`: the page people see after joining the waitlist
- `404.html`: shown by Netlify for any address that doesn't exist
- App pages, each an `index.html` shell plus a Vue app in `src/<page>/`:
  - `quiz/`: the four-question quiz and ranked results (results shareable as a link)
  - `explore/`: filters, a ranked list and the map
  - `gym/?id=…`: one gym's profile
  - `compare/`: up to 4 gyms side by side (shareable as `/compare/?ids=a,b`)
  - `saved/`: the shortlist with notes
- `src/shared/`: code used by several pages
  - `data.js`: the gyms, neighborhoods and price levels. **Review before launch** (see below)
  - `questions.js`, `scoring.js`: the quiz questions, scoring and shareable-link format
  - `filters.js`, `compare.js`, `format.js`: Explore filters, compare rows, display helpers
  - `store.js`: saved gyms, notes, the compare list and last quiz answers, kept in the visitor's browser (localStorage)
  - `MapView.vue`, `GymActions.vue`: the map and the View / Save / Compare buttons
- `tests/`: tests for the data, scoring, filters, compare and shareable links
- `public/`: files served as-is:
  - `styles.css`: design tokens (Barlow / Barlow Condensed, steel-blue accent), light and dark themes, shared styles
  - `theme.js`: the Light / System / Dark switch (the choice is remembered in the browser)
  - `fonts/`: Barlow and Barlow Condensed, hosted with the site (no Google Fonts request)
  - `og-image.png`, `favicon.svg`, `robots.txt`, `sitemap.xml`
- `netlify.toml`: build settings, security headers and cache headers

## Gym data

The 20 gyms in `src/shared/data.js` come from public listings and press (each has a source link). None has been confirmed with the gym, so:

- Prices are price levels ($ to $$$$) with estimated monthly ranges, not quoted prices
- Distances are approximate, measured between neighborhood centers
- There are no star ratings, opening hours, packages or class schedules, because no reliable figures were available. Gym pages say so
- There are no exact coordinates, so the map shows one marker per neighborhood with a gym count, not a pin per gym

The results page tells visitors this. Check the list before you promote the quiz.

## Map

The map uses Leaflet with OpenStreetMap's free tiles. That service is meant for light use, and the map credit must stay visible. If traffic grows, switch to a hosted tile provider by changing the tile URL in `src/shared/MapView.vue`. In dark mode the tiles are darkened with a CSS filter.

## Saved and compare

Saved gyms, notes and the compare list live in the visitor's browser only. They don't follow people to other devices until accounts arrive (Phase 4).

## How scoring works

Each gym gets up to 100 points: goal 35, budget 25, what matters most 20, schedule 10, distance 10. The weights are at the top of `src/shared/scoring.js`.

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
