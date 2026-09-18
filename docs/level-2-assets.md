# Level 2 — Required graphics

Status: all 13 production `v2` plates are painted, optimized, connected, and animated in `dist/level2.html`.

Companion to `level-2-plan.md`. Sizes and cell layouts match what `dist/game.js` already reads, so a finished plate drops in without changing how the game loads art.

## Conventions taken from Level 1

| Kind | Size | How the game reads it |
|---|---|---|
| Grid atlas | 1536 × 1024 | Cells by index. `prop()` cuts 4 × 2; the platform atlas uses six measured rects. |
| Single subject | 1254 × 1254 | One subject, alpha bounds measured into `artBounds`. |
| Parallax background | 2172 × 724 | Tiled horizontally at 1720 px. |
| Tiling strip | 1536 × 256 | Repeats every 384 px. New for Level 2. |

File rules:

- PNG-24 with a real alpha channel.
- **No baked shadow, no baked glow.** The game draws both (`shadowColor`, `shadowBlur`), so anything baked in doubles up.
- Each subject is drawn on transparent and centred in its cell, with margin. The game measures true alpha bounds per frame, so a subject may sit anywhere in its cell as long as it does not touch a neighbour.
- Naming stays `<subject>-v<N>.png`. A changed plate gets a new version number rather than an overwrite, so a cached browser cannot serve a stale mix.

## Reused from Level 1 — no new art needed

| File | Size | Note |
|---|---|---|
| `bix-motion-v2.png` | 1160 × 1356 | 12 frames. Bix is unchanged in Level 2. |
| `bix-hang-v1.png` | 2172 × 724 | Available as a legacy source plate; Level 2 currently uses the hang/climb cells in `bix-motion-v2.png`. |
| `pack-companion-v1.png` | 1254 × 1254 | Pack's travelling mode. |
| `energy-cog-v1.png` | 1254 × 1254 | Cogs are the same collectible. |
| `molten-blast-v1.png` | 1536 × 1024 | 8 blast frames, reused for every vent. |

## New plates

Priority: **P1** is everything a playable Level 2 needs. **P2** completes the enemies and set pieces. **P3** can ship later, because code can draw it first the way Level 1 already draws its lasers and lava.

### Characters

| File | Size | Cells | Pri |
|---|---|---|---|
| `pack-assist-v2.png` | 768 × 512 | 4 × 2: hover idle · arm extended · scan (amber eye) · carry cell · ping burst · hold shutter · catch (arms out) · detach from back | P1 |
| `supervisor-head-v2.png` | 768 × 512 | 4 × 2: idle · sweep left · sweep right · locked (red) · stalled · gantry mount · emitter close · spare | P2 |

The beam itself is drawn in code, like Level 1's lasers. Only the head unit is art.

### Enemies

| File | Size | Cells | Pri |
|---|---|---|---|
| `enemy-crawler-v2.png` | 768 × 512 | 4 × 2: walk A–D · turn · alert · stunned · grab | P1 |
| `enemy-spitter-v2.png` | 768 × 512 | 4 × 2: idle · charge amber · charge full · fire · recoil · cooldown · port shut · arc projectile | P2 |
| `enemy-claw-v2.png` | 768 × 512 | 4 × 2: open idle · tracking · locked · descending · slam impact · gripping · retracting · rail carriage | P2 |
| `enemy-wasp-v2.png` | 768 × 512 | 4 × 2: flight A–D · spawn ember · dissolve A–C | P2 |

Notes: the crawler's walk loop runs at the same cadence as Bix's run. The spitter's charge frames are the player's tell, so they must differ clearly from idle. The wasp is about 40 px on screen, so its silhouette has to read against fire.

### Environment

| File | Size | Cells | Pri |
|---|---|---|---|
| `furnace-background-v2.png` | 2172 × 724 | single plate | P1 |
| `furnace-platform-atlas-v2.png` | 768 × 512 | 3 × 2: slab wide · slab mid · ledge · slab worn · slab grated · ledge rail | P1 |
| `furnace-prop-atlas-v2.png` | 768 × 512 | 4 × 2: vent housing · ACT terminal · cooling shutter · coolant valve · laser emitter · power socket · emergency lift · pipe gantry | P1 |
| `casting-mold-v2.png` | 512 × 512 | mold platform | P2 |
| `coolant-mist-v2.png` | 768 × 512 | 4 × 2: burst 1–4 · fade 1–4 | P3 |
| `conveyor-belt-v2.png` | 1536 × 256 | four animated 384 px tiles | P3 |
| `lava-channel-v2.png` | 1536 × 256 | four animated 384 px tiles | P3 |

