# Level 6 — Mother Cluckzilla: image prompt sheet

Copy-paste prompts for every picture Level 6 needs. Written for Krea 2, and they work in Midjourney, DALL·E, Flux or Stable Diffusion with the same wording.

Companion to `docs/level-6-spec.md` (the build brief) and `docs/level-6-map.html` (the plan). The asset list here matches section 10 of the spec exactly.

---

## 1. How to use this sheet

Every prompt is written as: **STYLE + the subject + BACKGROUND**. The style and background blocks never change, so paste them around each subject line.

### STYLE — put this in front of every sprite prompt
```
Semi-realistic industrial hard-surface game art, flat straight-on front
elevation view, camera perfectly level with the object, no perspective, no
three-quarter angle, no tilt, no top surface visible. Real materials with
bright specular highlights on the edges, bevelled edges catching light,
subtle reflections, soft ambient occlusion in the seams, worn paint chipped
down to bare metal, rivets, bolts and fasteners, crisp dark outlines, high
detail, chunky readable silhouette, 2D side-scroller sprite.
```

### BACKGROUND — put this at the end of every sprite prompt
```
Isolated on a solid flat pure magenta #FF00FF background, single object,
centred, nothing else in the picture, no text, no watermark, no shadow.
```

The flat magenta is keyed out later to make the sprite transparent. Do not use white or green; the art has white and green in it.

### NEGATIVE — for any tool that takes one
```
cartoon, flat vector, cel shaded, chibi, toy, glossy plastic, anime,
photo, photorealistic, 3d render turntable, isometric, three-quarter view,
perspective, vanishing point, top-down, tilted, people, characters, hands,
text, watermark, signature, frame, border, blurry, low quality, purple,
pink, violet background
```

### Settings that worked on this project
- **Krea 2 Turbo** with the style-reference LoRA, 8 steps, cfg 1.0, euler / simple.
- Start each sprite from a **plain grey silhouette** at the proportions the game draws it, then repaint at denoise 0.95 with a mask. That is what keeps the flat side-on camera; a prompt alone drifts into three-quarter view every time.
- **One reference image, shrunk to 512 px.** Two references made each picture take five minutes instead of seventeen seconds.
- Generate **2 or 3 candidates** per asset and pick. Budget roughly 20 seconds each locally.
- Author at about **twice the size the game draws it**, then downscale.

---

## 2. The look of Level 6, in one paragraph

Warm, dusty and overgrown. A vast agricultural dome that has been running unattended for eleven years: grain-dust haze in the air, warm work lamps, green hydroponic growth, weathered timber and galvanised steel, brass and sun-faded paint.

**It must not look like any level before it.** Level 3 and 4 are blue-grey steel with orange service panels. Level 5 is cold storm-grey. Level 6 is **warm amber, dust, green and timber**. If a picture would sit unnoticed in Level 5, it is wrong.

**Colour rules, from `design/ART-DIRECTION.md`:**
- **Hazard red** only for danger. Mother Cluckzilla is never red.
- **Amber** is heat, feed, and every warning tell.
- **Restrained cyan** is Pack and safe technology.
- **Green** is growth: the columns and the orchard.

---

## 3. Backdrops

Six, one per area. **1536 × 640**, later resized to 2112 × 896 and darkened so sprites stay readable in front.

### Shared backdrop wrapper
```
Wide 2D side-scroller game backdrop, painted stylised industrial game art,
semi-realistic materials, dark and moody so a foreground platform stays
readable, centre calm and darker, no characters, no people, no robots, no
text, no platforms in the foreground.
```

**bg-threshold**
> …the inside of a vast agricultural dome seen from the side, near the entrance: a tall airlock arch, dusty concrete apron, hanging warm work lamps, faint grain haze in the air, distant curved dome ribs rising out of sight, cool daylight leaking through the arch behind.

**bg-feedline**
> …a long automated feed hall seen from the side: overhead grain chutes and conveyor lines running into the distance, sacks and hoppers stacked along the walls, warm amber lamps, thick dust in the light beams, dull galvanised steel and faded ochre paint.

**bg-orchard**
> …the inside of an enormous hydroponic orchard seen from the side: tall rows of green growing columns receding into haze, irrigation pipes overhead, soft green under-lighting, warm work lamps between the rows, dust motes, overgrown and abandoned.

**bg-alarmspine**
> …a tall service shaft inside a dome seen from the side: a lattice of galvanised ladders and catwalks going up, vent ducts and cable runs, a pale shaft of daylight from a broken roof panel far above, cool grey-green light, drifting dust.

**bg-grid**
> …a vast irrigation grid hall seen from the side: rows of massive green hydroponic columns with brass fittings and valve wheels, overhead sprinkler rails, warm amber lamps low down, deep green shadow, humid haze.

**bg-nestingbay**
> …a quiet bedding bay inside an agricultural dome seen from the side: deep straw bedding, timber stall partitions, rails running along the floor, a few dim warm lamps, dust settling in still air, calm and almost peaceful.

