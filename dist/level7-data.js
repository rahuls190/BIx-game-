/* Project Mayhem, Level 7: Clocking In. Geometry and authored encounter data. */
window.L7DATA = {
  world: { w: 34000, h: 720, yMin: -760, yMax: 1300, finishX: 33720 },
  start: { x: 150, y: 410 },

  areas: [
    { id:'dome',    name:'DOME EXIT',      x0:0,     x1:3000,  objective:'Leave the dome and find the civic line', vertical:true, killY:930 },
    { id:'intake',  name:'CIVIC INTAKE',   x0:3000,  x1:7000,  objective:'Link Pack to open the intake route',      vertical:true, killY:960 },
    { id:'court',   name:'RELAY COURT',    x0:7000,  x1:12000, objective:'Power both bridge pivots',               vertical:true, killY:960 },
    { id:'archive', name:'ARCHIVE SPINE',  x0:12000, x1:17500, objective:'Climb the records stack and recover BX-7',vertical:true, killY:980 },
    { id:'ghost',   name:'GHOST PLATFORM', x0:17500, x1:23000, objective:'Ride the tram and keep the signal alive',vertical:true, killY:980 },
    { id:'train',   name:'FIRST TRAIN',    x0:23000, x1:27500, objective:'Open the transfer shutter and chase the departing train',vertical:true, killY:980 },
    { id:'deadhead',name:'DEADHEAD LINE',  x0:27500, x1:34000, objective:'Climb above the empty line and reach the first train',vertical:true, killY:1300 },
  ],

  /* [x, walking top, width, visible depth, material] */
  platforms: [
    [80,410,900,170,'dome'],[1080,390,680,170,'dome'],[1880,360,520,180,'dome'],[2500,330,700,190,'dome'],
    [3260,330,620,170,'intake'],[4020,440,720,180,'intake'],[4860,310,620,180,'intake'],[5600,180,600,190,'intake'],[6320,300,820,180,'intake'],
    [7200,300,700,180,'court'],[8060,430,520,180,'court'],[8760,250,520,180,'court'],[9480,80,620,180,'court'],[10260,250,560,180,'court'],[11000,100,900,180,'court'],
    [12040,100,620,180,'archive'],[12820,260,560,180,'archive'],[13540,60,560,180,'archive'],[14240,-150,620,180,'archive'],[15020,60,520,180,'archive'],[15700,-180,620,180,'archive'],[16480,-20,1020,180,'archive'],
    [17540,-20,720,180,'ghost'],[18380,180,600,180,'ghost'],[19140,-40,620,180,'ghost'],[19920,240,600,180,'ghost'],[20700,20,620,180,'ghost'],[21480,-170,620,180,'ghost'],[22260,20,820,180,'ghost'],
    [23140,20,740,180,'train'],[24040,260,600,180,'train'],[24820,40,600,180,'train'],[25600,-180,700,180,'train'],[26500,20,900,180,'train'],
    [27600,-120,680,130,'deadhead'],[28440,80,600,130,'deadhead'],[29200,-100,620,130,'deadhead'],[30000,-280,680,130,'deadhead'],
    [30850,-80,600,130,'deadhead'],[31620,-260,620,130,'deadhead'],[32420,-60,600,130,'deadhead'],[33200,-220,700,130,'deadhead']
  ],

  // Optional rooms above or below the public route. Every entrance has a return door.
  secretPlatforms: [
    [2050,-350,500,70,'dome'],[13640,-550,480,70,'archive'],[30950,500,450,70,'deadhead']
  ],
  hiddenDoors: [
    {id:'closet-in',x:2160,y:360,toX:2220,toY:-350,room:'INSPECTION CLOSET',hint:'A draft comes through the wall seam.'},
    {id:'closet-out',x:2300,y:-350,toX:2160,toY:360,room:'INSPECTION CLOSET',returnDoor:true},
    {id:'records-in',x:13800,y:60,toX:13880,toY:-550,room:'COLD RECORDS',hint:'The archive wall sounds hollow.'},
    {id:'records-out',x:13940,y:-550,toX:13800,toY:60,room:'COLD RECORDS',returnDoor:true},
    {id:'zero-in',x:31060,y:-80,toX:31160,toY:500,room:'PLATFORM ZERO',hint:'A sealed service door hums below the timetable.'},
    {id:'zero-out',x:31270,y:500,toX:31060,toY:-80,room:'PLATFORM ZERO',returnDoor:true}
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
    {x:25100,y:-110,w:250,h:16,id:'t2'},{x:25940,y:-330,w:230,h:16,id:'t3'},
    {x:27840,y:-290,w:210,h:16,id:'h0'},{x:28800,y:-90,w:200,h:16,id:'h1'},
    {x:29640,y:-260,w:220,h:16,id:'h2'},{x:30460,y:-440,w:210,h:16,id:'h3'},
    {x:31320,y:-220,w:200,h:16,id:'h4'},{x:32020,y:-410,w:220,h:16,id:'h5'},
    {x:32800,y:-210,w:200,h:16,id:'h6'}
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
    {id:'r9',x:25820,y:-180,range:1750,target:'gate4',label:'TRANSFER SHUTTER'},
    {id:'r10',x:32520,y:-60,range:1450,target:'traction',label:'TRACTION RELAY'}
  ],
  repeaters: [
    {id:'p1',x:4160,y:440,relay:'r1'},{id:'p2',x:8150,y:430,relay:'r2'},{id:'p3',x:10380,y:250,relay:'r3'},
    {id:'p4',x:13200,y:260,relay:'r4'},{id:'p5',x:15320,y:60,relay:'r5'},{id:'p6',x:18820,y:180,relay:'r6'},
    {id:'p7',x:21200,y:20,relay:'r7'},{id:'p8',x:24280,y:260,relay:'r8'},{id:'p9',x:26800,y:20,relay:'r9'},
    {id:'p10',x:33400,y:-220,relay:'r10'}
  ],
  gates: [
    {id:'gate1',x:4650,y:110,w:44,h:330},{id:'gate2',x:15610,y:-430,w:44,h:490},{id:'gate3',x:21830,y:-320,w:44,h:340},
    {id:'gate4',x:27390,y:-250,w:44,h:270}
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
    {type:'ram',x:23480,y:20,range:250},{type:'ticket',x:25000,y:-300,range:350},{type:'sweeper',x:26700,y:20,range:300},
    {type:'sweeper',x:28000,y:-120,range:180},{type:'ticket',x:28600,y:-80,range:210},
    {type:'ram',x:29300,y:-100,range:170},{type:'clamp',x:30100,y:-500,range:180},
    {type:'sweeper',x:30950,y:-80,range:190},{type:'ticket',x:31720,y:-360,range:220},
    {type:'ram',x:32500,y:-60,range:180},{type:'clamp',x:33500,y:-480,range:170},
    {type:'ticket',x:31150,y:410,range:90,ambushAt:30900}
  ],
  blackouts: [
    {x0:8500,x1:9000,seconds:2.5,line:'The court just lost its lights.'},
    {x0:28800,x1:29400,seconds:3,line:'The timetable says this platform does not exist.'},
    {x0:32100,x1:32600,seconds:2.5,line:'Emergency lighting. That usually means we are close.'}
  ],
  auditors: [
    {id:'au1',relay:'r3',speed:.13},{id:'au2',relay:'r5',speed:.15},{id:'au3',relay:'r7',speed:.19},{id:'au4',relay:'r9',speed:.23}
  ],

  cogs: [
    {id:'c0',x:720,y:180},{id:'c1',x:2100,y:290},{id:'c2',x:3650,y:145},{id:'c3',x:5260,y:120},
    {id:'c4',x:7600,y:80},{id:'c5',x:9040,y:70},{id:'c6',x:9890,y:-140},{id:'c7',x:12440,y:-110},
    {id:'c8',x:14000,y:-130},{id:'c9',x:16140,y:-390},{id:'c10',x:18020,y:-240},{id:'c11',x:19550,y:-260},
    {id:'c12',x:21120,y:-200},{id:'c13',x:24380,y:30},{id:'c14',x:26040,y:-400},
    {id:'c15',x:2260,y:-420},{id:'c16',x:13900,y:-620},{id:'c17',x:31180,y:430},
    {id:'c18',x:29780,y:-330},{id:'c19',x:33360,y:-300}
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
    {x:23180,y:20,name:'FIRST TRAIN',area:'train'},
    {x:27700,y:-120,name:'TRANSFER LINE',area:'deadhead'},
    {x:30100,y:-280,name:'UPPER SIGNAL',area:'deadhead'},
    {x:32500,y:-60,name:'DEADHEAD PLATFORM',area:'deadhead'}
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
    {x:23040,say:[['PACK','The train just pulled away. There is a transfer line above us.']]},
    {x:27520,say:[['SYSTEM','Service route: deadhead. No passengers expected.'],['BIX','For once, that sounds honest.']]},
    {x:29100,say:[['PACK','Platform Zero is not on the public map. I can still hear a relay behind that wall.']]},
    {x:31900,say:[['PACK','The train is looping back. We get one more chance to board.']]}
  ]
};
