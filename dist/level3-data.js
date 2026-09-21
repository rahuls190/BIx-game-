/* Project Mayhem, LEVEL 3 "Magnetic Personality": geometry data only (stage 1: Areas 1-3, the Yard, Crusher Bay and the Shaft).
   Plain browser script, one global: window.L3DATA. Every number here comes from the Level 3 design document and was checked by
   tests/level3-geometry.cjs and tests/level3-route.cjs.

   PHYSICS THIS GEOMETRY WAS DESIGNED AGAINST (identical to Levels 1 and 2)
     player box 42x96, gravity 1450, jump 780 (apex 209), run 285, early release +1500, coyote .13, buffer .16
     solid platforms collide 78 px deep whatever h says (h is the drawn depth); ledges are one-way
     Reachability for surfaces A -> B:  rise = A.y-B.y, disc = v0^2 - 2 g rise, t = (v0+sqrt(disc))/g, need gap+42 < 285 t - 35
   Regions that change the physics:
     downdraft[]  extra gravity inside a box (the shaft): apex 179 px instead of 209
   Glove features (all hold-to-use; see docs):
     girders[]    iron beams Bix hangs from with Blue (slide 170 px/s). y is the beam; the hanging player's top is y+8.
     strips[]     iron wall strips: Blue clings, climb 120 px/s, slide 180 px/s
     pads[]       repel pads: Red while standing on one launches at 1100 px/s upward (apex 417 px)
     nets[]       repel net: catches a fall and bounces Bix back up. Passive
     crates[]     84x150 movable blocks: Blue pulls, Red pushes (160 px/s), can be stood on
     presses[]    hydraulic presses: rise, amber tell 0.5 s, slam 0.15 s, rest 0.25 s
   ledges[].t     'steel' | 'iron' (stable, clingable) | 'copper' (crumbles 0.8 s after landing, returns 2.5 s later)
*/
window.L3DATA = {
tetherDeck: 12,   /* the platform the shaft's last-plate tether swings Bix to (the apex deck) */
world: { w: 23200, yMin: -1300, yMax: 800, camY: 80 },

areas: [
  { id: 'yard',    name: 'THE YARD',     x0: 0,    x1: 2800, objective: 'Find the glove and get across the yard', camY: -40 },
  { id: 'crusher', name: 'CRUSHER BAY',  x0: 2800, x1: 6200, objective: 'Cross the crushers. Move on the click', camY: 0 },
  { id: 'shaft',   name: 'THE SHAFT',    x0: 6200, x1: 7800, objective: 'Climb the ore shaft', vertical: true },
  { id: 'lab',     name: 'POLARITY LAB', x0: 7800, x1: 11200, objective: 'Route both cores and open the boarding gate', camY: -960, killY: 320 },
  { id: 'train',   name: 'ORE TRAIN',    x0: 11200, x1: 16600, objective: 'Hold Blue on the jolts. Stay on the train', camY: -840, killY: 140 },
  { id: 'vault',   name: 'HIGH VAULT',   x0: 16600, x1: 20600, objective: 'Cross the vault, then overcharge the transit door', vertical: true, gravity: 0.4, killY: 300 },
  { id: 'archive', name: 'THE ARCHIVE',  x0: 22200, x1: 23200, objective: 'Read the records', camY: -820 },
],

/* [x, y (walking top), w, drawn depth] */
platforms: [
  /* 0*/ [100, 600, 620, 160],    /* A1 crash site. Start */
  /* 1*/ [820, 600, 420, 160],    /* A1 tool locker deck; the repel pad lies on its right end */
  /* 2*/ [1360, 260, 480, 160],   /* A1 raised deck, 340 px above p1: only the repel pad reaches it (a jump plus ledge grab tops out near 300) */
  /* 3*/ [2320, 540, 420, 160],   /* A1 yard exit deck; crate tutorial. 480 px past p2: wider than any free jump */
  /* 4*/ [2860, 540, 320, 160],   /* A2 entry rest deck */
  /* 5*/ [3300, 540, 240, 160],   /* A2 anvil 1 */
  /* 6*/ [3680, 500, 300, 160],   /* A2 buffer island 1 */
  /* 7*/ [4120, 500, 240, 160],   /* A2 anvil 2 */
  /* 8*/ [4500, 460, 340, 160],   /* A2 buffer island 2 (crawler) */
  /* 9*/ [4980, 460, 240, 160],   /* A2 anvil 3 */
  /*10*/ [5360, 420, 760, 160],   /* A2 crusher exit (spitter overhead) */
  /*11*/ [6260, 540, 420, 160],   /* A3 shaft base */
  /*12*/ [7220, -380, 480, 160],  /* A3 shaft apex deck */
  /*13*/ [7800, -380, 380, 160],  /* A4 lab entry */
  /*14*/ [8280, -380, 540, 160],  /* A4 bedplate: terminal T0, Blue drone overhead; catwalk cw0 above its right end (cog c6) */
  /*15*/ [8960, -380, 340, 160],  /* A4 pedestal: socket A. Stand here and hold Blue to pull core A in */
  /*16*/ [9440, -380, 300, 160],  /* A4 lab gantry (checkpoint between the two puzzles), Red drone overhead */
  /*17*/ [9880, -380, 720, 160],  /* A4 chute deck: terminal T1, laser grids 0 and 1, the scrap chute; catwalk cw1 (cog c7) */
  /*18*/ [10700, -380, 590, 160], /* A4 boarding station: socket B and the gate. Its end is the head of the ore train's rails */
  /*19*/ [16700, -200, 320, 160], /* A6 vault threshold */
  /*20*/ [19700, -260, 700, 160], /* A6 surface gate deck: the transit door and the archive door */
  /*21*/ [22300, -260, 700, 160], /* the archive room */
],

/* one-way ledges and shaft plates. id is for the tests; `fatal` = the last plate, Pack's tether saves you when it goes */
ledges: [
  /* 0*/ { x: 2500, y: 200, w: 180, h: 16, t: 'steel',  id: 'lc' },              /* crate ledge, 340 px above p3 (cog c1) */
  /* 1*/ { x: 6700, y: 450,  w: 150, h: 16, t: 'iron',   id: 'L0' },
  /* 2*/ { x: 6950, y: 360,  w: 150, h: 16, t: 'copper', id: 'R0' },
  /* 3*/ { x: 6700, y: 270,  w: 150, h: 16, t: 'iron',   id: 'L1' },
  /* 4*/ { x: 6950, y: 180,  w: 150, h: 16, t: 'copper', id: 'R1' },
  /* 5*/ { x: 6700, y: 90,   w: 200, h: 16, t: 'steel',  id: 'L2' },              /* rest plate, checkpoint */
  /* 6*/ { x: 6950, y: 0,    w: 150, h: 16, t: 'copper', id: 'R2' },
  /* 7*/ { x: 6700, y: -90,  w: 150, h: 16, t: 'iron',   id: 'L3' },
  /* 8*/ { x: 6950, y: -180, w: 150, h: 16, t: 'copper', id: 'R3' },
  /* 9*/ { x: 6700, y: -270, w: 150, h: 16, t: 'iron',   id: 'L4' },
  /*10*/ { x: 6950, y: -360, w: 150, h: 16, t: 'copper', id: 'R4', fatal: 1 },
  /*11*/ { x: 8740, y: -560, w: 240, h: 16, t: 'steel',  id: 'cw0' },             /* lab catwalk, 180 px above the bedplate (cog c6) */
  /*12*/ { x: 10040, y: -560, w: 220, h: 16, t: 'steel', id: 'cw1' },             /* lab catwalk behind laser grid 0 (cog c7) */
],

girders: [
  { id: 'G0', x0: 1820, x1: 2300, y: 140 },   /* crosses the 480 px pit between p2 and p3 (a free run-and-jump gets across up to about 400 px) */
  { id: 'G1', x0: 3300, x1: 3620, y: 240 },   /* optional: over anvil 1, cog c2 */
  { id: 'G2', x0: 4120, x1: 4440, y: 240 },   /* optional: over anvil 2, cog c3 */
],
strips: [
  { id: 'S0', x: 6700, w: 26, y0: -380, y1: 520 },   /* the shaft's left wall is iron */
],
pads: [
  { id: 'RP0', x: 1120, w: 120, y: 600 },      /* right end of p1 */
],
nets: [
  { id: 'N0', x: 6700, w: 400, y: 700 },
],
crates: [
  { id: 'K0', x: 2360, w: 84, h: 150, deck: 3, x0: 2340, x1: 2700 },
],
downdraft: [
  { x0: 6700, x1: 7100, y0: -460, y1: 640, extra: 250 },
],
presses: [
  { id: 'H0', x: 3360, w: 120, anvil: 540, period: 1.8, off: 0 },
  { id: 'H1', x: 4180, w: 120, anvil: 500, period: 2.4, off: 0.8 },
  { id: 'H2', x: 5040, w: 120, anvil: 460, period: 1.8, off: 0.4 },
],

lockers: [ { id: 'glove', x: 960, y: 600 } ],

checkpoints: [
  { x: 170,  y: 600,  name: 'CRASH SITE',   area: 'yard' },
  { x: 1400, y: 260,  name: 'TOOL BAY',     area: 'yard' },
  { x: 2900, y: 540,  name: 'CRUSHER DECK', area: 'crusher' },
  { x: 5400, y: 420,  name: 'CRUSHER EXIT', area: 'crusher' },
  { x: 6300, y: 540,  name: 'SHAFT BASE',   area: 'shaft' },
  { x: 6740, y: 90,   name: 'SHAFT REST',   area: 'shaft' },
  { x: 7260, y: -380, name: 'APEX',         area: 'shaft' },
  { x: 7860, y: -380, name: 'POLARITY LAB', area: 'lab' },
  { x: 9540, y: -380, name: 'LAB GANTRY',   area: 'lab' },
  { x: 11310, y: -320, name: 'RAIL HEAD',   area: 'train' },
  { x: 16860, y: -200, name: 'VAULT THRESHOLD', area: 'vault' },
  { x: 19860, y: -260, name: 'SURFACE GATE', area: 'vault' },
],

cogs: [
  { id: 'c0', x: 900,  y: 530,  route: 'main' },   /* on the locker deck, right on the walking line to the locker: the first cog is impossible to miss */
  { id: 'c1', x: 2590, y: 120,  route: 'hard' },
  { id: 'c2', x: 3560, y: 300,  route: 'hard' },
  { id: 'c3', x: 4380, y: 300,  route: 'hard' },
  { id: 'c4', x: 6775, y: 200,  route: 'main' },
  { id: 'c5', x: 7025, y: -70,  route: 'main' },
  { id: 'c6', x: 8870, y: -630, route: 'main' },
  { id: 'c7', x: 10100, y: -630, route: 'hard' },
  { id: 'c8', x: 12700, y: -520, route: 'timing', train: 1 },
  { id: 'c9', x: 14450, y: -520, route: 'timing', train: 1 },
  { id: 'c10', x: 18140, y: -560, route: 'main' },
  { id: 'c11', x: 19100, y: -1060, route: 'mastery' },
],

enemies: [
  { type: 'crawler', x: 4650, y: 460, range: 100, area: 'crusher' },
  { type: 'spitter', x: 5876, y: 250, dir: -1, vx: 240, vy: -320, g: 1100, landY: 420, area: 'crusher' },
],
perches: [ { x: 5800, y: 302, w: 200 } ],

/* lines of dialogue. x is where Bix must be to the right of; y0/y1 (optional) is a window on Bix's top */
triggers: [
  { x: 150,  s: 'VELA', t: 'Sector 3 impact detected. Schedule variance: 412%. Note filed.' },
  { x: 420,  s: 'PACK', t: 'Bix! Your internal gears are 98% aligned! Only 2% rattled!' },
  { x: 640,  s: 'BIX',  t: 'The lift is scrap. Help me open this prototype locker, Pack.' },
  { x: 1090, s: 'PACK', t: 'That pad is copper. Stand on it and hold Red. Say "up".' },
  { x: 1600, s: 'PACK', t: 'Girder! Hold Blue and hang on. Try not to look at the pit.' },
  { x: 2300, s: 'BIX',  t: 'Heavy. Pull it under the ledge, then push it back.' },
  { x: 2880, s: 'PACK', t: 'The presses are singing! Follow the amber light for the beat!' },
  { x: 3200, s: 'PACK', t: 'Amber, then click, then flat. Wait for the click.' },
  { x: 6300, s: 'BIX',  t: "The plates are thin. Move on the click, or we're floor-paint." },
  { x: 6700, y0: -20, y1: 120, s: 'PACK', t: 'Fun fact: iron holds. Copper lies. Climb accordingly.' },
  { x: 7850, s: 'PACK', t: 'Two terminals, two cores, one Pack. I will hold. You route.' },
  { x: 16820, s: 'BIX',  t: 'Gravity is optional in here. Good.' },
  { x: 20180, s: 'BIX',  t: 'Overcharge it. All of it.' },
],

/* ---- Area 4: the Polarity Lab ------------------------------------------------------------------------------------------
   terminals: ACT within `range` sends Pack to hold it for `hold` s. While Pack holds it the core on that rail floats and follows the glove:
   Blue pulls a core toward Bix, Red pushes it away. Speed 240 px/s (x1.3 from 4 cogs). A core within `seat` px of its socket locks in for good.
   Only one terminal can be held at a time (Pack is one robot). When the time runs out an unseated core drops back to its start. */
terminals: [
  { id: 'T0', x: 8330, y: -380, range: 110, hold: 24, core: 'A', hint: 'Holding the terminal! Blue pulls the core: hold Z at its socket.' },
  { id: 'T1', x: 9930, y: -380, range: 110, hold: 24, core: 'B', hint: 'Holding the terminal! Red pushes the core: hold X right here.' },
],
cores: [
  { id: 'A', pol: 1,  x0: 8600,  x1: 9240,  start: 8680,  y: -470, socket: 'SA' },   /* Blue: stand at the socket on the pedestal and pull it in */
  { id: 'B', pol: -1, x0: 10020, x1: 10860, start: 10040, y: -470, socket: 'SB' },   /* Red: stand at T1 and push it along the rail */
],
sockets: [
  { id: 'SA', x: 9240,  y: -380, seat: 40 },
  { id: 'SB', x: 10860, y: -380, seat: 40 },
],
gates: [ { id: 'GT', x: 11200, y: -380, w: 26, h: 460, needs: ['SA', 'SB'] } ],      /* 460 px: taller than a jump plus a ledge grab (300 px, and about 360 with the 8-cog recoil), so the puzzle cannot be jumped over */
lasers: [    /* 3.0 s cycle: safe 1.1 s, amber lamp 0.5 s, beam on 1.4 s. The beam is deck height and 320 px tall: it cannot be jumped */
  { id: 'LZ0', x: 9990,  y: -380, h: 320, period: 3.0, tell: 0.5, on: 1.4, phase: 0 },
  { id: 'LZ1', x: 10460, y: -380, h: 320, period: 3.0, tell: 0.5, on: 1.4, phase: 1.5 },
],
chutes: [ { id: 'CH0', x: 10250, y: -380, top: -800, period: 3.0, tell: 0.5, size: 48, phase: 0.6 } ],
/* Polar drones: patrol x0..x1; within 320 px of a held field they fly away (same colour) or at Bix (opposite). Touching one is lethal, a shield destroys it. */
drones: [
  { id: 'DB0', pol: 1,  x0: 8420, x1: 8760, y: -436, sp: 1.2, ph: 0, area: 'lab' },
  { id: 'DR0', pol: -1, x0: 9640, x1: 9980, y: -436, sp: 1.0, ph: 1.6, area: 'lab' },
  { id: 'DV0', pol: 1,  x0: 17480, x1: 17800, y: -430, amp: 90, sp: 0.9, ph: 0.5, area: 'vault' },
  { id: 'DV1', pol: -1, x0: 18560, x1: 18900, y: -520, amp: 90, sp: 1.1, ph: 2.2, area: 'vault' },
],

/* ---- Area 5: the ore train ------------------------------------------------------------------------------------------------
   The bed rolls along its own rail from x=start. It departs 2 s after Bix boards, speeds up to 427 px/s (1.5 x run), and the ride is a fixed
   sequence keyed to the position of the bed's FRONT. J: amber lamps 0.6 s ahead, then a 0.9 s jolt that needs Blue held 0.4 s. R: a rock
   falls on the bed's front third and rolls back (jump it or Red). G: a swing-load at head height (Red lifts it out of the way). D: a rogue
   drone at bed height (jump it, or parry). At buffer x the bed stops and Bix is thrown on a fixed arc onto the vault threshold. */
train: {
  start: 11290, y: -320, len: 420, v0: 110, accel: 120, vmax: 427, boardWait: 2.0, buffer: 16300, land: { x: 16860, y: -200 }, flight: 1.25, flightRise: 300,
  jolt: 0.9, need: 0.4, tell: 0.6,       /* seconds of warning: the amber lamps, the rock's shadow, the chain creak */
  obs: [
    { k: 'J', at: 12100 }, { k: 'R', at: 12500 }, { k: 'G', at: 12900 }, { k: 'D', at: 13300 }, { k: 'J', at: 13800 },
    { k: 'R', at: 14200 }, { k: 'D', at: 14700 }, { k: 'J', at: 15100 }, { k: 'G', at: 15200 }, { k: 'J', at: 15800 },
  ],
  x0: 11200, x1: 16500,
},

/* ---- Area 6: the High Vault -----------------------------------------------------------------------------------------------
   Gravity is 0.4 of normal. Islands orbit on ellipses. In the air Blue pulls Bix toward the nearest IRON island and Red pushes him away from
   the nearest COPPER one (accel 720 px/s^2 inside 480 px). Falling below y 300 is a fall. */
islands: [
  { id: 'v0', cx: 17300, cy: -200, w: 220, rx: 50, ry: 45, per: 9,    ph: 0,   t: 'iron' },
  { id: 'v1', cx: 17820, cy: -280, w: 220, rx: 60, ry: 50, per: 10,   ph: 1.2, t: 'iron' },
  { id: 'v2', cx: 18340, cy: -220, w: 220, rx: 60, ry: 45, per: 11,   ph: 2.4, t: 'copper' },
  { id: 'v3', cx: 18860, cy: -300, w: 220, rx: 60, ry: 50, per: 9.5,  ph: 3.6, t: 'copper' },
  { id: 'v4', cx: 19380, cy: -240, w: 220, rx: 50, ry: 45, per: 10.5, ph: 4.8, t: 'iron' },
],
steer: { accel: 720, range: 480, vmax: 340 },
doors: [
  { id: 'transit', x: 20300, y: -260, w: 40, h: 240 },                 /* hold Blue on it: the door adds heat until the glove overloads and the locks blow */
  { id: 'archive', x: 20060, y: -260, w: 36, h: 200, needs: 12 },     /* lit only with all 12 cogs */
],
archive: {
  enter: { x: 22380, y: -260 }, back: { x: 20120, y: -260 },
  exit: { x: 22330 },
  terminals: [
    { x: 22480, s: 'MAINTENANCE LOG', t: 'SECTOR 3. LIFT CABLE 4 FLAGGED FOR REPLACEMENT. DEFERRED. DEFERRED. DEFERRED. DEFERRED.' },
    { x: 22680, s: 'WORK ORDER 0031-A', t: 'TECHNICIAN BX-7. TASK: INSPECT LIFT. STATUS: OPEN FOR 11 YEARS. NO REPORT FILED.' },
    { x: 22880, s: 'NOTE', t: 'BX-7 LAST COMPLETED TASK: ROUTINE REPAIR. NEXT OF KIN: NONE LISTED.' },
  ],
},

/* The routes a player must be able to make. Nodes are ['p'|'l', index] into platforms / ledges.
   mode: 'jump' (default, base physics), 'pad' (needs the Red repel pad), 'girder' (needs Blue on girder `via`), 'crate' (stand on the crate).
   kind 'required' routes must work with the base jump and no cog upgrades. Optional routes lead to cogs. */
chains: [
  { id: 'a1-start',  kind: 'required', nodes: [['p', 0], ['p', 1]] },
  { id: 'a1-pad',    kind: 'required', nodes: [['p', 1], ['p', 2]], mode: 'pad', via: 'RP0' },
  { id: 'a1-girder', kind: 'required', nodes: [['p', 2], ['p', 3]], mode: 'girder', via: 'G0' },
  { id: 'a2',        kind: 'required', nodes: [['p', 3], ['p', 4], ['p', 5], ['p', 6], ['p', 7], ['p', 8], ['p', 9], ['p', 10]] },
  { id: 'a2-exit',   kind: 'required', nodes: [['p', 10], ['p', 11]] },
  { id: 'a3',        kind: 'required', nodes: [['p', 11], ['l', 1], ['l', 2], ['l', 3], ['l', 4], ['l', 5], ['l', 6], ['l', 7], ['l', 8], ['l', 9], ['l', 10], ['p', 12]] },
  { id: 'a4-lab',    kind: 'required', nodes: [['p', 12], ['p', 13], ['p', 14], ['p', 15], ['p', 16], ['p', 17], ['p', 18]] },
  { id: 'a4-cw0',    kind: 'optional', nodes: [['p', 14], ['l', 11]] },
  { id: 'a4-cw1',    kind: 'optional', nodes: [['p', 17], ['l', 12]] },
  { id: 'a1-crate',  kind: 'optional', nodes: [['p', 3], ['l', 0]], mode: 'crate', via: 'K0' },
  { id: 'a2-g1',     kind: 'optional', nodes: [['p', 5]], mode: 'girder', via: 'G1' },
  { id: 'a2-g2',     kind: 'optional', nodes: [['p', 7]], mode: 'girder', via: 'G2' },
],
};
