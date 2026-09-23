/* Project Mayhem, LEVEL 6 "Mother Cluckzilla": geometry and story data only (stage 1). One global: window.L6DATA.
   Spec: docs/level-6-spec.md. The finale of the first world: Bix cannot fight a four-storey brood machine, so he throws
   feed pods and she walks to the newest one. Every puzzle is her weight, used on purpose. Nobody is hurt, including her.

   PHYSICS THIS GEOMETRY WAS BUILT AGAINST (identical to Levels 1 to 5)
     player box 42x96, gravity 1450, jump 780 (apex 209), run 285, early release +1500, coyote .13, buffer .16
     Reachability A -> B:  rise = A.y-B.y, disc = v0^2 - 2 g rise, t = (v0+sqrt(disc))/g, need gap+42 < 285 t - 35
   Rules the geometry keeps: a step up is 100 px or less with a gap under 100; a free jump clears a gap of about 230 px;
   a jump plus a ledge grab climbs about 300 px, so anything meant to stop the player is 440 px or taller.

   Element lists (every one is optional; a missing list must not throw)
     hoppers[]  {id,x,y}                       pod source, refills after a moment. A pod is ALWAYS replaceable.
     troughs[]  {id,x,y,w,column}              a burst pod here lures her to that column
     columns[]  {id,x,y,h,trough,fallsTo}      standing irrigation column; her weight drops it and it becomes fallsTo
     boss{}     Mother Cluckzilla: where she enters, how fast, her footfall and sweep timing, the phase boundaries
     alarm{}    the switch that ends the pursuit and makes the pods live
     cart{}     the bedding cart: lure her on and it tips, which ends the level
*/
window.L6DATA = {
world: { w: 26000, h: 720, yMin: -900, yMax: 980, camY: -40, finishX: 25600 },
start: { x: 150, y: 410 },

areas: [
  { id:'threshold',  name:'DOME THRESHOLD', x0:0,     x1:3000,  objective:'Take a feed pod and carry it out',                     camY:-40,  killY:900 },
  { id:'feedline',   name:'FEED LINE',      x0:3000,  x1:7000,  objective:'Follow the feed line. Something is using it',          camY:-40,  killY:900 },
  { id:'orchard',    name:'ORCHARD ROWS',   x0:7000,  x1:12000, objective:'She is following the feed. Keep moving',               camY:-40,  killY:900 },
  { id:'alarmspine', name:'ALARM SPINE',    x0:12000, x1:16000, objective:'Climb to the dome alarm and pull it',                  vertical:true, killY:900 },
  { id:'grid',       name:'THE GRID',       x0:16000, x1:22000, objective:'Bait a trough, stand clear, let her drop the column',  camY:-560, killY:520 },
  { id:'nestingbay', name:'NESTING BAY',    x0:22000, x1:26000, objective:'Lure her onto the bedding cart',                       camY:-560, killY:520 },
],

/* [x, y (walking top), w, drawn depth] */
platforms: [
  /* 0*/ [100,   410, 900, 160],   /* A1 start; the first hopper and a safe pit to teach the respawn */
  /* 1*/ [1100,  410, 700, 160],
  /* 2*/ [1900,  390, 600, 160],
  /* 3*/ [2600,  390, 620, 160],   /* into A2 */
  /* 4*/ [3320,  390, 700, 160],   /* A2 conveyor deck */
  /* 5*/ [4120,  370, 620, 160],
  /* 6*/ [4840,  370, 700, 160],
  /* 7*/ [5640,  350, 620, 160],
  /* 8*/ [6360,  350, 900, 160],   /* into A3: she arrives here */
  /* 9*/ [7360,  350, 900, 160],   /* A3 orchard rows: flat and runnable, this is the pursuit */
  /*10*/ [8360,  340, 800, 160],
  /*11*/ [9260,  340, 900, 160],
  /*12*/ [10260, 330, 800, 160],
  /*13*/ [11160, 330, 900, 160],
  /*14*/ [12160, 330, 700, 160],   /* A4 spine foot */
  /*15*/ [14180, -210, 800, 160],  /* A4 alarm deck, top of the climb */
  /*16*/ [15080, -210, 700, 160],
  /*17*/ [15880, -210, 760, 160],  /* into A5 */
  /*18*/ [16740, -210, 800, 160],  /* A5 before column 1 */
  /*19*/ [18240, -210, 800, 160],  /* A5 before column 2 (the k1 gap sits between) */
  /*20*/ [19740, -210, 800, 160],  /* A5 before column 3 */
  /*21*/ [21240, -210, 900, 160],  /* A5 exit */
  /*22*/ [22240, -210, 1100, 160], /* A6 nesting bay floor */
  /*23*/ [23440, -210, 1000, 160],
  /*24*/ [24540, -210, 1060, 160], /* A6 the cart deck; the cart sits at 25200 */
],

/* one-way catwalks. The spine climbs 100 px a step with gaps of 60, the same as Level 4's heavy steps. */
ledges: [
  /* the pocket above the feed line: one cog, off the main line */
  /* 0*/ { x:4260,  y:250,  w:200, h:16, t:'steel', id:'f1' },
  /* 1*/ { x:4560,  y:170,  w:220, h:16, t:'steel', id:'f2' },
  /* the alarm spine: from p14 (y 330) up to the alarm deck (y -210) */
  /* 2*/ { x:12960, y:230,  w:240, h:16, t:'steel', id:'s0' },
  /* 3*/ { x:13260, y:130,  w:240, h:16, t:'steel', id:'s1' },
  /* 4*/ { x:13560, y:30,   w:240, h:16, t:'steel', id:'s2' },
  /* 5*/ { x:13860, y:-70,  w:240, h:16, t:'steel', id:'s3' },
  /* the shelf that carries trough 2: the pod has to be thrown up into it */
  /* 6*/ { x:18940, y:-410, w:240, h:16, t:'steel', id:'g1' },
],

/* pod hoppers. There is always one within reach of wherever a pod can be lost, so the player is never stuck. */
hoppers: [
  { id:'h1',  x:420,   y:410 },
  { id:'h2',  x:2900,  y:390 },
  { id:'h3',  x:5000,  y:370 },
  { id:'h4',  x:7600,  y:350 },
  { id:'h5',  x:11400, y:330 },
  { id:'h6',  x:14400, y:-210 },
  { id:'h7',  x:16900, y:-210 },
  { id:'h8',  x:18400, y:-210 },
  { id:'h9',  x:19900, y:-210 },
  { id:'h10', x:22500, y:-210 },
  { id:'h11', x:24700, y:-210 },
],

/* a burst pod in a trough brings her to that column. Trough 2 sits on a ledge, so the pod has to be thrown up to it. */
troughs: [
  { id:'t1', x:17300, y:-210, w:160, column:'k1' },
  { id:'t2', x:18980, y:-410, w:160, column:'k2' },
  { id:'t3', x:20300, y:-210, w:160, column:'k3' },
],

/* each gap is 700 px, far past a 400 px jump, so the column is the only way across. Dropping one is permanent. */
columns: [
  { id:'k1', x:17700, y:-210, h:690, trough:'t1', fallsTo:{ x:17540, y:-210, w:700, h:26 } },
  { id:'k2', x:19200, y:-210, h:690, trough:'t2', fallsTo:{ x:19040, y:-210, w:700, h:26 } },
  { id:'k3', x:20700, y:-210, h:690, trough:'t3', fallsTo:{ x:20540, y:-210, w:700, h:26 } },
],

/* Mother Cluckzilla. She never targets Bix: she walks to the strongest feed signal, and he is only ever in the way. */
boss: {
  enterAt: 7000,            /* she comes into the orchard here */
  speed: 250,               /* px/s: slower than a clean 285 run, faster than a careless one */
  leash: 520,               /* in pursuit she keeps this far behind the feed line ahead of her */
  height: 2600,             /* drawn: about four screens tall */
  footfall: { period: 1.55, tell: 0.7, spread: 150, radius: 120 },
  sweep:    { period: 6.2,  tell: 0.9, reach: 300 },
  shock:    { radius: 420 },     /* a landing footfall staggers a grounded Bix inside this: it costs time, not health */
  phases: [ { id:'pursuit', from:7000 }, { id:'alarm', from:12000 }, { id:'grid', from:16000 }, { id:'bed', from:22000 } ],
},

alarm: { x: 14600, y: -210 },
cart:  { x: 25200, y: -210, w: 280 },

/* light pressure only: the crawlers Bix already knows. She is the level's danger, not these. */
enemies: [
  { type:'crawler', x:3600,  y:390,  range:120, area:'feedline' },
  { type:'crawler', x:6600,  y:350,  range:110, area:'feedline' },
  { type:'crawler', x:15200, y:-210, range:120, area:'alarmspine' },
  { type:'crawler', x:22600, y:-210, range:130, area:'nestingbay' },
],

/* 15 cogs. c14 is the mastery cog: above the grid pocket, only reachable once a column has fallen. */
cogs: [
  { id:'c0',  x:620,   y:340,  route:'main' },
  { id:'c1',  x:1500,  y:340,  route:'main' },
  { id:'c2',  x:2200,  y:320,  route:'main' },
  { id:'c3',  x:3600,  y:320,  route:'main' },
  { id:'c4',  x:4660,  y:100,  route:'secret' },
  { id:'c5',  x:5900,  y:280,  route:'main' },
  { id:'c6',  x:7700,  y:280,  route:'main' },
  { id:'c7',  x:9600,  y:270,  route:'main' },
  { id:'c8',  x:11500, y:260,  route:'main' },
  { id:'c9',  x:13380, y:60,   route:'main' },
  { id:'c10', x:14000, y:-140, route:'main' },
  { id:'c11', x:17000, y:-280, route:'main' },
  { id:'c12', x:20000, y:-280, route:'main' },
  { id:'c13', x:23800, y:-280, route:'main' },
  { id:'c14', x:19390, y:-400, route:'mastery' },
],

/* story pickups: the BX-7 thread, carried over from Levels 3 and 4 */
slips: [
  { id:1, x:1750,  y:340,  t:'DOME LOG. FEED LINE RUNNING UNATTENDED: 11 YEARS.' },
  { id:2, x:6200,  y:280,  t:'MAINTENANCE NOTE. "SHE IS NOT BROKEN. SHE IS WORKING."' },
  { id:3, x:15600, y:-280, t:'ALARM TEST SHEET. LAST SIGNED: BX-7.' },
  { id:4, x:24000, y:-280, t:'BEDDING ROTA. NO NAMES LEFT ON IT.' },
],

checkpoints: [
  { x:170,   y:410,  name:'DOME THRESHOLD', area:'threshold' },
  { x:3360,  y:390,  name:'FEED LINE',      area:'feedline' },
  { x:7400,  y:350,  name:'ORCHARD ROWS',   area:'orchard' },
  { x:12200, y:330,  name:'SPINE FOOT',     area:'alarmspine' },
  { x:14220, y:-210, name:'THE ALARM',      area:'alarmspine' },
  { x:16780, y:-210, name:'THE GRID',       area:'grid' },
  { x:22280, y:-210, name:'NESTING BAY',    area:'nestingbay' },
],

/* story lines. Every one fits the HUD box: 70 characters or fewer, checked by tests/level6-geometry.cjs. */
triggers: [
  { x:60,    say:[['PACK','Sector 9. The dome is still running. Nobody told it to stop.']] },
  { x:340,   say:[['PACK','Feed pods in the hopper. Take one. They are popular, apparently.']] },
  { x:900,   say:[['BIX','Popular with what?'],['PACK','I did not want to say it first.']] },
  { x:3060,  say:[['PACK','The feed line. It runs the whole length of the dome.']] },
  { x:5200,  say:[['PACK','Something has been eating at the far end. For eleven years.']] },
  { x:6900,  say:[['VELA','Sector 9 occupied. Do not approach the— [static]']] },
  { x:7200,  say:[['PACK','Bix.'],['BIX','I see her.'],['PACK','She is quite large, Bix.']] },
  { x:7900,  say:[['PACK','She follows the feed. The feed goes the way we are going.']] },
  { x:9400,  say:[['BIX','Then we go faster.']] },
  { x:12060, say:[['PACK','Ladders. Up. Up is good. Up is away from the feet.']] },
  { x:14460, say:[['PACK','The dome alarm. Pull it and the work lights come up.']] },
  { x:16060, say:[['PACK','Irrigation columns. Too heavy for you. Not for her.']] },
  { x:16800, say:[['PACK','Drop a pod in the trough, or throw one in. Then stand clear.']] },
  { x:22060, say:[['PACK','Bedding bay. Straw, rails, and one very tired machine.']] },
  { x:24600, say:[['PACK','Last pod, Bix. Put it on the cart.']] },
],
};
