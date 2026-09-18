// Engine fixture for tests/level2-engine.cjs - NOT the shipped level.
// A tiny one-area level that exercises every system dist/level2.js supports,
// so the engine can be regression-tested independently of the real geometry.
window.L2DATA={
world:{w:2200,yMin:0,yMax:720},
areas:[{id:'smoke',name:'SMOKE BAY',objective:'Walk right and poke everything',x0:0,x1:2200,vertical:false}],
platforms:[[0,610,900,110],[980,560,300,160],[1360,610,840,110]],
ledges:[[500,470,150,22],[1050,430,140,20]],
movers:[{x:700,y:400,w:150,h:22,a:'y',r:80,p:0}],
pipes:[{x:1180,y:360,w:120,h:18}],
vents:[{x:1010,y:560,p:0}],
lasers:[{x:1520,y0:220,y1:610,p:0,pair:0},{x:1620,y0:220,y1:610,p:0,pair:1}],
belts:[{x:1700,y:610,w:260,dir:-1}],
lava:[{x:900,y:660,w:80}],
cogs:[{x:575,y:420},{x:1120,y:380}],
checkpoints:[{x:120,y:610,name:'SMOKE START',area:'smoke'},{x:1400,y:610,name:'SMOKE MID',area:'smoke'}],
terminals:[{x:1240,y:560,label:'OPEN',does:'gate'}],
valves:[{x:300,y:610,id:1},{x:420,y:610,id:2}],
shutters:[{x:1440,y:610,id:1},{x:1480,y:610,id:2},{x:1560,y:610,id:3}],
gates:[{x:1340,y:470,w:16,h:140,needs:'valves'}],
enemies:[{type:'crawler',x:400,y:610,range:120,dir:1},{type:'spitter',x:1290,y:520,dir:-1},{type:'wasp',x:1000,y:300,speed:40}],
pickups:[{type:'cell',x:250,y:580}],
sockets:[{x:1900,y:580}],
triggers:[{x:200,s:'PACK',t:'Smoke test. Try not to enjoy it.'}],
exit:{x:2050,y:560}
};
