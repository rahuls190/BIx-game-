# Level 2 — enemy behaviour module notes

`dist/level2-enemies.js` defines one global, `window.L2ENEMIES`. It is pure logic: no canvas, no
DOM, no images, no `Math.random`, no wall clock. It loads as a plain browser script and under
Node's `vm`, which is how `tests/level2-enemies.cjs` drives it.

Rendering lives in `dist/level2-art.js`, level data in `dist/level2-data.js`, the engine in
`dist/level2.js`. This module owns none of those.

## API

```js
L2ENEMIES.make(type, cfg)          // new enemy state object; throws on an unknown type
L2ENEMIES.update(e, dt, now, world)// advance one enemy by dt seconds; mutates and returns e
L2ENEMIES.hazard(e)                // {x,y,w,h} lethal box right now, or null when harmless
L2ENEMIES.tell(e)                  // 0..1 telegraph strength, drives the amber warning
L2ENEMIES.stun(e)                  // true if the Pack ping took, false if immune or already stunned
L2ENEMIES.mist(e)                  // true if coolant mist kills it (it is dead when this returns true)
L2ENEMIES.phaseName(e)             // 'wake' | 'patrol' | 'charge' | ... (see each machine below)
L2ENEMIES.consts                   // {WAKE, STUN, GRAVITY, DUR, SIZE, STUNNABLE, MISTABLE}
```

Types: `crawler`, `spitter`, `claw`, `wasp`, `supervisor`.

## The `world` contract

`update` reads exactly three fields and nothing else:

| Field | Type | Who uses it |
|---|---|---|
| `player` | `{x,y,w,h}` top-left box of Bix | `claw` picks the nearest lane to the player centre; `wasp` drifts toward the player centre. Omit it and the claw keeps its last lane while the wasp holds still. |
| `shutterOpened` | bool | `supervisor` only. Stalls on the **rising edge**, so the engine may safely leave it `true` for as long as the shutter is open. |
| `dt` | seconds | Mirror of the `dt` argument, used only if `dt` is not passed. **The `dt` argument wins.** |

No field was added beyond the three in the agreed contract. `now` is stored as `e.now` for
renderers and never drives behaviour, so behaviour is a pure function of state + elapsed `dt` and
is exactly repeatable.

Positions are world space. `e.x, e.y` is the **top-left** of the enemy box, like Level 1's rects,
so `overlap()` from `dist/game.js` works directly on `hazard()`.

## Shared rules

- **Spawn tell.** Every enemy starts in `wake` for 0.5 s: `tell()` ramps 0 → 1, `hazard()` is
  `null`. That is what guarantees, for all five types, that the tell rises before the enemy can
  ever kill. Override per enemy with `cfg.wake` (0 disables it — don't, unless the enemy spawns
  off-screen).
- **Per-cycle tells** on top of that: the spitter charges 0.8 s, the claw locks at `tell() === 1`
  for 0.4 s before it slams, the crawler's turn pause ramps to 1 before it walks again, and a
  stunned enemy's tell rises through the last 0.5 s of the stun so the restart is readable.
- `hazard()` is always `null` for a dead, stunned or still-waking enemy.
- `cfg.phase` (seconds) offsets where in the cycle the enemy starts, after its wake. Use it to
  stagger a row of identical enemies, exactly like Level 1's vent and laser `p` values.
- `cfg.durations` merges over the defaults and is the only supported way to retune a cycle.

## State machines

### crawler — Scrap Crawler (lethal on contact)

`wake 0.5` → `patrol 2.0` (left edge → right edge) → `turn 0.6` (stopped at the right edge) →
`patrol 2.0` (back) → `turn 0.6` (stopped at the left edge) → repeat. **Cycle 5.2 s.**

