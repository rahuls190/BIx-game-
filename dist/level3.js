// Level 03: Magnetic Personality (the Yard, Crusher Bay, the Shaft, the Polarity Lab, the Ore Train, the High Vault and the Archive).
// Forked from level2.js: same physics, camera, checkpoints and Pack catch. Geometry comes from level3-data.js, the glove rules from
// level3-glove.js, crawler and spitter behaviour from level2-enemies.js, and the borrowed Bix/Pack/enemy art from level2-art.js.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const ui=Object.fromEntries(['start','complete','dialogue','speaker','line','prompt','zone','objective','cogCount','finalCogs','finalTime','finalFalls','resultLine','medal','saveNote','lockNote','touchControls','packCharge','packChargeLabel','heatBar','polLabel','pips','tierLabel','startTier','gloveHud'].map(id=>[id,$(id)]));
const D=window.L3DATA,ART=window.L2ART,EN=window.L2ENEMIES,GL=window.L3GLOVE;
function fatal(msg){x.setTransform(1,0,0,1,0,0);x.fillStyle='#071217';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ff8b55';x.font='600 20px system-ui';x.textAlign='center';x.fillText(msg,c.width/2,c.height/2)}
if(!D||!ART||!EN||!GL){fatal('Level 3 failed to load: '+[!D&&'level3-data.js',!ART&&'level2-art.js',!EN&&'level2-enemies.js',!GL&&'level3-glove.js'].filter(Boolean).join(', '));return}

const H=720,GRAV=1450,JUMP=780,RUN=285,COG_TOTAL=D.cogs.length;
const HANG_SPEED=170,CLING_UP=120,CLING_DOWN=180,PAD_V=1100,NET_V=900,CRATE_V=160,CRATE_RANGE=320;
const CRUMBLE=.8,CRUMBLE_BACK=2.5,PRESS_HEAD=96,PRESS_UP=180;
const BLUE='#5fd4ff',RED='#ff8f6a';
const K={left:0,right:0,down:0,up:0,jump:0,interact:0,blue:0,red:0,shield:0};
let viewW=1280,dpr=1,running=0,done=0,last=0,camX=0,camY=0,cogs=0,startTime=0,msgTime=0,msgLock=0,shake=0,flash=0;
let charge=1,gloveOn=0,prevShield=0,padCD=0,tether=null,tetherUsed=0,parryFx=0,padFx=-9,netFx=-9;
let G=GL.make(0),crates=[],plates=[],reflected=[];
const TR=D.train,STEER=D.steer,CORE_V=240;        // cores move at 240 px/s: the longest push (core B, 820 px) is 3.4 s, 68% heat, well under the 85% warning
let terms=[],cores=[],seated=new Set(),blocks=[],chuteN={},drones=[],train=null,isl=[],flight=null;
let doorHold=0,doorNear=0,doorT=0,gflash=0,recoil=0,prevRed=0,inArchive=0,archiveRead=[0,0,0],archiveT=0,gateAnim=0,coreFx=-9;

const img=s=>{const a=new Image;a.src='./assets/'+s;return a};
const IMG={};for(const k of Object.keys(ART))IMG[k]=img(k);
// realistic Level 3 art: atlases + a name -> crop table written by design/process_level3_assets.py (window.L3ART)
const A=window.L3ART||{atlases:{},spr:{},bg:{}};
const ATL={};for(const k of Object.keys(A.atlases))ATL[k]=img(k);
const BGI={};for(const k of Object.keys(A.bg))BGI[k]=img(A.bg[k].file);
const ready=im=>im&&im.complete&&im.naturalWidth;
// draw a named sprite into the world rectangle (px,py,w,h = top-left); flip -1 mirrors it about its centre
function blit(name,px,py,w,h,flip,alpha){
  const s=A.spr[name],im=s&&ATL[s[0]];if(!ready(im))return 0;
  x.save();if(alpha!==undefined)x.globalAlpha=alpha;x.translate(SX(px+w/2),SY(py));if(flip<0)x.scale(-1,1);
  x.drawImage(im,s[1],s[2],s[3],s[4],-w/2,0,w,h);x.restore();return 1;
}
const sh=name=>A.spr[name]?A.spr[name][4]:0,sw=name=>A.spr[name]?A.spr[name][3]:0;
// an enemy frame scaled so that frame 0 is `height` tall, standing on `bottom`; a left-mounted spitter keeps its wall bracket fixed
function blitFrame(prefix,cell,cx,bottom,height,flip,mount){
  const n=prefix+cell,r0=prefix+0;if(!A.spr[n]||!A.spr[r0])return 0;
  const k=height/sh(r0),w=sw(n)*k,h=sh(n)*k,ox=mount?sw(r0)*k/2-w/2:0;
  return blit(n,cx-w/2+(flip<0?-ox:ox),bottom-h,w,h,flip);
}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const SX=v=>v-camX,SY=v=>v-camY;
const narrow=()=>viewW<700;
const leadTarget=()=>narrow()?(P.vx>40?.14:P.vx<-40?.55:.24):.42;
let lead=.42;
const camLead=()=>lead;
const flatCamY=()=>areaAt(P.x).camY??D.world.camY??80;       // an area may set its own flat camera height (the yard shows the girder above its raised deck)

const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,oldGround:0,coyote:0,buffer:0,face:1,falls:0,anim:0,land:0,hang:0,hangRect:null,climb:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0,gird:null,cling:null,latchCD:0};
const pack={x:0,y:0};
let checkpoint=D.checkpoints[0]||{x:120,y:400,name:'START'};
const seen=new Set();
let enemies=[],packMode=0,packUntil=0,packTarget=null;

// Best cogs of Levels 1 and 2 decide the shield tier. ?banked=N is a test switch for trying the tiers.
function bankedCogs(){
  try{const q=new URLSearchParams(location.search).get('banked');if(q!==null&&q!==''&&isFinite(+q))return Math.max(0,Math.min(26,Math.floor(+q)))}catch(e){}
  try{const p=window.Mayhem&&window.Mayhem.getProgress&&window.Mayhem.getProgress();if(p&&p.levels)return(p.levels.level1?.bestCogs||0)+(p.levels.level2?.bestCogs||0)}catch(e){}
  return 0;
}

// ---- drawing helpers -------------------------------------------------------
function sprite(plate,i,cx,bottom,height,flip,ref){
  const a=ART[plate],im=IMG[plate];if(!a||!im||!im.complete||!im.naturalWidth)return 0;
  const r=a.cells[i];if(!r)return 0;
  const rc=ref!==undefined?a.cells[ref]:null,s=rc?height/rc[3]:0;
  const w=s?r[2]*s:height*r[2]/r[3],h=s?r[3]*s:height;
  x.save();x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);
  x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,-h,w,h);x.restore();return 1;
}
function box(px,py,w,h,f,s){x.fillStyle=f;x.fillRect(SX(px),SY(py),w,h);if(s){x.strokeStyle=s;x.lineWidth=2;x.strokeRect(SX(px),SY(py),w,h)}}

// ---- world queries ---------------------------------------------------------
const onDeck=r=>D.platforms.some(p=>Math.abs(p[1]-r.y)<=4&&r.x+r.w>p[0]&&r.x<p[0]+p[2]);
const crateTop=k=>D.platforms[k.deck][1]-k.h;
function solids(){
  const out=[];
  for(const p of D.platforms)out.push({x:p[0],y:p[1],w:p[2],h:78});
  D.ledges.forEach((l,i)=>{if(plates[i]&&plates[i].gone>0)return;out.push({x:l.x,y:l.y,w:l.w,h:l.h,ledge:1,plate:i,t:l.t})});
  crates.forEach((k,i)=>out.push({x:k.x,y:k.y,w:k.w,h:k.h,crate:i}));
  if(train)out.push({x:train.x,y:TR.y,w:TR.len,h:78,ledge:1,mv:'bed'});          // the ore-train bed and the vault islands move: `mv` names the mover that carries whoever stands on it
  for(const v of isl)out.push({x:v.x,y:v.y,w:v.w,h:v.h,ledge:1,mv:v.id});
  if(gateBlocking())for(const g of D.gates||[])out.push({x:g.x,y:g.y-g.h,w:g.w,h:g.h,gate:1});
  for(const b of blocks)if(b.landed)out.push({x:b.x,y:b.y,w:b.w,h:b.h,blk:1});
  return out;
}
function areaAt(px){let a=D.areas[0];for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;return a}
const isVertical=a=>!!(a&&a.vertical);
const downdraftAt=()=>{for(const z of (D.downdraft||[])){const cx=P.x+P.w/2,cy=P.y+P.h/2;if(cx>=z.x0&&cx<=z.x1&&cy>=z.y0&&cy<=z.y1)return z.extra}return 0};

// ---- messages and checkpoints ---------------------------------------------
function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.45}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'PACK SPENT'}
function setCP(cp){checkpoint=cp;setCharge(1);GL.refill(G);toast('SYSTEM',`Checkpoint · ${cp.name}`,1.2,1)}
function setPackAction(cell,seconds,now,target=null){packMode=cell;packUntil=now+seconds;packTarget=target}

