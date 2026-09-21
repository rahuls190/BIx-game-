# Level 4, Delivery Attempt: build notes

Stage 1 (boxes first) is built and tested: the whole level is playable from the Transit Deck to the lift socket in plain shapes. The story is in `docs/level-4-story.md`, the line-by-line script in `docs/level-4-script.md`, the plan in `docs/level-4-plan.md` and the one-page map in `docs/level-4-map.html`. Nothing here is pushed.

## Play it locally
```
python -m http.server 8000 --directory dist
```
Then open http://localhost:8000/level4.html. It is locked until Levels 1 to 3 have carried 19 of their 38 cogs. On localhost, `?banked=38` unlocks it and sets the shield tier, and `?at=N` starts at checkpoint N (0 to 11) already carrying the core. Neither switch works on the live site.

## Files
| File | What it is |
|---|---|
| `dist/level4.html`, `level4.css`, `level4.js` | the page and the engine (a lean fork of Level 3's: same physics, camera, checkpoints, Pack catch, glove and crawlers) |
| `dist/level4-core.js` | pure logic for the Carried Core: modes and their effects, zone lookup, Pack's tell, reach numbers, Nib's incident reports and tally |
| `dist/level4-data.js` | all geometry and story triggers: 6 areas, 20 platforms, 18 ledges, core zones, plates, gates, belts, crane, vents, bolts, rails, relay nodes, stamps, slips, cogs, checkpoints, enemies |
| `tests/level4-{core,geometry,engine}.cjs` and `level4-harness.cjs` | the proofs (also in `.github/workflows/pages.yml`) |
| `design/make_l4_placeholder.py` | makes the placeholder landing picture (`dist/assets/landing-level4-placeholder.jpg`) |

## Cogs carry forward
`progress.js` has one rule: `carriedCogs(progress, levelId)` is the sum of each earlier level's best (Level 2: 0..12, Level 3: 0..26, Level 4: 0..38). Replaying can only raise it. `LEVEL4_UNLOCK_COGS = 19` (half of 38, as Level 3 asks 13 of 26). The shield tier scales with the total: `L3GLOVE.tierFor(banked, max)` maps Level 3's 12 and 20 of 26 to 18 and 29 of 38, so Level 4 tiers are Brittle Coil 0-17, Tempered Induction 18-28, Superconducting Aegis 29-38. `level4` (12 cogs) is in `progress.js` and `firestore.rules`.

## The Carried Core (as built)
- **E** picks up or sets down the core, **Red (X)** throws it (a held core, about 410 px), **Blue (Z)** calls a loose core within 560 px and Bix catches it.
- **Modes by zone** (`zones[]` in the data): heavy (run x0.82, jump x0.88, apex 162) in the Freight Concourse and the first part of the shaft; buoyant (gravity x0.55, glide at 260 px/s, a held jump rises about 380 px) in the Signal Spine and the middle of the shaft; charged (normal movement, live rails) in the Relay Bay and at the socket. The plain core is used on the deck and in the market.
- **Pack's tell:** the CORE chip turns amber ("CHANGE AHEAD") 240 px before a mode change, and Pack says a line when it changes.
- **Never lost:** a core that leaves the world, or any respawn, puts it beside Bix. `coreDrops` is counted for the "Careful Courier" note on the results screen.
- **Plate and gates:** a heavy core resting on the scale plate opens the sorting gate for good. The customs desk opens the customs gate with three stamps and the core. Three lit relay nodes open the relay gate. Courier Prime's speech opens the cage gate after 13 s. Gates are 460 px tall (a jump plus a ledge grab is 300).
- **Hazards:** cargo crane (Level 3's press timing), reversing belt, updraft vents, lightning bolts (a buoyant core makes Bix too light to hit), live rails. A raised shield soaks one hit and gives one second of grace.
- **Deaths:** Pack's catch first, then a real death filed by Nib as `INCIDENT n:` (two variants per cause, never the same one twice in a row). The results screen shows Nib's tally.
- **End:** seat the core at the socket. The delivery scene plays (`AUTHORISED: BX-7`, "Display glitch.", "Yeah.", "Thanks, Dennis."), the screen whitens, the level completes and saves as `level4`. Medals: Gold 10 cogs / 10 falls / 18:00, Silver 6 / 25 / 25:00, Bronze any.

## Numbers (checked by tests/level4-geometry.cjs)
Every jump on the route (34 of them) works in the real engine's physics both carrying the core in its zone and without it, so a dropped core never traps Bix. The spine also needs no updraft. Every cog and slip is collectable. Cog c11 (the mastery cog, y -1500) is out of reach of a plain jump and reachable only with the buoyant core from ledge b1. Heavy steps rise 100 with gaps under 100; buoyant steps rise 140 with gaps of 80; spine steps rise 80 to 100.

## Art (Krea 2 in a local ComfyUI, `design/comfy_l4.py` then `design/build_l4_art.py`)
Level 4 has its own look, not Level 3's blue-grey steel: each area has its own deck, underside and catwalk in its own materials and palette (transit slate concrete, rust-red freight container steel, timber and teal for the market, galvanised lattice for the spine, black composite with violet for the relay bay, black iron with a red lip for the shaft), its own painted backdrop, and the gates have their own doors (freight shutter, customs barrier, relay blast door, steel cage). New props: the core in four looks (grey-white, amber, cyan, violet), core cradle, scale plates, belt, vent, arc pylons, relay nodes, vending bot, busker bot, customs desk, lift socket, delivery slip, cargo crane container and cable. `build_l4_art.py --tag=vN` keys the magenta, packs `dist/assets/l4-world-vN.webp`, writes six `l4-bg-*-vN.jpg` backdrops and `dist/level4-art.js` (window.L4ART); choices are in `design/level4-art-krea/choices.json` (candidate folders are git-ignored). The engine draws every picture through `blit()` with a plain-shape fallback, and falls back to Level 3's art only for a name Level 4 lacks. Change the tag when the pictures change, so browsers do not keep the old atlas. The landing picture is `dist/assets/landing-level4-v1.jpg` (`design/comfy_landing_l4.py`).
Speed note: give the area pieces ONE small reference (the backdrop at 512 px). Two references made each picture take five minutes instead of 17 seconds.

## Not built yet (stage 2 and later)
- **Courier chase** (a courier bot steals the core on the spine) and **Courier Prime's three-core choice**. Stage 1 has his lines and the cage gate but no fight-free puzzle yet.
- **Blackout and Pack's Lens Beam** (hidden platforms), the **Antenna nest** and **Lost & Found** as separate rooms with their own puzzles (Lost & Found is two ledges with a cog and a stamp), **Zero Margin** and **No-drop** skill branches with ghost replay, **weak floors**, **rotating dishes**, **Nib** and the market NPCs as characters, the **busker band**.
- **Art for the stage 2 pieces** (Courier, Courier Prime, the blackout, the Lens Beam, the secret rooms), and **sound** for Levels 3 and 4.
- The **three-agent review** (graphics, physics, game rules), then the user's go-ahead before any push.

## Decisions taken as defaults (the user said "story, and start making it")
Carried Core is the signature idea. Unlock at 19 carried cogs; tiers 18 and 29. VELA returns softer and fades out. The socket flashes `AUTHORISED: BX-7`, then "Display glitch." "Yeah." No all-cogs archive room. BX-7 is Bix only as a private proposal in the story doc, never revealed. All can be changed; the alternatives are in `docs/level-4-script.md`.