Position is computed analytically from the cycle clock, so it never accumulates drift, and it is
clamped to `[x - range, x + range]` (measured on the box's left edge). `speed` defaults to
`2*range / 2.0`, i.e. it arrives at the edge exactly as the leg ends; a larger `speed` just makes
it arrive early and idle at the edge. It never leaves the span.

`hazard()` = the body box, at all times outside wake/stun. `tell()` = 0.25 while patrolling, rising
0.3 → 1.0 across the turn pause. Pass behind it during the turn.

### spitter — Slag Spitter (the projectile is lethal, the turret is not)

`wake 0.5` → `charge 0.8` (amber tell 0.08 → 1.0) → `fire 0.3` (the shot is created on the first
frame of this phase) → `cooldown 1.5` → repeat. **Cycle 2.6 s — "every 2.6 s".**

The shot is part of this module: `e.shot = {x,y,w,h,vx,vy,age}` while airborne, `null` otherwise,
and `e.lastLand = {x,y,t}` after each impact for the splash art. The parabola is fixed — muzzle,
velocity and gravity never vary — and the impact time and `e.shotLandX` are solved analytically
once per shot, so every shot from a given turret lands on the identical spot (the test measures a
0 px spread over three cycles). `cfg.landY` is the y the shot splashes on; default `y + 220`.

`hazard()` = the shot's box while it is airborne, else `null`. A shot stays lethal into the next
charge phase, which is intended: its own tell already happened.

### claw — Sorter Claw

`wake 0.5` → `track 1.4` → `lock 0.4` → `slam 0.6` → `retract 1.4` → repeat. **Cycle 3.8 s.**

`cfg.lanes` is an array of lane centre **x** values on the rail. During `track` the head slides
toward the lane nearest the player's centre at `railSpeed` (default 620 px/s). On the first frame
of `lock` it commits `e.lockLane` and **cannot correct**: moving the player after that does not
change where it slams (tested both ways — a player who stays gets slammed on, a player who bolts
after the lock does not). `slam` drives the head down `reach` px (default 260) on an accelerating
curve; `retract` eases it back up.

`hazard()` = the head box, **only during `slam`**. `tell()` = 0.2 → 0.5 across `track`, 1.0 through
`lock` and `slam`, decaying through `retract`.

### wasp — Cinder Wasp

`wake 0.5` → `drift`, forever. Moves at `speed` (default 58 px/s) straight at the player's centre,
never stopping, never accelerating. The step is clamped to the remaining distance, so it can never
overshoot and cannot fall into a jitter loop; distance to the player is monotonically
non-increasing. `hazard()` = the body box at all times. `tell()` = 0.45 steady (the ember glow is
the tell; it is a visible, slow, always-lethal object).

Not stunnable. Killed by coolant mist — that is the only way to remove one.

### supervisor — classification beam

`wake 0.5` → `sweepLeft 2.2` (beam travels right edge → left edge) → `hold 0.5` (at the left edge)
→ `sweepRight 2.2` (left → right) → `holdRight 0` → repeat. **Cycle 4.9 s.**

`stall 2.0` on the rising edge of `world.shutterOpened`, from any phase: the cycle clock and the
beam freeze where they are, `phaseName()` returns `'stall'`, and **`hazard()` returns `null` for
the whole stall** — the stall is the player's window, per the design. `tell()` drops to 0.15 and
then rises through the last 0.4 s so the restart is readable. Afterwards the sweep resumes exactly
where it left off.

`hazard()` = the beam, a vertical box `beamW` wide (default 46) and `beamH` tall (default 420),
centred on `e.beamX`, starting at `e.y`. Not stunnable.

## Stun (the Pack ping) and mist

| Type | `stun()` | `mist()` |
|---|---|---|
| crawler | **yes**, 2.0 s | no |
| spitter | **yes**, 2.0 s | no |
| claw | **yes**, 2.0 s | no |
| wasp | **no** — returns `false` | **yes** — the only thing mist kills |
| supervisor | **no** — returns `false` | no |

A stunned enemy is frozen solid: its cycle clock, its position and any live projectile all stop,
and `hazard()` is `null` for the full 2.0 s. `stun()` returns `false` on an enemy that is already
stunned, so the engine can decline to spend Pack's single charge.

## What the engine author must call, and when

1. **Spawn.** `const e = L2ENEMIES.make(type, cfg)` from the level data. Keep the returned objects
   in one array. `make()` throws on an unknown type — let it throw, it is a data bug.
2. **Every frame, once per enemy**, before collision:
   `L2ENEMIES.update(e, dt, now, {player: P, shutterOpened: shutterJustOpened, dt});`
   Use the same `dt` the rest of the level uses (Level 1 clamps to 0.033 — keep that; the module
   assumes sane frame steps and detects phase entry per frame).
3. **Collision.** `const h = L2ENEMIES.hazard(e); if (h && overlap(P, h)) hurt(...)`. `null` means
   harmless — do not test anything else. The box is world space, so cull on `h.x` against the
   camera exactly like spikes.
4. **Art.** `L2ENEMIES.tell(e)` is the amber warning strength and `L2ENEMIES.phaseName(e)` the
   sprite/pose selector. The renderer should read state, never write it. Useful read-only fields:
   `e.x, e.y, e.vx, e.vy, e.dir` (crawler/spitter), `e.shot`, `e.lastLand` (spitter),
   `e.headX, e.headY, e.lane, e.lockLane` (claw), `e.beamX` (supervisor).
5. **Pack ping.** On ACT near a marked enemy: `if (L2ENEMIES.stun(e)) spendPackCharge()`. If it
   returns `false` the enemy is immune or already stunned — do not spend the charge, and show the
   "no effect" line instead.
6. **Coolant mist.** When a shutter's mist plume fires, call `L2ENEMIES.mist(e)` on every enemy
   inside the plume. It returns `true` and marks the enemy dead only for wasps. The engine can then
   drop it from the array (or leave it: a dead enemy is inert and harmless forever).
7. **Shutter.** Set `world.shutterOpened = true` on the frame a cooling shutter opens. It is edge
   triggered, so holding it `true` while the shutter stays open does not re-stall or stall forever.
8. **Checkpoints.** The module holds no global state. On respawn, either `make()` the enemies again
   from the level data (cleanest) or reset `e.ct`, `e.wake`, `e.stun`, `e.dead`, `e.shot` yourself.

## Ambiguities in the design, and what was chosen

1. **The claw's "3.2 s".** The agreed per-phase durations are track 1.4 + lock 0.4 + slam 0.6 +
   retract 1.4, which is a 3.8 s cycle and therefore 3.8 s from one lock to the next — the design
   table's "slams down every 3.2 s" cannot also be true. The four explicit durations were treated
   as authoritative and implemented as given. If the 3.2 s figure is the one that matters, the
   engine can pass `durations:{track:0.8}` to `make()` without touching this module (0.8 + 0.4 +
   0.6 + 1.4 = 3.2). That is the only change needed.
2. **The supervisor's hold is one-sided.** The spec lists sweep left 2.2, hold 0.5, sweep right 2.2
   and no hold at the right end, so the beam reverses instantly when it reaches the right edge. That
   is implemented literally (cycle 4.9 s), with a `holdRight` leg present at duration 0 so a
   symmetric version is one config change away: `durations:{holdRight:0.5}`.
3. **Crawler `speed` vs `range` vs the 2.0 s leg.** All three are over-specified. `range` and the
   2.0 s leg win; `speed` defaults to the value that makes them consistent, and a faster `speed`
   only means the crawler arrives at the edge early and waits there. It never overruns the span.
4. **Claw lanes as x or y.** The design says "lane x-centres or y-levels". A ceiling claw on a
   horizontal rail above belt lanes only makes sense as x-centres, so `cfg.lanes` is x.
5. **Spitter tell floor.** The charge tell starts at 0.08 rather than 0, so the turret port keeps a
   dim glow and the amber warning never blinks to zero between the spawn tell and the first charge.

## Tests

`node tests/level2-enemies.cjs` from the repo root (no dependencies, loads the module in a `vm`
sandbox like `tests/gameplay.cjs`). It prints a one-line JSON summary and exits non-zero with a
named failure otherwise. It covers: cycle durations for all five enemies, tell-before-hazard for
every lethal enemy, crawler span and drift, spitter landing repeatability, claw commit at lock,
wasp closing without overshoot or jitter, supervisor stall and resume, stun and mist eligibility,
hazard box sanity, and determinism across identical runs.
