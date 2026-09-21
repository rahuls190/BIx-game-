# Level 4 — Delivery Attempt (working title): plan v0.2

Status: **stage 1 (boxes first) is built and tested**, see `design/LEVEL4-BUILD-NOTES.md`; nothing is pushed. The open decisions below were taken as defaults when the user said "story, and start making it" (unlock 19 carried cogs, shield tiers at 18 and 29 of 38, VELA returns softer, the socket flashes BX-7, no archive room) and can be changed. Open decisions are marked **DECIDE**. Numbers are starting points and get tuned in stage 1, the same way Level 3's were (see `design/LEVEL3-BUILD-NOTES.md`).

## Where the story stands
- Level 1 taught movement, batteries, breakers and Pack. Level 2 added heat, five enemies and Pack Assist. Level 3 added the Magnet Glove (Blue attract, Red repel, shield tiers from banked cogs).
- Level 3 ends at the **Surface Transit Gate**: Bix overcharges the transit door and the way up opens.
- The archive (all 12 cogs) plants a hook: work order **BX-7**, "inspect lift", open for 11 years, next of kin none, last task "routine repair". Pack goes quiet. Level 4 should pay this off a little and not solve it.
- VELA has gone from cold dispatcher to saying nothing (Level 2). Level 4 is where she speaks again, or where someone else does.
- The early blueprint already lists this slot as **04. Delivery Attempt**: the carried core changes weight and behaviour; a mid-level market scene gives NPC comedy and a low-pressure break. This plan adapts that to the industrial world the game actually became.

## Premise
The transit line up is dead. The surface lift needs a power core, and the only working one is in Sector 3's depot, so Bix has to carry it up through the Transit Levels: freight concourse, depot market, signal spine, lift shaft. Everything about the trip is "just deliver it". Each zone changes what the core does.

