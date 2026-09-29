/* Project Mayhem, Level 7: Clocking In. Geometry and authored encounter data. */
window.L7DATA = {
  world: { w: 27500, h: 720, yMin: -760, yMax: 980, finishX: 27220 },
  start: { x: 150, y: 410 },

  areas: [
    { id:'dome',    name:'DOME EXIT',      x0:0,     x1:3000,  objective:'Leave the dome and find the civic line', camY:-40,  killY:930 },
    { id:'intake',  name:'CIVIC INTAKE',   x0:3000,  x1:7000,  objective:'Link Pack to open the intake route',      vertical:true, killY:960 },
    { id:'court',   name:'RELAY COURT',    x0:7000,  x1:12000, objective:'Power both bridge pivots',               vertical:true, killY:960 },
    { id:'archive', name:'ARCHIVE SPINE',  x0:12000, x1:17500, objective:'Climb the records stack and recover BX-7',vertical:true, killY:980 },
    { id:'ghost',   name:'GHOST PLATFORM', x0:17500, x1:23000, objective:'Ride the tram and keep the signal alive',vertical:true, killY:980 },
    { id:'train',   name:'FIRST TRAIN',    x0:23000, x1:27500, objective:'Hold traction, recall Pack, board the train',vertical:true, killY:980 },
  ],

  /* [x, walking top, width, visible depth, material] */
  platforms: [
    [80,410,900,170,'dome'],[1080,390,680,170,'dome'],[1880,360,520,180,'dome'],[2500,330,700,190,'dome'],
    [3260,330,620,170,'intake'],[4020,440,720,180,'intake'],[4860,310,620,180,'intake'],[5600,180,600,190,'intake'],[6320,300,820,180,'intake'],
    [7200,300,700,180,'court'],[8060,430,520,180,'court'],[8760,250,520,180,'court'],[9480,80,620,180,'court'],[10260,250,560,180,'court'],[11000,100,900,180,'court'],
    [12040,100,620,180,'archive'],[12820,260,560,180,'archive'],[13540,60,560,180,'archive'],[14240,-150,620,180,'archive'],[15020,60,520,180,'archive'],[15700,-180,620,180,'archive'],[16480,-20,1020,180,'archive'],
    [17540,-20,720,180,'ghost'],[18380,180,600,180,'ghost'],[19140,-40,620,180,'ghost'],[19920,240,600,180,'ghost'],[20700,20,620,180,'ghost'],[21480,-170,620,180,'ghost'],[22260,20,820,180,'ghost'],
    [23140,20,740,180,'train'],[24040,260,600,180,'train'],[24820,40,600,180,'train'],[25600,-180,700,180,'train'],[26500,20,900,180,'train']
  ],

  ledges: [
    {x:700,y:245,w:220,h:16,id:'d0'},{x:1440,y:210,w:210,h:16,id:'d1'},
    {x:3510,y:210,w:220,h:16,id:'i0'},{x:3770,y:325,w:160,h:16,id:'i1'},{x:4540,y:300,w:180,h:16,id:'i2'},
    {x:5200,y:190,w:200,h:16,id:'i3'},{x:5880,y:40,w:220,h:16,id:'i4'},
    {x:7500,y:150,w:220,h:16,id:'c0'},{x:7820,y:290,w:180,h:16,id:'c1'},
    {x:8360,y:330,w:180,h:16,id:'c2'},{x:9050,y:140,w:180,h:16,id:'c3'},
    {x:9800,y:-70,w:220,h:16,id:'c4'},{x:10620,y:110,w:190,h:16,id:'c5'},
    {x:12380,y:-40,w:210,h:16,id:'a0'},{x:13140,y:130,w:190,h:16,id:'a1'},
    {x:13850,y:-60,w:190,h:16,id:'a2'},{x:14600,y:-290,w:220,h:16,id:'a3'},
    {x:15320,y:-70,w:200,h:16,id:'a4'},{x:16040,y:-320,w:220,h:16,id:'a5'},
    {x:17900,y:-170,w:220,h:16,id:'g0'},{x:18700,y:20,w:200,h:16,id:'g1'},
    {x:19450,y:-190,w:230,h:16,id:'g2'},{x:20240,y:80,w:210,h:16,id:'g3'},
    {x:21020,y:-130,w:220,h:16,id:'g4'},{x:21840,y:-320,w:220,h:16,id:'g5'},
    {x:23480,y:-130,w:220,h:16,id:'t0'},{x:24320,y:100,w:260,h:16,id:'t1'},
    {x:25100,y:-110,w:250,h:16,id:'t2'},{x:25940,y:-330,w:230,h:16,id:'t3'}
  ],

  /* A live relay powers its target. Some targets become collision surfaces, some remove a barrier. */
  relays: [
    {id:'r1',x:3400,y:330,range:1050,target:'gate1',label:'INTAKE LIFT'},
    {id:'r2',x:7340,y:300,range:1250,target:'bridge1',label:'WEST BRIDGE'},
    {id:'r3',x:9550,y:80, range:1300,target:'bridge2',label:'EAST BRIDGE'},
    {id:'r4',x:12320,y:100,range:1200,target:'lift1',label:'ARCHIVE LIFT'},
    {id:'r5',x:14500,y:-150,range:1250,target:'gate2',label:'RECORDS SHUTTER'},
    {id:'r6',x:17740,y:-20,range:1450,target:'tram1',label:'SERVICE TRAM'},
    {id:'r7',x:20240,y:240,range:1500,target:'gate3',label:'PLATFORM GATE'},
    {id:'r8',x:23280,y:20,range:1650,target:'lift2',label:'LUGGAGE LIFT'},
    {id:'r9',x:25820,y:-180,range:1750,target:'traction',label:'TRACTION RELAY'}
  ],
  repeaters: [
    {id:'p1',x:4160,y:440,relay:'r1'},{id:'p2',x:8150,y:430,relay:'r2'},{id:'p3',x:10380,y:250,relay:'r3'},
    {id:'p4',x:13200,y:260,relay:'r4'},{id:'p5',x:15320,y:60,relay:'r5'},{id:'p6',x:18820,y:180,relay:'r6'},
    {id:'p7',x:21200,y:20,relay:'r7'},{id:'p8',x:24280,y:260,relay:'r8'},{id:'p9',x:26800,y:20,relay:'r9'}
  ],
  gates: [
    {id:'gate1',x:4650,y:110,w:44,h:330},{id:'gate2',x:15610,y:-430,w:44,h:490},{id:'gate3',x:21830,y:-320,w:44,h:340}
  ],
  bridges: [
    {id:'bridge1',x:8540,y:430,w:380,h:22,onY:250},{id:'bridge2',x:10060,y:250,w:360,h:22,onY:100}
  ],
  lifts: [
    {id:'lift1',x:12620,y:260,w:180,h:20,onY:60},{id:'lift2',x:23850,y:260,w:180,h:20,onY:40}
  ],
  trams: [{id:'tram1',x0:18100,x1:19700,y:60,w:310,h:24,speed:150}],

  enemies: [
    {type:'sweeper',x:1260,y:390,range:250},{type:'ticket',x:3700,y:180,range:260},{type:'ram',x:5100,y:310,range:250},
    {type:'sweeper',x:7750,y:300,range:230},{type:'clamp',x:9160,y:-110,range:300},{type:'ticket',x:10800,y:-40,range:280},
    {type:'ram',x:12950,y:260,range:220},{type:'clamp',x:14650,y:-430,range:300},{type:'ticket',x:16100,y:-420,range:270},
    {type:'sweeper',x:18500,y:180,range:260},{type:'ticket',x:19550,y:-300,range:350},{type:'clamp',x:21100,y:-410,range:320},
    {type:'ram',x:23480,y:20,range:250},{type:'ticket',x:25000,y:-300,range:350},{type:'sweeper',x:26700,y:20,range:300}
  ],
  auditors: [
    {id:'au1',relay:'r3',speed:.13},{id:'au2',relay:'r5',speed:.15},{id:'au3',relay:'r7',speed:.19},{id:'au4',relay:'r9',speed:.23}
  ],

  cogs: [
    {id:'c0',x:720,y:180},{id:'c1',x:2100,y:290},{id:'c2',x:3650,y:145},{id:'c3',x:5260,y:120},
    {id:'c4',x:7600,y:80},{id:'c5',x:9040,y:70},{id:'c6',x:9890,y:-140},{id:'c7',x:12440,y:-110},
    {id:'c8',x:14000,y:-130},{id:'c9',x:16140,y:-390},{id:'c10',x:18020,y:-240},{id:'c11',x:19550,y:-260},
    {id:'c12',x:21120,y:-200},{id:'c13',x:24380,y:30},{id:'c14',x:26040,y:-400}
  ],
  fragments: [
    {id:1,x:2720,y:260,word:'BX-7'},{id:2,x:5980,y:-30,word:'DO'},{id:3,x:11500,y:30,word:'NOT'},
    {id:4,x:16600,y:-90,word:'CLOCK'},{id:5,x:22000,y:-390,word:'IN'}
  ],
  checkpoints: [
    {x:170,y:410,name:'DOME AIRLOCK',area:'dome'},{x:3180,y:330,name:'CIVIC INTAKE',area:'intake'},
    {x:6300,y:300,name:'INTAKE ROOF',area:'intake'},{x:7180,y:300,name:'RELAY COURT',area:'court'},
    {x:11100,y:100,name:'EAST TERRACE',area:'court'},{x:12080,y:100,name:'ARCHIVE DESK',area:'archive'},
    {x:16520,y:-20,name:'ARCHIVE EXIT',area:'archive'},{x:17600,y:-20,name:'GHOST PLATFORM',area:'ghost'},
    {x:23180,y:20,name:'FIRST TRAIN',area:'train'}
  ],
  terminals: [
    {id:'memory',x:16380,y:-20,kind:'memory'},{id:'board',x:22500,y:20,kind:'board'},{id:'reset',x:10920,y:100,kind:'reset'}
  ],
  triggers: [
    {x:80,say:[['PACK','Morning. The city has continued without us.'],['BIX','For eleven years.']]},
    {x:3020,say:[['SYSTEM','Employee BX-7. Shift status: absent.'],['PACK','That seems technically accurate.']]},
    {x:3340,say:[['PACK','Set me into the relay. You move; I hold the machine.'],['PACK','Too far away and the link will break.']]},
    {x:7100,say:[['PACK','Two bridge pivots. The court expects a very cooperative employee.']]},
    {x:12100,say:[['SYSTEM','Archive access requires active service link.']]},
    {x:14400,say:[['PACK','The records know your designation. I would like to know why.']]},
    {x:17600,say:[['PACK','The first train has been waiting on schedule. The passengers have not.']]},
    {x:20100,say:[['SYSTEM','Unauthorized relay path queued for inspection.'],['PACK','Ping sends the auditor back. Red sends it down another branch.']]},
    {x:23040,say:[['PACK','One traction relay, one closing train, and the usual poor timing.']]}
  ]
};