function spawnEnemies(){
  const tops=[...D.platforms.map(p=>({x:p[0],y:p[1],w:p[2]})),...D.ledges];
  return (D.enemies||[]).map(e=>{
    const cfg={...e};
    if(e.type==='crawler'){
      const top=tops.find(s=>Math.abs(s.y-e.y)<=3&&e.x>=s.x-160&&e.x<=s.x+s.w+160);
      if(top){cfg.y=top.y-EN.consts.SIZE.crawler[1];
        const bw=EN.consts.SIZE.crawler[0],r0=EN.make('crawler',cfg).range;
        cfg.range=Math.max(20,Math.min(r0,cfg.x-top.x,top.x+top.w-bw-cfg.x))}
    }
    return EN.make(e.type,cfg);
  });
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gateBlocking=()=>!(D.gates||[]).every(g=>g.needs.every(n=>seated.has(n)));
const islandAt=(v,now)=>{const a=now*6.283185/v.per+v.ph;return{x:v.cx-v.w/2+v.rx*Math.cos(a),y:v.cy+v.ry*Math.sin(a)}};
// Areas 4-6 state. A full restart clears everything; a respawn keeps the cores that are already seated (so a puzzle you solved stays solved)
function buildAreas(full){
  if(full){seated=new Set();archiveRead=[0,0,0];archiveT=0}
  terms=(D.terminals||[]).map(()=>({t:0}));
  cores=(D.cores||[]).map(k=>({id:k.id,x:seated.has(k.socket)?D.sockets.find(q=>q.id===k.socket).x:k.start}));
  gateAnim=gateBlocking()?0:1;
  blocks=[];chuteN={};
  drones=(D.drones||[]).map(d=>({...d,x:(d.x0+d.x1)/2,y:d.y,dead:0}));
  const now=performance.now()/1000;
  isl=(D.islands||[]).map(v=>{const q=islandAt(v,now);return{id:v.id,t:v.t,w:v.w,h:26,x:q.x,y:q.y,dx:0,dy:0}});
  train={x:TR.start,v:0,t:0,run:0,wait:0,done:0,riding:0,dx:0,boarded:0,vela:0,things:[],obs:TR.obs.map(o=>({...o,st:0,t:0,hold:0,ok:0}))};
  flight=null;doorHold=0;doorNear=0;doorT=0;gflash=0;recoil=0;inArchive=0;
}
function buildWorldState(full){
  buildAreas(full);
  crates=(D.crates||[]).map((k,i)=>({i,x:k.x,y:crateTop(k),w:k.w,h:k.h,deck:k.deck,x0:k.x0,x1:k.x1}));
  plates=D.ledges.map(()=>({t:0,armed:0,gone:0}));
  reflected=[];
}
function reset(full=1){
  Object.assign(P,{x:full?(D.checkpoints[0]||{}).x??120:checkpoint.x,y:(full?(D.checkpoints[0]||{}).y??400:checkpoint.y)-P.h,
    vx:0,vy:0,ground:0,coyote:0,buffer:0,falls:full?0:P.falls+1,hang:0,hangRect:null,climb:0,support:null,dropTime:0,jumpTime:0,grabCD:.32,inv:.75,gird:null,cling:null,latchCD:0});
  lead=leadTarget();pack.x=P.x-65;pack.y=P.y+18;camX=Math.max(0,P.x-viewW*camLead());
  camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):flatCamY();
  tether=null;padCD=0;
  enemies=spawnEnemies();buildWorldState(full);
  G.heat=0;G.overloaded=false;G.lock=0;G.shieldT=0;GL.refill(G);
  if(full){
    cogs=0;done=0;gloveOn=0;tetherUsed=0;setCharge(1);
    G=GL.make(bankedCogs());ui.tierLabel.textContent=G.tier.name;ui.startTier.textContent=`Shield: ${G.tier.name} · ${G.banked} banked cogs`;
    startTime=performance.now();checkpoint=D.checkpoints[0]||checkpoint;seen.clear();
    D.cogs.forEach(v=>v.got=0);(D.triggers||[]).forEach(v=>v.used=0);
    setPackAction(7,1,performance.now()/1000);
    ui.complete.classList.add('hidden');
    // ?at=N (a test switch, like ?banked=N): start at checkpoint N with the glove
    try{const q=new URLSearchParams(location.search).get('at'),cp=q!==null&&D.checkpoints[+q];
      if(cp){checkpoint=cp;seen.add(cp);gloveOn=1;Object.assign(P,{x:cp.x,y:cp.y-P.h});camX=Math.max(0,P.x-viewW*camLead());
        camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):flatCamY()}}catch(e){}
  }
  ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
}

// Level 3 opens once Levels 1 and 2 have banked more than 12 cogs (progress.js has the rule; this is the same test, on the same numbers)
const UNLOCK=(window.MayhemProgress&&window.MayhemProgress.LEVEL3_UNLOCK_COGS)||13;
const locked=()=>bankedCogs()<UNLOCK;
function refreshLock(){
  const l=locked(),b=$('startButton');
  if(b)b.disabled=l;
  if(ui.lockNote){ui.lockNote.hidden=!l;ui.lockNote.textContent=l?`Level 3 is locked. Bank more than 12 cogs in Levels 1 and 2 to open it (${bankedCogs()} so far).`:''}
}
function start(){clearInput();ui.start.classList.add('hidden');ui.touchControls.classList.add('playing');running=1;startTime=performance.now();c.focus()}
$('startButton').onclick=()=>{if(locked()){refreshLock();return}start()};
refreshLock();
try{if(window.Mayhem&&window.Mayhem.subscribe)window.Mayhem.subscribe(refreshLock)}catch(e){}
$('replayButton').onclick=()=>{clearInput();reset(1);running=1;ui.complete.classList.add('hidden');ui.touchControls.classList.add('playing')};

// ---- input -----------------------------------------------------------------
function key(code,on){
  if(['ArrowLeft','KeyA'].includes(code))K.left=on;
  if(['ArrowRight','KeyD'].includes(code))K.right=on;
  if(['ArrowDown','KeyS'].includes(code))K.down=on;
  if(['ArrowUp','KeyW','Space'].includes(code)){if(on&&!K.jump)P.buffer=.16;K.jump=on}
  if(['ArrowUp','KeyW'].includes(code))K.up=on;
  if(['KeyE','Enter'].includes(code))K.interact=on;
  if(code==='KeyZ')K.blue=on;
  if(code==='KeyX')K.red=on;
  if(['KeyC','ShiftLeft','ShiftRight'].includes(code))K.shield=on;
  if(code==='KeyR'&&on&&running&&!done)reset(0);
}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();key(e.code,1)});
addEventListener('keyup',e=>key(e.code,0));
function clearInput(){Object.keys(K).forEach(k=>K[k]=0);P.buffer=0;joyEnd()}
addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput()});
document.querySelectorAll('#touchControls button').forEach(b=>{const k=b.dataset.key,set=v=>{if(k==='jump'&&v&&!K.jump)P.buffer=.16;K[k]=v};
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(1)});
  b.addEventListener('pointerup',()=>set(0));b.addEventListener('pointercancel',()=>set(0));b.addEventListener('lostpointercapture',()=>set(0))});
const joy=$('joystick'),knob=$('joystickKnob');let jid=null;
function joyMove(e){if(e.pointerId!==jid)return;const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=r.width*.3,m=Math.hypot(dx,dy)||1,k=Math.min(1,l/m),jx=dx*k,jy=dy*k;
  knob.style.transform=`translate(${jx}px,${jy}px)`;K.left=jx<-14;K.right=jx>14;K.down=jy>l*.65&&Math.abs(jy)>Math.abs(jx)*1.4;K.up=jy<-l*.65&&Math.abs(jy)>Math.abs(jx)*1.4}
function joyEnd(e){if(e&&e.pointerId!==jid)return;jid=null;K.left=K.right=K.down=K.up=0;if(knob)knob.style.transform='translate(0,0)'}
if(joy){joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});
  joy.addEventListener('pointermove',joyMove);joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);joy.addEventListener('lostpointercapture',joyEnd)}

// ---- physics (ported from Level 2) -----------------------------------------
function move(a,dt){
  const all=solids(),blocks=all.filter(q=>!q.ledge);
  a.x+=a.vx*dt;a.x=Math.max(0,Math.min(D.world.w-a.w,a.x));
  for(const r of blocks)if(overlap(a,r)){if(a.vx>0)a.x=r.x-a.w;else if(a.vx<0)a.x=r.x+r.w;a.vx=0}
  const old=a.y+a.h;a.y+=a.vy*dt;a.ground=0;a.support=null;
  for(const r of all){
    if(a.x>=r.x+r.w||a.x+a.w<=r.x)continue;
    if(a.vy>=0&&old<=r.y+3&&a.y+a.h>=r.y&&!(r.ledge&&a.dropTime>0)){a.y=r.y-a.h;a.vy=0;a.ground=1;a.support=r}
    else if(!r.ledge&&a.vy<0&&overlap(a,r)){a.y=r.y+r.h;a.vy=0}
  }
}
function grab(now){
  if(P.ground||P.vy<45||P.grabCD)return;
  const hand=P.y+19;
  for(const r of solids()){
    if(r.crate!==undefined)continue;                    // a crate slides: it is not a lip to hang from
    if(hand<r.y-18||hand>r.y+32)continue;
    const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);
    if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;break}
  }
}
function letGo(){P.gird=null;P.cling=null}
// Pack's catch spends the single charge to save a death; otherwise respawn.
function trainFail(){shake=18;flash=.18;reset(0);toast('SYSTEM','[ERROR] Locomotive collision. Maintenance requested in Sector 3.',2.6,1)}
function hurt(t){
  if(P.inv||done||flight||doorT>0)return;
  if(train&&train.run&&!train.done){trainFail();return}          // the ride has no Pack catch: it is short, and a retry starts at the rail head
  if(charge){const now=performance.now()/1000;setCharge(0);setPackAction(6,1.1,now);P.inv=1.2;P.vx=0;P.vy=0;P.x=checkpoint.x;P.y=checkpoint.y-P.h;shake=12;
    P.hang=0;P.climb=0;P.hangRect=null;P.support=null;P.dropTime=0;P.grabCD=.32;letGo();tether=null;
    seen.add(checkpoint);
    toast('PACK','Got you. That counts as overtime.',2.1,1);return}
  shake=18;flash=.18;reset(0);toast('PACK',t,2.1,1);
}