## Signature mechanic: the Carried Core
One idea, introduced gently and recombined at the end (the blueprint's rule: every level ends by recombining its idea).
- Bix picks the core up (E / touch button) and carries it. It is heavy: it lives in front of him and can be set down, thrown, or pulled with the glove.
- The core has a **mode** set by the zone it is in, shown by its colour and a HUD chip (never colour alone, matching Level 3):
  | Mode | Where | Effect on Bix |
  |---|---|---|
  | Heavy | Freight Concourse | Slower run, lower jump, but breaks weak floors and holds down pressure plates |
  | Buoyant | Signal Spine | Bix floats on long jumps and is pushed by vents; the core drifts if thrown |
  | Charged | Relay and Lift | Sticks to iron, attracted by Blue, pushed by Red; arcs to nearby rails (hazard) |
- The Magnet Glove stays: Blue and Red move the core and act on the world as in Level 3, so nothing learned is thrown away. The shield still works, and its tier comes from the carried cog total (see the next section).
- Failing is cheap: dropping the core down a pit respawns it at the last checkpoint with Bix. It can never be lost or wedged (same soft-lock test as Level 3).
- Pack scans the core: amber tell before a mode change, so the level reads like a beat.

## Cogs carry forward (user rule, applies to every level)
Every cog banked in an earlier level counts in the next one. In Level 4 that means:
- The shield tier is set by the running total of best cogs across all earlier levels (before Level 4: Levels 1 to 3, up to 38). Level 3's cut-offs (0-11, 12-19, 20-26) are extended for the larger total; **DECIDE** the new numbers.
- The Level 4 unlock is a threshold on that same total, one rule in `progress.js` used by the landing card and the start screen, like Level 3's `LEVEL3_UNLOCK_COGS`.
- Cogs collected in Level 4 add to the total and carry on to Level 5. A better run replaces the level's best; the total is the sum of the bests, so replaying can never lower it.
- Code: generalise `bankedCogs` (or add `totalBankedCogs(upToLevel)`) so every level asks one function; add `level4` (12 cogs) to `progress.js` and `firestore.rules`; add a test that the total is the sum of bests and never drops. The start screen shows "Carried cogs: N".
- Check while building: Levels 1 to 3 as shipped may not all use the running total the same way (Level 3 counts Levels 1 and 2). Bring them into line with this rule in the same change, without lowering anyone's saved total.

## Set pieces, secrets and extras (v0.2: what makes each area memorable)
An interactive map of all of this is in `docs/level-4-map.html` (click markers, switch layers, press Play).

| Area | Set piece | Hazards | Secrets, branches, story |
|---|---|---|---|
| 1 Transit Deck | **First Handshake**: Pack introduces the core and its weight gauge; a safe pit shows the respawn rule | none | Pack names the core (running gag); delivery slip 1 |
| 2 Freight Concourse | **Sorting Gates** weigh what passes: the heavy core opens them, a fake does not | reversing conveyors (a plate flips them), swinging cargo crane on a beat, crawlers | Skill branch **Zero Margin** (timed cog run, ghost of your best time); slip 2 |
| 3 Depot Market | **Customs Desk**: three stamps from three stalls; a **busker bot band** | none (the breather) | **Nib** runs the market and files an incident report for every death; secret room **Lost & Found** (cog + slip); slip 3 (BX-7 signed for the lift) |
| 4 Signal Spine | **Rotating dishes**; **Courier Chase**: a courier bot grabs the core mid-climb and runs up the antennas | updraft vents, storm with a lightning tell | Gadget branch **Pack Lens Beam** (reveals hidden platforms); secret room **Antenna nest** (needs the beam); slip 4 |
| 5 Relay Bay | **Core Pinball**: Red-throw the core through three relay nodes to power a gate; Blue calls it back | arcing rails on a rhythm, **blackout** (Pack's lens is the only light) | Skill branch **No-drop cog run**; secret room **BX-7 crawlspace** (plaque, cog); slip 5 |
| 6 Lift Shaft | **Courier Prime** (mini-boss): three identical cores, only the real one obeys the modes; Pack scans, the glove picks. Solved with the environment, not a fight. Then the **three-mode climb** and **the delivery** | all three modes at once | slip 6 (the BX-7 work order, signed by Bix) |

Totals: 8 set pieces, 7 hazard types, 3 secret rooms, 6 delivery slips, 3 optional branches (2 skill, 1 gadget), 2 boss moments, 12 cogs, 12 checkpoints.

Extras that keep it fresh:
- **Nib's incident reports:** every death is filed as a short funny report; a tally shows at the end and is saved with the best run.
- **Delivery slips** (6): collectible lore that adds up to the BX-7 story; a full set is the "All Slips" medal.
- **Medals:** Careful Courier (never drop the core), Speed, All Slips.
- **Ghost replay** of your best run in the Zero Margin room.
- **Pack keeps its Level 2 assists** (holding a gate, scanning) and gains the Lens Beam and the mode-change tell.
- **Sound:** the busker band, the core's weight thud, vent air, arc crackle and the storm, all tied to actions.
- **Cogs carry forward** (see above) and Level 4 cogs carry on to Level 5.

## Areas (about 20,000 px, first clear 15 to 20 minutes, clean run about 5)
| # | Area | Idea taught | Beat |
|---|---|---|---|
| 1 | Transit Gate Deck | Pick up, carry, set down; core weight | Warm-up. Core sits on a cradle; a short carry teaches the slower run |
| 2 | Freight Concourse | Heavy mode | Conveyors and plates that need the core's weight; weak floors the core cracks; Level 2 crawlers as light pressure |
| 3 | Depot Market | Low-pressure break; NPC comedy | No hazards. Vending bots, a customs desk that demands the core's paperwork (a mini puzzle), Nib-style operations lead. Optional cog puzzle, one story beat about BX-7 |
| 4 | Signal Spine | Buoyant mode | Vertical climb on vents and antenna gantries; float jumps; wind you can read from Pack's amber tell |
| 5 | Relay Bay | Charged mode plus the glove | Magnetised rails, arcing cables, Red-throw the core across gaps and Blue it back. The combination of Levels 3 and 4 |
| 6 | Lift Shaft | Recombine all three modes | The final climb: heavy plate, buoyant hop, charged throw, in one run |
| End | Lift socket | Delivery | Core seated, lift rises, a short scene. Ends open, pointing at Level 5 |

Optional archive-style room for players who recovered all 12 cogs, again a payoff and not a new level (**DECIDE** whether to repeat the pattern).

## Enemies and hazards
- Reuse Level 2's five enemies where they fit (pressure, not new rules). Add **two** new ones only: a courier bot that carries a fake core and tries to swap it (comedy, and teaches "which core is real"), and an arcing cable rail for the Charged mode.
- Hazard red stays reserved for enemies and immediate danger. Charged arcs are cyan-white, buoyant vents are pale grey with chevrons.

## Numbers to tune in stage 1 (placeholder-first)
- Run and jump multipliers per mode, core throw speed, float coefficient, arc radius.
- Length per area, cogs (target **12**, one hard-to-reach mastery cog like Level 3's c11), **12 checkpoints**, no soft-locks.
- Medals and best-time saves through `progress.js` as `level4`; `firestore.rules` gets a `level4` entry (12 cogs).
- Unlock rule: a threshold on the carried cog total (**DECIDE** the number; Level 3 used more than 12 of 26).

## Story and dialogue (draft beats, not final text)
1. Arrival: VELA is silent; the comms carry static and a different voice, or nothing. Pack notes it.
2. Core pickup: "Delivery. That is all this is." (Bix says it; the level then makes it untrue.)
3. Depot Market: the customs desk lists BX-7 as the last signer for the lift. Bix pockets the slip. Pack does not comment.
4. Signal Spine: the first sign that the surface is not empty (a lit window, a bird-like drone).
5. Lift Shaft: the core spells a name on the socket display for one frame. **DECIDE** what it says.
6. End: the lift rises; the surface light is the first daylight in the game. Cut before Bix sees anything.
The full draft script is in `docs/level-4-script.md` (154 numbered trigger lines and 9 incident-report causes), with death lines per hazard (Pack for crushes, VELA or the desk for falls, "System" for arcs).

## Art and sound (the standing rules)
- Follows `design/ART-DIRECTION.md`. Side-on flat camera, Level 1/2 painted style, real metal sheen, detailed platforms. Flat magenta sprites keyed through the existing local ComfyUI + Krea 2 pipeline (`comfy_l3.py`, `build_l3_from_comfy.py`; copy the tooling to a `level4` variant). The core gets three matching looks (heavy, buoyant, charged), same object.
- Bix must be the real Level 1/2 Bix. Pack is the canonical Pack. New Bix/Pack turnaround art exists in `design/bix-poses` and `design/pack-poses` for reference (not yet game sprites).
- Sound must relate to the action: the core's weight (thud on a plate), the float (soft air), the charge (crackle), plus a market ambience. Real recordings first (Krea Seed Audio when credits return), synth fallback through `dist/audio.js`. Level 3 still has no sound; plan one sound pass for Levels 3 and 4 together.

## Build stages (same pipeline as Level 3)
1. **Greybox**: coloured boxes, all geometry in `dist/level4-data.js`, the engine forked from Level 3, the core and its three modes in `dist/level4-core.js` (pure logic like `level3-glove.js`). Tune until a bot can clear it.
2. **Tests first**: `tests/level4-{core,geometry,softlock,route,areas,rules,physics}.cjs` plus the fuzz run at 30 to 240 fps; add them to `.github/workflows/pages.yml`.
3. **Real art** and the landing card, after the user picks the pictures.
4. **Sound** pass.
5. **Three-agent review** (graphics, physics, game rules), then fixes, then the user's go-ahead before any push.

## Risks
- The carried object doubles the soft-lock surface (core stuck, core lost): the respawn-with-Bix rule and a reachability proof for every core position are the answer.
- Three modes plus the glove is a lot of rules: introduce one per area, never two new ones at once, and let the market (area 3) be the breather.
- Length: keep to about 20,000 px so the file and test time stay in the range of Level 3.
- The BX-7 thread must stay open: answering it in Level 4 would spend the mystery.

## DECIDE (need the user's answers)
1. Signature idea: the **Carried Core** with three modes (recommended), or another idea (see below).
2. How many carried cogs unlock Level 4 (Level 3 used more than 12).
3. The shield tier cut-offs for the larger carried total (the carry-forward itself is settled).
4. Who speaks in the comms in Level 4 (VELA returns, silence, or a new voice)?
5. What does the socket display spell (BX-7, Bix's own ID, or nothing)?
6. Does Level 4 get an all-12-cogs archive room?

### Alternative signature ideas, if the core does not appeal
- **Light and dark**: the transit tunnels are unlit; Pack's lens is the only light, and enemies only move in the dark.
- **Escort**: a slow maintenance bot follows Bix and must be guided across hazards with the glove.
- **Rewire**: the factory idea from blueprint level 05 moved earlier: a switchboard puzzle where the wrong wiring changes the level.
