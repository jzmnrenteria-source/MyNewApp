# FitQuest

FitQuest matches people with the right gym in Miami: a landing page, a four-question quiz that ranks gyms, a map to explore them, gym pages, a side-by-side compare, a saved shortlist, accounts, and tools for gym owners and admins.

Built with [Vite](https://vite.dev), [Vue](https://vuejs.org), [Leaflet](https://leafletjs.com) (map) and [Supabase](https://supabase.com) (database and sign-in). The landing, thank-you and 404 pages are plain HTML; each app page is a small Vue app.

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
  - `account/`: email-link sign-in, sent messages and owner request status
  - `owner/`: gym owners claim a listing, edit their details and read messages
  - `admin/`: approve owner requests, edit or add gyms (admins only)
- `src/shared/`: code used by several pages
  - `data.js`: the gyms, neighborhoods and price levels. **Review before launch** (see below)
  - `questions.js`, `scoring.js`: the quiz questions, scoring and shareable-link format
  - `filters.js`, `compare.js`, `format.js`: Explore filters, compare rows, display helpers
  - `store.js`: saved gyms, notes, the compare list and last quiz answers, kept in the browser and synced to the account when signed in
  - `supabase.js`, `auth.js`, `gyms.js`: the database connection, sign-in, and the live gym list (falls back to `data.js` if the database can't be reached)
  - `features.js`: the switch for the gym-page contact form and claim link
  - `MapView.vue`, `GymActions.vue`: the map and the View / Save / Compare buttons
- `tests/`: tests for the data, scoring, filters, compare and shareable links
- `public/`: files served as-is:
  - `styles.css`: design tokens (Barlow / Barlow Condensed, steel-blue accent), light and dark themes, shared styles
  - `theme.js`: the Light / System / Dark switch (the choice is remembered in the browser)
  - `fonts/`: Barlow and Barlow Condensed, hosted with the site (no Google Fonts request)
  - `og-image.png`, `favicon.svg`, `robots.txt`, `sitemap.xml`
- `supabase/migrations/`: the database tables, access rules and seed data (already applied to the FitQuest project)
- `.env`: the Supabase project address and publishable key. Both are public by design; never put the secret key here
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

Saved gyms and notes live in the visitor's browser, and sync to their account when they sign in (merging with anything already saved there). Signing out clears them from that browser. The compare list stays in the browser.

## Accounts, owners and admins

- **Sign-in:** visitors enter their email and click the link they receive. No passwords.
- **Gym owners** request to claim a listing (or add a new gym) on `/owner/`. Once an admin approves, they can edit their gym's description, hours, pricing, website, phone and day-pass offer, and read messages sent from their gym page. Name, address, price level and training styles stay admin-only.
- **Messages:** signed-in visitors can request a day pass or ask a question on any gym page (10 a day per account). Owners see them on `/owner/`; admins see recent ones on `/admin/`.
- **Admins** approve or reject requests and edit or add any gym on `/admin/`. Admin rights are granted in the database (`private.admin_emails`), never from the app.
- **Who can see what** is enforced by row level security in the database, not just the pages. See `supabase/migrations/`.

### Supabase settings to check

- **Authentication → URL Configuration:** set the Site URL to the live site address and add `https://<your-site>/account/` (and `http://localhost:5173/account/` for local development) to the Redirect URLs. Sign-in links won't return to the site otherwise.
- **Email:** Supabase's built-in email sender only allows a few emails an hour. Connect your own SMTP provider (Authentication → Emails) before launch.
- **Free plan:** projects pause after a week without activity. The site keeps working on the built-in gym list while paused, but sign-in and owner tools stop until it's restored.

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
