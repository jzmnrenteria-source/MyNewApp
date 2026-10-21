# FitQuest roadmap

Each phase ends with a quality check. The next phase starts only after the check passes.

## Decisions

- **Framework (from Phase 2):** Vite + Vue. The FitQuest design artifact's screens are already written in Vue.
- **Maps (Phase 3):** Leaflet with OpenStreetMap-based map tiles. No API key or billing. Map credits must stay visible on the map.
  If traffic grows, move the tiles to a hosted provider (most have a free tier) by changing one URL.

## Phase 0: Light, dark and system themes ✔ done

- Light / System / Dark switch in the top bar on every page
- System follows the device setting; a chosen theme is remembered and applied with no flash

✅ Check: try all three on desktop and phone, reload after each, switch the device to dark mode while on System.

## Phase 1: Make the landing page launch-ready ✔ done

- Done: honest figures, and the sample gyms are labelled "Example" (real gyms arrive with the Phase 2 data)
- Done: social share image and tags, sitemap, robots.txt, 404 page
- Done: all colours pass WCAG AA contrast in both themes
- Done: fonts hosted with the site (faster first paint, no Google request)
- For you in Netlify: turn on visitor stats (Netlify Analytics needs no code), connect a custom domain

✅ Check: a waitlist signup arrives in Netlify Forms, Lighthouse 90+, both themes look right on a real phone.

## Phase 2: The working quiz with ranked matches (Vite + Vue) ✔ done

- Four-question quiz: goal, budget, when you train, what matters most
- Ranked results with match % and the reasons behind it, using 20 real Miami gyms from public listings
  (prices are estimated levels, no ratings or hours yet; confirm with the gyms before launch)
- "Distances from" picker for 7 neighborhoods
- Results shareable as a link
- Netlify switches to a build step (`npm run build`, publish `dist`)

✅ Check: rankings make sense for 5 to 6 test answer sets, smooth on a phone. Review the gym list in `src/shared/data.js`.

## Phase 3: Explore, gym profiles, compare and saved (Leaflet) (built, waiting for the check)

- Map with filters for price, distance, training style and amenities; map tiles darken in dark mode
- One marker per neighborhood with a gym count (exact pins once addresses are confirmed)
- "Get directions" opens the gym's address in the visitor's maps app
- Gym pages: price level, access, coaching, recovery, best-for, your match, nearby gyms
  (packages, schedules, hours and reviews show as "still to come" until they can be confirmed; Phase 4 owner listings fill them)
- Compare up to 4 gyms side by side, best value in each row highlighted
- Saved shortlist with notes, kept in the browser
- Quiz results: View / Save / Compare on each gym, top 10 with "Show all"

✅ Check: quiz → explore → profile → compare → saved works end to end; filters and the shortlist behave.

## Phase 4: Accounts, live data and the gym-owner side

- Gym data in Supabase
- Sign-in so a shortlist follows people across devices
- Gym listing form with leads delivered to the gym
- Simple admin page for keeping listings current

✅ Check: security review (one user can't see another's data), full test from sign-up to a gym receiving a lead, Netlify error logs clean.