// ---- glove features --------------------------------------------------------
let engaged=false;
function tryLatchGirder(){
  if(P.latchCD)return;
  const cx=P.x+P.w/2;
  for(const g of D.girders||[]){
    if(cx<g.x0-6||cx>g.x1+6||P.y<g.y-10||P.y>g.y+60)continue;
    P.gird=g;P.x=Math.max(g.x0-P.w/2,Math.min(g.x1-P.w/2,P.x));P.y=g.y+8;P.vx=P.vy=0;P.ground=0;P.support=null;P.hang=0;P.buffer=0;engaged=true;return;
  }
}
function tryCling(){
  if(P.ground||P.latchCD)return;
  const cy=P.y+P.h/2;
  for(const s of D.strips||[]){
    if(P.x+P.w<s.x-6||P.x>s.x+s.w+6||cy<s.y0||cy>s.y1)continue;
    P.cling=s;P.vx=P.vy=0;P.x=s.x+2;P.support=null;P.hang=0;engaged=true;return;
  }
}
function tryPad(now){
  if(!P.ground||padCD)return;
  for(const pad of D.pads||[])if(P.x+P.w>pad.x&&P.x<pad.x+pad.w&&Math.abs(P.y+P.h-pad.y)<4){
    P.vy=-PAD_V*(cogs>=4?1.3:1);P.ground=0;P.support=null;P.jumpTime=1;padCD=.4;padFx=now;engaged=true;return}
}
function updateGirder(dt,pol){
  const g=P.gird,input=(K.right?1:0)-(K.left?1:0);
  P.buffer=Math.max(0,P.buffer-dt);
  P.vx=input*HANG_SPEED;P.vy=0;P.ground=0;P.support=null;if(input)P.face=input;
  P.x+=P.vx*dt;P.y=g.y+8;engaged=true;
  const cx=P.x+P.w/2;
  if(pol!==1||K.down||cx<g.x0-6||cx>g.x1+6){P.gird=null;P.latchCD=.3;P.grabCD=.25}
  else if(P.buffer){P.gird=null;P.vy=-JUMP*.6;P.buffer=0;P.latchCD=.35;P.grabCD=.3;P.jumpTime=.12}
}
function updateCling(dt,pol,now){
  const s=P.cling;P.buffer=Math.max(0,P.buffer-dt);
  P.vx=0;P.vy=K.up?-CLING_UP:K.down?CLING_DOWN:0;engaged=true;
  P.oldGround=0;move(P,dt);P.x=s.x+2;
  const cy=P.y+P.h/2;
  if(P.ground){P.cling=null;P.latchCD=.2;return}
  if(K.up){   // climbing up past a plate: step onto it
    for(const r of solids()){if(r.crate!==undefined||P.x+P.w<=r.x||P.x>=r.x+r.w)continue;
      const feet=P.y+P.h;if(feet<=r.y+6&&feet>=r.y-16){P.y=r.y-P.h;P.vy=0;P.ground=1;P.support=r;P.cling=null;P.latchCD=.25;return}}
  }
  if(pol!==1||cy<s.y0||cy>s.y1){P.cling=null;P.latchCD=.25;return}
  if(P.buffer){P.cling=null;P.vx=240;P.vy=-JUMP*.85;P.buffer=0;P.latchCD=.35;P.jumpTime=.14;P.face=1}
}
function updateCrates(dt,pol){
  for(const k of crates){
    const dx=P.x+P.w/2-(k.x+k.w/2);let v=0;
    if(pol&&Math.abs(dx)<=CRATE_RANGE&&Math.abs(P.y+P.h/2-(k.y+k.h/2))<220)v=(pol===1?Math.sign(dx):-Math.sign(dx))*CRATE_V*(cogs>=4?1.3:1);
    if(!v)continue;
    const nx=Math.max(k.x0,Math.min(k.x1-k.w,k.x+v*dt)),d=nx-k.x;
    if(!d||overlap({x:nx,y:k.y,w:k.w,h:k.h},P))continue;
    k.x=nx;engaged=true;
    if(P.ground&&P.support&&P.support.crate===k.i)P.x+=d;
  }
}
function updatePlates(dt,now){
  D.ledges.forEach((l,i)=>{
    if(l.t!=='copper')return;const s=plates[i];
    if(s.gone>0){s.gone-=dt;if(s.gone<=0){s.gone=0;s.t=0;s.armed=0}return}
    if(!s.armed&&P.ground&&P.support&&P.support.plate===i)s.armed=1;
    if(s.armed){s.t+=dt;if(s.t>=CRUMBLE){const onIt=P.ground&&P.support&&P.support.plate===i;s.gone=CRUMBLE_BACK;s.armed=0;s.t=0;
      if(l.fatal&&onIt&&!tetherUsed)startTether(now)}}
  });
}
// The last shaft plate always goes. The first time, Pack tethers Bix and swings him to the apex deck (a scripted rescue).
function startTether(now){
  const apex=D.platforms[D.tetherDeck];
  tether={t:0,dur:.9,sx:P.x,sy:P.y,tx:apex[0]+70,ty:apex[1]-P.h};tetherUsed=1;P.inv=Math.max(P.inv,1.2);
  letGo();setPackAction(6,1,now);toast('PACK','Tether deployed! Hold still! Holding is my speciality!',2.6,1);
}
function updateTether(dt){
  tether.t+=dt;const q=Math.min(1,tether.t/tether.dur),e=q*q*(3-2*q);
  P.x=tether.sx+(tether.tx-tether.sx)*e;P.y=tether.sy+(tether.ty-tether.sy)*e-Math.sin(q*Math.PI)*90;P.vx=P.vy=0;P.ground=0;P.support=null;
  if(q>=1){P.x=tether.tx;P.y=tether.ty;P.ground=1;tether=null;P.inv=Math.max(P.inv,.5);P.grabCD=.3}
}
function pressState(pr,now){
  const per=pr.period,t=(((now+pr.off)%per)+per)%per,up=per-.9;let bottom=PRESS_UP,ph='up',tell=0;
  if(t<.2){ph='rise';const q=t/.2;bottom=pr.anvil-(pr.anvil-PRESS_UP)*q*q*(3-2*q)}
  else if(t<up)ph='up';
  else if(t<up+.5){ph='tell';tell=(t-up)/.5}
  else if(t<up+.65){ph='slam';bottom=PRESS_UP+(pr.anvil-PRESS_UP)*((t-up-.5)/.15)}
  else{ph='rest';bottom=pr.anvil}
  return{ph,tell,bottom,rect:{x:pr.x,y:bottom-PRESS_HEAD,w:pr.w,h:PRESS_HEAD},lethal:ph==='slam'||ph==='rest'};
}
// Shield: parry a spitter shot (Tempered and above), flip a crawler (Tempered and above), EMP stun (Aegis).
function shieldEffects(now){
  if(!GL.shieldActive(G))return;
  const sb={x:P.x-24,y:P.y-12,w:P.w+48,h:P.h+24};let parried=false,reflectedNow=false;
  for(const e of enemies){
    if(e.dead)continue;
    if(e.type==='spitter'&&e.shot&&overlap(sb,e.shot)){
      if(G.tier.parry){reflected.push({x:e.shot.x,y:e.shot.y,w:e.shot.w,h:e.shot.h,vx:-e.sx*1.35,vy:-180,spit:e});e.shot=null;e.shotT=0;parried=true;reflectedNow=true}
    }else if(e.type==='crawler'&&G.tier.parry&&overlap(sb,EN.hazard(e)||{x:-9,y:-9,w:1,h:1})){e.dead=1;e.dissolveAt=now;parried=true}
  }
  if(parried){
    if(G.tier.emp)for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<GL.consts.EMP_RANGE)EN.stun(e);
    parryFx=now;
    toast(reflectedNow?'BIX':'SYSTEM',reflectedNow?'Return to sender.':`[SHIELD ACTIVE] Kinetic energy dispersed. Charges remaining: ${G.charges}.`,1.8,1);
  }
}
function updateReflected(dt,now){
  for(const s of reflected){s.vy+=1100*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.spit&&!s.spit.dead&&overlap(s,{x:s.spit.x,y:s.spit.y,w:s.spit.w,h:s.spit.h})){s.spit.dead=1;s.spit.dissolveAt=now;s.gone=1}
    if(s.y>D.world.yMax+200)s.gone=1}
  reflected=reflected.filter(s=>!s.gone);
}


