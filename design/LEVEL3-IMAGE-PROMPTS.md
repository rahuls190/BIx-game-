# Level 3 image prompts

One copy-and-paste prompt for every Level 3 image. Each prompt already contains the shared style rules, so you can paste it straight into an image generator.

## How to use this

1. **Make the glove first (prompt 00).** Bix, Pack and the enemies already have approved designs. The Magnet Glove does not. Generate prompt 00, pick the best result, and attach it to every prompt that lists it.
2. **Attach the reference images** each prompt lists. The Bix and Pack images are the most important: they keep the characters identical from sheet to sheet. Where the reference files live is at the end of this document.
3. **One sheet per generation.** Ask for exactly one image per prompt. If the generator changes the size, keep the grid (columns x rows) and the cell order: I can trim and pad to exact pixels afterwards.
4. **Check before you keep it.** Every subject must sit fully inside its cell with space around it, be lit from the upper left, and have no background, shadow, text or grid lines. Check that the cells are in the order the prompt lists. If one cell is wrong, regenerate the whole sheet, or send me the good cells and I will rebuild the sheet.
5. **Save each master** as `design/level3-art-masters-v1/<file>-master.png` (the file name is under each prompt's heading), and never overwrite an older one: use `-v2` for a redo. Then tell me and I will run the plate pipeline (trim, crop table, sizes, tests).
6. **If your generator cannot make transparent PNGs**, the prompts fall back to a flat magenta (#FF00FF) background. Keep the magenta clean and I will key it out.

## What to make first

| Priority | Prompts | Why |
|---|---|---|
| 1. Areas 1 to 3 (the playable stage 1) | 00, 01, 02, 03, 04, 05, 06, 07, 09, 10, 15, 16, 17 | The glove, Bix with the glove, Pack, the effects, plates, pad, crate, presses, crawler, spitter and the first three backgrounds |
| 2. Areas 4 to 6 | 08, 11, 12, 13, 18, 19, 20 | Drones, lab, train, vault and their backgrounds |
| 3. Polish | 14, 21, 22 | UI icons, foreground silhouettes, the landing card |


## The prompts

### 00 · Magnet Glove concept (make this FIRST, then attach it to every Bix prompt)

**Save as:** `magnet-glove-concept-v1.png`  
**Attach:** `pack-character-v1.png`, `bix-motion-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One image, 1536 x 1024 px, three views of the SAME gauntlet on a transparent background (or flat magenta #FF00FF if transparency is unavailable): left = side view, centre = three-quarter view, right = palm view. Show only the gauntlet and forearm, no body. No text.

SUBJECT
Design the prototype Magnet Glove for Bix, the hero of a platform game.
It is a bulky forearm gauntlet, roughly one and a half times the size of a normal work glove. Charcoal dark-steel body with worn off-white armour plates, a copper induction coil wound around the wrist (with a green-brown patina), orange service panels with fasteners, hazard-stripe edging on one plate, two small heat-vent slots on the back of the hand, and a round palm emitter with a cyan-blue polarity core that can glow.
The palm emitter has a faint swappable ring: cyan-blue with inward chevrons for Blue (attract), copper-coral with outward chevrons for Red (repel). Show the ring in its dark, unlit state.
It looks prototype and handmade: exposed cable runs, a taped-on gauge, scratched edges. It must clearly belong to the same world as Pack (attached): the same worn off-white armour, charcoal machinery and orange panels.
Do not show fingers doing anything dramatic; a relaxed open hand.
```

### 01 · Bix with the glove: movement sheet (same cell order as bix-motion-v2)

**Save as:** `bix-glove-motion-v1` (`-master.png` will be added)  
**Attach:** `bix-motion-v2.png`, `magnet-glove-concept-v1.png`

*Cell order matches bix-motion-v2 (0 idle, 1 idle, 2-5 run, 6 jump up, 7 apex, 8 fall, 9 land, 10 hang, 11 cling/climb) so the engine can swap the file without code changes.*

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1152 px, a strict grid of 4 columns x 3 rows of equal cells (384 x 384 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
BIX (must match the attached bix-motion-v2.png exactly): a young man with wavy brown hair and tinted glasses, a worn blue-teal work jacket with orange piping over a white tee, grey cargo trousers with knee pads, chunky grey boots with orange accents, fingerless black-and-orange work gloves, and Pack (a rectangular robot backpack with a cyan camera lens) on his back. Same proportions, same wardrobe, same line quality.
THE MAGNET GLOVE (must match the attached magnet-glove-concept image): it replaces the black-and-orange glove on Bix's RIGHT hand. A bulky forearm gauntlet in charcoal steel with worn off-white plates, a copper induction coil wound around the wrist, orange service panels, a cyan-blue polarity core in the palm, and two small vent slots on the back of the hand. It must stay recognisably the same in every pose.
All poses are side-on, facing RIGHT, feet at the same baseline in each cell where he is grounded. Pose list:
1 standing idle, weight even, glove hand relaxed at his side.
2 standing idle, second frame: a slight breath, shoulders a touch lower.
3 run cycle frame A: contact pose, lead foot forward.
4 run cycle frame B: passing pose.
5 run cycle frame C: opposite contact pose.
6 run cycle frame D: opposite passing pose.
7 jumping upward: both legs bent, arms trailing, going up.
8 apex of a jump: body tucked, glove arm forward.
9 falling: legs reaching down, arms up and back.
10 landing: deep crouch, one glove hand touching the ground.
11 hanging from an overhead iron girder: both arms straight up, the glove hand gripping magnetically with a faint cyan-blue glow at the palm, the other hand holding the beam, legs dangling.
12 clinging to a vertical iron wall: side on, glove hand flat against the wall with a faint cyan-blue glow, one knee raised, boots pressed to the wall, body angled into it.
```

### 02 · Bix with the glove: action sheet

**Save as:** `bix-glove-action-v1` (`-master.png` will be added)  
**Attach:** `bix-motion-v2.png`, `magnet-glove-concept-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
BIX (must match the attached bix-motion-v2.png exactly): a young man with wavy brown hair and tinted glasses, a worn blue-teal work jacket with orange piping over a white tee, grey cargo trousers with knee pads, chunky grey boots with orange accents, fingerless black-and-orange work gloves, and Pack (a rectangular robot backpack with a cyan camera lens) on his back. Same proportions, same wardrobe, same line quality.
THE MAGNET GLOVE (must match the attached magnet-glove-concept image): it replaces the black-and-orange glove on Bix's RIGHT hand. A bulky forearm gauntlet in charcoal steel with worn off-white plates, a copper induction coil wound around the wrist, orange service panels, a cyan-blue polarity core in the palm, and two small vent slots on the back of the hand. It must stay recognisably the same in every pose.
All poses side-on, facing RIGHT. Pose list:
1 reaching into a prototype locker and lifting the glove out, curious.
2 BLUE field: right arm extended forward, palm out, cyan-blue glow and inward chevrons at the palm, hair and jacket tugged forward as if pulled.
3 RED field: right arm extended forward, palm out, copper-coral glow and outward chevrons at the palm, hair and jacket pushed back, bracing stance.
4 SHIELD: the glove fist raised in front of him, a small teal energy bracing at the wrist, other arm guarding.
5 sliding down a vertical wall: glove hand flat on the wall, legs trailing, sparks at the palm.
6 OVERLOAD: glove smoking from its vents, jagged cyan-white arcs around the hand, Bix wincing and shaking the arm.
7 being lifted on a tether: a thin cable from Pack's arm to his harness, body slightly limp and swinging, legs trailing.
8 comically flattened by a press: his body compressed to a thin, wide silhouette, arms and legs splayed, dazed expression. Playful slapstick, NO gore.
```

### 03 · Pack: tether and terminal poses

**Save as:** `pack-tether-v1` (`-master.png` will be added)  
**Attach:** `pack-character-v1.png`, `pack-assist-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 512 px, a strict grid of 4 columns x 1 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
PACK (must match the attached pack-character-v1.png exactly: a compact rectangular industrial chassis, a large cyan camera lens, articulated utility arms, an antenna, worn off-white armour, charcoal machinery, orange service panels). Side-on, facing RIGHT, floating slightly.
Pose list:
1 tether DEPLOY: one arm firing a thin steel cable diagonally upward-right, a small grapple claw at its tip, the lens bright.
2 tether HOLD: Pack braced, two arms gripping a cable that runs off to the right, antenna straight, small effort lines are NOT allowed, show effort with posture only.
3 tether SWING: Pack hauling the cable in, body tilted back, the cable taut.
4 HOLDING A TERMINAL: one arm clamped onto a small grey console panel (only the part Pack touches, in cyan-lit light), the other arm bracing; lens glowing steady cyan, a faint cyan halo around the clamped hand.
```

### 04 · Glove effects

**Save as:** `glove-fx-v1` (`-master.png` will be added)  
**Attach:** `magnet-glove-concept-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
These are EFFECT sprites for a magnet glove. Glow IS allowed here because the glow is the asset. Pure additive-looking light, no solid backgrounds.
1 BLUE field: a circular field of cyan-blue (#5FD4FF) energy about 116 px across in the final game, a ring of inward-pointing chevrons, faint plasma streaks being pulled toward the empty centre.
2 RED field: same size, warm copper-coral (#FF8F6A), a ring of OUTWARD-pointing chevrons, streaks radiating outward. NOT hazard red.
3 LATCH spark: a bright cyan-white contact flare where a magnet meets an iron beam, short arc lines, about 64 px.
4 CLING spark: three small cyan-white contact flares, tiny.
5 OVERLOAD arcs: unstable jagged cyan-white arcs with orange edges around a hand-sized area.
6 SHIELD dome: a translucent teal (#59E2C2) bubble outline with faint hexagonal panels and a thin bright rim, seen side-on, about 110 px tall.
7 EMP ring: an expanding double shockwave ring, teal-white, thin and crisp.
8 VENT puff: a puff of steam from a glove vent, grey-white with a faint orange edge.
```

### 05 · Iron, copper and steel plates, girders and wall strips

**Save as:** `mag-plates-v1` (`-master.png` will be added)  
**Attach:** `furnace-platform-atlas-v2.png`, `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Platform pieces for an ore shaft, seen from the side. Wide pieces fill about 90% of the cell width and are centred vertically. Each is a self-contained piece with its own bolts and brackets.
1 IRON plate: a wall-mounted ledge, about 3:1 wide, blue-grey iron with horizontal ribbing, a thin glowing cyan-blue strip along its front edge, heavy wall bracket at one end.
2 COPPER plate: same shape, warm copper with a diamond hatch and a green-brown patina, slightly thinner, looks fragile.
3 STEEL rest plate: wider, 4:1, charcoal steel, an orange service panel, hazard-stripe edging and a small round checkpoint lamp on its top.
4 COPPER plate, LIGHTLY CRACKED: same as 2 with fine hairline cracks and a few loose flakes.
5 COPPER plate, ABOUT TO FALL: badly cracked along a diagonal, one end lifting, rivets popping, small pieces falling away.
6 IRON GIRDER segment: a horizontal overhead I-beam, about 8:1, seen from the side and slightly below, ribbed iron with rivets and a row of small cyan-blue indicator studs on its underside so a magnet has something to grip.
7 IRON WALL STRIP: a tall vertical panel, about 1:6, iron horizontal ribbing, cyan-blue indicator lights, bolted seams.
8 COPPER WALL STRIP: the same tall panel in diamond-hatch copper with a green-brown patina.
```

### 06 · Repel pad, repel net, crate, cores and socket

**Save as:** `repel-and-crate-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
1 REPEL PAD, idle: a floor-mounted copper pad, about 3:1 wide, dark, with concentric copper-coral arrows pointing UP, unlit, sitting flush in a steel frame.
2 REPEL PAD, fired: the same pad with a bright coral-white burst, arrows lit, sparks shooting upward.
3 REPEL NET: a taut woven copper mesh strip about 8:1 wide, stretched between two heavy brackets, faint coral glow along the weave.
4 CRATE: a heavy iron scrap crate, tall, about 84 wide by 150 high in game proportions (0.56:1), iron banding, stencil-free hazard corner marks, a round cyan-blue magnetic plate on the visible side. No text.
5 CRATE, crumpled: the same crate dented on the side, one top corner crushed inward.
6 POLARITY CORE, blue: a floating spherical core in a slim open cage, about 90 px, glowing cyan-blue with inward chevron markings.
7 POLARITY CORE, red: the same, glowing copper-coral with outward chevron markings.
8 CORE SOCKET: a wall-mounted receptacle, rectangular, with a round recess for a core and two small unlit lamps beside it.
```

### 07 · Hydraulic press parts

**Save as:** `crusher-press-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 3 columns x 2 rows of equal cells (512 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Parts of a heavy hydraulic press, drawn side-on so they can be stacked in the game.
1 PRESS HEAD: a heavy wide block about 1.25:1, dark steel, hazard-stripe band on its lower face, hydraulic bosses on top where the piston joins, scarred and dented from use.
2 PISTON SHAFT: a tall thin chrome-steel rod segment about 1:4 that can be repeated vertically, oil-stained, with a fitted collar at each end.
3 ANVIL BLOCK: a wide steel plate about 4:1 sunk into a deck, heavily scarred by impacts in the middle.
4 AMBER WARNING LAMP: a round caged beacon, lit amber and glowing softly, on a short bracket. The only warm light in the cell.
5 SLAM DUST: a burst of dust, grit and a few metal shards thrown sideways from an impact on the ground, side-on, semi-transparent, no ground drawn.
6 CEILING MOUNT: a heavy bolted ceiling bracket block that the piston hangs from, with a hydraulic hose.
```

### 08 · Polar Drones (cyan and copper)

**Save as:** `polar-drone-v1` (`-master.png` will be added)  
**Attach:** `enemy-wasp-v2.png`, `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
POLAR DRONE: a small hovering industrial sentry, about 36 px in game, roundish, matte charcoal steel shell with off-white plates, TWO magnet coils like short horns on top, small thrusters underneath, and a central polarity core that glows. Because it is an enemy it also has one small hazard-red sensor dot.
Top row = BLUE drone (core glows cyan-blue with inward chevrons). Bottom row = RED drone (same design, core glows copper-coral with outward chevrons).
Columns: 1 hovering idle, 2 THROWN AWAY (tilted hard, motion streaks pointing away), 3 ATTRACTED (leaning forward, pulled, coils reaching), 4 DESTROYED (shell split, sparks, parts flying, core dark).
```

### 09 · Scrap Crawler, mining-sector reskin

**Save as:** `enemy-crawler-v3` (`-master.png` will be added)  
**Attach:** `enemy-crawler-v2.png`, `pack-character-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Re-skin the attached Level 2 Scrap Crawler (KEEP the same body shape, six-limb stance, red eye lens and antenna, and EXACTLY the same 8-cell order and poses) for the Level 3 mining sector: more ore dust and grey grit on the armour, copper-green patina on the joints, one panel replaced with a rough iron plate, and small chunks of ore stuck in its feet. Hazard-red eye stays.
Cell order (same as the Level 2 sheet): 1-4 walk cycle, 5 turn/pause, 6 waking with the eye stalk raised, 7 stunned with green sparks, 8 alert with claw extended. Side-on, facing RIGHT.
```

### 10 · Slag Spitter, mining-sector reskin

**Save as:** `enemy-spitter-v3` (`-master.png` will be added)  
**Attach:** `enemy-spitter-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Re-skin the attached Level 2 Slag Spitter (KEEP the same body, the mouth-port, the red charge glow and EXACTLY the same 8-cell order and poses) for the Level 3 mining sector: ore dust, grit, copper-green patina on the pipework, a rough iron bracket where it hangs from its ceiling girder. Keep the hazard-red charge glow.
Cell order (same as the Level 2 sheet): 1 idle, 2 charging (glow low), 3 charging (glow high), 4 firing, 5 firing recoil, 6 cooling, 7 waking or cooled, 8 the slag shot on its own (a glob of molten orange slag). Side-on, facing LEFT.
```

### 11 · Polarity Lab props

**Save as:** `lab-props-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
1 TURNTABLE: a heavy round bedplate on a short pillar seen from the side, about 2.5:1, scarred steel with an induction ring around its rim, currently dead.
2 TERMINAL: a console on a pedestal, cyan screen showing only an abstract progress bar (no text), a big square press-plate for Pack to hold.
3 TERMINAL, HELD: the same terminal glowing brighter, the press-plate clamped, a cyan halo, small sparks.
4 LASER EMITTER: a wall-mounted emitter head with an amber lens, mounted on a bracket, angled to fire downward.
5 LASER BEAM: a tall thin vertical beam segment that can be repeated, hot white-coral core with a hazard-red edge glow, crisp.
6 SCRAP CHUTE: an overhead funnel and hatch, open, a few lumps of scrap visible inside, ragged orange service panel.
7 BOARDING GATE panel: a tall louvred shutter segment, about 1:1, that can be stacked vertically, dark steel with hazard-stripe trim.
8 SOCKET LAMPS: two round lamps side by side. Left one dark (off). Right one lit cyan.
```

### 12 · Ore train parts

**Save as:** `ore-train-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1024 px, a strict grid of 4 columns x 2 rows of equal cells (384 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
1 FLATBED: an ore-train flatbed car, about 6:1, heavy steel deck with a low edge rim, two chunky bogies, rust and ore dust, a small amber beacon socket at each end, seen from the side.
2 COUPLING: a heavy coupling hook with a dangling chain, small.
3 BUFFER STOP: a massive dented buffer block on a short rail stub, hazard stripes, scarred by impacts.
4 RAIL SEGMENT: a tileable horizontal piece about 8:1: two steel rails on sleepers with a thin cyan-blue magnetic strip between them, gravel bed.
5 OVERHEAD GANTRY: a tall portal frame of iron beams that arches over the track, seen side-on, with a small crane trolley.
6 FALLING ROCK: a chunk of dark ore with copper veins, about 48 px, tumbling, a puff of grit.
7 SWING-LOAD: a scrap-magnet crane load: a chain hanging from the top of the cell and a lump of mixed scrap held on a round magnet plate.
8 JOLT LAMP: a round caged amber beacon on a bracket, lit, glowing.
```

### 13 · High Vault props

**Save as:** `vault-props-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`, `magnet-glove-concept-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1536 px, a strict grid of 3 columns x 3 rows of equal cells (512 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Low-gravity sorting chamber props. Everything is heavy but drawn as if floating.
1 ISLAND A (iron-rich): a floating slab of magnetised scrap, about 2.5:1, blue-grey ribbed iron with cyan-blue glints and stuck-on scrap.
2 ISLAND B (iron-rich): a different silhouette, same idea, slightly smaller.
3 ISLAND C (copper-rich): the same idea in diamond-hatch copper with a green-brown patina.
4 ISLAND D (copper-rich): different silhouette from C.
5 ISLAND E (mixed): iron and copper welded together, uneven, larger.
6 TRANSIT DOOR: a huge closed vault door with a heavy round lock ring in the middle, hazard-stripe trim, coils around the lock, ready to blow. Seen straight on. No text.
7 ARCHIVE DOOR: a smaller, cleaner door with a cyan security lock glowing softly, brushed steel, a narrow indicator strip.
8 DOOR LOCK close-up: the transit door's lock ring alone, with a copper coil, drawn large so it can be animated overheating (dark, unlit).
9 VOID HAZE: soft drifting dust and faint magnetic field lines, very low opacity, wispy, teal-grey, no hard edges, transparent.
```

### 14 · Glove icons, medals and shield badges

**Save as:** `level3-ui-v1` (`-master.png` will be added)  
**Attach:** `furnace-prop-atlas-v2.png`, `energy-cog-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1536 x 1536 px, a strict grid of 3 columns x 3 rows of equal cells (512 x 512 px each). Exactly one subject per cell, centred, fully inside its cell with at least 8% empty margin on every side. Nothing may cross a cell boundary. Cells are numbered left to right, top to bottom. Draw NO grid lines. Transparent background (PNG with alpha). If your generator cannot output transparency, use a flat pure magenta background (#FF00FF) and nothing else in that colour. Keep the scale and lighting identical in every cell (light from the upper left).

SUBJECT
Painted interface icons in the same worn industrial style (NOT flat vector). Each fills about 80% of its cell.
Row 1, polarity glyphs: 1 BLUE: a round emblem with INWARD chevrons in cyan-blue. 2 RED: a round emblem with OUTWARD chevrons in copper-coral. 3 NEUTRAL: a round emblem with a single horizontal dash in grey.
Row 2, medals: 4 GOLD medal: a round metal medal on a short ribbon, engraved with a glove and a cog (no text). 5 SILVER medal. 6 BRONZE medal.
Row 3, shield tier badges, each a worn steel shield-shaped badge with a coil symbol: 7 BRITTLE COIL: cracked, dull grey. 8 TEMPERED INDUCTION: steel with an orange panel. 9 SUPERCONDUCTING AEGIS: polished with a soft teal glow.
```

### 15 · Area 1 background: the Yard

**Save as:** `level3-bg-yard-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
A derelict mineral yard at dusk seen from ground level: rusted gantry cranes, heaps of ore, cracked concrete, a smoggy orange-grey overcast sky, distant smoke stacks and a stalled conveyor. Muted, warm-grey, low contrast.
```

### 16 · Area 2 background: Crusher Bay

**Save as:** `level3-bg-crusher-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
The inside of a giant crushing hall: enormous idle hydraulic presses, pistons and catwalks in the far distance, warm amber warning lamps glowing in the haze, shafts of dusty light from high windows. Heavy, dark, amber accents.
```

### 17 · Area 3 background: the Shaft

**Save as:** `level3-bg-shaft-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
The inside of a vast vertical ore shaft: curved dark walls with iron ribbing and copper conduits, distant depth fading to black, cool blue-grey light from far above, dripping water, faint fog. Cold and deep.
```

### 18 · Area 4 background: the Polarity Lab

**Save as:** `level3-bg-lab-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
A dim electrical hall: giant induction coils and rings in the distance, machinery of a seized turntable, cyan-teal indicator lights, cable bundles, humid haze. Dark, teal accents.
```

### 19 · Area 5 background: the rail corridor

**Save as:** `level3-bg-rail-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
A long tunnel with parallel rails receding, repeating iron gantry frames, sparks and lights streaking past, a hint of motion blur to the far distance only. Warm lamps against cold steel.
```

### 20 · Area 6 background: the High Vault

**Save as:** `level3-bg-vault-v1.png`  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 2172 x 724 px (3:1), an OPAQUE background painting (no transparency). It must tile seamlessly left to right: the far-left edge continues exactly into the far-right edge. Keep contrast LOW and detail soft in the middle band so gameplay platforms placed over it stay readable. No characters, no platforms drawn as if walkable, no text.

SUBJECT
A cavernous zero-gravity sorting chamber: a vast dark void, distant pieces of magnetised scrap floating, faint curved magnetic field lines, cold teal light from far below, tiny far-off transit lights. Vast, quiet, low contrast.
```

### 21 · Foreground silhouettes (optional, one per area)

**Save as:** `level3-bg-near-v1` (`-master.png` will be added)  
**Attach:** `furnace-background-v2.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image per area, 2172 x 724 px, TRANSPARENT background, tiling seamlessly left to right. Only dark silhouettes hugging the TOP and BOTTOM edges; the middle 60% must be completely transparent. Very dark charcoal with a hint of the area's accent light on the edges.

SUBJECT
Make six variants, one per area, using the same layout each time. Run the prompt once per area and swap the theme line:
1 YARD: hanging chains, crane hooks, broken fencing and scrap piles.
2 CRUSHER BAY: hydraulic hoses, pipes and a caged amber lamp hanging from the ceiling, rubble below.
3 SHAFT: dangling cables, rusted rungs, dripping stalactites of scale.
4 LAB: bundled cables, coil housings and small blinking cyan indicator lights.
5 RAIL: overhead wires, signal poles and sleepers.
6 VAULT: floating debris silhouettes and thin strands of cable drifting.
```

### 22 · Landing page card and key art

**Save as:** `landing-level3-v1.jpg`  
**Attach:** `landing-level2-v1.jpg`, `landing-hero-v1.jpg`, `bix-motion-v2.png`, `pack-character-v1.png`, `magnet-glove-concept-v1.png`

```text
STYLE (applies to everything below)
Semi-realistic industrial hard-surface game art, hand-painted digital illustration with crisp, readable silhouettes, in exactly the same style as the attached reference images. Worn off-white armour panels, charcoal and dark-steel structure, orange service panels, and restrained cyan light for safe technology. Practical wear everywhere: scratches, edge abrasion, grime, heat discoloration, fasteners, seams, vents, service access. Grounded near-future setting. Hazard red is reserved for enemies and immediate danger. Molten yellow/orange is reserved for heat. Side-on 2D platformer view unless stated. Every subject must still read clearly when shrunk to about 100 px tall.
Level 3 polarity colours: BLUE (attract) is a cyan-blue, about #5FD4FF. RED (repel) is a warm copper-coral, about #FF8F6A, clearly different from hazard red. Never rely on colour alone: Blue is always shown with inward-pointing chevrons, Red with outward-pointing chevrons. Iron surfaces have horizontal ribbing; copper surfaces have a diamond hatch and a green-brown patina.
DO NOT: flat vector, chibi, glossy toy, fantasy, steampunk, clean white laboratory, purple-blue sci-fi neon, text, letters, numbers, logos, watermarks, baked drop shadows, ground shadows, backdrop scenery, frame lines, cell borders, labels or captions.

LAYOUT
One single image, 1280 x 720 px (16:9), JPG, a finished cinematic illustration with full background, in the same painted style, framing and colour grade as the attached landing-level2-v1.jpg. Leave the lower-left third calmer so a title can sit there. No text.

SUBJECT
Key art for Level 3, "Magnetic Personality". Bix (exactly as the attached references) is mid-leap inside a vast ore shaft, his right arm out wearing the Magnet Glove (attached), a cyan-blue attraction field pulling him toward a rusted iron girder overhead. Pack is on his back, lens glowing. Below him, dark rusted copper plates crumble away and fall into the depths. Cold blue-grey shaft walls, amber warning lamps far below, dust in the light. Dramatic but readable, semi-realistic hand-painted style.
```

## Where the reference files are

| Reference | Location |
|---|---|
| Pack (canonical) | `design/references/pack-character-v1.png` |
| Bix movement sheet | `dist/assets/bix-motion-v2.png` |
| Level 2 props, platforms, enemies, background | `dist/assets/furnace-prop-atlas-v2.png`, `furnace-platform-atlas-v2.png`, `enemy-crawler-v2.png`, `enemy-spitter-v2.png`, `enemy-wasp-v2.png`, `furnace-background-v2.png` |
| Pack action sheet | `dist/assets/pack-assist-v2.png` |
| Landing art | `dist/assets/landing-level2-v1.jpg`, `landing-hero-v1.jpg` |
| Cog | `dist/assets/energy-cog-v1.png` |
| The rules these prompts come from | `design/ART-DIRECTION.md` |
