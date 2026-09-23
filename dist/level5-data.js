/* Project Mayhem — Level 5 data: Skyline Foundry. Harder, stormier, still the same controls. */
(()=>{
'use strict';
window.L5DATA={
  world:{w:24400,h:720,yMin:-520,yMax:980,camY:-70,finishX:24100},
  start:{x:120,y:410},
  areas:[
    {name:'ROOFTOP ENTRY',objective:'Climb the maintenance ladders and hold the exposed edges',x0:0,x1:3300,camY:-50,killY:880},
    {name:'CRANE RUN',objective:'Hang from crane ledges, then hit the gate switch',x0:3300,x1:7200,camY:-120,killY:900},
    {name:'STORM DUCTS',objective:'Jump through changing airflow',x0:7200,x1:10900,camY:-150,killY:920},
    {name:'SECURITY GAUNTLET',objective:'Open the double lock and dodge the pulse rails',x0:10900,x1:15100,camY:-90,killY:900},
    {name:'SHUTDOWN RUN',objective:'Run before the shutdown wall catches you',x0:15100,x1:19300,camY:-80,killY:900,chase:1},
    {name:'STORM CORE',objective:'Read the warning lights, dodge the hunters, reach the beacon',x0:19300,x1:24400,camY:-110,killY:930}
  ],
  platforms:[
    [0,520,900,90],[980,492,440,80],[1540,456,360,80],[2020,426,470,80],[2700,390,520,80],
    [3380,470,440,80],[4050,420,340,80],[4700,370,320,80],[5300,424,440,80],[6060,376,460,80],[6750,330,360,80],
    [7320,500,380,80],[7920,448,300,80],[8460,390,320,80],[9050,336,300,80],[9600,430,420,80],[10300,360,390,80],
    [11020,490,540,80],[11840,434,360,80],[12480,382,360,80],[13180,444,430,80],[13920,388,360,80],[14620,332,420,80],
    [15360,500,420,80],[16080,456,330,80],[16680,408,350,80],[17280,356,320,80],[17840,410,520,90],
    [18480,468,430,80],[19200,410,390,80],[19940,492,430,80],[20680,430,340,80],[21320,370,360,80],[22020,446,420,80],[22740,392,340,80],[23380,340,300,80],[23920,410,460,90]
  ],
  ledges:[
    {x:1180,y:360,w:180,h:16},{x:2290,y:294,w:150,h:16},{x:4960,y:258,w:170,h:16},{x:8240,y:282,w:190,h:16},{x:12250,y:272,w:170,h:16},{x:14240,y:260,w:170,h:16},{x:17020,y:250,w:190,h:16},{x:18820,y:294,w:170,h:16},{x:20380,y:300,w:180,h:16},{x:21720,y:260,w:170,h:16},{x:23110,y:238,w:180,h:16}
  ],
  climbs:[
    {x:1154,y:360,w:52,h:132},{x:2312,y:294,w:52,h:132},{x:4992,y:258,w:52,h:112},
    {x:8308,y:282,w:52,h:166},{x:12282,y:272,w:52,h:162},{x:14272,y:260,w:52,h:128},{x:17052,y:250,w:52,h:158},{x:18852,y:294,w:52,h:174},{x:20412,y:300,w:52,h:192},{x:21752,y:260,w:52,h:110},{x:23142,y:238,w:52,h:154}
  ],
  movers:[
    {id:'m1',x:3180,y:520,w:260,h:32,dx:460,dy:-130,period:4.4,phase:.3},
    {id:'m2',x:4400,y:480,w:290,h:32,dx:0,dy:-120,period:4.1,phase:1.1},
    {id:'m3',x:5750,y:484,w:310,h:32,dx:0,dy:-118,period:3.8,phase:.6},
    {id:'m4',x:8780,y:520,w:220,h:32,dx:0,dy:-210,period:3.2,phase:1.4},
    {id:'m5',x:13620,y:504,w:290,h:32,dx:0,dy:-126,period:3.6,phase:.7},
    {id:'m6',x:15680,y:590,w:240,h:32,dx:420,dy:-90,period:3.4,phase:0},
    {id:'m7',x:18920,y:560,w:230,h:32,dx:480,dy:-150,period:3.25,phase:.5},{id:'m8',x:21100,y:530,w:220,h:32,dx:430,dy:-190,period:3.0,phase:1.2},{id:'m9',x:22880,y:510,w:230,h:32,dx:470,dy:-160,period:2.85,phase:.2}
  ],
  collapses:[
    {id:'c1',x:2520,y:430,w:150,h:26},{id:'c2',x:6990,y:365,w:150,h:26},{id:'c3',x:10070,y:418,w:160,h:26},
    {id:'c4',x:15070,y:408,w:150,h:26},{id:'c5',x:16380,y:472,w:140,h:26},{id:'c6',x:17680,y:380,w:145,h:26},{id:'c7',x:19720,y:438,w:150,h:26},{id:'c8',x:21840,y:404,w:150,h:26},{id:'c9',x:23720,y:376,w:145,h:26}
  ],
  gusts:[
    {x:1700,y:230,w:520,h:360,dir:1,power:260,period:3.6,on:1.7,phase:.2},
    {x:7600,y:230,w:700,h:410,dir:-1,power:300,period:3.2,on:1.6,phase:1.1},
    {x:8800,y:170,w:680,h:430,dir:1,power:330,period:3.4,on:1.5,phase:.6},
    {x:10230,y:160,w:520,h:390,dir:-1,power:280,period:3.0,on:1.4,phase:1.7},
    {x:16600,y:190,w:580,h:410,dir:1,power:320,period:3.1,on:1.4,phase:.5},
    {x:19500,y:170,w:620,h:430,dir:-1,power:350,period:2.9,on:1.35,phase:.8},{x:21600,y:150,w:650,h:450,dir:1,power:370,period:2.75,on:1.25,phase:.3},{x:23200,y:130,w:570,h:460,dir:-1,power:380,period:2.6,on:1.2,phase:1.1}
  ],
  electrics:[
    {x:1340,y:378,w:34,h:118,period:2.7,on:1.05,tell:.45,phase:.1},
    {x:3860,y:286,w:34,h:150,period:2.4,on:.9,tell:.4,phase:.8},
    {x:6540,y:236,w:34,h:150,period:2.2,on:.9,tell:.38,phase:1.2},
    {x:9360,y:220,w:34,h:200,period:2.5,on:1.0,tell:.45,phase:.4},
    {x:11670,y:300,w:34,h:160,period:2.15,on:.85,tell:.38,phase:.2},
    {x:12880,y:245,w:34,h:160,period:2.1,on:.85,tell:.38,phase:1.0},
    {x:14490,y:188,w:34,h:170,period:2.0,on:.78,tell:.35,phase:.7},
    {x:17490,y:205,w:34,h:180,period:1.9,on:.72,tell:.35,phase:.2},
    {x:19100,y:250,w:34,h:190,period:1.85,on:.7,tell:.34,phase:.6},{x:20880,y:210,w:34,h:200,period:1.8,on:.68,tell:.32,phase:1.1},{x:22480,y:200,w:34,h:190,period:1.7,on:.62,tell:.3,phase:.2},{x:23620,y:165,w:34,h:205,period:1.65,on:.6,tell:.3,phase:.9}
  ],
  gates:[
    {id:'cargoA',x:6170,y:376,w:88,h:190,need:'swA',seconds:12},
    {id:'securityA',x:13380,y:444,w:88,h:210,need:'swB',seconds:12},
    {id:'securityB',x:14730,y:332,w:88,h:220,need:'swC',seconds:12}
  ],
  switches:[
    {id:'swA',x:5740,y:306,w:46,h:48,label:'CARGO GATE'},
    {id:'swB',x:12240,y:318,w:46,h:48,label:'LEFT LOCK'},
    {id:'swC',x:14060,y:262,w:46,h:48,label:'RIGHT LOCK'}
  ],
  drones:[
    {x:1880,y:290,range:360,speed:95,phase:.2},{x:5220,y:234,range:300,speed:110,phase:1.1},{x:8280,y:250,range:380,speed:120,phase:.7},
    {x:12080,y:292,range:360,speed:130,phase:1.6},{x:13880,y:252,range:330,speed:135,phase:.4},{x:16850,y:275,range:360,speed:150,phase:.9},{x:19900,y:274,range:300,speed:155,phase:.4},{x:22200,y:250,range:340,speed:165,phase:1.3}
  ],
  stalkers:[
    {x:18720,y:468,range:180,speed:125,period:3.8,warn:.7,charge:1.0,phase:.2},{x:20220,y:492,range:170,speed:135,period:3.5,warn:.65,charge:1.05,phase:1.1},
    {x:21600,y:370,range:150,speed:145,period:3.25,warn:.62,charge:1.05,phase:.5},{x:22930,y:392,range:150,speed:155,period:3.0,warn:.58,charge:1.0,phase:1.6}
  ],
  sentinels:[
    {x:19480,y:365,dir:1,reach:620,period:3.4,warn:.8,fire:.55,phase:.3},{x:21180,y:350,dir:-1,reach:650,period:3.15,warn:.74,fire:.55,phase:1.4},
    {x:22680,y:350,dir:1,reach:680,period:2.95,warn:.7,fire:.52,phase:.8},{x:23820,y:330,dir:-1,reach:620,period:2.75,warn:.66,fire:.5,phase:1.9}
  ],
  cogs:[
    {x:740,y:420},{x:1220,y:300},{x:2180,y:245},{x:3440,y:374},{x:4985,y:202},{x:6120,y:296},{x:7040,y:252},{x:8160,y:235},
    {x:9250,y:278},{x:10420,y:302},{x:12260,y:224},{x:13250,y:334},{x:14330,y:214},{x:16040,y:372},{x:17120,y:198}
  ],
  checkpoints:[
    {x:120,y:410,name:'SKY DOCK'},{x:3440,y:360,name:'CRANE START'},{x:7600,y:390,name:'DUCT ENTRY'},{x:11220,y:390,name:'SECURITY'},{x:15380,y:390,name:'BEACON RUN'},{x:19420,y:330,name:'STORM CORE'}
  ],
  triggers:[
    {x:280,s:'PACK',t:'Skyline Foundry. Hold UP on a ladder to climb, LEFT or RIGHT to step off, JUMP to leap away. Jump while hanging to pull up; DOWN drops.'},
    {x:1660,s:'PACK',t:'Wind gusts are on timers. Jump with them, not against them.'},
    {x:3600,s:'BIX',t:'That cargo lift looks angry.'},{x:5740,s:'PACK',t:'Switch opens the gate briefly. Brief is doing heavy work there.'},
    {x:7600,s:'PACK',t:'Duct fans ahead. Your hair has filed a complaint.'},{x:11200,s:'SYSTEM',t:'Security route armed.'},
    {x:15120,s:'PACK',t:'Shutdown wall behind us. I recommend leaving dramatically.'},
    {x:19320,s:'SYSTEM',t:'Storm Core armed. Red stalkers charge after their warning flash. Sentinels fire after locking on.'},{x:22500,s:'PACK',t:'Final grid. Watch the lights, then move.'}
  ]
};
})();
