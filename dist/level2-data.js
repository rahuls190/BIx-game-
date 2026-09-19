/* Project Mayhem — LEVEL 2 "The Furnace Below" — geometry data only.
   Plain browser script. No modules, no build step. Defines one global: window.L2DATA.
   Engine is written elsewhere; this file is pure data + the contract below.

   PHYSICS THIS GEOMETRY WAS DESIGNED AGAINST (identical to Level 1):
     player box 42x96 · gravity vy+=1450*dt · jump vy=-780 · early release vy+=1500*dt
     run max 285 px/s · coyote .13 · buffer .16 · max jump height 209
     solid platforms collide at h=78 regardless of the h stored here (h here is the drawn depth)
     ledges are one-way: land from above, drop through with Down, pass up through from below
   Reachability rule used by tests/level2-geometry.cjs for surfaces A -> B:
     rise = A.y - B.y ; disc = 780^2 - 2*1450*rise ; t = (780+sqrt(disc))/1450
     require disc > 0 and gap + 42 < 285*t - 35, where
     gap = max(0, B.x-(A.x+A.w), A.x-(B.x+B.w))   <-- both directions, Area 5 climbs left and right

   KEYS ADDED BEYOND THE AGREED SCHEMA (all optional for a renderer, all documented here):
     chains[]      required/optional/pack traversal proofs. Each node is ['p'|'l'|'m', index]
                   into platforms / ledges / movers. The test walks these; without them the
                   split route in Area 3 and the vertical climb in Area 5 are not expressible
                   as "consecutive platforms sorted by x".
     climbWalls[]  {x,y,w,h,side,note} faces intended to be grabbed and mantled.
     decor[]       {x,y,w,h,kind,note} non-colliding set dressing (Area 1's sealed crawler bay).
     retracts[]    {i,mode:'trigger',hold,gone} platform index i retracts `hold` s AFTER Bix
                   lands on it and returns after `gone` s. Trigger-based, never timer-based, so
                   the upper pipe route is always crossable from a standstill.
     floods[]      {x0,x1,yDry,yWet,period,wet,p} Area 3 lower tunnel. yWet=648 is ABOVE
                   (numerically below) every lower-route platform top, so tops stay dry; the
                   flood kills in the gaps only.
     heat          {x0,x1,yStart,rate,perShutter} Area 5 rising heat line; rate increases by
                   perShutter px/s for every cooling shutter opened.
     vents[].safe  1 = decorative/teaching vent, never lethal (Area 1 only).
     vents[].period / lasers[].y0,y1 / belts[].w  timing + extent the design specifies.
     enemies[] carry their own patrol range or cycle: crawler x0,x1,speed,pause ·
               spitter period,tell,landX,landY · claw lanes[],period · wasp period,speed ·
               supervisor x0,x1,period,stall.
     checkpoints[].area / terminals[].route / enemies[].area  tagging only.
*/
window.L2DATA = {
world: {w: 16600, yMin: -1000, yMax: 1000},

areas: [
 {id:'lift',    name:'BROKEN LIFT',    objective:'Climb down out of the wrecked lift', x0:0,     x1:2600},
 {id:'casting', name:'CASTING HALL',   objective:'Ride the molds across the molten channel', x0:2600, x1:6200},
 {id:'cooling', name:'COOLING WORKS',  objective:'Open both coolant valves', x0:6200, x1:10500},
 {id:'sorter',  name:'SCRAP SORTER',   objective:'Seat the power cell past the laser gates', x0:10500, x1:14360},
 {id:'furnace', name:'FURNACE ESCAPE', objective:'Open three shutters and board the lift', x0:14360, x1:16600}
],

/* --- SOLID PLATFORMS (index order is load-bearing: chains[] and retracts[] point at it) --- */
platforms: [
 /* 0*/ [0,430,640,300],      /* A1 wide safe landing, lift wreck */
 /* 1*/ [1290,650,330,200],   /* A1 shaft base */
 /* 2*/ [1730,560,240,440],   /* A1 step */
 /* 3*/ [2050,430,290,570],   /* A1 hang-and-climb wall */
 /* 4*/ [2400,470,260,530],   /* A1 exit shelf */
 /* 5*/ [2760,520,300,160],   /* A2 safe island 1 */
 /* 6*/ [3480,530,300,160],   /* A2 safe island 2 */
 /* 7*/ [4210,525,300,160],   /* A2 safe island 3 */
 /* 8*/ [4930,515,320,160],   /* A2 deck */
 /* 9*/ [5390,545,300,160],   /* A2 deck */
 /*10*/ [5790,500,320,160],   /* A2 deck (rail lane drops back here) */
 /*11*/ [6210,500,300,160],   /* A2 -> A3 transition (level with deck 10, one 80 px step up to the hub) */
 /*12*/ [6600,420,520,180],   /* A3 central pump hub — route splits here: JUMP right = upper pipes, WALK OFF = tunnel */
 /*13*/ [7230,300,220,90],    /* A3 upper pipe */
 /*14*/ [7560,285,200,90],
 /*15*/ [7870,280,200,90],    /* retracting */
 /*16*/ [8180,285,200,90],    /* retracting */
 /*17*/ [8490,275,200,90],    /* retracting */
 /*18*/ [8800,285,220,90],    /* spitter target slab */
 /*19*/ [9130,280,200,90],    /* retracting */
 /*20*/ [9440,290,220,90],    /* upper coolant valve */
 /*21*/ [9770,290,240,90],
 /*22*/ [7230,620,240,160],   /* A3 lower maintenance tunnel */
 /*23*/ [7560,632,220,160],
 /*24*/ [7870,620,220,160],
 /*25*/ [8180,634,240,160],
 /*26*/ [8510,622,220,160],   /* spitter target slab */
 /*27*/ [8820,636,240,160],
 /*28*/ [9150,624,220,160],   /* lower coolant valve */
 /*29*/ [9460,612,240,160],
 /*30*/ [9790,596,220,160],
 /*31*/ [10090,500,340,200],  /* A3 rejoin, behind the coolant gate */
 /*32*/ [10540,520,340,200],  /* A4 sorter entry */
 /*33*/ [11000,530,420,190],  /* A4 belt deck 1 */
 /*34*/ [11560,540,300,180],
 /*35*/ [11990,550,420,180],  /* A4 belt deck 2 */
 /*36*/ [12550,535,300,185],  /* power cell deck */
 /*37*/ [12980,545,420,175],  /* A4 belt deck 3 */
 /*38*/ [13540,530,300,190],
 /*39*/ [13970,545,320,175],  /* socket deck */
 /*40*/ [14360,520,300,200],  /* A4 -> A5, base of the furnace shaft */
 /*41*/ [10900,780,300,110],  /* A4 Pack-only service tunnel */
 /*42*/ [11300,780,300,110],
 /*43*/ [11700,780,300,110],
 /*44*/ [12100,780,300,110],
 /*45*/ [15020,-930,300,70]   /* A5 emergency lift deck */
],

/* --- ONE-WAY LEDGES --- */
ledges: [
 /* 0*/ [700,500,150,22],     /* A1 descending ledge 1 */
 /* 1*/ [900,570,150,22],     /* A1 descending ledge 2 */
 /* 2*/ [1100,640,150,22],    /* A1 descending ledge 3 */
 /* 3*/ [2830,360,180,22],    /* A2 hang-rail lane, entered from island 1 */
 /* 4*/ [3120,340,170,22],
 /* 5*/ [3400,355,170,22],
 /* 6*/ [3700,335,170,22],
 /* 7*/ [3990,350,170,22],
 /* 8*/ [4290,330,170,22],
 /* 9*/ [4600,350,170,22],
 /*10*/ [4900,335,170,22],
 /*11*/ [5460,340,170,22],    /* after the moving rail gap */
 /*12*/ [5760,325,170,22],
 /*13*/ [7600,150,150,22],    /* A3 upper cog perch */
 /*14*/ [8540,150,150,22],    /* A3 upper cog perch */
 /*15*/ [8040,540,100,22],    /* A3 lower cog perch (over the right end of deck 24: does not sit in the landing zone of 23 -> 24) */
 /*16*/ [10700,375,180,22],   /* A4 catwalk — every span keeps a belt deck within 200 px below it */
 /*17*/ [11020,355,170,22],
 /*18*/ [11340,365,170,22],
 /*19*/ [11660,350,170,22],
 /*20*/ [11980,365,170,22],
 /*21*/ [12300,350,170,22],
 /*22*/ [12620,365,170,22],
 /*23*/ [12940,355,170,22],
 /*24*/ [14700,415,230,22],   /* A5 climb 1 (left column) */
 /*25*/ [15040,320,230,22],   /* A5 climb 2 (right column) */
 /*26*/ [14700,205,230,22],   /* shutter 1 */
 /*27*/ [15040,110,230,22],
 /*28*/ [14700,-5,230,22],
 /*29*/ [15040,-110,230,22],  /* REST LEDGE A — checkpoint (right column, 220 px above ledge 27) */
 /*30*/ [14700,-215,230,22],  /* shutter 2 */
 /*31*/ [15040,-320,230,22],
 /*32*/ [14700,-425,230,22],
 /*33*/ [15040,-540,230,22],  /* REST LEDGE B — checkpoint (right column, 220 px above ledge 31) */
 /*34*/ [14700,-635,230,22],  /* shutter 3 */
 /*35*/ [14860,-750,150,22],  /* override console — clear of the lift deck's underside (x < 15020-42 at take-off) */
 /*36*/ [14700,-845,230,22],
 /*37*/ [15380,250,150,22],   /* A5 cog perch */
 /*38*/ [14420,-70,150,22],   /* A5 cog perch */
 /*39*/ [15380,-590,150,22]   /* A5 cog perch */
],

/* --- MOVERS: x,y is the CENTRE of travel. The test proves every required hop at the
       centre position, so the mold is usable twice per cycle with the stated margin. --- */
movers: [
 /*0*/ {x:3170,y:545,w:160,h:24,a:'y',r:60,p:0},    /* casting mold A */
 /*1*/ {x:3900,y:540,w:160,h:24,a:'y',r:65,p:1.4},  /* casting mold B */
 /*2*/ {x:4630,y:550,w:160,h:24,a:'x',r:70,p:.8},   /* casting mold C */
 /*3*/ {x:5180,y:345,w:150,h:22,a:'x',r:90,p:.5}    /* hang-rail moving gap (optional lane) */
],

/* --- BLAST VENTS. period is the full cycle; Level 1 used 4.2, the difficulty pass tightens
       the Casting Hall to 3.4. safe:1 vents never damage (Area 1 teaching vent). --- */
vents: [
 {x:1420,y:650,p:0,period:5.2,safe:1},
 {x:2900,y:520,p:0,period:3.4},
 {x:3600,y:530,p:1.1,period:3.4},
 {x:4330,y:525,p:2.2,period:3.4},
 {x:5560,y:545,p:.6,period:3.4}
],

/* --- LASER GATES. pair 0 and pair 1 alternate, so no moment is safe everywhere. --- */
lasers: [
 {x:11480,y0:300,y1:620,p:0,pair:0},
 {x:12470,y0:300,y1:620,p:1.6,pair:1},
 {x:13460,y0:300,y1:620,p:0,pair:0}
],

/* --- CONVEYORS. Each leaves 60 px of belt-free deck at both ends so a standing
       spot exists on both sides of every laser gap. --- */
belts: [
 {x:11060,y:530,w:300,dir:1},
 {x:12050,y:550,w:300,dir:-1},
 {x:13040,y:545,w:300,dir:1}
],

/* --- MOLTEN CHANNEL (Casting Hall floor) + furnace pool at the base of the shaft --- */
lava: [
 {x:2700,y:760,w:700},
 {x:3400,y:760,w:700},
 {x:4100,y:760,w:700},
 {x:4800,y:760,w:700},
 {x:5500,y:760,w:680},
 {x:14650,y:760,w:700}
],

/* --- 14 OPTIONAL COGS, all on hang-rail / catwalk / side-perch routes --- */
cogs: [
 {x:3205,y:290},  {x:3785,y:285},  {x:4375,y:280},  {x:5845,y:275},   /* A2 hang-rail lane */
 {x:7675,y:100},  {x:8615,y:100},  {x:8090,y:490},                    /* A3 both routes */
 {x:11105,y:305}, {x:11745,y:300}, {x:12385,y:300}, {x:13025,y:305},  /* A4 catwalk */
 {x:15455,y:200}, {x:14495,y:-120},{x:15455,y:-640}                   /* A5 side perches */
],

/* --- CHECKPOINTS. Every y is exactly the top of a real surface. --- */
checkpoints: [
 {x:140,   y:430,  name:'LIFT WRECK',    area:'lift'},
 {x:1760,  y:560,  name:'SHAFT BASE',    area:'lift'},
 {x:2790,  y:520,  name:'FIRST ISLAND',  area:'casting'},
 {x:4960,  y:515,  name:'MOLD DECK',     area:'casting'},
 {x:6660,  y:420,  name:'PUMP HUB',      area:'cooling'},
 {x:10180, y:500,  name:'COOLANT GATE',  area:'cooling'},
 {x:10600, y:520,  name:'SORTER ENTRY',  area:'sorter'},
 {x:12600, y:535,  name:'CELL DECK',     area:'sorter'},
 {x:14400, y:520,  name:'FURNACE BASE',  area:'furnace'},
 {x:15100, y:-110, name:'REST LEDGE A',  area:'furnace'},
 {x:15100, y:-540, name:'REST LEDGE B',  area:'furnace'}
],

/* --- PACK ACT TERMINALS --- */
terminals: [
 {x:7930,  y:280,  label:'PIPE CONTROL',  does:'Pack holds the retracting pipe span out for 6 s', area:'cooling', route:'upper'},
 {x:7930,  y:620,  label:'TUNNEL PUMP',   does:'Pack delays the next flood by 8 s',               area:'cooling', route:'lower'},
 {x:11030, y:530,  label:'SERVICE HATCH', does:'Pack drops into the tunnel and clears the claw rail', area:'sorter'},
 {x:14990, y:-750, label:'OVERRIDE',      does:'Pack holds the lift shutter while Bix boards',   area:'furnace'}
],

valves: [
 {x:9530, y:290, id:'valveUpper'},
 {x:9250, y:624, id:'valveLower'}
],

shutters: [
 {x:14780, y:205,  id:'sh1'},
 {x:14780, y:-215, id:'sh2'},
 {x:14780, y:-635, id:'sh3'}
],

gates: [
 {x:10460, y:150, w:40, h:410, needs:['valveUpper','valveLower']}
],

enemies: [
 {type:'crawler',    x:3560, y:530,  x0:3500,  x1:3740,  speed:78, pause:.6, area:'casting'},
 {type:'crawler',    x:5080, y:515,  x0:5060,  x1:5230,  speed:78, pause:.6, area:'casting'},
 {type:'spitter',    x:9120, y:205,  face:-1, period:2.6, tell:.8, landX:8910, landY:285, area:'cooling', route:'upper'},
 {type:'spitter',    x:8820, y:540,  face:-1, period:2.6, tell:.8, landX:8620, landY:622, area:'cooling', route:'lower'},
 {type:'claw',       x:12200,y:300,  x0:11060, x1:13340, period:3.2, lanes:[11210,12200,13190], area:'sorter'},
 {type:'crawler',    x:11800,y:780,  x0:11720, x1:11980, speed:78, pause:.6, area:'sorter', packOnly:1},
 {type:'wasp',       x:14820,y:700,  spawn:1, period:6, speed:58, p:0, area:'furnace'},
 {type:'wasp',       x:15160,y:200,  spawn:1, period:6, speed:58, p:2, area:'furnace'},
 {type:'wasp',       x:14820,y:-300, spawn:1, period:6, speed:58, p:4, area:'furnace'},
 {type:'supervisor', x:15420,y:-60,  x0:14650, x1:15330, period:5.2, stall:2, area:'furnace'}
],

pickups: [{type:'cell', x:12700, y:495}],
sockets: [{x:14100, y:505}],

triggers: [
 {x:180,   s:'PACK',       t:'We are one floor below "fine".'},
 {x:1300,  s:'PACK',       t:'Sealed bay on your left. Whatever is in there stays in there.'},
 {x:2060,  s:'BIX',        t:'Hang, pull, mantle. I have done worse with fewer hands.'},
 {x:2780,  s:'PACK',       t:'Casting hall. Three lanes, one of them is soup.'},
 {x:3480,  s:'PACK',       t:'Crawler ahead. It turns, it pauses, you walk. Do not improvise.'},
 {x:6610,  s:'VELA',       t:'Two valves, two routes. Pick your poison, both are wet.'},
 {x:7240,  s:'PACK',       t:'Pipes retract once you land. I did warn the pipes.'},
 {x:7240,  s:'BIX',        t:'Tunnel floods on a timer. So does my optimism.'},
 {x:10120, s:'PACK',       t:'Coolant gate. It wants both valves and no excuses.'},
 {x:10560, s:'PACK',       t:'Scrap sorter. You are, technically, scrap.'},
 {x:12560, s:'PACK',       t:'Power cell. I will carry it. You carry the anxiety.'},
 {x:13500, s:'SUPERVISOR', t:'CLASSIFICATION: RECYCLABLE. BEGINNING ROUTINE CYCLE.'},
 {x:14380, s:'PACK',       t:'Good news: we are recyclable.'},
 {x:14380, s:'BIX',        t:'Find less good news.'},
 {x:14700, s:'PACK',       t:'Three shutters, then the lift. Heat is coming up behind you.'},
 {x:15060, s:'PACK',       t:'That counts as overtime.'}
],

exit: {x:15170, y:-930},

/* --- ADDITIONS (documented in the header) --- */
climbWalls: [
 {x:2050, y:430, w:290, h:570, side:'left', note:'Area 1 teaching face: grab the lip, auto-mantle. A normal jump also clears it.'}
],

decor: [
 {x:1290, y:430, w:300, h:210, kind:'sealed-bay', note:'Glassed crawler display. Silhouette + sound only, never active.'}
],

retracts: [
 {i:15, mode:'trigger', hold:.8, gone:2.5},
 {i:16, mode:'trigger', hold:.8, gone:2.5},
 {i:17, mode:'trigger', hold:.8, gone:2.5},
 {i:19, mode:'trigger', hold:.8, gone:2.5}
],

floods: [
 {x0:7180, x1:10060, yDry:900, yWet:648, period:16, wet:5, p:0}
],

heat: {x0:14360, x1:15560, yStart:820, rate:34, perShutter:14},

/* --- TRAVERSAL PROOFS. kind:'required' must clear the envelope with real margin. --- */
chains: [
 {id:'a1-descent', kind:'required', nodes:[['p',0],['l',0],['l',1],['l',2],['p',1],['p',2],['p',3],['p',4]]},
 {id:'a2-middle',  kind:'required', nodes:[['p',4],['p',5],['m',0],['p',6],['m',1],['p',7],['m',2],['p',8],['p',9],['p',10],['p',11]]},
 {id:'a2-rail',    kind:'optional', nodes:[['p',5],['l',3],['l',4],['l',5],['l',6],['l',7],['l',8],['l',9],['l',10],['m',3],['l',11],['l',12]]},
 {id:'a3-upper',   kind:'required', nodes:[['p',11],['p',12],['p',13],['p',14],['p',15],['p',16],['p',17],['p',18],['p',19],['p',20],['p',21],['p',31]]},
 {id:'a3-lower',   kind:'required', nodes:[['p',12],['p',22],['p',23],['p',24],['p',25],['p',26],['p',27],['p',28],['p',29],['p',30],['p',31]]},
 {id:'a4-main',    kind:'required', nodes:[['p',31],['p',32],['p',33],['p',34],['p',35],['p',36],['p',37],['p',38],['p',39],['p',40]]},
 {id:'a4-catwalk', kind:'optional', nodes:[['p',32],['l',16],['l',17],['l',18],['l',19],['l',20],['l',21],['l',22],['l',23]]},
 {id:'a4-tunnel',  kind:'pack',     nodes:[['p',41],['p',42],['p',43],['p',44]]},
 {id:'a5-climb',   kind:'required', nodes:[['p',40],['l',24],['l',25],['l',26],['l',27],['l',28],['l',29],['l',30],['l',31],['l',32],['l',33],['l',34],['l',35],['l',36],['p',45]]}
]
};