// ---- Areas 4-6: the lab, the train, the vault ----------------------------------------------------------------------------
function laserState(l,now){const t=(((now+l.phase)%l.period)+l.period)%l.period,offEnd=l.period-l.on;return{on:t>=offEnd,tell:t>=offEnd-l.tell&&t<offEnd?(t-(offEnd-l.tell))/l.tell:0}}
function startTerm(i,now){
  const t=D.terminals[i];terms.forEach((q,j)=>{if(j!==i&&q.t>0){q.t=0;const c=D.cores.find(k=>k.id===D.terminals[j].core),m=cores.find(k=>k.id===c.id);if(m&&!seated.has(c.socket))m.x=c.start}});
  terms[i].t=t.hold;setPackAction(1,t.hold,now,{x:t.x,y:t.y-20});
  toast('PACK','Holding the terminal! My sensors are tingly! Route the cores, Bix!',2.8,1);
}
function updateLab(dt,now,pol){
  const cx=P.x+P.w/2;
  terms.forEach((tm,i)=>{if(tm.t>0){tm.t-=dt;if(tm.t<=0){tm.t=0;const t=D.terminals[i],c=D.cores.find(k=>k.id===t.core),m=cores.find(k=>k.id===c.id);
    if(m&&!seated.has(c.socket))m.x=c.start;packUntil=0;toast('PACK','Terminal released. The core dropped back. I did nothing wrong.',2.4,0)}}});
  cores.forEach((k,i)=>{
    const cfg=D.cores[i],sock=D.sockets.find(q=>q.id===cfg.socket);
    if(seated.has(cfg.socket))return;
    const ti=D.terminals.findIndex(t=>t.core===cfg.id);
    if(ti<0||terms[ti].t<=0||!gloveOn||!pol)return;
    const v=CORE_V*(cogs>=4?1.3:1);
    if(pol===1){const d=clamp(cx,cfg.x0,cfg.x1)-k.x;k.x+=Math.sign(d)*Math.min(Math.abs(d),v*dt)}       // Blue pulls the core toward Bix
    else k.x=clamp(k.x+(k.x>=cx?1:-1)*v*dt,cfg.x0,cfg.x1);                                            // Red pushes it away
    engaged=true;
    if(Math.abs(k.x-sock.x)<=sock.seat){
      k.x=sock.x;seated.add(cfg.socket);terms[ti].t=0;packUntil=0;coreFx=now;
      toast('PACK','Core seated. Do not ask me what it does.',2.4,1);
      if(!gateBlocking())toast('VELA','Unscheduled rail usage. Deploying maintenance drones for removal.',3.2,1);
    }
  });
  gateAnim+=((gateBlocking()?0:1)-gateAnim)*Math.min(1,dt*3);
}
function updateLasers(now){
  for(const l of D.lasers||[]){if(Math.abs(P.x-l.x)>400)continue;
    if(laserState(l,now).on&&overlap(P,{x:l.x-5,y:l.y-l.h,w:10,h:l.h}))hurt('Bix? The beam says you are a fine conductor. Recalibrating...')}
}
function updateChutes(dt,now,pol){
  for(const c of D.chutes||[]){
    if(Math.abs(P.x-c.x)>1500)continue;
    const n=Math.floor((now+c.phase)/c.period);
    if(chuteN[c.id]===undefined)chuteN[c.id]=n;
    if(n!==chuteN[c.id]){chuteN[c.id]=n;blocks.push({x:c.x-c.size/2,y:c.top,w:c.size,h:c.size,vx:0,vy:0,landed:0,age:0,c})}
  }
  const cx=P.x+P.w/2;
  for(const b of blocks){
    if(b.landed){b.age+=dt;continue}
    if(gloveOn&&pol===-1&&Math.abs(b.x+b.w/2-cx)<320){b.vx=clamp(b.vx+(b.x+b.w/2>=cx?1:-1)*900*dt,-240,240);engaged=true}   // Red deflects it sideways
    b.vy+=GRAV*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    const deck=D.platforms.find(q=>b.x+b.w/2>q[0]&&b.x+b.w/2<q[0]+q[2]&&Math.abs(q[1]-b.c.y)<2);
    if(deck&&b.y+b.h>=deck[1]){b.y=deck[1]-b.h;b.landed=1;b.vx=b.vy=0;shake=Math.max(shake,4)}
    else if(overlap(P,b))hurt('Bix? You look significantly flatter than usual. Recalibrating...');
    if(b.y>D.world.yMax)b.dead=1;
  }
  const landed=blocks.filter(b=>b.landed).sort((a,b)=>b.age-a.age);
  landed.slice(0,Math.max(0,landed.length-3)).forEach(b=>b.dead=1);          // a landed block is cover, but only three stay
  blocks=blocks.filter(b=>!b.dead&&!(b.landed&&b.age>9));
}
function updateDrones(dt,now,pol){
  const cx=P.x+P.w/2,cy=P.y+P.h/2;
  for(const d of drones){
    if(d.dead||Math.abs(d.x-cx)>1400)continue;
    const mid=(d.x0+d.x1)/2,amp=(d.x1-d.x0)/2,hx=mid+amp*Math.sin(now*d.sp+d.ph),hy=d.y+(d.amp?d.amp*Math.sin(now*d.sp*.7+d.ph*1.3):0);
    const dist=Math.hypot(d.x-cx,d.y-cy);d.vx=0;d.vy=0;
    if(gloveOn&&pol&&dist<320){const sg=pol===d.pol?-1:1;d.vx=(cx-d.x)/(dist||1)*sg*260;d.vy=(cy-d.y)/(dist||1)*sg*260;engaged=true;d.mode=sg}
    else d.mode=0;
    if(d.vx||d.vy){d.x+=d.vx*dt;d.y+=d.vy*dt}else{d.x+=(hx-d.x)*Math.min(1,dt*1.8);d.y+=(hy-d.y)*Math.min(1,dt*1.8)}
    if(Math.abs(d.x-cx)<40&&Math.abs(d.y-cy)<52){
      if(GL.shieldActive(G)){d.dead=1;parryFx=now;toast('SYSTEM',`[SHIELD ACTIVE] Kinetic energy dispersed. Charges remaining: ${G.charges}.`,1.8,1)}
      else hurt('Reclassified as scrap. Briefly.');
    }
  }
}
// The bed and the islands move before the player does, and carry whoever is on them.
function moversStep(dt,now){
  for(const v of isl){
    const d=D.islands.find(q=>q.id===v.id),q=islandAt(d,now);v.dx=q.x-v.x;v.dy=q.y-v.y;v.x=q.x;v.y=q.y;
    if(P.ground&&P.support&&P.support.mv===v.id&&!tether&&!flight){P.x+=v.dx;P.y+=v.dy}
  }
  if(train&&train.run&&!train.done){
    train.t+=dt;train.v=Math.min(TR.vmax,TR.v0+TR.accel*train.t);train.dx=train.v*dt;train.x+=train.dx;
    // everything in the air keeps the train's speed: the ride is played in the bed's frame
    train.riding=(P.x+P.w>train.x-70&&P.x<train.x+TR.len+70&&P.y+P.h<TR.y+40&&!tether&&!flight)?1:0;
    if(train.riding)P.x+=train.dx;
  }
}
function updateTrain(dt,now,pol){
  if(!train||train.done)return;
  const on=P.ground&&P.support&&P.support.mv==='bed';
  if(!train.run){
    if(on){
      train.wait+=dt;
      if(!train.boarded){train.boarded=1;toast('PACK','Jolt ahead! Blue, Bix, Blue!',2.6,1)}
      if(train.wait>=TR.boardWait){train.run=1;train.riding=1;shake=8;toast('SYSTEM','Ore train departing.',1.4,1)}
    }else train.wait=Math.max(0,train.wait-dt*2);
    return;
  }
  const front=train.x+TR.len,pcx=P.x+P.w/2;
  for(const o of train.obs){
    if(o.st===0&&front>=o.at-Math.max(80,train.v*TR.tell)){
      o.st=1;
      if(o.k==='R')train.things.push({k:'R',bx:300,y:-1000,vy:0,vx:0,ph:'tell',t:0});
      if(o.k==='G')train.things.push({k:'G',bx:210,t:0,up:0,off:0,x:0,y:-500});
      if(o.k==='D'){train.things.push({k:'D',bx:520,t:0,y:TR.y-68});if(!train.vela){train.vela=1;toast('VELA','Maintenance drones dispatched. You are, technically, the maintenance.',2.8,1)}}
    }
    if(o.k==='J'){
      if(o.st===1&&front>=o.at)o.st=2;
      if(o.st===2){
        o.t+=dt;if(pol===1){o.hold+=dt;engaged=true}
        if(o.hold>=TR.need)o.ok=1;
        shake=Math.max(shake,o.ok?3:8);
        if(o.t>=TR.jolt){if(!o.ok){trainFail();return}o.st=3}
      }
    }
  }
  for(const th of train.things){
    th.t+=dt;
    if(th.k==='R'){
      if(th.ph==='tell'){if(th.t>=.6){th.ph='fall'}}
      else if(th.ph==='fall'){th.vy+=GRAV*dt;th.y+=th.vy*dt;if(th.y>=TR.y-30){th.y=TR.y-30;th.ph='roll';th.vy=0;shake=Math.max(shake,5)}}
      else if(th.ph==='roll'){th.bx-=210*dt;if(th.bx<-80)th.ph='gone'}
      else if(th.ph==='fling'){th.vy+=GRAV*dt;th.y+=th.vy*dt;th.bx+=th.vx*dt;if(th.t>th.flingT+1.8)th.ph='gone'}
      const rx=train.x+th.bx;
      if((th.ph==='fall'||th.ph==='roll')&&gloveOn&&pol===-1&&Math.abs(rx-pcx)<320){th.ph='fling';th.flingT=th.t;th.vx=(rx>=pcx?1:-1)*320;th.vy=-480;engaged=true}   // Red throws it clear
      if((th.ph==='fall'||th.ph==='roll')&&overlap(P,{x:rx-28,y:th.y-28,w:56,h:56})){hurt('Bix? A rock has opinions about your skull.');return}
    }else if(th.k==='G'){
      const sw=Math.max(0,th.t-.6),ang=.55*Math.sin(3*sw),L=520,px=train.x+th.bx;
      const bx=px+L*Math.sin(ang),by=th.t<.6?-910+L*(th.t/.6):-910+L*Math.cos(ang);
      if(gloveOn&&pol===-1&&Math.abs(bx-pcx)<320){th.up=1.4;engaged=true}     // Red pushes the load up and away (the chain creaks for 0.6 s first: press Red then)
      th.up=Math.max(0,th.up-dt);th.off+=((th.up>0?360:0)-th.off)*Math.min(1,dt*8);
      th.px=px;th.x=bx;th.y=by-th.off;
      if(th.t>=.6&&th.t<2&&th.off<160&&overlap(P,{x:bx-30,y:th.y-30,w:60,h:60})){hurt('Bix? The swing-load says hello. Heavily.');return}
      if(th.t>2.3)th.gone=1;
    }else if(th.k==='D'&&!th.dead){
      th.bx-=190*dt;
      if(overlap(P,{x:train.x+th.bx-26,y:th.y-26,w:52,h:52})){
        if(GL.shieldActive(G)){th.dead=1;parryFx=now;toast('SYSTEM',`[SHIELD ACTIVE] Kinetic energy dispersed. Charges remaining: ${G.charges}.`,1.8,1)}
        else{hurt('Reclassified as scrap. Briefly.');return}
      }
      if(th.bx<-100)th.dead=1;
    }
  }
  train.things=train.things.filter(t=>t.ph!=='gone'&&!t.gone&&!t.dead);
  if(front>=TR.buffer){
    train.v=0;train.done=1;train.riding=0;train.things=[];
    flight={t:0,dur:TR.flight,sx:P.x,sy:P.y,tx:TR.land.x,ty:TR.land.y-P.h,rise:TR.flightRise};
    shake=22;flash=.12;letGo();P.hang=0;P.climb=0;P.hangRect=null;P.vy=0;
    toast('SYSTEM','Buffer stop. Impact absorbed by Bix.',2.4,1);
  }
}
function updateFlight(dt){
  flight.t+=dt;const q=Math.min(1,flight.t/flight.dur);
  P.x=flight.sx+(flight.tx-flight.sx)*q;P.y=flight.sy+(flight.ty-flight.sy)*q-Math.sin(q*Math.PI)*flight.rise;
  P.vx=P.vy=0;P.ground=0;P.support=null;P.inv=Math.max(P.inv,.3);
  if(q>=1){P.x=flight.tx;P.y=flight.ty;P.ground=1;flight=null;P.inv=Math.max(P.inv,.6);P.grabCD=.3}
}
// Vault: in the air Blue pulls Bix toward the nearest iron island, Red pushes him away from the nearest copper one.
function steer(dt,pol){
  const cx=P.x+P.w/2,cy=P.y+P.h/2;let best=null,bd=STEER.range;
  for(const v of isl){if(v.t!==(pol===1?'iron':'copper'))continue;const d=Math.hypot(v.x+v.w/2-cx,v.y-cy);if(d<bd){bd=d;best=v}}
  if(!best)return;
  const ux=(best.x+best.w/2-cx)/(bd||1),uy=(best.y-cy)/(bd||1),sg=pol===1?1:-1;
  P.vx+=ux*sg*STEER.accel*dt;P.vy+=uy*sg*STEER.accel*dt;
  const sp=Math.hypot(P.vx,P.vy),cap=STEER.vmax*1.7;if(sp>cap){P.vx*=cap/sp;P.vy*=cap/sp}
  engaged=true;
}
function updateDoors(dt,now,pol){
  const d=D.doors.find(q=>q.id==='transit'),cx=P.x+P.w/2;
  doorNear=!doorT&&Math.abs(cx-(d.x+d.w/2))<170&&Math.abs(P.y+P.h-d.y)<60?1:0;
  if(doorNear&&gloveOn&&!G.overloaded&&pol===1){engaged=true;GL.drain(G,20,dt);doorHold+=dt}      // 20 %/s from the field plus 20 %/s from the door: 40 %/s, 2.5 s from cold
  else if(!doorNear)doorHold=0;
}
function afterGlove(dt){
  if(doorNear&&doorHold>0&&G.overloaded&&!doorT){doorT=1.5;gflash=1;shake=22;P.inv=Math.max(P.inv,3);toast('SYSTEM','[LOCKS RELEASED] Transit door overcharged. Surface access granted.',2.6,1)}
  if(doorT>0){doorT-=dt;gflash=Math.max(0,doorT/1.5);if(doorT<=0)finish()}
}

