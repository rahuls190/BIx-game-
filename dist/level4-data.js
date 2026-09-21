/* Project Mayhem, LEVEL 4 "Delivery Attempt": geometry data only (stage 1, boxes first: every area is playable in plain shapes).
   Plain browser script, one global: window.L4DATA. Numbers come from docs/level-4-plan.md and are checked by tests/level4-geometry.cjs.

   PHYSICS THIS GEOMETRY WAS DESIGNED AGAINST (identical to Levels 1 to 3)
     player box 42x96, gravity 1450, jump 780 (apex 209), run 285, early release +1500, coyote .13, buffer .16
     Reachability for surfaces A -> B:  rise = A.y-B.y, disc = v0^2 - 2 g rise, t = (v0+sqrt(disc))/g, need gap+42 < run*t - 35
   The Carried Core changes those numbers by zone (see dist/level4-core.js):
     heavy    run x0.82, jump x0.88 (apex 162). Every step in a heavy zone rises 100 or less, every gap is under 100.
     buoy     gravity x0.55 while falling, glide at 260 px/s. The spine is also climbable with plain jumps: a dropped core never traps Bix.
     charge   normal movement; live rails arc on a rhythm.
   The core can be set down, thrown (Red) and called back (Blue). It can never be lost: a core that leaves the world, or a respawn, puts it back beside Bix.

   Element lists (all optional keys are read with a fallback by the engine)
     zones[]      {x0,x1,mode}    the core's mode by x. Outside every zone the core is a plain 'carry' core
     plates[]     {id,x,y,w,gate,needs}   a scale plate: a core resting on it in mode `needs` opens gate `gate`
     gates[]      {id,x,y,w,h,by}          a wall; opens by a plate (`plate`) or by the customs desk / the cage script (`by`)
     conveyors[]  {x,y,w,sp,period}        a belt that reverses every period/2 seconds; carries Bix at sp px/s
     presses[]    cargo cranes (same timing as Level 3's presses): rise, amber tell .5 s, slam .15 s, rest .25 s
     vents[]      {x,w,y0,y1,period,on,tell,phase}   updraft columns: lift Bix and a loose core while on
     bolts[]      {x,w,y0,y1,period,on,tell,phase}   lightning columns; a buoyant core makes Bix too light to hit
     arcs[]       {x,y,w,h,period,on,tell,phase}     live rails; a charged core arcs to them too
     nodes[]      {id,x,y,r,gate}          relay nodes: a loose core passing through lights one; all lit opens `gate` */
