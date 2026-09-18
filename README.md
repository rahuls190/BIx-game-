# Bix — Project Mayhem

Main project repository for the game, artwork, plans, tests and publishing.

## Project layout

- `dist/`: playable Level 1 and all shipped graphics.
- `dist/blast-demo.html`: earlier blast animation study (legacy reference).
- `tests/`: gameplay simulation and graphics source-bound checks.
- `docs/level-2-plan.md`: Level 2 design only; not implemented.
- `.github/workflows/pages.yml`: verify and publish `dist/` to GitHub Pages.

## Run locally

From the repository root, run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000.

## Checks

Requires Node.js 22 or later. Run `node --check dist/game.js`, `node tests/gameplay.cjs`, and `node tests/graphics.cjs`.
These are automated simulations and rendering-call checks, not a substitute for visual device testing.

## Publishing

In repository Settings → Pages, choose **GitHub Actions** as the source. Each push to `main` then validates the game and publishes `dist/`. The workflow can also be run manually.
Expected Pages address after successful deployment: https://rahuls190.github.io/BIx-game-/

The previous ChatGPT Site stays available as the last published copy. GitHub is now the source of truth; future changes and publishing configuration belong here.

## Current scope

Level 1 includes Bix movement, ledges, moving platforms, checkpoints, battery and breaker puzzles, robot Pack, gold cogs and animated molten blasts. Level 2 remains planning-only until implementation is requested.
