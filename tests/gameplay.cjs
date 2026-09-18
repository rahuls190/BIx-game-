const fs=require('fs'),vm=require('vm'),assert=require('assert');let clock=0;
const noop=()=>{},ctx=new Proxy({},{get:()=>noop});
const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},addEventListener:noop,getBoundingClientRect:()=>({width:1280,height:720}),getContext:()=>ctx,focus:noop});const els={};const sandbox={console,Math,performance:{now:()=>clock*1000},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop},Image:class{},addEventListener:noop,devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop};sandbox.window=sandbox;
let src=fs.readFileSync('dist/game.js','utf8').replace('resize();reset(1);requestAnimationFrame(frame);','resize();reset(1);globalThis.qa={P,K,platforms,ledges,movers,switches,cogList,vents,lasers,spikes,move,update,moving,reset,start,ventHeight,crate,socket,getState:()=>({done,breakers,power,cogs,checkpoint}),setPower:()=>power=1};');vm.createContext(sandbox);vm.runInContext(src,sandbox);const q=sandbox.qa;q.start();
function tick(n=1){for(let i=0;i<n;i++){clock+=1/120;q.update(1/120)}}
function place(x,y){q.reset(1);Object.assign(q.P,{x,y:y-q.P.h,ground:1,vx:0,vy:0,inv:999});Object.keys(q.K).forEach(k=>q.K[k]=0);q.setPower()}
// Test every upper ledge with an actual held jump from the platform underneath.
let landed=0;for(const l of q.ledges){const floor=q.platforms.find(p=>l[0]>=p[0]&&l[0]+42<=p[0]+p[2]&&l[1]<p[1]);if(!floor)continue;place(l[0]+20,floor[1]);q.K.jump=1;q.P.buffer=.16;let ok=false;for(let i=0;i<180;i++){tick();if(q.P.ground&&Math.abs(q.P.y+q.P.h-l[1])<1){ok=true;break}}assert(ok,`unreachable ledge ${l}`);landed++}
place(700,610);q.P.buffer=.16;q.K.jump=0;let minY=q.P.y;for(let i=0;i<120;i++){tick();minY=Math.min(minY,q.P.y)}assert(610-96-minY>140,'tap jump cannot reach first ledge');
// Every adjacent main platform: numerical ballistic envelope with generous landing width.
for(let i=1;i<q.platforms.length;i++){const a=q.platforms[i-1],b=q.platforms[i],rise=a[1]-b[1],disc=780**2-2*1450*rise;assert(disc>0,'main rise '+i);const t=(780+Math.sqrt(disc))/1450;assert(b[0]-(a[0]+a[2])+42<285*t-35,'main gap '+i)}
// Ground ignores down; one-way ledges support deliberate dropping.
place(300,610);q.K.down=1;tick(60);assert(q.P.ground&&q.P.y+96===610,'down falls through floor');
// Moving platform must carry feet throughout a full cycle.
place(0,610);let m=q.moving(clock)[1];Object.assign(q.P,{x:m.x+40,y:m.y-96,ground:1,support:m});tick(240);m=q.moving(clock)[1];assert(Math.abs(q.P.y+96-m.y)<.1,'moving platform lost rider');
// Mantling finishes fully inside the upper surface.
place(630,610);Object.assign(q.P,{x:643,y:451,face:1,hang:1,hangAt:clock,hangRect:{x:680,y:470,w:150,h:20,ledge:1},ground:0});tick(100);assert(q.P.ground&&q.P.x>=680&&Math.abs(q.P.y+96-470)<1,'mantle landing');
// Battery can reach the socket with two deliberate shoves.
q.reset(1);Object.keys(q.K).forEach(k=>q.K[k]=0);for(let n=0;n<2;n++){Object.assign(q.P,{x:q.crate.x-50,y:514,vx:0,vy:0,ground:1,inv:999,face:1});q.K.interact=1;tick(180)}assert(q.getState().power,'battery relay');
// Every checkpoint must survive a respawn and settle on its real floor.
for(const [at,top] of [[3510,550],[8670,610],[12960,540],[15170,610]]){place(at,top);tick();q.reset(0);const falls=q.P.falls;tick(180);assert(q.P.falls===falls&&q.P.ground,'checkpoint survival '+at)}
// Checkpoint restore and all three breaker interactions, exit completion.
place(8700,610);tick();q.reset(0);assert(q.P.x===8640,'checkpoint restore');q.setPower();for(const sw of q.switches){Object.assign(q.P,{x:sw.x-21,y:sw.y-42,vx:0,vy:0,ground:0,inv:999});q.K.interact=1;tick();}assert(q.getState().breakers===3,'breakers');Object.assign(q.P,{x:17730,y:510,vx:0,vy:0,inv:999});tick();assert(q.getState().done,'exit');
console.log(JSON.stringify({upperLedgesLanded:landed,mainPlatformConnections:q.platforms.length-1,tapJump:true,groundDropSafety:true,movingPlatformRide:true,checkpoint:true,threeBreakers:true,exit:true}));