---

## 4. Platform kit

Three pieces per area: the **deck** (what you walk on), the **hull** (its underside) and the **ledge** (a narrow catwalk). Eighteen pictures.

### Deck wrapper
Decks are the most common failure. This sentence is what fixes it:
```
A solid horizontal slab seen exactly from the side. The very top edge of the
picture is the flat walking surface: nothing rises above it, no wall, no
scenery, nothing standing on it, the whole frame is the slab body. Long and
narrow, about 5 to 1.
```

| Area | Deck: top edge, then body |
|---|---|
| Threshold | a pale painted safety edge stripe · dusty poured concrete slabs with galvanised trim and a faded yellow line |
| Feed Line | a brass edge rail with grain dust caught along it · weathered timber decking strapped with galvanised bands, faded ochre paint |
| Orchard | a moss-green edge lip with small drip nozzles · galvanised grating over dark soil trays, green growth creeping through |
| Alarm Spine | a bare galvanised edge angle · open steel grating walkway with cross bracing, cable clips and bolted brackets |
| The Grid | a wet brass edge trim with a thin water line · dark green glazed irrigation panels with brass valve fittings and mineral staining |
| Nesting Bay | a worn timber edge beam with straw caught on it · thick timber planks over iron joists, bedding straw spilling at the edges |

**Hull** (the underside, `('hull', 3.0)`, a tapering trapezoid):
> the underside of a raised deck seen from the side: hanging **[Threshold: conduit and dusty pipework · Feed Line: grain chutes, sacks and hoppers · Orchard: irrigation pipes and trailing roots · Alarm Spine: a steel truss with cross bracing and dangling cables · The Grid: water pipes, brass valves and drip lines · Nesting Bay: timber joists, straw and hanging lamps]**, dark, fading to black at the bottom.

**Ledge** (a narrow catwalk): the same wording as that area's deck, but *"a narrow catwalk plank, a slim band, about 5 to 1"*.

---

## 5. Props

All on flat magenta, all flat side elevation.

**feed-pod** (held and thrown) — *round, about 1:1*
> a feed pod: a fist-sized ribbed canister of galvanised steel and brass with a perforated grain grille around its middle, a warm amber glow inside showing through the holes, a carry ring on top, worn and dented, chunky and readable

**feed-pod-burst** — *wide, about 2:1*
> a burst feed pod on the ground: the canister split open with golden grain scattering out in a low spray, a warm amber glow at the centre, drifting grain dust, a few husks in the air

**pod-hopper-full** — *tall, about 0.6:1*
> a feed pod dispenser hopper: a galvanised steel funnel on a braced timber frame, a brass shutter at the bottom with one pod visible in the chute, a small amber lamp lit above the shutter, grain dust caught on every ledge, worn

**pod-hopper-empty** — same, but: *the chute empty and the amber lamp dark, the shutter closed*

**trough-empty** — *wide and low, about 4:1*
> a long galvanised feed trough on short timber legs, empty, scoured smooth inside, grain dust in the corners, worn brass end caps

**trough-baited** — same, but: *heaped with golden grain, a warm amber glow rising out of it, a few husks drifting above*

**column-standing** — *tall and narrow, about 0.2:1*
> a colossal irrigation column: a dark green glazed pipe tower with brass ring collars every few feet, valve wheels, drip nozzles and mineral staining, green growth climbing it, dead straight and vertical, heavy

**column-leaning** — same, but: *tilted over at a steep angle, its base cracked open, brass collars sprung and a spray of water bursting from the split*

**column-fallen** — *wide, about 6:1*
> a colossal irrigation column lying on its side as a walkway: the dark green glazed pipe seen from the side, brass ring collars along it, cracked open at one end with water pooling, green growth crushed beneath, flat enough to walk along the top

**alarm-off** — *tall, about 0.5:1*
> a dome alarm station: a galvanised wall box with a big brass pull lever pointing down, a dark red bell dome on top, a small unlit amber lamp, a faded instruction plate, dusty and untouched for years

**alarm-on** — same, but: *the lever pulled up, the amber lamp blazing, the bell dome ringing with faint motion blur*

**bedding-cart** — *wide, about 2.4:1*
> a heavy bedding cart on rail wheels: a low timber-sided trailer heaped with golden straw, iron corner braces, a tipping hinge at one end, worn brass fittings, parked on a short length of floor rail

**conveyor** — *very wide, about 8:1*
> a grain conveyor belt segment seen from the side: a dark rubber tread belt on a galvanised frame with roller ends and timber guard rails, grain spilling over the edge, horizontal, worn

**grain-chute** — *tall, about 0.7:1*
> an overhead grain chute: a galvanised funnel and a canvas sleeve hanging down, a brass release ring, grain dust caked on the rim, a thin trickle of golden grain falling from it

**orchard-planter** — *about 1.4:1*
> an orchard row planter: a long galvanised trough bed on timber legs, dense green leafy growth spilling out of it, drip lines and small brass nozzles, roots hanging beneath

