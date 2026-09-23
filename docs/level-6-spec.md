# Level 6 — Mother Cluckzilla: build specification

**For the builder (Lovable).** This is the complete brief for Level 6, the finale of the first world. It gives the story, the mechanic, the boss, the geometry, the exact data shapes, the integration points and the acceptance criteria. Numbers marked *(tune)* are starting points to adjust in playtesting; everything else is fixed, because the rest of the game already depends on it.

Build it the way Levels 3, 4 and 5 are built: one page, one data file, one engine file, plain JavaScript, no framework, no build step.

---

## 1. Where this sits

| Level | Name | Signature mechanic | Ends with |
|---|---|---|---|
| 1 | The Broken Line | movement, batteries, breakers | boarding the emergency lift |
| 2 | The Furnace Below | heat, five enemies, Pack Assist | escaping the furnace |
| 3 | Magnetic Personality | the Magnet Glove (Blue attract, Red repel) | overcharging the transit door |
| 4 | Delivery Attempt | the Carried Core (heavy, buoyant, charged) | the lift rising to daylight |
| 5 | Skyline Foundry | storm climbing: ladders, gusts, collapses, hunters | the Storm Core beacon |
| **6** | **Mother Cluckzilla** | **the Lure** | **the first world ends** |

Level 6 is the last level of the first world. It must feel like a finale: it reuses every earlier idea and adds one of its own.

**The blueprint's line for this slot,** which this spec expands: *"Boss is solved through environment manipulation: pursuit, alarm reveal, awakened tree grid, then a non-violent hay-cart finish."*

---

## 2. Premise and tone

Level 5 left Bix on the rooftops at the Storm Core beacon. Beyond it, across the city's edge, is the thing the whole facility has been feeding: **Sector 9, the Agri-Dome**. A vast automated food dome, still running, still on schedule, eleven years after anyone read its reports.

Inside it lives **Mother Cluckzilla**: the dome's brood machine, a colossal automated rig that has been growing itself out of spare parts and feed for years. She is the size of a building. She is not evil, and she is not hunting Bix. She is following the feed line, exactly as she was told to, and everything in her way is incidental.

That is the joke and the point of the whole game in one image: **a machine helping so hard it becomes a disaster.** Level 4 said it in paperwork; Level 6 says it at four storeys tall.

**Tone.** Deadpan industrial comedy with real scale. Pack reports the apocalypse as a status update. Bix does not panic, because panicking would be admitting it is happening. Nothing is gory and nothing dies, including her.

**Non-negotiable:** Bix never fights her and never hurts her. Every solution is environmental. If a build has Bix damaging her, it is wrong.

---

## 3. Signature mechanic: the Lure

Bix cannot fight a four-storey machine. He can make her go somewhere.