The background tiles at 1720 px exactly like `facility-background-v1.png`: hotter, deeper, more shadow. The platform atlas keeps the Level 1 rect layout, where left cap, middle and right cap are cut in code from each slab.

## Production plates (shipped)

All 13 `v2` plates above exist in `dist/assets/` as optimized production art. Full-resolution authored masters remain in `design/level2-art-masters-v2/`.

Regenerate the delivery copies with `python design/process_level2_v2_assets.py` (needs Pillow). `design/level2-v2-contact-sheet.png` shows all 13 on one sheet.

Verified on generation: exact delivery dimensions, RGBA for transparent plates, safe per-cell margins, and valid four-frame tiling strips.

The game reads measured alpha bounds from generated `dist/level2-art.js`. Never overwrite released art; process a new version and update the crop manifest and renderer together.

## Art direction

The permanent project-wide rule is `design/ART-DIRECTION.md`. Level 2 is industrial semi-realistic, the same world as Level 1 one floor down and much hotter: brighter molten metal, deeper shadow, worn off-white/charcoal/orange machinery, and platform edges that read instantly.

Palette, taken from the shipped game:

| Name | Hex | Used for |
|---|---|---|
| Ink | `#071217` | Page and HUD ground |
| Steel | `#1a2e36` | Platform body |
| Steel edge | `#48707a` | Platform outline |
| Edge light | `#ffc84a` | Top lip of every platform |
| Mint | `#59e2c2` | Pack, safe things, checkpoints |
| Yellow | `#ffd75a` | Cogs, objectives |
| Molten | `#ff9d23` | Heat, vents, moving platforms |
| Hot core | `#ffe02e` | Blast core, sparks |
| Danger | `#ff4d3a` | Enemies, lasers |
| Cream | `#edf0dc` | Body text |

Enemies are the only things that use Danger red as a body colour, so a red silhouette always means "this can hurt you."

## Weight budget — fix this before adding plates

Level 1 already ships **16 MB** of art across nine files. Adding these thirteen plates at the same sizes would push the game past **30 MB**, which is a punishing first load on a phone.

The cause is that every plate is authored far larger than it is ever drawn. `energy-cog-v1.png` is a 1254 px plate rendered on screen at 54 px.

| Plate | Authored | Size | Ship at | Saves to |
|---|---|---|---|---|
| `bix-motion-v2` | 1160 × 1356 | 1.6 MB | 580 × 678 | ~0.5 MB |
| `pack-companion` | 1254 × 1254 | 1.4 MB | 256 × 256 | ~0.1 MB |
| `energy-cog` | 1254 × 1254 | 2.1 MB | 128 × 128 | ~0.05 MB |
| `molten-blast` | 1536 × 1024 | 1.9 MB | 768 × 512 | ~0.5 MB |
| `facility-platform-atlas` | 1536 × 1024 | 1.5 MB | 768 × 512 | ~0.4 MB |
| `facility-prop-atlas` | 1536 × 1024 | 2.0 MB | 768 × 512 | ~0.5 MB |
| `facility-background` | 2172 × 724 | 2.2 MB | keep as is | 2.2 MB |

**Rule: author large, ship at twice the largest on-screen size.** That takes Level 1 from about 16 MB to about 4 MB and leaves room for Level 2. The authored originals stay in the design folder; only the shipped copies under `dist/assets/` are downscaled.

Level 2 applies this delivery rule now. A future Level 1 optimization pass remains separate so its released art is not silently replaced.

## Resolved production decisions

- Level 2 production art ships optimized; the large masters stay under `design/level2-art-masters-v2/`.
- Level 2 hanging and climbing use the matching authored cells already present in `bix-motion-v2.png`; the separate legacy hang plate remains unused.
- The Supervisor is a head unit mounted to a gantry, matching the route document and final sprite sheet.