---

## 6. Mother Cluckzilla

Draw her **in parts**, so the engine can compose her at any size and animate the legs and head. Assembled she is about **2,600 px tall**, so author each part large.

### Her rules, in every prompt
```
She is weathered agricultural machinery at a terrible size, not a creature
and not a robot: caked in years of grain dust, sun-faded paint peeling to
bare galvanised metal, mismatched repair patches welded on, rust in the
seams, brass fittings gone green, weathered timber packing. Warm amber
lamps. No teeth, no claws, no eyes, no red lights, nothing hostile-looking,
nothing clean, nothing sci-fi.
```
**Avoid the word "armour"** in her prompts. It pulls every model straight to
clean white-and-orange sci-fi mech. Say *panelling*, *plating* or *cowl*,
and lead with the dust.

**cluck-body** — *wide, about 1.6:1*
> the body of a colossal automated brood machine seen from the side: a broad rounded hull of dust-caked off-white panelling over a galvanised frame, a row of riveted grain hoppers along the top, feed pipes and canvas sleeves running along the flank, warm amber lamps glowing at the seams, brass inspection hatches, decades of dust and repair patches, enormous and heavy

**cluck-underside** — *wide, about 3:1*
> the underside of a colossal machine seen from the side: hanging feed pipes, canvas sleeves, chain runs and drip lines, dusty steel plating, warm amber light spilling down from between the panels, dark and fading to black at the bottom

**cluck-leg-plant / -lift / -mid** — *tall, about 0.35:1* — three poses of the same leg
> one leg of a colossal automated machine seen from the side: a heavy galvanised hydraulic limb with a brass knee joint, ribbed pistons, cable bundles and a broad padded foot plate, grain-dusted off-white panelling, paint worn through, worn
> — **plant:** straight and vertical with the foot flat on the ground
> — **lift:** bent at the knee with the foot raised and tilted
> — **mid:** angled forward mid-stride, foot just off the ground

**cluck-head-raised / -lowering / -feeding** — *about 1:1*
> the head of a colossal brood machine on the end of a segmented neck, seen from the side: a blunt rounded feed cowl of dust-caked off-white panelling with a wide intake grille underneath, a warm amber lamp set behind the grille, brass hinge plates, dust and grain husks caught on it, no eyes and no face
> — **raised:** the neck curving up, the cowl level
> — **lowering:** the neck curving down and forward, the cowl tilted toward the ground
> — **feeding:** the cowl down against the ground, the intake grille open and glowing amber, grain dust kicking up

**cluck-footfall-ring** — *wide, about 4:1, on black not magenta*
> a warning ring of amber dust on the ground: a flattened ellipse of glowing amber particles and lifted dust, brightest at the rim, nothing in the middle, seen from the side, on pure black

---

## 7. Landing card

**1280 × 720.** This one is a full painted scene, not a sprite, so it does **not** use the magenta background.

> Cinematic 2D platformer key art, wide 16:9. Bix, the young man from the reference image (messy dark hair, glasses with a glowing blue lens, teal-green work jacket, brown harness straps, dark cargo trousers, boots, one black fingerless glove and one orange robotic glove, a grey robotic camera backpack on his back), stands small in the lower left of a vast agricultural dome, side-on, holding a glowing amber feed pod. Behind and above him, filling most of the frame, the legs and underside of Mother Cluckzilla: a colossal dusty machine-white brood rig on four galvanised hydraulic legs, warm amber lamps along her flank, her head lowering out of frame at the top. Rows of tall green hydroponic columns recede into golden grain haze. Pack, the small hovering camera robot (white and orange armour, big cyan lens eye, one antenna), floats at Bix's shoulder. Semi-realistic hard-surface game art, warm amber and dusty green lighting, dramatic scale, Bix and Pack exactly as in the reference images.

**References to attach:** `design/bix-poses/front/1.png`, `design/pack-poses/front-wave/3.png`, and one Level 6 backdrop once it exists.

**The scale is the point.** Bix should be small enough that you look for him. Her whole body should not fit in frame.

---

## 8. After generating

1. **Key the magenta** out of every sprite (`design/key_magenta.py`, or any tool's colour-key), then pull the alpha in one pixel to remove the pink fringe.
2. **Crop to the artwork,** scale to about twice the on-screen size, and pack into one atlas.
3. **Save as WebP, quality 92.** Not PNG. Level 5 shipped seven PNGs over 1 MB each and took `dist/` from 28 MB to 40.5 MB; Level 4's whole 41-sprite atlas is 1 MB.
4. **Ship one version of each picture.** Delete anything the code does not load. Level 5 currently carries about 4 MB of unused v1 kits.
5. **Check every sprite against the three rules** before packing it: flat side-on camera, semi-realistic and not cartoon, and colour used with meaning.

`design/comfy_l4.py` and `design/build_l4_art.py` are the working scripts for all of this; copy them to `comfy_l6.py` and `build_l6_art.py` and swap the item list for the one above.