window.L4DATA = {
world: { w: 20400, yMin: -1700, yMax: 900, camY: -40 },

areas: [
  { id: 'deck',    name: 'TRANSIT DECK',      x0: 0,     x1: 2200,  objective: 'Pick up the core and carry it out', camY: -40 },
  { id: 'freight', name: 'FREIGHT CONCOURSE', x0: 2200,  x1: 6200,  objective: 'Heavy core: set it on the scale to open the gate', camY: -20 },
  { id: 'market',  name: 'DEPOT MARKET',      x0: 6200,  x1: 9000,  objective: 'Collect three stamps and clear customs', camY: -120 },
  { id: 'spine',   name: 'SIGNAL SPINE',      x0: 9000,  x1: 12800, objective: 'Climb the antenna spine. The core floats', vertical: true, killY: 760 },
  { id: 'relay',   name: 'RELAY BAY',         x0: 12800, x1: 16800, objective: 'Throw the core through three relay nodes', camY: -1070, killY: 380 },
  { id: 'shaft',   name: 'LIFT SHAFT',        x0: 16800, x1: 20400, objective: 'Three modes, one climb. Seat the core', vertical: true, killY: 380 },
],

zones: [
  { x0: 2200,  x1: 6200,  mode: 'heavy' },
  { x0: 9000,  x1: 12800, mode: 'buoy' },
  { x0: 12800, x1: 16800, mode: 'charge' },
  { x0: 17700, x1: 18700, mode: 'heavy' },
  { x0: 18700, x1: 19800, mode: 'buoy' },
  { x0: 19800, x1: 20400, mode: 'charge' },
],

/* [x, y (walking top), w, drawn depth] */
platforms: [
  /* 0*/ [100,   600, 1000, 160],   /* A1 start deck, the core's cradle at x 520 */
  /* 1*/ [1200,  600, 700,  160],
  /* 2*/ [2000,  600, 500,  160],   /* A1 to A2: the heavy zone starts at 2200 */
  /* 3*/ [2600,  600, 600,  160],   /* A2 (crawler) */
  /* 4*/ [3300,  560, 700,  160],   /* A2 scale plate at 3450, sorting gate at 3780 */
  /* 5*/ [4100,  560, 600,  160],   /* A2 cargo crane at 4300 */
  /* 6*/ [4800,  520, 600,  160],   /* A2 conveyor */
  /* 7*/ [5500,  520, 400,  160],   /* A2 (crawler) */
  /* 8*/ [6000,  480, 700,  160],   /* A2 to A3 */
  /* 9*/ [6800,  480, 1000, 160],   /* A3 market floor A: vendor, busker, Lost & Found ledges */
  /*10*/ [7900,  480, 1100, 160],   /* A3 market floor B: customs desk at 8500, customs gate at 8700 */
  /*11*/ [9100,  480, 3500, 160],   /* A4 the spine floor: a fall from the antennas always lands here */
  /*12*/ [12500, -470, 700, 160],   /* A4 spine top, the first Relay checkpoint area */
  /*13*/ [13300, -470, 700, 160],   /* A5 first arcing rail at 13550 */
  /*14*/ [14100, -470, 600, 160],   /* A5 relay nodes overhead, the node gate at 14640 */
  /*15*/ [14850, -470, 700, 160],   /* A5 (crawler) arcing rail at 14980 */
  /*16*/ [15650, -470, 800, 160],   /* A5 blackout stretch (stage 2), rails at 15800 and 16150 */
  /*17*/ [16550, -470, 700, 160],   /* A6 Courier Prime's cage; the cage gate at 17100 */
  /*18*/ [17350, -470, 500, 160],   /* A6 shaft foot */
  /*19*/ [19870, -1290, 400, 160],  /* A6 socket deck, a live rail at 20000 */
],

/* one-way plates. Heavy steps rise 100 (gap 60); buoyant steps rise 140 (gap 80); the spine steps rise 80-100 (gap 60) */
ledges: [
  /* Lost & Found: a small hidden room over the market floor (one cog, stamp 3) */
  /* 0*/ { x: 7250, y: 400, w: 140, h: 16, t: 'steel', id: 'lf1' },
  /* 1*/ { x: 7420, y: 330, w: 180, h: 16, t: 'steel', id: 'lf2' },
  /* the spine, buoyant zone */
  /* 2*/ { x: 9700,  y: 400,  w: 260, h: 16, t: 'steel', id: 's0' },
  /* 3*/ { x: 10020, y: 320,  w: 240, h: 16, t: 'steel', id: 's1' },
  /* 4*/ { x: 10320, y: 230,  w: 240, h: 16, t: 'steel', id: 's2' },
  /* 5*/ { x: 10620, y: 130,  w: 240, h: 16, t: 'steel', id: 's3' },
  /* 6*/ { x: 10920, y: 30,   w: 240, h: 16, t: 'steel', id: 's4' },
  /* 7*/ { x: 11220, y: -70,  w: 240, h: 16, t: 'steel', id: 's5' },
  /* 8*/ { x: 11520, y: -170, w: 240, h: 16, t: 'steel', id: 's6' },
  /* 9*/ { x: 11820, y: -270, w: 240, h: 16, t: 'steel', id: 's7' },
  /*10*/ { x: 12120, y: -370, w: 240, h: 16, t: 'steel', id: 's8' },
  /* the shaft, heavy zone (17700-18700) */
  /*11*/ { x: 17910, y: -570, w: 200, h: 16, t: 'steel', id: 'h0' },
  /*12*/ { x: 18170, y: -670, w: 200, h: 16, t: 'steel', id: 'h1' },
  /*13*/ { x: 18430, y: -770, w: 200, h: 16, t: 'steel', id: 'h2' },
  /*14*/ { x: 18690, y: -870, w: 200, h: 16, t: 'steel', id: 'h3' },
  /* the shaft, buoyant zone (18700-19800): h3 is already inside it */
  /*15*/ { x: 18970, y: -1010, w: 220, h: 16, t: 'steel', id: 'b0' },
  /*16*/ { x: 19270, y: -1150, w: 220, h: 16, t: 'steel', id: 'b1' },
  /*17*/ { x: 19570, y: -1290, w: 220, h: 16, t: 'steel', id: 'b2' },
],

/* a scale plate: the heavy core resting on it opens the sorting gate; the plate is drawn flush with the deck */
plates: [
  { id: 'sc1', x: 3450, y: 560, w: 130, gate: 'g1', needs: 'heavy' },
],
gates: [
  { id: 'g1', x: 3780,  y: 560,  w: 36, h: 460, plate: 'sc1', name: 'SORTING GATE' },
  { id: 'g2', x: 8700,  y: 480,  w: 36, h: 460, by: 'customs', name: 'CUSTOMS GATE' },
  { id: 'g3', x: 14640, y: -470, w: 36, h: 460, nodes: true, name: 'RELAY GATE' },
  { id: 'g4', x: 17100, y: -470, w: 36, h: 460, by: 'prime', name: 'CAGE GATE' },
],
conveyors: [
  { x: 4850, y: 520, w: 420, sp: 150, period: 6 },
],
presses: [
  { x: 4300, w: 140, anvil: 560, period: 3.6, off: 0 },
],
vents: [
  { x: 10400, w: 110, y0: -60,  y1: 230,  period: 4, on: 2.4, tell: .7, phase: 0 },
  { x: 11000, w: 110, y0: -240, y1: 30,   period: 4, on: 2.4, tell: .7, phase: 1.3 },
  { x: 11600, w: 110, y0: -440, y1: -170, period: 4, on: 2.4, tell: .7, phase: 2.6 },
],
bolts: [
  { x: 10760, w: 70, y0: -200, y1: 130,  period: 6.5, on: .25, tell: 1.0, phase: .5, id: 'b0' },
  { x: 11930, w: 70, y0: -500, y1: -270, period: 6.5, on: .25, tell: 1.0, phase: 3.2, id: 'b1' },
],
arcs: [
  { x: 13550, y: -570,  w: 130, h: 100, period: 3.2, on: 1.2, tell: .6, phase: 0 },
  { x: 14980, y: -570,  w: 130, h: 100, period: 3.2, on: 1.2, tell: .6, phase: 1.1 },
  { x: 15800, y: -570,  w: 130, h: 100, period: 3.2, on: 1.2, tell: .6, phase: 2.0 },
  { x: 16150, y: -570,  w: 130, h: 100, period: 3.2, on: 1.2, tell: .6, phase: .4 },
  { x: 20000, y: -1390, w: 110, h: 100, period: 3.2, on: 1.2, tell: .6, phase: 1.6 },
],
nodes: [
  { id: 'n1', x: 14250, y: -690, r: 46, gate: 'g3' },
  { id: 'n2', x: 14400, y: -620, r: 46, gate: 'g3' },
  { id: 'n3', x: 14550, y: -700, r: 46, gate: 'g3' },
],

/* things Bix talks to with ACT */
stamps: [
  { id: 'st1', x: 6950, y: 480, name: 'VENDOR' },
  { id: 'st2', x: 7700, y: 480, name: 'MUSIC LICENCE' },
  { id: 'st3', x: 7520, y: 330, name: 'LOST AND FOUND' },
],
desk:   { x: 8500, y: 480 },
socket: { x: 20200, y: -1290 },
core:   { x: 520, y: 600 },                        /* where the core starts (its cradle); y is the surface it rests on */

enemies: [
  { type: 'crawler', x: 2860,  y: 600,  range: 110, area: 'freight' },
  { type: 'crawler', x: 5640,  y: 520,  range: 90,  area: 'freight' },
  { type: 'crawler', x: 15160, y: -470, range: 140, area: 'relay' },
  { type: 'crawler', x: 16700, y: -470, range: 120, area: 'shaft' },
],

/* 12 cogs. c11 is the mastery cog: out of reach of a plain jump, reachable only with the buoyant core (float, hold jump) from ledge b1 */
cogs: [
  { id: 'c0',  x: 700,   y: 530,  route: 'main' },
  { id: 'c1',  x: 1500,  y: 530,  route: 'main' },
  { id: 'c2',  x: 2900,  y: 530,  route: 'main' },
  { id: 'c3',  x: 3650,  y: 490,  route: 'main' },
  { id: 'c4',  x: 4560,  y: 490,  route: 'main' },
  { id: 'c5',  x: 5100,  y: 450,  route: 'main' },
  { id: 'c6',  x: 7470,  y: 260,  route: 'secret' },      /* Lost & Found */
  { id: 'c7',  x: 10140, y: 250,  route: 'main' },
  { id: 'c8',  x: 11640, y: -240, route: 'main' },
  { id: 'c9',  x: 15200, y: -540, route: 'main' },
  { id: 'c10', x: 16000, y: -540, route: 'main' },
  { id: 'c11', x: 19380, y: -1500, route: 'mastery' },
],

/* six delivery slips: lore, and the "All Slips" medal */
slips: [
  { id: 1, x: 1000,  y: 535,  t: 'ORDER FORM, ONE POWER CORE. SIGNED: [SMUDGED]' },
  { id: 2, x: 3050,  y: 535,  t: 'CUSTOMS FORM, STAMPED TWICE. ONE UPSIDE DOWN.' },
  { id: 3, x: 8560,  y: 420,  t: 'CUSTOMS LOG. LAST SIGNER FOR THE SURFACE LIFT: BX-7.' },
  { id: 4, x: 11300, y: -140, t: 'COURIER ROUTE. LAST STOP: 11 YEARS AGO.' },
  { id: 5, x: 15300, y: -540, t: 'RELAY NOTE. "LEAVE THE LIFT ALONE."' },
  { id: 6, x: 19680, y: -1360, t: 'WORK ORDER 0031-A. TECHNICIAN: BX-7. TASK: INSPECT LIFT. SIGNED: BIX.' },
],

checkpoints: [
  { x: 170,   y: 600,   name: 'TRANSIT CRADLE',  area: 'deck' },
  { x: 2650,  y: 600,   name: 'CONCOURSE ENTRY', area: 'freight' },
  { x: 3350,  y: 560,   name: 'SORTING GATES',   area: 'freight' },
  { x: 6250,  y: 480,   name: 'MARKET GATE',     area: 'market' },
  { x: 8300,  y: 480,   name: 'CUSTOMS DESK',    area: 'market' },
  { x: 9200,  y: 480,   name: 'SPINE BASE',      area: 'spine' },
  { x: 10660, y: 130,   name: 'DISH WALK',       area: 'spine' },
  { x: 13350, y: -470,  name: 'RELAY HEAD',      area: 'relay' },
  { x: 15700, y: -470,  name: 'BLACKOUT LINE',   area: 'relay' },
  { x: 16830, y: -470,  name: "PRIME'S CAGE",    area: 'shaft' },
  { x: 17400, y: -470,  name: 'SHAFT FOOT',      area: 'shaft' },
  { x: 19900, y: -1290, name: 'LIFT SOCKET',     area: 'shaft' },
],

/* story lines that fire once when Bix passes x (y0..y1 limit them to a height band in the vertical areas). `say` is played line after line.
   Copy is from docs/level-4-script.md; every line fits the HUD box (about 70 characters). */
triggers: [
  { x: 60,    say: [['VELA', 'Surface lift unpowered. Depot core assigned. Deliver it. Note filed.']] },
  { x: 260,   say: [['PACK', 'Good news: the lift exists. Bad news: only on paper.']] },
  { x: 420,   say: [['VELA', 'Routing to Surface. Reassigning. Reass— [static]'], ['PACK', 'VELA has left the call. She may have left the building.'], ['BIX', 'Fine. One core. One lift.']] },
  { x: 1300,  say: [['PACK', 'New gauge: how heavy Dennis feels about this.']] },
  { x: 2260,  say: [['PACK', 'Freight Concourse. Everything here weighs more than it says.']] },
  { x: 2700,  say: [['BIX', 'Crawlers. I know these.']] },
  { x: 3300,  say: [['PACK', 'Sorting gates. They weigh things. They have opinions.']] },
  { x: 4160,  say: [['BIX', 'Big box. Regular swing. Count it.']] },
  { x: 4780,  say: [['PACK', 'The belts run backwards. On purpose, allegedly.']] },
  { x: 6260,  say: [['PACK', 'A market! Nothing here can hurt us. I checked. Twice.'], ['BIX', 'You said that about the cafeteria.']] },
  { x: 6860,  say: [['VENDOR', 'Welcome! Everything is out of stock!']] },
  { x: 7420,  say: [['PACK', 'A band! They play in real time. Please do not join in.']] },
  { x: 7900,  say: [['NIB', 'Delivery? I will need it in writing.'], ['NIB', 'Nib, market manager. I file the avoidable disasters.'], ['PACK', 'You are the person from the incident forms!']] },
  { x: 8380,  say: [['CUSTOMS DESK', 'Core requires three stamps. Please queue.'], ['BIX', 'There is no queue.'], ['CUSTOMS DESK', 'Please queue anyway.']] },
  { x: 9160,  say: [['PACK', 'Signal Spine. Tall. Windy. Wildly antenna.']] },
  { x: 9620,  say: [['PACK', 'Dennis is light now. So is my confidence.'], ['BIX', 'I am floating.'], ['PACK', 'Please float with purpose.']] },
  { x: 10360, y0: -100, y1: 300, say: [['PACK', 'Updraft ahead. Watch for the amber puff.']] },
  { x: 10700, y0: -60,  y1: 200, say: [['PACK', 'Lightning. It flashes before it strikes. Manners.']] },
  { x: 11900, y0: -420, y1: -200, say: [['PACK', 'Sign of life. Small. Fast. Possibly rude.'], ['BIX', 'The surface is not empty.']] },
  { x: 12520, y0: -600, y1: -300, say: [['VELA', 'Routing restored. Surface in sight. Careful.'], ['PACK', 'VELA said "careful." I am filing that as alarming.']] },
  { x: 13010, say: [['PACK', 'Relay Bay. Everything here bites. Electrically.']] },
  { x: 13480, say: [['PACK', 'The rails arc on a rhythm. Amber, then flash.']] },
  { x: 14110, say: [['BIX', 'Three nodes. Throw the core through them.'], ['PACK', 'Red throws. Blue calls him back. Dennis is a boomerang.']] },
  { x: 16460, say: [['VELA', 'Lift ahead. Please— [static]']] },
  { x: 16900, say: [['PRIME', 'Welcome! I am here to help you deliver.'], ['BIX', 'We have a core.'], ['PRIME', 'You have a core. I have three. All authentic.'], ['PRIME', 'Delivery accepted. Please rate your experience.'], ['BIX', 'Five stars. Go away.']], opens: 'g4', delay: 13 },
  { x: 17420, say: [['PACK', 'Lift shaft. Three parts. Three moods. One Dennis.']] },
  { x: 19860, say: [['PACK', 'Lift socket. Insert Dennis. Gently.']] },
],
};
