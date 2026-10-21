# FitQuest

Landing page for FitQuest, which matches people with the right gym in Miami.

Plain HTML and CSS, so there's no build step.

## Files

- `index.html`: the landing page
- `thanks.html`: the page people see after joining the waitlist
- `styles.css`: design tokens (Barlow / Barlow Condensed, steel-blue accent), light and dark themes, and the page styles
- `theme.js`: the Light / System / Dark switch in the top bar (the choice is remembered in the browser)
- `netlify.toml`: Netlify settings (serves the repo root, adds security headers)

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo.
2. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
3. Deploy.

The waitlist form uses [Netlify Forms](https://docs.netlify.com/forms/setup/). Signups show up under **Forms** in your Netlify dashboard after the first deploy. You may need to turn on form detection in the site settings.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
