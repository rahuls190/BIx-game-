# Bix — Project Mayhem

Main project repository for the game, artwork, plans, tests and publishing.

## Project layout

- `dist/`: playable Level 1, playable Level 2, and all shipped graphics.
- `dist/blast-demo.html`: earlier blast animation study (legacy reference).
- `tests/`: gameplay simulation and graphics source-bound checks.
- `docs/level-2-plan.md`: Level 2 route, mechanics, enemies, and difficulty specification.
- `docs/game-script.md`: dialogue and story source for both levels.
- `docs/level-2-assets.md`: Level 2 production graphics, cell layouts, palette, and delivery rules.
- `design/ART-DIRECTION.md`: permanent visual rule for every future Bix image.
- `.github/workflows/pages.yml`: verify and publish `dist/` to GitHub Pages.

## Run locally

From the repository root, run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000 for Level 1 or http://localhost:8000/level2.html for Level 2.

## Checks

Requires Node.js 22 or later. Run the Level 1 checks (`node tests/gameplay.cjs`, `node tests/graphics.cjs`) and the Level 2 checks (`node tests/level2-engine.cjs`, `node tests/level2-enemies.cjs`, `node tests/level2-geometry.cjs`).
These are automated simulations and rendering-call checks, not a substitute for visual device testing.

## Publishing

In repository Settings → Pages, choose **GitHub Actions** as the source. Each push to `main` then validates the game and publishes `dist/`. The workflow can also be run manually.
Expected Pages address after successful deployment: https://rahuls190.github.io/BIx-game-/

The previous ChatGPT Site stays available as the last published copy. GitHub is now the source of truth; future changes and publishing configuration belong here.

## Current scope

Level 1 includes Bix movement, ledges, moving platforms, checkpoints, battery and breaker puzzles, robot Pack, gold cogs and animated molten blasts. Level 2 is playable across Broken Lift, Casting Hall, Cooling Works, Scrap Sorter, and Furnace Escape, with Pack assists, five enemy types, and production `v2` art.