**Feed pods.** Bix picks up a feed pod (E, exactly like Level 4's core: same button, same carry, same set-down). He throws it with **Red (X)**, exactly like the core. A thrown pod bursts on landing into a bright, noisy feed scatter that lasts *(tune: 6 s)*.

**Her rule, and it is the whole boss:** Mother Cluckzilla always moves toward the strongest feed signal she can sense. A burst pod beats the standing feed line. The newest burst beats an older one. She never targets Bix. She walks into him because he is standing in the way, which is worse.

**Why this is the right mechanic**
- It reuses controls the player already has (E to carry, X to throw, Z to call back), so there is nothing new to learn at the exact moment the game gets hardest.
- It makes the boss a puzzle, not a fight.
- It recombines every level: the glove throws (L3), the carry (L4), the climbing and gusts (L5), Pack's scan (L1 and L2).

**Pod rules**
- Bix carries one pod at a time. Pods come from **pod hoppers** placed through the level; a hopper refills *(tune: 3 s)* after being taken from.
- **Blue (Z)** calls an unburst pod back to his hand within *(tune: 560 px)*, the same as the Level 4 core.
- A pod that leaves the world is replaced at the nearest hopper. **A player can never be left with no way to make a pod.** This is a hard rule; the soft-lock test depends on it.
- Bursting a pod in mid-air is allowed and is the intended trick for the high lures.
- **The lure is never the only way to survive.** Every pursuit stretch can be outrun. The lure is how you open the route, not how you stay alive.

---

## 4. Mother Cluckzilla

**Scale.** She is about 4 screens tall at the camera's height, so she is drawn at roughly 2,600 px tall in world units and is almost never fully on screen. The player mostly sees legs, the underside of her body, and a head that comes down into frame. That is deliberate: she should feel bigger than the camera.

**What she is.** An automated brood rig on four heavy legs, built of poultry-line machinery, grain hoppers, ducting and years of accumulated repair. Warm amber lamps where the feed runs. Nothing about her is hostile-looking; she is agricultural equipment at a terrible size. **No teeth, no claws, no red glowing eyes.** Hazard red belongs to danger, and she is not the danger — her footfalls are.

**How she hurts Bix.** Only by being enormous:
- **Footfall.** A leg comes down. Amber dust ring on the ground *(tune: 0.7 s)* before it lands, then the impact.
- **Sweep.** Her head lowers to feed and sweeps the ground where the feed is. Telegraphed by the head entering frame.
- **Shockwave.** Every footfall knocks loose debris and staggers Bix if he is grounded and close. Staggering is not damage; it costs him half a second.

**Her tells are always amber, always before, always the same length.** The player must be able to read her without a caption, exactly like Level 3's presses and Level 5's stalkers.

### The four phases

**Phase 1 — Pursuit** *(Orchard Rows)*
She follows the feed line, which runs the same way Bix is going. No pods yet. Bix runs, climbs and uses the orchard rows as cover. Teaches her speed, her footfall tell and that she cannot be stopped. She is never faster than a running Bix with a clean line, but she is faster than a careless one *(tune: her advance 250 px/s against a 285 px/s run)*.

**Phase 2 — Alarm reveal** *(Alarm Spine)*
Bix climbs to the dome alarm and trips it. The work lights come up across the dome. The reveal: she has not been chasing him at all. The feed line runs exactly where he has been running. Pack goes quiet for a beat, then says so.

This is the turning point. **After the alarm, pod hoppers are live and the lure works.** Before it, a pod does nothing, because she cannot hear it over the standing feed line.

**Phase 3 — The awakened grid** *(The Grid)*
The orchard's three irrigation columns *(tune)* stand between Bix and the nesting bay. Each is too heavy for anything Bix has. Each has a feed trough at its base.

For each column: put a pod in the trough, get clear, let her come. She leans in to feed, her weight takes the column, the column falls and becomes the route. Three columns, three different set-ups:
1. **Straight.** Trough at ground level. Teaches the loop.
2. **High.** The trough is on a ledge; the pod must be thrown in mid-air, or thrown up from a gust.
3. **Timed.** A gust blows a ground pod out of the trough, so the throw has to land between gusts, and a collapse platform means Bix cannot wait where he threw from.

Each fallen column is permanent and stays fallen through a respawn, the same rule as Level 3's seated cores and Level 4's opened gates.

**Phase 4 — The nesting bay** *(non-violent finish)*
The bedding cart sits on rails over the nesting bay. Bix lures her onto the cart's weighing deck with the last pod. Her weight tips the cart, the cart runs down its rails, and she settles into the bedding with a long mechanical sigh. The feed line shuts off. The dome goes quiet for the first time in eleven years.

Nobody is hurt. She is not beaten; she is **fed and put to bed**. That is the ending the blueprint asked for and it is the right one for this game.

---

## 5. Areas and route

About **26,000 px** wide, one continuous left-to-right run with two vertical stretches. First clear 18 to 25 minutes; a clean run about 6.

| # | Area | x range *(tune)* | Teaches | Pressure |
|---|---|---|---|---|
| 1 | **Dome Threshold** | 0 – 3,000 | Pod pick-up, carry, throw, burst, call back | none |
| 2 | **Feed Line** | 3,000 – 7,000 | The standing feed line; her silhouette in the distance; conveyors | low |
| 3 | **Orchard Rows** | 7,000 – 12,000 | **Phase 1:** she arrives, the pursuit | high |
| 4 | **Alarm Spine** | 12,000 – 16,000 | **Phase 2:** vertical climb, gusts, collapses, the alarm | medium |
| 5 | **The Grid** | 16,000 – 22,000 | **Phase 3:** the three columns | high, puzzle |
| 6 | **Nesting Bay** | 22,000 – 26,000 | **Phase 4:** the finish | release |

**Shape of the run.** Threshold and Feed Line are flat and calm; Orchard Rows is the first real pressure; Alarm Spine goes vertical like Level 5's ladders; The Grid is the longest and hardest; Nesting Bay is short, wide and quiet. Never put two new ideas in the same stretch.

**Counts**
- **15 cogs.** 13 on or near the main route, 1 in a side pocket, 1 mastery cog that needs a column fall plus a gust.
- **7 checkpoints,** one at the entry to each area plus one inside The Grid before column 3.
- **Two optional side rooms** off Feed Line and The Grid, each holding a cog and one story pickup.

---

## 6. Numbers that cannot change

These are the physics every level from 1 to 5 was built and tested against. Level 6 must use exactly these, or every jump in the game stops meaning the same thing.

```
player box        42 x 96
gravity           1450
jump velocity     780        (apex about 209 px)
run speed         285
early release     +1500 downward while rising with jump let go
coyote time       0.13 s
jump buffer       0.16 s
canvas height     720 world units (the camera scales to fit)
```

**Reachability,** the same formula the Level 2, 3 and 4 tests use, for a jump from surface A to surface B:
```
rise = A.y - B.y
disc = v0² - 2 · g · rise
t    = (v0 + √disc) / g
need: gap + 42 < 285 · t - 35
```

**Geometry rules**
- A step up is **100 px or less** with a gap under 100, unless it is meant to need a climb.
- A free jump clears a **gap of about 230 px** on the level (the measured number from the engine, not the raw distance travelled).
- A jump plus a ledge grab climbs about **300 px**, so **any wall meant to stop the player must be 440 px or taller.**
- Every surface a checkpoint sits on must be exactly at the checkpoint's `y`, with the full 42 px player width on it.
- **A cog is never placed where collecting it can strand the player.**

---

## 7. Files to create

Follow the existing naming exactly. Everything lives in `dist/`, because GitHub Pages publishes `dist/` and nothing else.

| File | What it holds |
|---|---|
| `dist/level6.html` | the page; copy `dist/level5.html` and change the level-specific text |
| `dist/level6.css` | only what is new to Level 6 (the pod chip, the phase banner); it shares `style.css`, `mobile.css`, `polish.css` |
| `dist/level6-data.js` | all geometry and story triggers; one global, `window.L6DATA` |
| `dist/level6.js` | the engine, forked from `dist/level5.js` |
| `dist/level6-art.js` | generated crop table, `window.L6ART`, if you build an atlas |
| `tests/level6-*.cjs` | the proofs (see section 12) |

**Do not** put copies at the repository root. `level5.html`, `level5.js` and `level5-data.js` currently exist both at the root and in `dist/`, and the root copies are stale. Delete those three root files as part of this work; nothing serves them.

`dist/level6.html` loads, in this order:
```html
<script src="./firebase-config.js"></script>
<script src="./progress.js?v=6"></script>
<script src="./level2-art.js?v=5"></script>
<script src="./audio.js?v=5"></script>
<script src="./level6-data.js?v=1"></script>
<script src="./level6.js?v=1"></script>
<script src="./auth.js" defer></script>
```
Bump the `?v=` number on any file you change, or players keep the old one from cache.

---

## 8. The data file

`dist/level6-data.js` reuses Level 5's element shapes exactly, so the engine fork needs no rewriting. Copy these shapes:

```js
window.L6DATA = {
  world:{w:26000, h:720, yMin:-560, yMax:980, camY:-70, finishX:25700},
  start:{x:120, y:410},
  areas:[ {name:'DOME THRESHOLD', objective:'…', x0:0, x1:3000, camY:-50, killY:880}, … ],

  platforms:[ … ],                                   // solid ground
  ledges:[ … ],                                      // one-way, grabbable
  climbs:[ {x,y,w:52,h} ],                           // ladders: UP climbs, LEFT/RIGHT steps off
  movers:[ {id,x,y,w,h,dx,dy,period,phase} ],        // carry whoever stands on them
  collapses:[ {id,x,y,w,h} ],                        // fall away after a moment, return later
  gusts:[ {x,y,w,h,dir,power,period,on,phase} ],
  electrics:[ {x,y,w,h,period,on,tell,phase} ],
  gates:[ {id,x,y,w,h,need,seconds} ],
  switches:[ {id,x,y,w,h,label} ],
  cogs:[ {x,y} ],
  checkpoints:[ {x,y,name} ],
  triggers:[ {x, s:'PACK', t:'…'} ],
```

and add these, which are new to Level 6:

```js
  hoppers:[ {id,x,y} ],                              // pod source; refills after `refill` seconds
  troughs:[ {id,x,y,w, column:'k1'} ],               // a burst pod here lures her to that column
  columns:[ {id:'k1', x,y,w,h, fallsTo:{x,y,w,h}} ], // standing, and the platform it becomes
  boss:{                                              // Mother Cluckzilla
    enterAt:7000, speed:250, footfall:{period:1.8, tell:0.7, radius:170},
    sweep:{period:5.2, tell:0.9, reach:520},
    phases:[ {id:'pursuit', from:7000}, {id:'alarm', from:12000},
             {id:'grid', from:16000}, {id:'bed', from:22000} ]
  },
  alarm:{x:15400, y:…},                              // the switch that ends phase 1
  cart:{x:25200, y:…, rails:{x0:…, x1:…}}            // the bedding cart
```

**Rules for the data**
- Every number in world pixels; `y` grows downward; a surface's `y` is its walking top.
- Every element list is optional in the engine: a missing list must not throw.
- Story lines are **70 characters or fewer**, because the HUD box is one or two short lines. This is checked by a test.

---

## 9. Integration with the rest of the game

Five files outside Level 6 have to change. Each one already has the pattern from Levels 3, 4 and 5; follow it exactly.

**1. `dist/progress.js`**
```js
const LEVELS = { …, level5:{cogs:15}, level6:{cogs:15} };
const ORDER  = ['level1','level2','level3','level4','level5','level6'];
const LEVEL6_UNLOCK_COGS = 33;   // half of the 65 cogs in Levels 1 to 5
const level6Unlocked = progress => carriedCogs(progress,'level6') >= LEVEL6_UNLOCK_COGS;
```
and export `LEVEL6_UNLOCK_COGS` and `level6Unlocked`.

**The carry-forward rule is the user's standing rule and must hold:** cogs banked in every earlier level count in the next one. The running totals are 12, 26, 38, 50, 65, and each unlock is half: 13, 19, 25, 33. A worse replay can never lower a total, because the total is the sum of each level's best.

**2. `firestore.rules`**
Add `'level6'` to the `hasOnly` list and one line:
```
&& (!('level6' in p.levels) || validLevel(p.levels.level6, 15));
```
`tests/progress.cjs` fails if the cog limit here and in `progress.js` disagree.

**3. `dist/index.html`** — a Level 6 card in the same shape as Level 5's, with `data-lock="level6"`, `data-lock-note="level6"`, a `data-level="level6"` badge, the footer link, and the "levels" and "cogs to collect" counts updated to 6 and 80.

**4. `dist/account-ui.js`** — add a `level6` entry to the `LOCKS` object. The lock note reads: *"Locked. Carry 33 of the 65 cogs from Levels 1 to 5 to open it (N so far)."*

**5. `.github/workflows/pages.yml`** — add `node --check` for the three Level 6 files and a line for each new test. **While you are there, add the two lines Level 5 is missing:** `node --check dist/level5.js` and `node --check dist/level5-data.js`. Level 5 currently ships with no syntax check and no tests at all.

---

## 10. Art

Follow `design/ART-DIRECTION.md`. It is the permanent rule for every picture in this game, and the three things that have gone wrong before are all in it.

**The three rules that keep being broken**
1. **The camera is flat side-on.** Every sprite is a straight-on front elevation: no perspective, no three-quarter view, no visible top surface. A plate is a flat rectangle seen from the side.
2. **Semi-realistic industrial, never cartoon.** Real metal with specular edges, worn paint, rivets and seams. Not flat vector, not glossy toy, not chibi.
3. **Colour has meaning.** Hazard red is only for danger. Amber is heat, feed and warning tells. Restrained cyan is Pack and safe technology. Mother Cluckzilla is warm amber and dusty machine-white, never red.

**Level 6 must not look like Level 5.** Level 5 is cold storm-grey; Level 6 is a warm, dusty, overgrown agricultural interior: grain-dust haze, green hydroponic columns, warm work lamps, timber and galvanised steel. Give each area its own deck material and its own backdrop, the way Level 4 does.

**The list**

*Backdrops*, one per area, 2112 × 896, darkened so sprites stay readable:
`threshold`, `feedline`, `orchard`, `alarmspine`, `grid`, `nestingbay`.

*Platform kit*, per area: deck, underside, catwalk.

*Props:* feed pod (held, thrown, burst), pod hopper (full and empty), feed trough (empty and baited), irrigation column (standing, leaning, fallen), the alarm switch (off and on), the bedding cart, conveyor, grain chute, orchard row planter.

*Mother Cluckzilla,* drawn in parts so she can be composed at any size: leg (three poses), body underside, head (raised, lowering, feeding), feed lamp. Authored large, around 2,600 px tall assembled.

*Landing card:* `dist/assets/landing-level6-v1.jpg`, 1280 × 720.

**Weight matters.** Ship sprite sheets as **WebP**, not PNG. Level 5's art is seven PNGs over 1 MB each and has taken `dist/` from 28 MB to 40.5 MB; two of them, `level5-prop-kit-v1.png` and `level5-scenery-kit-v1.png`, are about 4 MB that nothing loads, because the code uses the v2 kits. Level 4's entire 41-sprite atlas is 1 MB. **Target: the whole of Level 6's art under 4 MB,** and delete any version the code does not load.

---

## 11. Sound

Sounds relate to the action. No chiptune, no arcade jingles. Level 6 needs:
footfall (distant, near, ground-shaking), her feed-sigh, the pod throw, the pod burst scatter, the trough bait, a column groan and fall, the alarm, the conveyor, grain pouring, the cart rolling on rails, and the final silence when the feed line stops.

Route them through the existing `dist/audio.js` (`window.MayhemAudio.play(name)` and `.scene(name)`), so the volume and mute controls keep working. **Levels 3, 4 and 5 still have no sound;** if you are adding audio anyway, doing those in the same pass is cheap.

---

## 12. Acceptance criteria

Level 6 is not done until these pass. Write them as `tests/level6-*.cjs` in the style of `tests/level4-geometry.cjs` and `tests/level4-engine.cjs`: boot the **real** engine against the **real** data in a Node `vm` sandbox with a fake canvas and a controllable clock, then assert. Add every file to the workflow.

**Geometry** (`tests/level6-geometry.cjs`)
- 15 cogs with unique positions; 7 checkpoints in order along the level.
- Every checkpoint rests exactly on a surface with the full player width on it, and is inside the area it names.
- Every area runs end to end with no gap, and the last ends at `world.w`.
- No cog or pickup is buried inside a platform.
- Every story line is 70 characters or fewer.
- Every wall meant to stop the player is 440 px or taller.
- **Every jump on the route is simulated in the real engine and lands**, both carrying a pod and empty-handed.
- Every cog is collectable; the mastery cog is **not** reachable without a fallen column.

**Rules** (`tests/level6-rules.cjs`)
- A pod does nothing before the alarm, and works after it.
- She always moves to the newest burst pod, never to Bix.
- A trough with a pod in it brings her to that column, and the column falls.
- A fallen column stays fallen through a respawn; a full restart puts it back.
- The cart tips only when she is on it, and the level ends when it does.
- **She never damages Bix except by footfall, sweep or shockwave, and Bix can never damage her.**

**Soft-lock** (`tests/level6-softlock.cjs`)
- From every checkpoint, with every combination of columns already fallen, the exit is still reachable.
- A pod thrown into a pit, off the level, or into a fallen column's gap is always replaceable from a hopper.
- **There is no state in which the player has no way to make a pod.**

**Engine** (`tests/level6-engine.cjs`)
- Carry, set down, throw, burst and call back all behave.
- Each of the four phases starts and the phase banner shows.
- Deaths return to the checkpoint; the results screen and the `level6` save both record.
- The level draws without an exception in every phase, including the finish.
- **16 random 40-second runs at 30, 60, 120 and 240 fps stay finite and throw nothing.** Every level from 2 onward has this test and it has caught real bugs each time.

**Progress** (extend `tests/progress.cjs`)
- `level6` holds 15 cogs and saves a result.
- The carried total for Level 6 is the sum of Levels 1 to 5, topping out at 65.
- 32 carried cogs leave it locked; 33 open it.
- The Firestore rules and `progress.js` agree on the cog limit.

**Landing** (extend `tests/landing.cjs`)
- The page links all six levels and every image and stylesheet it names exists.
- With 32 carried cogs the Level 6 button has no link and the note explains why; with 33 it links.

---

## 13. Traps this project has already fallen into

Every one of these cost real rework. They are cheap to avoid.

1. **A level that looks like the one before it.** Level 4's first art pass reused Level 3's steel decks and read as the same level. Give Level 6 its own deck material, its own palette and its own backdrop per area.
2. **A hazard with no tell.** Level 3's ore train ended rides in six seconds because nothing said which button to press. Every hazard needs an amber tell before it, and the prompt box should name the button while it needs one.
3. **A test that proves nothing.** The Level 3 ride tests ran with an invulnerable player, so they passed while the ride was unplayable. **If a test measures danger, turn invulnerability off.**
4. **Colour carrying meaning alone.** Always pair colour with a shape or a label: inward chevrons and outward chevrons, a named chip in the HUD.
5. **Art that is too heavy.** See section 10. WebP, one version, delete what nothing loads.
6. **Files at the repository root.** Only `dist/` is published.
7. **Publishing without the rules.** `firestore.rules` has to be published by hand in the Firebase console. It is currently unpublished for `level4` and `level5`, so those results save on the device but are rejected for accounts.

---

## 14. Decisions I have taken, and the one I have not

**Taken as defaults,** all changeable:
- The dome reconciliation: the blueprint's "tree grid" and "hay-cart" become an **agri-dome** with irrigation columns and a bedding cart, so the finale keeps the blueprint's beats without leaving the industrial world the game actually became.
- Mother Cluckzilla is machinery, not a creature, and is never harmed.
- The signature mechanic is the Lure, using the controls the player already has.
- 15 cogs, 7 checkpoints, unlock at 33 of 65.
- Three columns in phase 3.

**Not taken — this one is yours.** Level 6 ends the first world, so it has to decide how much of the **BX-7 thread** to answer. Level 3's archive and Level 4's slips have been pointing at the same name for two levels: a work order open eleven years, signed by Bix, that he does not remember signing. The three ways to end this world:
- **Answer it.** The dome holds the last record and the player learns what BX-7 is.
- **Name it and stop.** Bix says the name out loud for the first time, and the world ends there.
- **Leave it.** Finish on the quiet dome and keep it for the second world.

The rest of this spec works with any of the three. Tell me which and I will write the closing script to match.
