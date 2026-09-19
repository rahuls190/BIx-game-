# Bix — Project Mayhem

Main project repository for the game, artwork, plans, tests and publishing.

## Project layout

- `dist/index.html` + `dist/landing.css`: the landing page, the site's front door.
- `dist/level1.html`, `dist/level2.html`: the two playable levels, with all shipped graphics in `dist/assets/`.
- `dist/progress.js`, `dist/auth.js`, `dist/account-ui.js`, `dist/firebase-config.js`, `firestore.rules`: optional Google sign-in and cloud saves. They stay off until a Firebase config is added; see `docs/login-setup.md`.
- `dist/blast-demo.html`: earlier blast animation study (legacy reference).
- `tests/`: gameplay simulation and graphics source-bound checks.
- `docs/level-2-plan.md`: Level 2 route, mechanics, enemies, and difficulty specification.
- `docs/game-script.md`: dialogue and story source for both levels.
- `docs/level-2-assets.md`: Level 2 production graphics, cell layouts, palette, and delivery rules.
- `design/ART-DIRECTION.md`: permanent visual rule for every future Bix image.
- `index.html` (repo root): a redirect into `dist/`, for the case where Pages publishes the repository root instead of `dist/`.
- `.github/workflows/pages.yml`: verify and publish `dist/` to GitHub Pages.

## Run locally

From the repository root, run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000 for the landing page, http://localhost:8000/level1.html for Level 1, or http://localhost:8000/level2.html for Level 2.

## Checks

Requires Node.js 22 or later. CI runs every check listed in `.github/workflows/pages.yml`; run any of them locally as `node tests/<name>.cjs` from the repository root. `tests/landing.cjs` covers the landing page: every link, image and stylesheet must exist, the buttons must lead to the real games, and the two `404.html` redirects must map addresses correctly without looping. `tests/progress.cjs` covers saved progress, the sign-in wiring and the Firestore rules file.
These are automated simulations and rendering-call checks, not a substitute for visual device testing.

## Publishing

In repository Settings → Pages, choose **GitHub Actions** as the source. Each push to `main` then validates the game and publishes `dist/`. The workflow can also be run manually.
Expected Pages address after successful deployment: https://rahuls190.github.io/BIx-game-/ (landing page), with the levels at `/level1.html` and `/level2.html`.

The previous ChatGPT Site stays available as the last published copy. GitHub is now the source of truth; future changes and publishing configuration belong here.

## Current scope

Level 1 includes Bix movement, ledges, moving platforms, checkpoints, battery and breaker puzzles, robot Pack, gold cogs and animated molten blasts. Level 2 is playable across Broken Lift, Casting Hall, Cooling Works, Scrap Sorter, and Furnace Escape, with Pack assists, five enemy types, and production `v2` art.
