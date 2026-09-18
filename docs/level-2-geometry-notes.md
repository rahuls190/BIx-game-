# Level 2 — geometry notes

Data: `dist/level2-data.js` (one global, `window.L2DATA`).
Proof: `node tests/level2-geometry.cjs` — exits non-zero on any failure, prints a one-line JSON summary on success.

This file records the numbers behind the data. It is not the design doc; that is `level-2-plan.md`.

## The jump envelope I designed against

Level 1's physics, unchanged:

| | |
|---|---|
| Player box | 42 × 96 |
| Gravity | `vy += 1450*dt` |
| Jump | `vy = -780`, early release `vy += 1500*dt` |
| Run | 285 px/s max |
| Max jump height | **209.8 px** |

Reachability between surfaces A → B, the same formula `tests/gameplay.cjs` uses:

```
rise = A.y - B.y
disc = 780² - 2·1450·rise            require disc > 0
t    = (780 + √disc) / 1450
require   gap + 42 < 285·t - 35      (the 35 is the safety slack)
gap  = max(0, B.x-(A.x+A.w), A.x-(B.x+B.w))
```

The `gap` term is the one change from Level 1: it is computed in **both directions**, because Area 5 zig-zags left as well as right. Level 1 only ever moved right.

The practical budget that fell out of it, and the numbers I actually built to:

| Rise (px gained) | Largest legal gap | Gap I used on required hops |
|---|---|---|
| −100 (dropping) | 262 | ≤ 140 |
| 0 (level) | 229 | ≤ 150 |
| +50 | 210 | ≤ 140 |
| +105 | 184 | 110 (every Area 5 step) |
| +150 | 158 | ≤ 110 |
| +190 | 123 | 0 (straight-up hops onto catwalks only) |
| +209 | — | impossible |

## Hardest required jump per area, with margin

Margin = px of horizontal slack left over after the formula. Positive means it clears.

| Area | Hardest required hop | Rise | Gap | Margin |
|---|---|---|---|---|
| 1 · Broken Lift | shaft base → step (`p1 → p2`) | +90 | 110 | **82.2 px** |
| 2 · Casting Hall | mold A → safe island 2 (`m0 → p6`) | +15 | 150 | **74.0 px** |
| 3 · Cooling Works | pump hub → first upper pipe (`p12 → p13`) | +100 | 110 | **77.2 px** |
| 4 · Scrap Sorter | belt deck 3 → deck (`p37 → p38`) | +15 | 140 | **84.0 px** |
| 5 · Furnace Escape | every climb step (`l24 → l25` …) | +105 | 110 | **74.7 px** |

**Tightest required jump in the whole level: 74.04 px of margin**, Casting Hall, moving mold A → safe island 2 (and the identical mold B → island 3). That is roughly a quarter of a full running jump in reserve — comfortably inside mobile tap tolerance.

Optional routes (hang-rail lane, Area 4 catwalk, the three Area 5 cog perches) are allowed to be tighter; the test only requires margin > 0 for those, and > 20 for anything required. In practice the tightest optional hop is also ~74 px, because the cog routes reuse the same spacing grid.

## Things a future engine author must know

**Collision height.** Solid platforms collide at `h = 78` in `move()` regardless of the `h` stored in the data. The `h` in `platforms[]` is drawn depth only. This matters: two solids stacked in the same x column need ~234 px of vertical spacing (78 slab + 96 player + headroom) or the player cracks his head on the way up.

**Area 5 is built from ledges, not platforms.** That is why. The climb steps 105 px per hop in two alternating columns, so the same column repeats every 210 px — which is *less* than the 234 px a solid stack needs. One-way ledges pass through from below, so the problem disappears. Only the lift deck at the top (`platforms[45]`) is solid. If anyone converts the climb to solids, it stops being climbable.

**`chains[]` is the traversal contract.** Level 1 could assert "platform *i* reaches platform *i+1*" because it is a single left-to-right line. Level 2 cannot: Area 3 splits into two parallel routes and Area 5 runs vertically. `chains[]` names the routes explicitly, each node a `['p'|'l'|'m', index]` pair. The test walks those. If you insert or reorder anything in `platforms[]`, `ledges[]` or `movers[]`, fix the indices in `chains[]` and `retracts[]` in the same edit — they are positional.

**Movers are proved at their centre.** `movers[].x,y` is the centre of travel, `r` the amplitude. The test checks every required mold hop with the mold parked at centre, which it passes through twice per cycle. So the stated margins are what the player gets if he waits for the mold rather than jumping at an extreme. Don't widen `r` without re-running the test.

**Retracting pipes are trigger-based, not timer-based.** `retracts[]` says `mode:'trigger'` — a segment pulls in `hold` seconds *after Bix lands on it* and returns after `gone`. A timer-based version would make the upper route randomly impossible from a standstill, and there is no geometry that fixes that. The Pack terminal at (7930, 395) holds the span out for 6 s as the escape hatch.

**The flood never submerges a platform top.** `floods[0].yWet = 648`; every lower-route platform top is at y ≤ 636. Standing on the tunnel route is always survivable. The flood kills in the *gaps*, which converts a missed jump from recoverable into fatal — that is the whole difficulty increase, and it is the reason the route is provable at all. If you raise `yWet`, the test will tell you which slab you drowned.

**Hazard clearance.** The test parks a 42 × 96 player box at the departure and arrival end of every required gap and asserts no vent column (`x ± 25`, 175 tall), laser (`x ± 8`), or lava rect touches it, and that the box is not standing on a conveyor. That is why the three belts are 300 px on 420 px decks — the 60 px of bare deck at each end is load-bearing, not decoration.

**Area 1 is asserted safe.** No lethal vent, laser, lava, enemy or mover may have an x inside `[0, 2600)`. The one vent there carries `safe: 1` and exists only to teach the blast tell. The crawler the player learns is in `decor[]` behind glass, not in `enemies[]`.

**Checkpoint placement is exact, not approximate.** Every `checkpoints[].y` equals a surface top to the pixel, and the test requires the full player width to fit on that surface. Nudging a platform means nudging its checkpoint.

## Compromises made

- **The Area 5 shaft is narrow.** The climb occupies x 14700–15270, about 600 px of a 2000 px area, because two columns 110 px apart is the only spacing that keeps a +105 rise inside the envelope with real margin. The side cog perches at 14420 and 15380 push the visible width to ~1100. The remaining width is background; a 2D camera can frame it tightly.
- **Both Cooling Works routes are required, not optional.** The design says "either route first", but the gate needs both valves, so the player does both. They are therefore both held to required-path margins (77.2 and 89.2 px at their worst), which makes the "lower route is the slow safe one" contrast weaker than the plan implies. The flood timer and the spitter carry that contrast instead of the geometry.
- **Area 1's hang wall is also jumpable.** `platforms[3]` sits 130 px above the step before it, so a plain jump clears it. A wall that *required* the hang would need a lip more than 209 px up, which no test could prove reachable by the ballistic rule. It is a teaching wall: the grab reads as the intended solution, the jump is the fallback. `climbWalls[]` marks it for the renderer.
- **The Pack service tunnel is validated as an ordinary chain.** Pack flies, so the envelope does not really apply, but the four segments are 100 px apart and clear it anyway. No harm in proving it.
