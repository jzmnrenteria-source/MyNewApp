# FitQuest roadmap

Each phase ends with a quality check. The next phase starts only after the check passes.

## Decisions

- **Framework (from Phase 2):** Vite + Vue. The FitQuest design artifact's screens are already written in Vue.
- **Maps (Phase 3):** Leaflet with OpenStreetMap-based map tiles. No API key or billing. Map credits must stay visible on the map.
  If traffic grows, move the tiles to a hosted provider (most have a free tier) by changing one URL.

## Phase 0: Light, dark and system themes (built, waiting for the check)

- Light / System / Dark switch in the top bar on every page
- System follows the device setting; a chosen theme is remembered and applied with no flash

✅ Check: try all three on desktop and phone, reload after each, switch the device to dark mode while on System.

## Phase 1: Make the landing page launch-ready

- Real gyms and figures in place of the placeholders
- Social share image and description, sitemap, 404 page
- Privacy-friendly visitor stats, custom domain
- Easier-to-read blue buttons (contrast)

✅ Check: a waitlist signup arrives in Netlify Forms, Lighthouse 90+, both themes look right on a real phone.

## Phase 2: The working quiz with ranked matches (Vite + Vue)

- Four-question quiz: goal, budget, when you train, what matters most
- Ranked results with match % and the reasons behind it, using ~20 real Miami gyms
- Results shareable as a link
- Netlify switches to a build step (`npm run build`, publish `dist`)

✅ Check: rankings make sense for 5 to 6 test answer sets, smooth on a phone.

## Phase 3: Explore, gym profiles, compare and saved (Leaflet)

- Map with filters for price, distance, classes and amenities; map tiles switch to a dark style in dark mode
- "Get directions" opens the gym's address in the visitor's maps app
- Gym pages: fees, packages, schedule, hours, reviews
- Compare up to 4 gyms side by side, best value in each row highlighted
- Saved shortlist with notes, kept in the browser

✅ Check: quiz → explore → profile → compare → saved works end to end; filters and the shortlist behave.

## Phase 4: Accounts, live data and the gym-owner side

- Gym data in Supabase
- Sign-in so a shortlist follows people across devices
- Gym listing form with leads delivered to the gym
- Simple admin page for keeping listings current

✅ Check: security review (one user can't see another's data), full test from sign-up to a gym receiving a lead, Netlify error logs clean.
