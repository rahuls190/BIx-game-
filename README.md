# Bix — Project Mayhem

Main project repository for the game, artwork, plans, tests and publishing.

## Project layout

- `dist/index.html` + `dist/landing.css`: the landing page, the site's front door.
- `dist/level1.html`, `dist/level2.html`, `dist/level3.html`, `dist/level4.html`: the four playable levels, with all shipped graphics in `dist/assets/`.
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

From the repository root, run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000 for the landing page, http://localhost:8000/level1.html for Level 1, http://localhost:8000/level2.html for Level 2, , http://localhost:8000/level3.html?banked=26 for Level 3 or http://localhost:8000/level4.html?banked=38 for Level 4 (it opens once Levels 1 and 2 have banked more than 12 cogs; `?banked=N` is a test switch, and `?at=N` starts at checkpoint N).

## Checks

Requires Node.js 22 or later. CI runs every check listed in `.github/workflows/pages.yml`; run any of them locally as `node tests/<name>.cjs` from the repository root. `tests/landing.cjs` covers the landing page: every link, image and stylesheet must exist, the buttons must lead to the real games, and the two `404.html` redirects must map addresses correctly without looping. `tests/progress.cjs` covers saved progress, the sign-in wiring and the Firestore rules file.
These are automated simulations and rendering-call checks, not a substitute for visual device testing.

## Publishing

In repository Settings → Pages, choose **GitHub Actions** as the source. Each push to `main` then validates the game and publishes `dist/`. The workflow can also be run manually.
Expected Pages address after successful deployment: https://rahuls190.github.io/BIx-game-/ (landing page), with the levels at `/level1.html`, `/level2.html` and `/level3.html`.

The previous ChatGPT Site stays available as the last published copy. GitHub is now the source of truth; future changes and publishing configuration belong here.

## Current scope

Level 1 includes Bix movement, ledges, moving platforms, checkpoints, battery and breaker puzzles, robot Pack, gold cogs and animated molten blasts. Level 2 is playable across Broken Lift, Casting Hall, Cooling Works, Scrap Sorter, and Furnace Escape, with Pack assists, five enemy types, and production `v2` art.

Level 4, Delivery Attempt (stage 1, boxes first, art and sound to come), adds the Carried Core: Bix carries one power core up through freight, a market, the antennas, the relays and the lift shaft, and it is heavy, buoyant or charged depending on the zone. Cogs carry forward: the shield tier and the unlock (19 of the 38 cogs from Levels 1 to 3) come from every earlier level's best. See `design/LEVEL4-BUILD-NOTES.md`, `docs/level-4-plan.md`, `docs/level-4-story.md` and `docs/level-4-script.md`.

Level 3, Magnetic Personality, adds the Magnet Glove (hold Z for Blue, X for Red, C for the shield) across six areas: the Yard, Crusher Bay, the Shaft, the Polarity Lab, the Ore Train and the High Vault, plus an archive room for anyone who collects all 12 cogs. See `design/LEVEL3-BUILD-NOTES.md`.