// ---- update ----------------------------------------------------------------
function update(dt){
  if(!running||done)return;
  const now=performance.now()/1000;
  msgLock=Math.max(0,msgLock-dt);P.inv=Math.max(0,P.inv-dt);P.dropTime=Math.max(0,P.dropTime-dt);
  P.jumpTime=Math.max(0,P.jumpTime-dt);P.grabCD=Math.max(0,P.grabCD-dt);P.latchCD=Math.max(0,P.latchCD-dt);padCD=Math.max(0,padCD-dt);
  const shieldEdge=!!K.shield&&!prevShield;prevShield=K.shield;
  const pol=gloveOn&&!G.overloaded?GL.polarity(!!K.blue,!!K.red):0;
  engaged=false;
  const area0=areaAt(P.x),grav=area0.gravity??1;
  moversStep(dt,now);

  if(tether)updateTether(dt);
  else if(flight)updateFlight(dt);
  else if(P.gird)updateGirder(dt,pol);
  else if(P.cling)updateCling(dt,pol,now);
  else{
    if(K.down&&P.ground&&P.support?.ledge&&!onDeck(P.support)){P.dropTime=.25;P.ground=0;P.y+=5;P.coyote=0}
    if(P.climb){
      P.climb=Math.max(0,P.climb-dt);const p=1-P.climb/.45,r=P.hangRect,e=p*p*(3-2*p);
      P.x=P.climbX+(P.climbTarget-P.climbX)*e;P.y=r.y-19-(P.h-19)*e;
      if(!P.climb){P.y=r.y-P.h;P.ground=1;P.support=r;P.hangRect=null;P.grabCD=.28}
    }else if(P.hang){
      P.vx=P.vy=0;P.ground=0;
      if(K.down||(P.face>0&&K.left)||(P.face<0&&K.right)){P.hang=0;P.hangRect=null;P.vy=100;P.grabCD=.35}
      else if(P.buffer||now-P.hangAt>.18){P.hang=0;P.climb=.45;P.climbX=P.x;P.climbTarget=P.face>0?P.hangRect.x+8:P.hangRect.x+P.hangRect.w-P.w-8;P.buffer=0}
    }else{
      const input=(K.right?1:0)-(K.left?1:0);
      if(input)P.face=input;
      P.vx+=(input*RUN-P.vx)*(1-Math.exp(-(P.ground?(input?10:16):(input?4.6:1.6))*dt));
      if(!input&&Math.abs(P.vx)<.6)P.vx=0;
      P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);
      if(P.buffer&&P.coyote){P.vy=-JUMP;P.jumpTime=.18;P.buffer=P.coyote=0;P.ground=0;P.support=null}
      if(!K.jump&&!P.jumpTime&&P.vy<0)P.vy+=1500*grav*dt;
      P.vy+=(GRAV*grav+downdraftAt())*dt;
      if(!P.ground&&gloveOn&&pol&&area0.id==='vault')steer(dt,pol);
      // Kinetic Recoil (8 cogs): one Red push in mid-air gives a second small jump
      if(P.ground)recoil=0;
      else if(cogs>=8&&gloveOn&&K.red&&!prevRed&&!recoil&&!G.overloaded&&!P.hang){P.vy=-JUMP*.55;recoil=1;P.jumpTime=.1;engaged=true}
      P.oldGround=P.ground;move(P,dt);grab(now);
      if(pol===1){tryLatchGirder();if(!P.gird)tryCling()}
      if(pol===-1)tryPad(now);
      for(const n of D.nets||[])if(!P.ground&&P.vy>0&&P.y+P.h>=n.y&&P.x+P.w>n.x&&P.x<n.x+n.w){P.y=n.y-P.h;P.vy=-NET_V;P.jumpTime=1;netFx=now}
    }
  }
  if(P.ground&&!P.oldGround)P.land=.14;P.land=Math.max(0,P.land-dt);P.anim+=Math.abs(P.vx)*dt/58;

  prevRed=K.red;
  updateCrates(dt,pol);
  updatePlates(dt,now);
  if(inArchive)P.x=clamp(P.x,D.archive.exit.x-20,D.platforms[D.platforms.length-1][0]+D.platforms[D.platforms.length-1][2]-P.w);
  updateLab(dt,now,pol);updateLasers(now);updateChutes(dt,now,pol);updateDrones(dt,now,pol);updateTrain(dt,now,pol);updateDoors(dt,now,pol);
  const gs=GL.update(G,dt,{blue:gloveOn&&K.blue,red:gloveOn&&K.red,engaged,shield:shieldEdge&&gloveOn});
  if(G.overloaded&&(P.gird||P.cling)){letGo();P.latchCD=.4}
  afterGlove(dt);
  if(archiveT>0){archiveT-=dt;if(archiveT<=0)toast('PACK','BX-7 had a very long to-do list. ... Let us go.',4.2,1)}
  if(gs.shieldEmpty)toast('SYSTEM','[CRITICAL] Capacitor depleted. Manual grounding required.',2,1);

  if(packUntil<=now){packMode=0;packTarget=null}
  const packBusy=packUntil>now&&packTarget,packX=packBusy?packTarget.x:P.x-P.face*58,packY=packBusy?packTarget.y-42:P.y+18;
  pack.x+=(packX-pack.x)*Math.min(1,dt*5);pack.y+=(packY-pack.y)*Math.min(1,dt*4);

  // enemies and the shield
  const world={player:{x:P.x,y:P.y,w:P.w,h:P.h},dt};
  for(const e of enemies)EN.update(e,dt,now,world);
  shieldEffects(now);updateReflected(dt,now);
  for(const e of enemies){const hz=EN.hazard(e);if(hz&&overlap(P,hz))hurt('Reclassified as scrap. Briefly.')}
  enemies=enemies.filter(e=>!e.dead||now-(e.dissolveAt??now)<.55);
  for(const s of D.presses||[]){const ps=pressState(s,now);if(ps.lethal&&overlap(P,ps.rect))hurt('Bix? You look significantly flatter than usual. Recalibrating...')}
  if(!inArchive&&P.y>(area0.killY??((D.world.yMax??900)+160)))hurt('Gravity remains constant. Technician durability: sub-optimal.');

  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;cogs++;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
    toast('PACK',cogs===4?'Cog 4. Field Boost online: Red hits 30% harder.':cogs===8?'Cog 8. Kinetic Recoil online: one Red kick in mid-air.':cogs===12?"Glove capacitor at 100%! We're practically magnetic royalty!":`Cog ${cogs} secured.`,cogs===12?3:1.4,1)}
  for(const t of (D.triggers||[]))if(!t.used&&P.x>t.x&&(t.y0===undefined||(P.y>=t.y0&&P.y<=t.y1))){t.used=1;toast(t.s,t.t,2.8,1)}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&D.checkpoints.indexOf(cp)>D.checkpoints.indexOf(checkpoint)&&P.x>cp.x-40&&Math.abs(P.y+P.h-cp.y)<80){seen.add(cp);setCP(cp)}   // only forward: a checkpoint never moves you back

  interact(now);

  lead+=(leadTarget()-lead)*(1-Math.exp(-3*dt));
  const area=areaAt(P.x);
  const tx=Math.max(0,Math.min(D.world.w-viewW,P.x+(narrow()?P.vx*.22:0)-viewW*camLead()));
  const ty=isVertical(area)?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):flatCamY();
  camX+=(tx-camX)*(1-Math.exp(-4.5*dt));camY+=(ty-camY)*(1-Math.exp(-4.5*dt));
  shake=Math.max(0,shake-30*dt);flash=Math.max(0,flash-dt);

  ui.zone.textContent=area?area.name:'';ui.objective.textContent=area?area.objective:'';
  hud();
  if(msgTime>0){msgTime-=dt;if(msgTime<=0)ui.dialogue.classList.add('hidden')}
}
function hud(){
  ui.gloveHud.classList.toggle('off',!gloveOn);
  ui.heatBar.style.width=Math.round(G.heat)+'%';
  ui.heatBar.className=G.overloaded?'lock':G.heat>=GL.consts.WARN?'warn':'';
  ui.polLabel.textContent=!gloveOn?'NO GLOVE':G.overloaded?'OVERLOAD':G.pol===1?'BLUE +':G.pol===-1?'RED -':'NEUTRAL';
  const pips='●'.repeat(G.charges)+'○'.repeat(G.tier.charges-G.charges);
  if(ui.pips.textContent!==pips)ui.pips.textContent=pips;
}

// ---- interaction (one ACT button, context label) ---------------------------
function nearest(list,r){let best=null,bd=r;for(const q of (list||[])){const d=Math.hypot(P.x+21-q.x,P.y+48-q.y);if(d<bd){bd=d;best=q}}return best}
function interact(now){
  const A=D.archive,cx=P.x+P.w/2,doorA=D.doors.find(q=>q.id==='archive');
  let label='',act=null;
  const locker=!gloveOn?nearest(D.lockers,120):null;
  const ti=gloveOn&&!inArchive?D.terminals.findIndex(t=>Math.abs(cx-t.x)<t.range&&Math.abs(P.y+P.h-t.y)<40):-1;
  if(locker){label='ACT · OPEN LOCKER';act=()=>{gloveOn=1;setPackAction(1,.9,now,locker);toast('PACK','Hold Z for Blue, X for Red. Do not hold both. I checked. Twice.',3.2,1)}}
  else if(ti>=0){label=terms[ti].t>0?`ACT · PACK HOLDING · ${Math.ceil(terms[ti].t)} S`:'ACT · SEND PACK TO HOLD THE TERMINAL';act=()=>startTerm(ti,now)}
  else if(!inArchive&&Math.abs(cx-(doorA.x+doorA.w/2))<110&&Math.abs(P.y+P.h-doorA.y)<60){
    if(cogs>=doorA.needs){label='ACT · ENTER THE ARCHIVE';act=()=>{inArchive=1;P.x=A.enter.x;P.y=A.enter.y-P.h;P.vx=P.vy=0;camX=Math.max(0,P.x-viewW*.4);camY=D.areas.find(q=>q.id==='archive').camY;toast('PACK','That door is glowing at me. I would like to go in and be quiet.',3,1)}}
    else label=`ARCHIVE DOOR · LOCKED · ${cogs} / ${doorA.needs} COGS`;
  }else if(inArchive){
    const k=A.terminals.findIndex(t=>Math.abs(cx-t.x)<90);
    if(k>=0){label='ACT · READ';act=()=>{archiveRead[k]=1;toast(A.terminals[k].s,A.terminals[k].t,7,1);if(archiveRead.every(Boolean)&&!archiveT&&!archiveRead.done){archiveRead.done=1;archiveT=7.2}}}
    else if(Math.abs(cx-A.exit.x)<90){label='ACT · LEAVE THE ARCHIVE';act=()=>{inArchive=0;P.x=A.back.x;P.y=A.back.y-P.h;P.vx=P.vy=0;camX=Math.max(0,P.x-viewW*camLead());camY=areaAt(P.x).camY??camY;letGo()}}
  }
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);
  if(!K.interact)return;
  K.interact=0;
  if(act)act();
}

// Medals (design doc, table 20). Gold: 10 cogs, 8 falls, 14:00. Silver: 6 cogs, 20 falls, 22:00. Bronze: any finish.
const MEDALS=[
  {name:'GOLD',cogs:10,falls:8,sec:840,who:'PACK',line:'Positively Charged! That was a masterclass in industrial physics!'},
  {name:'SILVER',cogs:6,falls:20,sec:1320,who:'PACK',line:'Unstoppable Anomaly! A few dents, but the spirit is polarized!'},
  {name:'BRONZE',cogs:0,falls:1e9,sec:1e9,who:'BIX',line:"Barely grounded. Let's never take that lift again."},
];
const medalFor=(c,f,t)=>MEDALS.find(m=>c>=m.cogs&&f<=m.falls&&t<=m.sec);
// Hand the finished run to progress.js (device copy, plus the cloud when signed in) and tell the player where it went.
function saveResult(level,sec,cogsN,falls){const M=window.Mayhem;if(!M||!ui.saveNote)return;M.recordResult(level,{timeSec:sec,cogs:cogsN,falls}).then(t=>{ui.saveNote.textContent=t;ui.saveNote.hidden=!t}).catch(()=>{})}
function finish(){
  if(done)return;
  done=1;running=0;ui.touchControls.classList.remove('playing');
  const sec=Math.max(1,Math.floor((performance.now()-startTime)/1000)),m=medalFor(cogs,P.falls,sec);
  ui.finalCogs.textContent=`${cogs} / ${COG_TOTAL}`;
  ui.finalTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  ui.finalFalls.textContent=P.falls;
  ui.medal.textContent=m.name;ui.medal.dataset.medal=m.name.toLowerCase();
  ui.resultLine.textContent=`${m.who}: “${m.line}”`+(cogs>=COG_TOTAL?' The archive door was lit. You saw it.':'');
  ui.complete.classList.remove('hidden');
  saveResult('level3',sec,cogs,P.falls);
}


// ---- drawing: lab, train, vault, archive ------------------------------------------------------------------------------------
const poly=(pts,f)=>{x.beginPath();pts.forEach((q,i)=>i?x.lineTo(SX(q[0]),SY(q[1])):x.moveTo(SX(q[0]),SY(q[1])));x.closePath();x.fillStyle=f;x.fill()};
const glow=(px,py,r,col,a)=>{const g=x.createRadialGradient(SX(px),SY(py),0,SX(px),SY(py),r);g.addColorStop(0,col);g.addColorStop(1,'transparent');x.save();x.globalAlpha=a;x.fillStyle=g;x.fillRect(SX(px)-r,SY(py)-r,r*2,r*2);x.restore()};
function drawTerminal(t,now,on,cd){
  const h=118,w=h*(sw('terminal')||1)/(sh('terminal')||1);
  if(!blit(on?'terminal-on':'terminal',t.x-w/2,t.y-h,w,h)){box(t.x-26,t.y-70,52,70,'#2c3a40','#7d9aa5')}
  if(on){glow(t.x,t.y-70,90,'#5fd4ff',.35+.15*Math.sin(now*6));x.save();x.fillStyle='#dff7ee';x.font='800 15px system-ui';x.textAlign='center';x.fillText(Math.ceil(cd)+' s',SX(t.x),SY(t.y-h-10));x.restore()}
}
function drawLab(now){
  for(const s0 of D.sockets){const on=seated.has(s0.id);
    if(!blit('socket',s0.x-30,s0.y-96,60,60))box(s0.x-26,s0.y-90,52,52,'#2c3a40','#7d9aa5');
    x.fillStyle=on?'#59e2c2':'#ffb43c';x.beginPath();x.arc(SX(s0.x),SY(s0.y-110),7,0,7);x.fill();glow(s0.x,s0.y-110,26,on?'#59e2c2':'#ffb43c',.45)}
  for(const c of D.cores){line(c.x0,c.y,c.x1,c.y,'#3b4e57',4);line(c.x0,c.y,c.x1,c.y,c.pol===1?'#5fd4ff33':'#ff8f6a33',10)}
  cores.forEach((k,i)=>{const c=D.cores[i],act=terms[D.terminals.findIndex(t=>t.core===c.id)]?.t>0,st=seated.has(c.socket),bob=st?0:Math.sin(now*3+i)*(act?7:2);
    glow(k.x,c.y+bob,act||st?64:40,st?'#59e2c2':c.pol===1?'#5fd4ff':'#ff8f6a',act||st?.5:.25);
    if(!blit(c.pol===1?'core-blue':'core-red',k.x-30,c.y-30+bob,60,60)){x.fillStyle=c.pol===1?BLUE:RED;x.beginPath();x.arc(SX(k.x),SY(c.y+bob),24,0,7);x.fill()}});
  D.terminals.forEach((t,i)=>drawTerminal(t,now,terms[i]&&terms[i].t>0,terms[i]?terms[i].t:0));
  for(const g of D.gates||[]){const open=gateAnim,top=g.y-g.h-open*(g.h+30);
    if(open<.98){x.save();x.globalAlpha=1-open*.7;if(!blit('hazard-door',g.x-32,top,90,g.h))box(g.x,top,g.w,g.h,'#3a4a52','#ffb43c');x.restore()}}
  for(const l of D.lasers||[]){const st=laserState(l,now),top=l.y-l.h;
    box(l.x-9,l.y-8,18,8,'#2c3a40','#7d9aa5');box(l.x-9,top,18,8,'#2c3a40','#7d9aa5');
    if(st.on){x.save();x.shadowColor='#ff3b30';x.shadowBlur=22;x.fillStyle='#ff5a48';x.fillRect(SX(l.x)-3,SY(top+8),6,l.h-16);x.fillStyle='#fff';x.fillRect(SX(l.x)-1,SY(top+8),2,l.h-16);x.restore()}
    else{x.save();x.strokeStyle=st.tell>0?`rgba(255,180,60,${.4+.6*(Math.floor(st.tell*8)%2)})`:'rgba(255,90,72,.18)';x.setLineDash([4,10]);x.lineWidth=2;x.beginPath();x.moveTo(SX(l.x),SY(top+8));x.lineTo(SX(l.x),SY(l.y-8));x.stroke();x.restore();
      if(st.tell>0)glow(l.x,top+4,30,'#ffb43c',.6)}}
  for(const c of D.chutes||[]){
    const t=(((now+c.phase)%c.period)+c.period)%c.period,tell=t>c.period-c.tell,sh0=tell?Math.sin(now*70)*2:0,h=190,w=h*(sw('hopper')||1)/(sh('hopper')||1);
    if(!blit('hopper',c.x-w/2+sh0,c.top-h+40,w,h))box(c.x-40,c.top-120,80,120,'#3a4a52','#7d9aa5');
    if(tell)glow(c.x,c.top+30,50,'#ffb43c',.5)}
  for(const b of blocks){if(!blit('crate',b.x-4,b.y-4,b.w+8,b.h+8))box(b.x,b.y,b.w,b.h,'#6b4a26','#c99a55')}
}
function drawDrone(d,now){
  if(d.dead)return;const f=d.mode===1?2:d.mode===-1?1:0,name=(d.pol===1?'drone-b':'drone-r')+f,h=66;
  const vx=d.vx||Math.cos(now*d.sp+d.ph),w=h*(sw(name)||1)/(sh(name)||1);
  glow(d.x,d.y,48,d.pol===1?'#5fd4ff':'#ff8f6a',.28);
  if(!blit(name,d.x-w/2,d.y-h/2,w,h,vx<0?-1:1)){x.fillStyle=d.pol===1?BLUE:RED;x.beginPath();x.arc(SX(d.x),SY(d.y),24,0,7);x.fill()}
}
function drawTrain(now){
  const T=TR;
  // rails and sleepers: the world-fixed pattern that tells you how fast you are going
  const ty=T.y+78;
  for(let tx=Math.floor((Math.max(camX,T.x0)-380)/380)*380;tx<Math.min(camX+viewW+380,T.x1);tx+=380){if(tx+380<T.x0)continue;if(!blit('track',tx,ty-16,381,100)){box(tx,ty,380,10,'#3a3a3a')}}
  const tv=A.spr.gantry?1:0;
  for(const o of T.obs){if(o.k==='R'||o.k==='G'){const gx=o.at-40,gh=380,gw=gh*(sw('gantry')||1)/(sh('gantry')||1);if(tv)blit('gantry',gx,ty-gh+20,gw,gh,1,.85)}}
  const bz=(f,a,b)=>{const c=(now*6)%1<.5;return f?a:b};
  blit('buffer',T.buffer-8,ty-96,150,96);
  // the bed
  const bw=T.len+44,bh=bw*(sh('flatcar')||1)/(sw('flatcar')||1);
  if(!blit('flatcar',train.x-22,T.y-6,bw,bh))box(train.x,T.y,T.len,60,'#4a3a2e','#c99a55');
  // jolt lamps and the clamp light
  const lamp=train.obs.some(o=>o.k==='J'&&o.st===1),jolt=train.obs.find(o=>o.k==='J'&&o.st===2);
  if(lamp&&Math.floor(now*8)%2){for(const bx of [train.x+20,train.x+T.len-20]){blit('beacon',bx-18,T.y-58,36,44);glow(bx,T.y-40,60,'#ffb43c',.7)}}
  if(jolt){x.save();x.globalAlpha=.16;x.fillStyle=jolt.ok?'#5fd4ff':'#ff8a3c';x.fillRect(0,0,viewW,H);x.restore()}
  if(!train.run&&train.boarded){x.save();x.fillStyle='#ffd75a';x.font='800 15px system-ui';x.textAlign='center';x.fillText('DEPARTING '+Math.max(0,Math.ceil(TR.boardWait-train.wait)),SX(train.x+T.len/2),SY(T.y-130));x.restore()}
  for(const th of train.things){
    if(th.k==='R'){const rx=train.x+th.bx;
      if(th.ph==='tell'){const a=.5+.5*Math.sin(now*14);x.save();x.globalAlpha=.4+.4*a;x.fillStyle='#ffb43c';x.beginPath();x.moveTo(SX(rx),SY(T.y-4));x.lineTo(SX(rx-26),SY(T.y+10));x.lineTo(SX(rx+26),SY(T.y+10));x.fill();x.restore()}
      else if(!blit('ore',rx-36,th.y-40,72,80,1)){x.fillStyle='#5a4a3a';x.beginPath();x.arc(SX(rx),SY(th.y),28,0,7);x.fill()}}
    else if(th.k==='G'&&th.px!==undefined){
      x.save();x.strokeStyle='#8a8f92';x.lineWidth=5;x.beginPath();x.moveTo(SX(th.px),SY(-960));x.lineTo(SX(th.x),SY(th.y-58));x.stroke();x.restore();
      if(!blit('grab',th.x-46,th.y-62,92,116))box(th.x-30,th.y-30,60,60,'#5a4a3a','#c99a55')}
    else if(th.k==='D'&&!th.dead){const r={x:train.x+th.bx,y:th.y,pol:-1,sp:1,ph:0,mode:0,vx:-1};drawDrone(r,now)}
  }
}
function drawVault(now){
  const id=i=>Math.max(0,Math.min(4,i));
  D.islands.forEach((d,i)=>{const v=isl.find(q=>q.id===d.id);if(!v)return;const name='island'+id(i),nat=sh(name)/(sw(name)||1),w=v.w+70,h=Math.min(190,w*nat);
    glow(v.x+v.w/2,v.y+60,150,d.t==='iron'?'#5fd4ff':'#ff8f6a',.14);
    if(!blit(name,v.x-35,v.y-14,w,h)){box(v.x,v.y,v.w,60,'#3a4a52','#7d9aa5')}});
  if(gloveOn&&!P.ground){const pol=GL.polarity(!!K.blue,!!K.red);
    if(pol&&!G.overloaded){const cx=P.x+P.w/2,cy=P.y+P.h/2;let best=null,bd=STEER.range;for(const v of isl){if(v.t!==(pol===1?'iron':'copper'))continue;const dd=Math.hypot(v.x+v.w/2-cx,v.y-cy);if(dd<bd){bd=dd;best=v}}
      if(best){x.save();x.strokeStyle=pol===1?BLUE:RED;x.globalAlpha=.55;x.setLineDash([8,10]);x.lineWidth=3;x.beginPath();x.moveTo(SX(cx),SY(cy));x.lineTo(SX(best.x+best.w/2),SY(best.y));x.stroke();x.restore()}}}
  const dt=D.doors.find(q=>q.id==='transit'),da=D.doors.find(q=>q.id==='archive'),lit=cogs>=da.needs,dh=dt.h+70,dw=dh*(sw('vault-door')||1)/(sh('vault-door')||1);
  const heat=doorNear?G.heat/100:0;
  if(!blit('vault-door',dt.x+dt.w/2-dw/2,dt.y-dh+10,dw,dh)){box(dt.x,dt.y-dt.h,dt.w,dt.h,'#3a4a52','#7d9aa5')}
  if(heat>0)glow(dt.x+dt.w/2,dt.y-dt.h/2,160,'#ff6a3c',.15+heat*.7);
  const ah=da.h+10,aw=ah*(sw('door')||1)/(sh('door')||1);
  blit('door',da.x+da.w/2-aw/2,da.y-ah,aw,ah);
  if(lit)glow(da.x+da.w/2,da.y-da.h/2,110,'#59e2c2',.35+.15*Math.sin(now*3));
  // the archive room
  const A2=D.archive,pl=D.platforms[D.platforms.length-1];
  box(pl[0]-30,pl[1]-420,pl[2]+60,420,'#0d151a');x.fillStyle='rgba(89,226,194,.06)';x.fillRect(SX(pl[0]-30),SY(pl[1]-420),pl[2]+60,420);
  A2.terminals.forEach((t,i)=>drawTerminal({x:t.x,y:pl[1]},now,archiveRead[i],0));
  const ex=A2.exit.x;blit('door',ex-40,pl[1]-190,80,190);
}

// ---- draw ------------------------------------------------------------------
function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;
  dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const s=c.height/H;viewW=c.width/s;x.setTransform(s,0,0,s,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high'}

function line(x0,y0,x1,y1,col,w){x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(SX(x0),SY(y0));x.lineTo(SX(x1),SY(y1));x.stroke()}
function chevrons(px,py,w,h,dir,col){   // dir 1 = point inward/up, drawn as small arrows
  x.save();x.strokeStyle=col;x.lineWidth=2;
  for(let i=8;i<w;i+=22){const cx=SX(px+i),cy=SY(py+h/2);x.beginPath();x.moveTo(cx-5,cy+4*dir);x.lineTo(cx,cy-4*dir);x.lineTo(cx+5,cy+4*dir);x.stroke()}
  x.restore();
}
// one painted strip per area, tiled, drifting slower than the world; two are blended for a few hundred px around an area border
const BGKEY={train:'rail',archive:'lab'};
function bgStrip(id,alpha){
  id=BGKEY[id]||id;const b=A.bg[id],im=BGI[id];if(!b||!ready(im))return;
  const dh=H*1.08,dw=b.w*dh/b.h,oy=Math.max(-(dh-H),Math.min(0,-(dh-H)*.5-(camY-(D.world.camY??80))*.05));
  let ox=-((camX*.28)%dw);x.save();x.globalAlpha=Math.max(0,Math.min(1,alpha));
  let ti=Math.floor((camX*.28)/dw);
  for(;ox<viewW;ox+=dw,ti++){                // every other tile is mirrored, so the edges always meet
    if(ti&1){x.save();x.translate(Math.round(ox)+Math.ceil(dw)+1,0);x.scale(-1,1);x.drawImage(im,0,oy,Math.ceil(dw)+1,dh);x.restore()}
    else x.drawImage(im,Math.round(ox),oy,Math.ceil(dw)+1,dh)}
  x.restore();
}
function drawBackdrop(){
  const mid=camX+viewW/2,as=D.areas,cur=areaAt(mid),k=as.indexOf(cur),blend=260,prev=as[k-1],next=as[k+1];
  bgStrip(cur.id,1);
  if(prev&&mid<cur.x0+blend&&A.bg[BGKEY[prev.id]||prev.id])bgStrip(prev.id,1-(mid-(cur.x0-blend))/(2*blend));
  if(next&&mid>cur.x1-blend&&A.bg[BGKEY[next.id]||next.id])bgStrip(next.id,(mid-(cur.x1-blend))/(2*blend));
  x.fillStyle='rgba(4,8,12,.18)';x.fillRect(-20,-20,viewW+40,H+40);
}
function draw(){
  const now=performance.now()/1000;
  x.save();x.clearRect(0,0,viewW,H);
  if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.65);
  const grd=x.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#14212c');grd.addColorStop(.6,'#0e1820');grd.addColorStop(1,'#1c1410');
  x.fillStyle=grd;x.fillRect(-20,-20,viewW+40,H+40);
  drawBackdrop();

  D.platforms.forEach(p=>{
    const th=Math.max(60,Math.min(100,p[2]/4.9)),drawn=A.spr.steel;
    if(drawn){const y0=p[1]-8+th-6,g=x.createLinearGradient(0,SY(y0),0,SY(p[1]+(p[3]||78)));g.addColorStop(0,'#1a2228');g.addColorStop(1,'#0a0e12');
      const yb=p[1]+(p[3]||78)+40,inset=Math.min(46,p[2]*.16);   // a tapering hull of scrap under the deck that fades into the haze
      g.addColorStop(0,'#3a2e24');g.addColorStop(.5,'#1d1814');g.addColorStop(1,'rgba(12,10,9,0)');x.fillStyle=g;
      x.beginPath();x.moveTo(SX(p[0]+3),SY(y0));x.lineTo(SX(p[0]+p[2]-3),SY(y0));x.lineTo(SX(p[0]+p[2]-inset),SY(yb));x.lineTo(SX(p[0]+inset),SY(yb));x.closePath();x.fill();
      blit('steel',p[0]-6,p[1]-8,p[2]+12,th)}
    else{box(p[0],p[1],p[2],p[3]||78,'#1a2e36','#48707a');x.fillStyle='#ffc84a';x.fillRect(SX(p[0]),SY(p[1]),p[2],4)}
  });
  for(const l of D.ledges){
    const i=D.ledges.indexOf(l),s=plates[i]||{t:0,gone:0,armed:0};
    const lt=Math.max(30,Math.min(60,l.w/4.9)),lname=l.t==='copper'?(s.armed?'copper-crack':'copper'):l.t;
    if(A.spr[lname]){
      if(l.t==='copper'&&s.gone>0){blit('copper-broken',l.x-4,l.y-6,l.w+8,lt,1,.22);continue}
      blit(lname,l.x-4+(l.t==='copper'&&s.armed&&Math.floor(s.t*30)%2?1.5:0),l.y-6,l.w+8,lt);continue}
    if(l.t==='copper'&&s.gone>0){x.save();x.globalAlpha=.18;box(l.x,l.y,l.w,l.h,'#8a4a26');x.restore();continue}
    const col=l.t==='iron'?'#2b5f8f':l.t==='copper'?'#8a4a26':'#3a5560';
    x.save();if(l.t==='copper'&&s.armed&&Math.floor(s.t*30)%2)x.translate(1.5,0);
    box(l.x,l.y,l.w,l.h,col,l.t==='steel'?'#7d9aa5':l.t==='iron'?BLUE:'#e09a5a');
    x.fillStyle='#ffc84a';x.fillRect(SX(l.x),SY(l.y),l.w,3);
    if(l.t==='iron'){x.strokeStyle='#ffffff22';for(let k=6;k<l.w;k+=14){x.beginPath();x.moveTo(SX(l.x+k),SY(l.y+3));x.lineTo(SX(l.x+k),SY(l.y+l.h));x.stroke()}}
    if(l.t==='copper'&&s.armed&&s.t>.4){line(l.x+l.w*.3,l.y,l.x+l.w*.4,l.y+l.h,'#000',2);line(l.x+l.w*.6,l.y,l.x+l.w*.55,l.y+l.h,'#000',2)}
    x.restore();
  }
  for(const s of D.strips||[]){if(A.spr.strip){for(let yy=s.y0;yy<s.y1;yy+=180)blit('strip',s.x-6,yy,s.w+12,Math.min(181,s.y1-yy+1));continue}box(s.x,s.y0,s.w,s.y1-s.y0,'#1d4468','#5fd4ff55');x.save();x.strokeStyle='#5fd4ff33';for(let yy=s.y0;yy<s.y1;yy+=40){x.beginPath();x.moveTo(SX(s.x),SY(yy));x.lineTo(SX(s.x+s.w),SY(yy));x.stroke()}x.restore()}
  for(const g of D.girders||[]){if(A.spr.girder){const len=g.x1-g.x0,n=Math.max(1,Math.round(len/170)),seg=len/n;for(let i=0;i<n;i++)blit('girder',g.x0+i*seg,g.y-30,seg+1,40);continue}box(g.x0,g.y-8,g.x1-g.x0,12,'#2b5f8f','#5fd4ff');chevrons(g.x0,g.y-8,g.x1-g.x0,12,1,'#bfeeff')}
  for(const p of D.pads||[]){const pulse=now-padFx<.3;if(blit(pulse?'pad-fire':'pad',p.x-6,p.y-52,p.w+12,64))continue;box(p.x,p.y-6,p.w,10,pulse?'#ffd0bd':'#b8563a',RED);chevrons(p.x,p.y-30,p.w,24,1,RED)}
  for(const n of D.nets||[]){const nn=Math.max(1,Math.round(n.w/200));let ok=1;for(let i=0;i<nn&&ok;i++)ok=blit('net',n.x+i*n.w/nn,n.y-14,n.w/nn+1,46,1,now-netFx<.3?1:.92);if(ok)continue;box(n.x,n.y,n.w,14,now-netFx<.3?'#ffd0bd':'#7a3a2a',RED);chevrons(n.x,n.y-16,n.w,16,1,RED)}
  for(const p of D.perches||[])box(p.x,p.y,p.w,10,'#2b3a42','#48707a');
  for(const l of D.lockers||[]){if(A.spr.locker){const h=120,w=h*sw('locker')/sh('locker');blit('locker',l.x-w/2,l.y-h,w,h);continue}box(l.x-22,l.y-84,44,84,gloveOn?'#22323a':'#4a5a30','#9bb05a');if(!gloveOn){x.fillStyle='#ffd75a';x.fillRect(SX(l.x)-6,SY(l.y-50),12,12)}}
  for(const k of crates){if(blit('crate',k.x-6,k.y-4,k.w+12,k.h+6))continue;box(k.x,k.y,k.w,k.h,'#6b4a26','#c99a55');line(k.x,k.y,k.x+k.w,k.y+k.h,'#c99a5555',3);line(k.x+k.w,k.y,k.x,k.y+k.h,'#c99a5555',3)}
  for(const s of D.presses||[]){
    const ps=pressState(s,now);
    if(A.spr['press-head']){
      const hw=s.w+22,hh=hw*sh('press-head')/sw('press-head'),top=PRESS_UP-PRESS_HEAD-120;
      blit('press-rod',s.x+s.w/2-11,top,22,ps.bottom-hh+10-top);blit('press-head',s.x-11,ps.bottom-hh+8,hw,hh);
      if(ps.lethal){x.save();x.globalAlpha=.16;x.fillStyle='#ff3a20';x.fillRect(SX(ps.rect.x),SY(ps.rect.y),ps.rect.w,ps.rect.h);x.restore()}
    }else{
    box(s.x+s.w/2-8,PRESS_UP-PRESS_HEAD-40,16,ps.bottom-PRESS_HEAD-(PRESS_UP-PRESS_HEAD-40),'#26343b');
    box(ps.rect.x,ps.rect.y,ps.rect.w,ps.rect.h,ps.lethal?'#a02a20':'#3a4a52',ps.tell>0?'#ffb43c':'#7d9aa5');}
    x.fillStyle=ps.ph==='tell'?`rgba(255,180,60,${.4+.6*(Math.floor(ps.tell*8)%2)})`:'#553';x.beginPath();x.arc(SX(s.x+s.w/2),SY(ps.rect.y+18),9,0,7);x.fill();
    if(ps.tell>0){x.save();x.strokeStyle='#ffb43c66';x.setLineDash([6,10]);x.beginPath();x.moveTo(SX(s.x),SY(ps.bottom));x.lineTo(SX(s.x),SY(s.anvil));x.moveTo(SX(s.x+s.w),SY(ps.bottom));x.lineTo(SX(s.x+s.w),SY(s.anvil));x.stroke();x.restore()}
  }
  drawLab(now);drawTrain(now);drawVault(now);
  D.cogs.forEach((q,i)=>cog(q,i,now));
  for(const e of enemies)drawEnemy(e,now);
  for(const d of drones)drawDrone(d,now);
  for(const s of reflected){x.fillStyle=RED;x.beginPath();x.arc(SX(s.x+s.w/2),SY(s.y+s.h/2),9,0,7);x.fill()}

  const packCell=packUntil>now?packMode:0;
  sprite('pack-assist-v2.png',packCell,pack.x,pack.y+32,64,-P.face);
  if(tether){line(pack.x,pack.y,P.x+P.w/2,P.y+30,'#cfe',3)}
  drawBix(now);
  // the glove's field
  if(gloveOn&&G.pol&&!G.overloaded){x.save();x.strokeStyle=G.pol===1?BLUE:RED;x.globalAlpha=.55+.25*Math.sin(now*14);x.lineWidth=3;
    x.beginPath();x.arc(SX(P.x+P.w/2),SY(P.y+P.h/2),58+(G.pol===1?-6:6)*Math.sin(now*10),0,7);x.stroke();x.restore()}
  if(GL.shieldActive(G)){x.save();x.strokeStyle='#59e2c2';x.lineWidth=4;x.beginPath();x.arc(SX(P.x+P.w/2),SY(P.y+P.h/2),Math.hypot(P.w/2+24,P.h/2+12),0,7);x.stroke();x.restore()}
  const vig=x.createRadialGradient(viewW*.5,H*.45,H*.2,viewW*.5,H*.48,Math.max(viewW,H)*.72);
  vig.addColorStop(0,'transparent');vig.addColorStop(.74,'#00000014');vig.addColorStop(1,'#000a');
  x.fillStyle=vig;x.fillRect(0,0,viewW,H);
  if(flash){x.fillStyle=`rgba(255,220,170,${flash*2})`;x.fillRect(0,0,viewW,H)}
  if(gflash>0){x.fillStyle=`rgba(120,255,170,${Math.min(.85,gflash)})`;x.fillRect(0,0,viewW,H)}
  x.restore();
}
const cogImg=img('energy-cog-v1.png'),COG_SRC=[53,57,1148,1117];
function cog(q,i,now){
  if(q.got)return;
  const bob=Math.sin(now*2+i)*5;
  x.save();x.translate(SX(q.x),SY(q.y+bob));x.rotate(now*.55*(i%2?1:-1));x.shadowColor='#5ff7de';x.shadowBlur=9;
  if(cogImg.complete&&cogImg.naturalWidth){const[sx,sy,sw,sh]=COG_SRC,h=54,w=h*sw/sh;x.drawImage(cogImg,sx,sy,sw,sh,-w/2,-h/2,w,h)}
  else{x.fillStyle='#ffd75a';x.beginPath();x.arc(0,0,16,0,7);x.fill()}
  x.restore();
}
const ENEMY_PLATE={crawler:'enemy-crawler-v2.png',spitter:'enemy-spitter-v2.png'};
function enemyPose(e){
  if(e.type==='crawler')return{cx:e.x+e.w/2,bottom:e.y+e.h+3,h:62};
  return{cx:e.x+e.w/2,bottom:e.y+e.h+4,h:66};
}
function drawEnemy(e,now){
  const plate=ENEMY_PLATE[e.type];if(!plate)return;
  const ph=EN.phaseName?EN.phaseName(e):'',tell=EN.tell?EN.tell(e):0;
  let cell=0;
  if(e.type==='crawler')cell=e.stun?6:ph==='wake'?5:ph==='turn'?4:Math.hypot(P.x-e.x,P.y-e.y)<72?7:Math.floor(now*7)%4;
  else if(e.type==='spitter')cell=ph==='wake'?6:ph==='charge'?(tell>.6?2:1):ph==='fire'?(e.t<.16?3:4):ph==='cooldown'?(e.t<.5?4:e.t>1.15?6:5):0;
  const hz=EN.hazard(e),pose=enemyPose(e),flip=e.dir<0?-1:1;
  if(tell>0&&!hz){x.save();x.globalAlpha=.25+tell*.5;x.fillStyle='#ffb43c';x.beginPath();x.arc(SX(pose.cx),SY(pose.bottom-pose.h-18),14+tell*10,0,7);x.fill();x.restore()}
  if(!blitFrame(e.type,cell,pose.cx,pose.bottom,pose.h,flip,e.type==='spitter')&&!sprite(plate,cell,pose.cx,pose.bottom,pose.h,flip,0))box(e.x,e.y,e.w,e.h,'#8a2a20','#ff4d3a');
  if(e.shot){x.fillStyle='#ff9d23';x.beginPath();x.arc(SX(e.shot.x+e.shot.w/2),SY(e.shot.y+e.shot.h/2),9,0,7);x.fill()}
}
function drawBix(now){
  const f=P.gird?10:P.cling?11:P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):P.land?9:Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  const n='bix'+f;
  if(!A.spr[n]){drawBixOld(now);return}
  const k=96*1.02/sh('bix0'),dh=sh(n)*k,dw=sw(n)*k;
  let ay=P.y+P.h+2;
  if(P.gird||P.cling)ay=P.y+dh-6;
  else if(P.hang||P.climb){const t=P.climb?1-P.climb/.45:0;ay=P.hangRect.y+(dh-6)*(1-t)}
  const ax=P.x+P.w/2;
  x.save();x.shadowColor=G.pol===1?BLUE:G.pol===-1?RED:'rgba(255,226,180,.55)';x.shadowBlur=G.pol?18:9;
  x.globalAlpha=P.inv&&Math.floor(performance.now()/70)%2?.48:1;
  blit(n,ax-dw/2,ay-dh,dw,dh,P.face);x.restore();
}
function drawBixOld(now){
  const bix=BIX;
  if(!bix.complete||!bix.naturalWidth){box(P.x,P.y,P.w,P.h,'#59e2c2');return}
  const R=[[48,20,174,436],[305,20,176,436],[535,57,294,397],[862,57,260,397],[22,498,270,384],[301,480,260,402],[590,484,240,395],[860,457,275,330],[8,901,299,397],[311,1049,285,270],[643,879,180,451],[911,883,210,440]];
  let f=P.gird?10:P.cling?10:P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):P.land?9:Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  let ay=P.y+P.h;const r=R[f],dh=r[3]*.22,dw=r[2]*.22,ax=SX(P.x+P.w/2);
  if(P.gird||P.cling)ay=P.y+dh-4;
  else if(P.hang||P.climb){const t=P.climb?1-P.climb/.45:0;ay=P.hangRect.y+(dh-4)*(1-t)}
  x.save();x.translate(ax,0);x.scale(P.face,1);x.shadowColor=G.pol===1?BLUE:G.pol===-1?RED:'#59e2c2';x.shadowBlur=G.pol?16:7;
  x.globalAlpha=P.inv&&Math.floor(performance.now()/70)%2?.48:1;
  x.drawImage(bix,r[0],r[1],r[2],r[3],-dw/2,SY(ay)-dh,dw,dh);x.restore();
}
const BIX=img('bix-motion-v2.png');

function frame(t){requestAnimationFrame(frame);const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw()}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);
addEventListener('orientationchange',()=>setTimeout(resize,120));
if(window.ResizeObserver)new ResizeObserver(resize).observe(c);
resize();reset(1);requestAnimationFrame(frame);
})();
