// Level 04: Delivery Attempt (the Transit Deck, Freight Concourse, Depot Market, Signal Spine, Relay Bay and Lift Shaft). Stage 1: boxes first.
// Forked from level3.js: same physics, camera, checkpoints, Pack catch, Magnet Glove and crawlers. Geometry comes from level4-data.js, the Carried
// Core rules from level4-core.js, the glove rules from level3-glove.js, crawlers from level2-enemies.js and Bix/Pack/enemy art from level2-art.js.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const ui=Object.fromEntries(['start','complete','dialogue','speaker','line','prompt','zone','objective','cogCount','slipCount','modeChip','finalCogs','finalTime','finalFalls','resultLine','medal','saveNote','lockNote','touchControls','packCharge','packChargeLabel','heatBar','polLabel','pips','tierLabel','startTier','gloveHud'].map(id=>[id,$(id)]));
const D=window.L4DATA,ART=window.L2ART,EN=window.L2ENEMIES,GL=window.L3GLOVE,CO=window.L4CORE;
function fatal(msg){x.setTransform(1,0,0,1,0,0);x.fillStyle='#071217';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ff8b55';x.font='600 20px system-ui';x.textAlign='center';x.fillText(msg,c.width/2,c.height/2)}
if(!D||!ART||!EN||!GL||!CO){fatal('Level 4 failed to load: '+[!D&&'level4-data.js',!ART&&'level2-art.js',!EN&&'level2-enemies.js',!GL&&'level3-glove.js',!CO&&'level4-core.js'].filter(Boolean).join(', '));return}

const H=720,GRAV=1450,JUMP=780,RUN=285,COG_TOTAL=D.cogs.length,SLIP_TOTAL=D.slips.length,CARRY_MAX=38;
const BLUE='#5fd4ff',RED='#ff8f6a',PRESS_HEAD=96,PRESS_UP=180,CK=CO.consts;
const K={left:0,right:0,down:0,up:0,jump:0,interact:0,blue:0,red:0,shield:0};
let viewW=1280,dpr=1,running=0,done=0,last=0,camX=0,camY=0,cogs=0,slips=0,startTime=0,msgTime=0,msgLock=0,shake=0,flash=0;
let charge=1,prevShield=0,prevRed=0,parryFx=0,G=GL.make(0,CARRY_MAX),reflected=[];
let core={x:0,y:0,w:CK.SIZE,h:CK.SIZE,vx:0,vy:0,held:0,ground:0,support:null,dropTime:0,mode:'carry'},coreDrops=0,lastMode='carry',tellX=null;
let open=new Set(),lit=new Set(),stamps=new Set(),gateAnim={},pending=[],sayQ=[],sayT=0,ending=0,endFx=0,deskDone=0,told=new Set(),lastInc=null,coreFx=-9;

const img=s=>{const a=new Image;a.src='./assets/'+s;return a};
const IMG={};for(const k of Object.keys(ART))IMG[k]=img(k);
// Art: Level 4's own atlas (window.L4ART, made by design/build_l4_art.py) plus Level 3's (steel decks, catwalks, gate, crane, socket, locker are shared).
// Every picture has a plain-shape fallback, so a missing atlas never breaks the level.
const A3=window.L3ART||{atlases:{},spr:{},bg:{}},A4=window.L4ART||{atlases:{},spr:{},bg:{}};
const A={atlases:{...A3.atlases,...A4.atlases},spr:{...A3.spr,...A4.spr},bg:{...A4.bg}};
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
// a sprite at its own aspect ratio: h tall, centred on cx, its bottom on `bottom`
const blitH=(name,cx,bottom,h,flip,alpha)=>{const w=h*(sw(name)||1)/(sh(name)||1);return blit(name,cx-w/2,bottom-h,w,h,flip,alpha)};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const SX=v=>v-camX,SY=v=>v-camY;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const narrow=()=>viewW<700;
const leadTarget=()=>narrow()?(P.vx>40?.14:P.vx<-40?.55:.24):.42;
let lead=.42;
const camLead=()=>lead;
const flatCamY=()=>areaAt(P.x).camY??D.world.camY??-40;

const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,oldGround:0,coyote:0,buffer:0,face:1,falls:0,anim:0,land:0,hang:0,hangRect:null,climb:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0};
const pack={x:0,y:0};
let checkpoint=D.checkpoints[0]||{x:120,y:400,name:'START'};
const seen=new Set();
let enemies=[],packUntil=0;

// Carried cogs (Levels 1 to 3, 0..38) set the shield tier and unlock the level. ?banked=N is a test switch, honoured on localhost only.
const devHost=()=>{try{return !location.hostname||/^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(location.hostname)}catch(e){return true}};
function carried(){
  try{const q=devHost()?new URLSearchParams(location.search).get('banked'):null;if(q!==null&&q!==''&&isFinite(+q))return Math.max(0,Math.min(CARRY_MAX,Math.floor(+q)))}catch(e){}
  try{const p=window.Mayhem&&window.Mayhem.getProgress&&window.Mayhem.getProgress(),MP=window.MayhemProgress;if(p&&MP&&MP.carriedCogs)return MP.carriedCogs(p,'level4')}catch(e){}
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
function line(x0,y0,x1,y1,col,w){x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(SX(x0),SY(y0));x.lineTo(SX(x1),SY(y1));x.stroke()}
const glow=(px,py,r,col,a)=>{const g=x.createRadialGradient(SX(px),SY(py),0,SX(px),SY(py),r);g.addColorStop(0,col);g.addColorStop(1,'transparent');x.save();x.globalAlpha=a;x.fillStyle=g;x.fillRect(SX(px)-r,SY(py)-r,r*2,r*2);x.restore()};

// ---- world queries ---------------------------------------------------------
const onDeck=r=>D.platforms.some(p=>Math.abs(p[1]-r.y)<=4&&r.x+r.w>p[0]&&r.x<p[0]+p[2]);
const gateOpen=g=>open.has(g.id);
function solids(){
  const out=[];
  for(const p of D.platforms)out.push({x:p[0],y:p[1],w:p[2],h:78});
  for(const l of D.ledges)out.push({x:l.x,y:l.y,w:l.w,h:l.h,ledge:1});
  for(const g of D.gates||[])if(!gateOpen(g)&&(gateAnim[g.id]||0)<.5)out.push({x:g.x,y:g.y-g.h,w:g.w,h:g.h,gate:1});
  return out;
}
function areaAt(px){let a=D.areas[0];for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;return a}
const isVertical=a=>!!(a&&a.vertical);
const killYAt=px=>areaAt(px).killY??((D.world.yMax??900)+160);
const phaseOn=(o,now)=>{const t=(((now+o.phase)%o.period)+o.period)%o.period,offEnd=o.period-o.on;return{on:t>=offEnd,tell:t>=offEnd-o.tell&&t<offEnd?(t-(offEnd-o.tell))/o.tell:0}};
const convDir=(cv,now)=>Math.floor(now/(cv.period/2))%2?1:-1;

// ---- messages and checkpoints ---------------------------------------------
function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.45}
function say(lines){for(const l of lines)sayQ.push(l)}
function pumpSay(dt){sayT=Math.max(0,sayT-dt);if(sayT<=0&&sayQ.length){const[s,t]=sayQ.shift();toast(s==='PRIME'?'COURIER PRIME':s,t,2.5,1);sayT=2.5}}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'PACK SPENT'}
function setCP(cp){checkpoint=cp;setCharge(1);GL.refill(G);toast('SYSTEM',`Checkpoint · ${cp.name}`,1.2,0)}

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

// ---- the Carried Core ------------------------------------------------------
const coreBox=()=>({x:core.x,y:core.y,w:core.w,h:core.h});
const coreMode=()=>CO.modeAt(D.zones,core.x+core.w/2);
function placeCoreBeside(){                  // the core is never lost: after a death, a fall or a reset it comes back next to Bix
  core.held=0;core.vx=core.vy=0;core.ground=0;core.support=null;
  core.x=clamp(P.x+P.w/2+P.face*48-core.w/2,0,D.world.w-core.w);core.y=P.y+P.h-core.h;
}
function pickUp(){core.held=1;core.vx=core.vy=0;lastMode=coreMode();ui.modeChip.classList.remove('hidden')}
function setDown(){
  core.held=0;core.vx=P.face*50;core.vy=0;core.x=clamp(P.x+P.w/2+P.face*46-core.w/2,0,D.world.w-core.w);core.y=P.y+P.h-core.h;core.ground=0;
}
function throwCore(){
  core.held=0;core.x=clamp(P.x+P.w/2+P.face*30-core.w/2,0,D.world.w-core.w);core.y=P.y+22;core.vx=P.face*CK.THROW_V+P.vx*.3;core.vy=-CK.THROW_UP;core.ground=0;
}
function updateCore(dt,now,pol){
  core.mode=coreMode();
  if(core.held){core.x=P.x+P.w/2+P.face*24-core.w/2;core.y=P.y+30;core.vx=core.vy=0;core.ground=0;return}
  const gm=core.mode==='heavy'?CK.HEAVY_GRAV:core.mode==='buoy'?CK.BUOY_GRAV:1;
  const cx=P.x+P.w/2,cy=P.y+P.h/2,ccx=core.x+core.w/2,ccy=core.y+core.h/2,dist=Math.hypot(cx-ccx,cy-ccy);
  if(pol===1&&!ending&&dist<CK.CALL_RANGE){                       // Blue calls the core: it flies to Bix and he catches it
    core.vx=(cx-ccx)/(dist||1)*CK.CALL_V;core.vy=(cy-ccy)/(dist||1)*CK.CALL_V;engaged=true;
    if(dist<CK.CATCH_R){pickUp();return}
  }else{
    core.vy+=GRAV*gm*dt;
    if(core.ground)core.vx*=Math.exp(-9*dt);else core.vx*=Math.exp(-.35*dt);
    for(const v of D.vents||[])if(phaseOn(v,now).on&&ccx>v.x&&ccx<v.x+v.w&&ccy>v.y0-60&&ccy<v.y1+60){core.vy=Math.max(-380,core.vy-CK.VENT_ACCEL*dt)}
    if(core.mode==='buoy'&&core.vy>CO.fx('buoy').fall)core.vy=CO.fx('buoy').fall;
  }
  move(core,dt);
  if(core.y>killYAt(core.x)||core.y<D.world.yMin-300){placeCoreBeside();coreDrops++;if(!told.has('drop')){told.add('drop');say([['PACK','Dennis fell. He is back. He is not happy.']])}else toast('SYSTEM','Core returned to checkpoint.',1.6,1)}
  // a heavy core resting on a scale plate opens its gate for good
  for(const p of D.plates||[]){
    if(open.has(p.gate)||core.mode!==p.needs||!core.ground)continue;
    if(ccx>p.x&&ccx<p.x+p.w&&Math.abs(core.y+core.h-p.y)<6){open.add(p.gate);coreFx=now;shake=Math.max(shake,6);toast('SYSTEM','Weight accepted.',1.8,1)}
  }
  // a core passing through a relay node lights it; all three light the gate
  for(const n of D.nodes||[])if(!lit.has(n.id)&&Math.hypot(ccx-n.x,ccy-n.y)<n.r+core.w/2){
    lit.add(n.id);coreFx=now;const k=D.nodes.filter(q=>lit.has(q.id)).length;toast('SYSTEM',`Relay ${k}/${D.nodes.length}`,1.4,1);
    if(D.nodes.every(q=>lit.has(q.id))){for(const g of D.gates)if(g.nodes)open.add(g.id);say([['PACK','Gate open. Dennis regrets nothing.']])}
  }
}
let engaged=false;

// ---- reset / start ---------------------------------------------------------
function buildWorldState(full){
  if(full){open=new Set();lit=new Set();stamps=new Set();gateAnim={};pending=[];deskDone=0;coreDrops=0;told=new Set();lastInc=null;slips=0;endFx=0}
  for(const g of D.gates||[])gateAnim[g.id]=open.has(g.id)?1:0;
  reflected=[];
}
function reset(full=1){
  Object.assign(P,{x:full?(D.checkpoints[0]||{}).x??120:checkpoint.x,y:(full?(D.checkpoints[0]||{}).y??400:checkpoint.y)-P.h,
    vx:0,vy:0,ground:0,coyote:0,buffer:0,falls:full?0:P.falls+1,hang:0,hangRect:null,climb:0,support:null,dropTime:0,jumpTime:0,grabCD:.32,inv:.75});
  lead=leadTarget();pack.x=P.x-65;pack.y=P.y+18;camX=Math.max(0,P.x-viewW*camLead());
  camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):flatCamY();
  enemies=spawnEnemies();buildWorldState(full);sayQ.length=0;sayT=0;ending=0;
  G.heat=0;G.overloaded=false;G.lock=0;G.shieldT=0;GL.refill(G);
  if(full){
    cogs=0;done=0;setCharge(1);
    G=GL.make(carried(),CARRY_MAX);ui.tierLabel.textContent=G.tier.name;ui.startTier.textContent=`Shield: ${G.tier.name} · ${G.banked} carried cogs`;
    startTime=performance.now();checkpoint=D.checkpoints[0]||checkpoint;seen.clear();
    D.cogs.forEach(v=>v.got=0);D.slips.forEach(v=>v.got=0);(D.triggers||[]).forEach(v=>v.used=0);
    core.held=0;core.mode='carry';core.x=D.core.x-core.w/2;core.y=D.core.y-core.h;core.vx=core.vy=0;core.ground=0;core.support=null;
    ui.complete.classList.add('hidden');ui.modeChip.classList.add('hidden');
    try{const q=devHost()?new URLSearchParams(location.search).get('at'):null,cp=q!==null&&D.checkpoints[+q];
      if(cp){checkpoint=cp;seen.add(cp);Object.assign(P,{x:cp.x,y:cp.y-P.h});camX=Math.max(0,P.x-viewW*camLead());
        camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):flatCamY();placeCoreBeside();pickUp()}}catch(e){}
  }else placeCoreBeside();
  ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;ui.slipCount.textContent=`${slips} / ${SLIP_TOTAL}`;
}

// Level 4 opens once Levels 1 to 3 have carried 19 of their 38 cogs (progress.js has the rule; this is the same test, on the same numbers)
const UNLOCK=(window.MayhemProgress&&window.MayhemProgress.LEVEL4_UNLOCK_COGS)||19;
const locked=()=>carried()<UNLOCK;
function refreshLock(){
  if(!running&&!done){const t=GL.tierFor(carried(),CARRY_MAX);if(G.tier!==t||G.banked!==Math.min(CARRY_MAX,carried())){G=GL.make(carried(),CARRY_MAX);ui.tierLabel.textContent=G.tier.name;ui.startTier.textContent=`Shield: ${G.tier.name} · ${G.banked} carried cogs`}}
  const l=locked(),b=$('startButton');
  if(b)b.disabled=l;
  if(ui.lockNote){ui.lockNote.hidden=!l;ui.lockNote.textContent=l?`Level 4 is locked. Carry ${UNLOCK} of the 38 cogs from Levels 1 to 3 to open it (${carried()} so far).`:''}
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
  if(code==='KeyR'&&on&&running&&!done&&!ending)reset(0);
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

// ---- physics (ported from Level 3) -----------------------------------------
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
    if(r.gate)continue;                                  // a gate is a wall: never a lip to hang from
    if(hand<r.y-18||hand>r.y+32)continue;
    const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);
    if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;break}
  }
}
// Pack's catch spends the single charge to save a death; otherwise respawn with one of Nib's incident reports.
function hurt(cause){
  if(P.inv||done||ending)return;
  if(charge){const now=performance.now()/1000;setCharge(0);packUntil=now+1.1;P.inv=1.2;P.vx=0;P.vy=0;P.buffer=0;P.coyote=0;P.jumpTime=0;P.x=checkpoint.x;P.y=checkpoint.y-P.h;shake=12;
    P.hang=0;P.climb=0;P.hangRect=null;P.support=null;P.dropTime=0;P.grabCD=.32;
    if(core.held)pickUp();else placeCoreBeside();
    seen.add(checkpoint);toast('PACK','Got you. That counts as overtime.',2.1,1);return}
  shake=18;flash=.18;reset(0);
  const inc=CO.incident(cause,P.falls,lastInc);lastInc={cause,v:inc.v};toast(inc.who,inc.text,2.6,1);
}
function shieldTakes(now){       // a shield that is up soaks one hit from a crane, an arc or a bolt
  if(!GL.shieldActive(G))return false;
  parryFx=now;P.inv=Math.max(P.inv,1);toast('SYSTEM',`[SHIELD ACTIVE] Kinetic energy dispersed. Charges remaining: ${G.charges}.`,1.8,1);return true;      // a soaked hit buys a second: a rail stays live longer than the shield window
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
function shieldEffects(now){
  if(!GL.shieldActive(G)||!G.tier.parry)return;
  const sb={x:P.x-24,y:P.y-12,w:P.w+48,h:P.h+24};let parried=false;
  for(const e of enemies)if(!e.dead&&e.type==='crawler'&&overlap(sb,EN.hazard(e)||{x:-9,y:-9,w:1,h:1})){e.dead=1;e.dissolveAt=now;parried=true}
  if(parried){if(G.tier.emp)for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<GL.consts.EMP_RANGE)EN.stun(e);
    parryFx=now;toast('SYSTEM',`[SHIELD ACTIVE] Kinetic energy dispersed. Charges remaining: ${G.charges}.`,1.8,1)}
}

// ---- hazards and moving parts ----------------------------------------------
function updateWorld(dt,now){
  for(const g of D.gates||[])gateAnim[g.id]+=((gateOpen(g)?1:0)-gateAnim[g.id])*Math.min(1,dt*3);
  for(let i=pending.length-1;i>=0;i--)if(now>=pending[i].at){open.add(pending[i].id);toast('SYSTEM',`${(D.gates.find(g=>g.id===pending[i].id)||{}).name||'Gate'} open.`,1.8,1);pending.splice(i,1)}
  // belts carry whoever stands on them; a loose core too
  for(const cv of D.conveyors||[]){
    const v=convDir(cv,now)*cv.sp;
    for(const a of [P,core.held?null:core]){if(!a||!a.ground||!a.support||Math.abs(a.support.y-cv.y)>2)continue;
      const mid=a.x+a.w/2;if(mid>cv.x&&mid<cv.x+cv.w){a.x=clamp(a.x+v*dt,0,D.world.w-a.w)}}
  }
  // updrafts lift Bix, and a loose core (in updateCore)
  const cx=P.x+P.w/2,cy=P.y+P.h/2;
  for(const v of D.vents||[])if(phaseOn(v,now).on&&cx>v.x&&cx<v.x+v.w&&cy>v.y0&&cy<v.y1+40){P.vy=Math.max(-420,P.vy-CK.VENT_ACCEL*dt);P.ground=0}
  for(const b of D.bolts||[]){const st=phaseOn(b,now);
    if(st.on&&overlap(P,{x:b.x,y:b.y0,w:b.w,h:b.y1-b.y0})&&!(core.held&&core.mode==='buoy')){if(shieldTakes(now))continue;hurt('bolt');return}}
  for(const a of D.arcs||[]){const st=phaseOn(a,now);
    if(st.on&&overlap(P,a)){if(shieldTakes(now))continue;hurt('arc');return}}
  for(const s of D.presses||[]){const ps=pressState(s,now);if(ps.lethal&&overlap(P,ps.rect)){if(shieldTakes(now))continue;hurt('crane');return}}
}

// ---- update ----------------------------------------------------------------
function update(dt){
  if(!running||done)return;
  const now=performance.now()/1000;
  msgLock=Math.max(0,msgLock-dt);P.inv=Math.max(0,P.inv-dt);P.dropTime=Math.max(0,P.dropTime-dt);
  P.jumpTime=Math.max(0,P.jumpTime-dt);P.grabCD=Math.max(0,P.grabCD-dt);
  const shieldEdge=!!K.shield&&!prevShield;prevShield=K.shield;
  const pol=!G.overloaded?GL.polarity(!!K.blue,!!K.red):0;
  engaged=false;pumpSay(dt);
  const mode=core.held?core.mode:'carry',fx=CO.fx(mode),runX=RUN*fx.run,jumpX=JUMP*fx.jump;
  if(ending){                                                     // the delivery: Bix stands at the socket while the lift starts
    ending-=dt;P.vx=0;P.vy=0;P.buffer=0;shake=Math.max(shake,3);if(endFx<1)endFx=Math.min(1,endFx+dt*.3);
    if(ending<=0)finish();
  }else{
    if(P.climb){
      P.climb=Math.max(0,P.climb-dt);const p=1-P.climb/.45,r=P.hangRect,e=p*p*(3-2*p);
      P.x=P.climbX+(P.climbTarget-P.climbX)*e;P.y=r.y-19-(P.h-19)*e;
      if(!P.climb){P.y=r.y-P.h;P.ground=1;P.support=r;P.hangRect=null;P.grabCD=.28}
    }else if(P.hang){
      P.vx=P.vy=0;P.ground=0;
      if(K.down||(P.face>0&&K.left)||(P.face<0&&K.right)){P.hang=0;P.hangRect=null;P.vy=100;P.grabCD=.35}
      else if(P.buffer||now-P.hangAt>.18){P.hang=0;P.climb=.45;P.climbX=P.x;P.climbTarget=P.face>0?P.hangRect.x+8:P.hangRect.x+P.hangRect.w-P.w-8;P.buffer=0}
    }else{
      if(K.down&&P.ground&&P.support?.ledge&&!onDeck(P.support)){P.grabCD=.4;P.dropTime=.25;P.ground=0;P.y+=5;P.coyote=0}
      const input=(K.right?1:0)-(K.left?1:0);
      if(input)P.face=input;
      P.vx+=(input*runX-P.vx)*(1-Math.exp(-(P.ground?(input?10:16):(input?4.6:1.6))*dt));
      if(!input&&Math.abs(P.vx)<.6)P.vx=0;
      P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);
      if(P.buffer&&P.coyote){P.vy=-jumpX;P.jumpTime=.18;P.buffer=P.coyote=0;P.ground=0;P.support=null}
      if(!K.jump&&!P.jumpTime&&P.vy<0)P.vy+=1500*fx.grav*dt;
      P.vy+=GRAV*fx.grav*dt;
      if(fx.fall&&P.vy>fx.fall)P.vy=fx.fall;                       // a buoyant core lets Bix glide
      P.oldGround=P.ground;move(P,dt);grab(now);
    }
  }
  if(P.ground&&!P.oldGround)P.land=.14;P.land=Math.max(0,P.land-dt);P.anim+=Math.abs(P.vx)*dt/58;

  // the core: E sets it down or picks it up, Red throws it, Blue calls it back
  if(!ending&&core.held&&K.red&&!prevRed&&!G.overloaded){throwCore();engaged=true}
  prevRed=K.red;
  updateCore(dt,now,pol);
  if(!ending)updateWorld(dt,now);
  const gs=GL.update(G,dt,{blue:K.blue,red:K.red,engaged,shield:shieldEdge});
  if(gs.shieldEmpty)toast('SYSTEM','[CRITICAL] Capacitor depleted. Manual grounding required.',2,1);

  // Pack's amber tell: a mode change is coming
  if(core.held){
    if(core.mode!==lastMode){lastMode=core.mode;toast('PACK',core.mode==='heavy'?'Dennis is going heavy. Please bend your knees.':core.mode==='buoy'?'Dennis is light now. So is my confidence.':core.mode==='charge'?'Dennis is charged. Please stop touching the rails.':'Dennis is normal. Enjoy it.',2.4,0);shake=Math.max(shake,4)}
    const nx=CO.nextChange(D.zones,core.x+core.w/2,CK.TELL);tellX=nx?nx.x:null;
  }else tellX=null;

  if(packUntil<=now)packUntil=0;
  pack.x+=(P.x-P.face*58-pack.x)*Math.min(1,dt*5);pack.y+=(P.y+18-pack.y)*Math.min(1,dt*4);

  const world={player:{x:P.x,y:P.y,w:P.w,h:P.h},dt};
  for(const e of enemies)EN.update(e,dt,now,world);
  shieldEffects(now);
  for(const e of enemies){const hz=EN.hazard(e);if(hz&&overlap(P,hz)){if(shieldTakes(now))continue;hurt('enemy');break}}
  enemies=enemies.filter(e=>!e.dead||now-(e.dissolveAt??now)<.55);
  if(!ending&&P.y>killYAt(P.x))hurt('fall');

  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;cogs++;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
    toast('PACK',cogs===12?'Cog 12. Difficult. Recorded as "showing off."':`Cog ${cogs} secured.`,cogs===12?3:1.4,1)}
  for(const q of D.slips)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;slips++;ui.slipCount.textContent=`${slips} / ${SLIP_TOTAL}`;
    toast('SYSTEM',`Slip ${slips}/${SLIP_TOTAL}: ${q.t}`,4.2,1);
    if(slips===SLIP_TOTAL)say([['PACK','Full set of slips. We are now a filing cabinet.']])}
  for(const t of D.triggers||[])if(!t.used&&P.x>t.x&&(t.y0===undefined||(P.y>=t.y0&&P.y<=t.y1))){t.used=1;say(t.say);if(t.opens)pending.push({id:t.opens,at:now+(t.delay||3)})}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&D.checkpoints.indexOf(cp)>D.checkpoints.indexOf(checkpoint)&&P.x>cp.x-40&&Math.abs(P.y+P.h-cp.y)<80){seen.add(cp);setCP(cp)}

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
const qs=sel=>document.querySelector?document.querySelector(sel):null;
const gbtn={blue:qs('.touch-glove .blue'),red:qs('.touch-glove .red'),shield:qs('.touch-glove .shield')},gwrap=qs('.touch-glove');
function hud(){
  if(gwrap){gwrap.classList.toggle('overload',!!G.overloaded);
    if(gbtn.blue)gbtn.blue.classList.toggle('on',!!K.blue&&!G.overloaded);
    if(gbtn.red)gbtn.red.classList.toggle('on',!!K.red&&!G.overloaded);
    if(gbtn.shield){gbtn.shield.dataset.charges=G.charges;gbtn.shield.classList.toggle('empty',!G.charges)}}
  ui.heatBar.style.width=Math.round(G.heat)+'%';
  ui.heatBar.className=G.overloaded?'lock':G.heat>=GL.consts.WARN?'warn':'';
  ui.polLabel.textContent=G.overloaded?'OVERLOAD':G.pol===1?'BLUE +':G.pol===-1?'RED -':'NEUTRAL';
  const pips='●'.repeat(G.charges)+'○'.repeat(G.tier.charges-G.charges);
  if(ui.pips.textContent!==pips)ui.pips.textContent=pips;
  const f=CO.fx(core.mode),txt=core.held?`CORE · ${f.label}${tellX!==null?' · CHANGE AHEAD':''}`:'CORE · SET DOWN';
  if(ui.modeChip.textContent!==txt)ui.modeChip.textContent=txt;
  ui.modeChip.style.borderColor=core.held&&tellX!==null?'#ffb43c':f.color;ui.modeChip.style.color=f.color;
}

// ---- interaction (one ACT button, context label) ---------------------------
const near=(o,r)=>Math.hypot(P.x+P.w/2-o.x,P.y+P.h/2-(o.y-48))<r;
const nearCore=r=>Math.hypot(P.x+P.w/2-(core.x+core.w/2),P.y+P.h/2-(core.y+core.h/2))<r;
function interact(now){
  let label='',act=null;
  const st=D.stamps.find(s=>!stamps.has(s.id)&&near(s,110)),desk=D.desk,sk=D.socket;
  if(!ending&&near(sk,130)&&(core.held||nearCore(160))){label='ACT · SEAT THE CORE';act=()=>seatCore(now)}
  else if(st){label=`ACT · GET STAMP · ${st.name}`;act=()=>{stamps.add(st.id);toast('SYSTEM',`Stamp ${stamps.size}/3: ${st.name}`,2,1)}}
  else if(!ending&&near(desk,150)&&!deskDone){label=stamps.size<3?`CUSTOMS DESK · ${stamps.size} / 3 STAMPS`:'ACT · HAND OVER THE CORE';
    if(stamps.size>=3&&(core.held||nearCore(200)))act=()=>{deskDone=1;open.add('g2');say([['CUSTOMS DESK','Core approved. Enjoy your delivery.'],['CUSTOMS DESK','Last signature for the surface lift: technician BX-7.'],['SYSTEM','(Bix pockets the slip. Pack looks at the ceiling.)']])}
    else if(stamps.size<3)act=()=>toast('SYSTEM','Core needs 3 stamps.',2,1)}
  else if(!ending&&core.held){label='ACT · SET DOWN THE CORE';act=()=>{setDown();if(!told.has('down')){told.add('down');say([['PACK','Dennis is down. Dennis is fine. Dennis is judging you.']])}}}
  else if(!ending&&!core.held&&nearCore(CK.PICKUP_R)){label='ACT · PICK UP THE CORE';act=()=>{pickUp();if(!told.has('pick')){told.add('pick');say([['BIX','Delivery. That is all this is.'],['PACK','Bold. Last time you said "one relay."'],['PACK','I have filed it as Dennis. Cargo, fragile, emotional.'],['BIX','Do not name the cargo.'],['PACK','Too late. Dennis has a form.']])}}}
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);
  if(!K.interact)return;
  K.interact=0;
  if(act)act();
}
function seatCore(now){
  ending=9.5;core.held=0;core.x=D.socket.x-core.w/2;core.y=D.socket.y-core.h-6;core.vx=core.vy=0;coreFx=now;flash=.3;
  say([['SYSTEM','Core seated.'],['SYSTEM','AUTHORISED: BX-7'],['PACK','Display glitch.'],['BIX','Yeah.'],['PACK','Good news: the lift works. Bad news: I do not know where it goes.'],['BIX','Up. It goes up.'],['PACK','Bix. That is light. Actual light.'],['BIX','Thanks, Dennis.'],['PACK','He heard that.']]);
}

// Medals. Gold: 10 cogs, 10 falls, 18:00. Silver: 6 cogs, 25 falls, 25:00. Bronze: any delivery.
const MEDALS=[
  {name:'GOLD',cogs:10,falls:10,sec:1080,who:'PACK',line:'Delivered, stamped, and mildly suspicious. Dennis is very proud.'},
  {name:'SILVER',cogs:6,falls:25,sec:1500,who:'PACK',line:'Delivered. Several incidents. Nib is not surprised.'},
  {name:'BRONZE',cogs:0,falls:1e9,sec:1e9,who:'BIX',line:'Delivered. That is all this was.'},
];
const medalFor=(cg,f,t)=>MEDALS.find(m=>cg>=m.cogs&&f<=m.falls&&t<=m.sec);
function saveResult(level,sec,cogsN,falls){const M=window.Mayhem;if(!M||!ui.saveNote)return;M.recordResult(level,{timeSec:sec,cogs:cogsN,falls}).then(t=>{ui.saveNote.textContent=t;ui.saveNote.hidden=!t}).catch(()=>{})}
function finish(){
  if(done)return;
  done=1;running=0;ui.touchControls.classList.remove('playing');
  const sec=Math.max(1,Math.floor((performance.now()-startTime)/1000)),m=medalFor(cogs,P.falls,sec);
  ui.finalCogs.textContent=`${cogs} / ${COG_TOTAL}`;
  ui.finalTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  ui.finalFalls.textContent=P.falls;
  ui.medal.textContent=m.name;ui.medal.dataset.medal=m.name.toLowerCase();
  ui.resultLine.textContent=`${m.who}: “${m.line}” NIB: ${CO.tally(P.falls)}`+(coreDrops===0?' Careful Courier: the core never touched the floor of the world.':'')+(slips===SLIP_TOTAL?' All six slips found.':'');
  ui.complete.classList.remove('hidden');
  saveResult('level4',sec,cogs,P.falls);
}

// ---- drawing (stage 1: plain shapes) --------------------------------------------------------------------------------------------
const AREA_COL={deck:['#14212c','#0e1820'],freight:['#2a1d12','#150e08'],market:['#16301f','#0b1a11'],spine:['#12283a','#0a1620'],relay:['#241638','#100a1a'],shaft:['#331715','#170b0a']};
function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;
  dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const s=c.height/H;viewW=c.width/s;x.setTransform(s,0,0,s,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high'}
function chevrons(px,py,w,h,dir,col){
  x.save();x.strokeStyle=col;x.lineWidth=2;
  for(let i=8;i<w;i+=22){const cx=SX(px+i),cy=SY(py+h/2);x.beginPath();x.moveTo(cx-5,cy+4*dir);x.lineTo(cx,cy-4*dir);x.lineTo(cx+5,cy+4*dir);x.stroke()}
  x.restore();
}
// one painted strip per area, tiled, drifting slower than the world; two are blended for a few hundred px around an area border
function bgStrip(id,alpha){
  const b=A.bg[id],im=BGI[id];if(!b||!ready(im))return 0;
  const dh=H*1.08,dw=b.w*dh/b.h,oy=Math.max(-(dh-H),Math.min(0,-(dh-H)*.5-(camY-(D.world.camY??-40))*.05));
  let ox=-((camX*.28)%dw);x.save();x.globalAlpha=Math.max(0,Math.min(1,alpha));
  let ti=Math.floor((camX*.28)/dw);
  for(;ox<viewW;ox+=dw,ti++){                // every other tile is mirrored, so the edges always meet
    if(ti&1){x.save();x.translate(Math.round(ox)+Math.ceil(dw)+1,0);x.scale(-1,1);x.drawImage(im,0,oy,Math.ceil(dw)+1,dh);x.restore()}
    else x.drawImage(im,Math.round(ox),oy,Math.ceil(dw)+1,dh)}
  x.restore();return 1;
}
function drawBackdrop(){
  const a=areaAt(camX+viewW/2),col=AREA_COL[a.id]||AREA_COL.deck,g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);
  x.fillStyle=g;x.fillRect(-20,-20,viewW+40,H+40);
  const mid=camX+viewW/2,as=D.areas,cur=areaAt(mid),k=as.indexOf(cur),blend=260,prev=as[k-1],next=as[k+1];
  if(bgStrip(cur.id,1)){
    if(prev&&mid<cur.x0+blend)bgStrip(prev.id,1-(mid-(cur.x0-blend))/(2*blend));
    if(next&&mid>cur.x1-blend)bgStrip(next.id,(mid-(cur.x1-blend))/(2*blend));
    x.fillStyle='rgba(4,8,12,.18)';x.fillRect(-20,-20,viewW+40,H+40);
  }else{
    x.save();x.globalAlpha=.16;x.fillStyle='#000';                    // far girders, drifting slower than the world
    for(let i=-1;i<viewW/260+2;i++){const bx=i*260-((camX*.3)%260);x.fillRect(bx,H*.28,34,H)}
    x.restore();
  }
}
function drawCore(now){
  const cx=core.x+core.w/2,cy=core.y+core.h/2,f=CO.fx(core.mode),col=f.color;
  glow(cx,cy,core.held?58:44,col,core.mode==='charge'?.5:.3);
  const bob=core.mode==='buoy'&&!core.held?Math.sin(now*3)*4:0;
  if(blitH('core-'+core.mode,cx,cy+bob+24,52)){
    if(core.mode==='charge'){x.save();x.globalCompositeOperation='lighter';x.strokeStyle='rgba(220,200,255,.85)';x.lineWidth=2;x.beginPath();x.moveTo(SX(cx-16),SY(cy-22));x.lineTo(SX(cx-4),SY(cy-10+Math.sin(now*40)*3));x.lineTo(SX(cx-10),SY(cy-2));x.lineTo(SX(cx+4),SY(cy+10));x.stroke();x.restore()}
    return;
  }
  x.save();x.translate(SX(cx),SY(cy+bob));
  x.fillStyle='#1c2a33';x.strokeStyle=col;x.lineWidth=3;
  x.beginPath();x.roundRect?x.roundRect(-20,-20,40,40,9):x.rect(-20,-20,40,40);x.fill();x.stroke();
  x.fillStyle=col;x.beginPath();x.arc(0,0,8,0,7);x.fill();
  if(core.mode==='heavy'){x.fillRect(-16,12,32,5)}
  else if(core.mode==='buoy'){x.strokeStyle=col;x.lineWidth=2;x.beginPath();x.moveTo(-10,-24);x.lineTo(0,-32);x.lineTo(10,-24);x.stroke()}
  else if(core.mode==='charge'){x.strokeStyle='#e6d8ff';x.lineWidth=2;x.beginPath();x.moveTo(-14,-22);x.lineTo(-4,-12);x.lineTo(-10,-6);x.lineTo(2,4);x.stroke()}
  x.restore();
}
const GATE_ART={g1:'gate-sorting',g2:'gate-customs',g3:'gate-relay',g4:'gate-cage'};
function drawWorld(now){
  D.platforms.forEach(p=>{
    const th=Math.max(60,Math.min(100,p[2]/4.9)),aid=areaAt(p[0]+p[2]/2).id;
    if(A.spr['deck-'+aid]){const y0=p[1]-8+th-6,hh=Math.min(150,(p[3]||78)+30);if(A.spr['hull-'+aid])blit('hull-'+aid,p[0]+4,y0-6,p[2]-8,hh);blit('deck-'+aid,p[0]-6,p[1]-8,p[2]+12,th);return}
    if(A.spr.steel&&A.spr.hull){const y0=p[1]-8+th-6,hh=Math.min(150,(p[3]||78)+30);blit('hull',p[0]+4,y0-6,p[2]-8,hh);blit('steel',p[0]-6,p[1]-8,p[2]+12,th);return}
    box(p[0],p[1],p[2],p[3]||78,'#1a2e36','#48707a');x.fillStyle='#ffc84a';x.fillRect(SX(p[0]),SY(p[1]),p[2],4)});
  for(const l of D.ledges){if(blit('ledge-'+areaAt(l.x+l.w/2).id,l.x-4,l.y-8,l.w+8,34)||blit('steel-thin',l.x-4,l.y-8,l.w+8,34))continue;box(l.x,l.y,l.w,l.h,'#3a5560','#7d9aa5');x.fillStyle='#ffc84a';x.fillRect(SX(l.x),SY(l.y),l.w,3)}
  blitH('cradle',D.core.x,D.core.y+3,26);
  for(const p of D.plates||[]){const on=open.has(p.gate);if(!blit(on?'scale-plate-on':'scale-plate',p.x-4,p.y-24,p.w+8,28))box(p.x,p.y-8,p.w,8,on?'#2f6b4f':'#7a5a24','#ffb43c');chevrons(p.x,p.y-30,p.w,20,1,on?'#7ff0b0':'#ffb43c');
    x.save();x.fillStyle=on?'#7ff0b0':'#ffd75a';x.font='800 13px system-ui';x.textAlign='center';x.fillText(on?'WEIGHT OK':'HEAVY SCALE',SX(p.x+p.w/2),SY(p.y-38));x.restore()}
  for(const cv of D.conveyors||[]){const d=convDir(cv,now);if(!blit('belt',cv.x-6,cv.y-24,cv.w+12,28))box(cv.x,cv.y-10,cv.w,10,'#33383c','#7d8a92');
    x.save();x.strokeStyle='#ffb43c';x.lineWidth=3;for(let i=10;i<cv.w;i+=34){const px=SX(cv.x+((i+now*cv.sp*d)%cv.w+cv.w)%cv.w),py=SY(cv.y-5);x.beginPath();x.moveTo(px-6*d,py-5);x.lineTo(px+4*d,py);x.lineTo(px-6*d,py+5);x.stroke()}x.restore()}
  for(const v of D.vents||[]){const st=phaseOn(v,now),h=v.y1-v.y0;
    x.save();x.globalAlpha=st.on?.28:st.tell>0?.14+.14*(Math.floor(now*10)%2):.06;x.fillStyle=st.tell>0?'#ffb43c':'#9fd0e6';x.fillRect(SX(v.x),SY(v.y0),v.w,h);x.restore();
    if(st.on)chevrons(v.x,v.y0,v.w,h,-1,'#d6f2ff');if(!blit('vent',v.x-4,v.y1-46,v.w+8,50))box(v.x,v.y1,v.w,10,'#33383c','#7d8a92')}
  for(const b of D.bolts||[]){const st=phaseOn(b,now);
    if(st.on){x.save();x.strokeStyle='#fff';x.lineWidth=5;x.shadowColor='#bfe4ff';x.shadowBlur=24;x.beginPath();let px=SX(b.x+b.w/2),py=SY(b.y0-200);x.moveTo(px,py);for(let k=1;k<=9;k++){px=SX(b.x+b.w/2+Math.sin(now*60+k*2.3)*18);py=SY(b.y0-200+(b.y1-b.y0+200)*k/9);x.lineTo(px,py)}x.stroke();x.restore()}
    else if(st.tell>0){x.save();x.strokeStyle=`rgba(255,180,60,${.3+.6*(Math.floor(st.tell*8)%2)})`;x.setLineDash([6,10]);x.lineWidth=3;x.beginPath();x.moveTo(SX(b.x+b.w/2),SY(b.y0));x.lineTo(SX(b.x+b.w/2),SY(b.y1));x.stroke();x.restore()}}
  for(const a of D.arcs||[]){const st=phaseOn(a,now),my=a.y+a.h/2;
    if(!(blitH('arc-post',a.x-3,a.y+a.h+4,a.h+18)&&blitH('arc-post',a.x+a.w+3,a.y+a.h+4,a.h+18))){box(a.x-8,a.y,10,a.h,'#2c3a40','#7d9aa5');box(a.x+a.w-2,a.y,10,a.h,'#2c3a40','#7d9aa5')}
    if(st.on){x.save();x.strokeStyle='#e6d8ff';x.lineWidth=4;x.shadowColor='#b58cff';x.shadowBlur=22;x.beginPath();x.moveTo(SX(a.x+2),SY(my));for(let k=1;k<=8;k++)x.lineTo(SX(a.x+2+(a.w-4)*k/8),SY(my+Math.sin(now*70+k*3)*24));x.stroke();x.restore()}
    else{x.save();x.strokeStyle=st.tell>0?`rgba(255,180,60,${.4+.6*(Math.floor(st.tell*8)%2)})`:'rgba(181,140,255,.22)';x.setLineDash([4,10]);x.lineWidth=2;x.beginPath();x.moveTo(SX(a.x+2),SY(my));x.lineTo(SX(a.x+a.w-2),SY(my));x.stroke();x.restore();if(st.tell>0)glow(a.x+a.w/2,my,50,'#ffb43c',.5)}}
  for(const n of D.nodes||[]){const on=lit.has(n.id);glow(n.x,n.y,n.r*1.6,on?'#7ff0b0':'#b58cff',on?.5:.25);
    if(blit(on?'relay-node-on':'relay-node',n.x-n.r,n.y-n.r,n.r*2,n.r*2))continue;
    x.save();x.strokeStyle=on?'#7ff0b0':'#b58cff';x.lineWidth=4;x.beginPath();x.arc(SX(n.x),SY(n.y),n.r,0,7);x.stroke();x.lineWidth=2;x.beginPath();x.arc(SX(n.x),SY(n.y),n.r*.55+Math.sin(now*4)*3,0,7);x.stroke();x.restore()}
  for(const s of D.presses||[]){const ps=pressState(s,now);
    const HD=A.spr['crane-container']?'crane-container':'press-head',RD=A.spr['crane-cable']?'crane-cable':'press-rod';
    if(A.spr[HD]){const hw=s.w+22,hh=hw*sh(HD)/sw(HD),top=PRESS_UP-PRESS_HEAD-120;
      blit(RD,s.x+s.w/2-11,top,22,ps.bottom-hh+10-top);blit(HD,s.x-11,ps.bottom-hh+8,hw,hh);
      if(ps.lethal){x.save();x.globalAlpha=.16;x.fillStyle='#ff3a20';x.fillRect(SX(ps.rect.x),SY(ps.rect.y),ps.rect.w,ps.rect.h);x.restore()}
    }else{
    box(s.x+s.w/2-8,PRESS_UP-PRESS_HEAD-40,16,ps.bottom-PRESS_HEAD-(PRESS_UP-PRESS_HEAD-40),'#26343b');
    box(ps.rect.x,ps.rect.y,ps.rect.w,ps.rect.h,ps.lethal?'#a02a20':'#3a4a52',ps.tell>0?'#ffb43c':'#7d9aa5');
    x.fillStyle='#ffc84a';x.fillRect(SX(ps.rect.x),SY(ps.rect.y+ps.rect.h-10),ps.rect.w,10);}
    if(ps.tell>0){x.save();x.strokeStyle='#ffb43c66';x.setLineDash([6,10]);x.beginPath();x.moveTo(SX(s.x),SY(ps.bottom));x.lineTo(SX(s.x),SY(s.anvil));x.moveTo(SX(s.x+s.w),SY(ps.bottom));x.lineTo(SX(s.x+s.w),SY(s.anvil));x.stroke();x.restore()}}
  for(const g of D.gates||[]){const o=gateAnim[g.id]||0,top=g.y-g.h-o*(g.h+30);
    if(o<.98){x.save();x.globalAlpha=1-o*.7;if(!(GATE_ART[g.id]&&blit(GATE_ART[g.id],g.x+g.w/2-50,top,100,g.h))&&!blit('hazard-door',g.x-32,top,90,g.h))box(g.x,top,g.w,g.h,'#3a4a52','#ffb43c');
      x.fillStyle='#ffb43c';x.font='800 12px system-ui';x.textAlign='center';x.fillText(g.name,SX(g.x+g.w/2),SY(top-8));x.restore()}}
  for(const s of D.stamps){const got=stamps.has(s.id),art=s.id==='st1'?'vending-bot':s.id==='st2'?'busker-bot':'locker';
    if(!blitH(art,s.x,s.y,art==='locker'?96:art==='busker-bot'?74:86,1,got?.6:1))box(s.x-22,s.y-74,44,74,got?'#2d5a3f':'#3a4a30','#9bb05a');x.fillStyle=got?'#7ff0b0':'#ffd75a';x.font='800 11px system-ui';x.textAlign='center';x.fillText(s.name,SX(s.x),SY(s.y-82))}
  {const d=D.desk;if(!blitH('customs-desk',d.x,d.y,84,1,deskDone?.7:1))box(d.x-40,d.y-70,80,70,deskDone?'#2d5a3f':'#3a3a4a','#9aa0c8');x.fillStyle='#e6e9ff';x.font='800 11px system-ui';x.textAlign='center';x.fillText('CUSTOMS',SX(d.x),SY(d.y-78))}
  {const s=D.socket;if(!blitH('lift-socket',s.x,s.y,112))box(s.x-30,s.y-96,60,96,'#26343b','#7d9aa5');glow(s.x,s.y-60,80,ending?'#9fffd0':'#ffb43c',.4+.2*Math.sin(now*4));
    x.fillStyle=ending?'#9fffd0':'#ffb43c';x.beginPath();x.arc(SX(s.x),SY(s.y-60),12,0,7);x.fill();x.fillStyle='#e6f6ee';x.font='800 12px system-ui';x.textAlign='center';x.fillText('LIFT SOCKET',SX(s.x),SY(s.y-108))}
  for(const q of D.slips)if(!q.got){if(blitH('slip',q.x,q.y+16+Math.sin(now*2+q.id)*4,32))continue;x.save();x.translate(SX(q.x),SY(q.y+Math.sin(now*2+q.id)*4));x.fillStyle='#e8ecef';x.strokeStyle='#8a9aa5';x.lineWidth=2;x.fillRect(-11,-14,22,28);x.strokeRect(-11,-14,22,28);x.strokeStyle='#5a6a75';for(let k=-7;k<9;k+=6){x.beginPath();x.moveTo(-6,k);x.lineTo(6,k);x.stroke()}x.restore()}
}
function cog(q,i,now){
  if(q.got)return;
  const bob=Math.sin(now*2+i)*5;
  x.save();x.translate(SX(q.x),SY(q.y+bob));x.rotate(now*.55*(i%2?1:-1));x.shadowColor='#5ff7de';x.shadowBlur=9;
  if(cogImg.complete&&cogImg.naturalWidth){const[sx,sy,sw,sh]=COG_SRC,h=54,w=h*sw/sh;x.drawImage(cogImg,sx,sy,sw,sh,-w/2,-h/2,w,h)}
  else{x.fillStyle=q.route==='mastery'?'#ff9d23':'#ffd75a';x.beginPath();x.arc(0,0,16,0,7);x.fill()}
  x.restore();
}
const cogImg=img('energy-cog-v1.png'),COG_SRC=[53,57,1148,1117];
const ENEMY_PLATE={crawler:'enemy-crawler-v2.png'};
function drawEnemy(e,now){
  const plate=ENEMY_PLATE[e.type];if(!plate)return;
  const ph=EN.phaseName?EN.phaseName(e):'',tell=EN.tell?EN.tell(e):0;
  const cell=e.stun?6:ph==='wake'?5:ph==='turn'?4:Math.hypot(P.x-e.x,P.y-e.y)<72?7:Math.floor(now*7)%4;
  const hz=EN.hazard(e),flip=e.dir<0?-1:1,cx=e.x+e.w/2,bottom=e.y+e.h+3;
  if(tell>0&&!hz){x.save();x.globalAlpha=.25+tell*.5;x.fillStyle='#ffb43c';x.beginPath();x.arc(SX(cx),SY(bottom-80),14+tell*10,0,7);x.fill();x.restore()}
  if(!sprite(plate,cell,cx,bottom,62,flip,0))box(e.x,e.y,e.w,e.h,'#8a2a20','#ff4d3a');
}
function bolt(hx,hy,ang,len,seed,now){
  x.beginPath();x.moveTo(SX(hx),SY(hy));
  for(let k=1;k<=6;k++){const t=k/6,j=Math.sin(now*47+seed*3.1+k*5.3)*9*(1-t*.4);
    x.lineTo(SX(hx+Math.cos(ang)*len*t-Math.sin(ang)*j),SY(hy+Math.sin(ang)*len*t+Math.cos(ang)*j))}
  x.stroke();
}
function chevron(px,py,ang,size){x.save();x.translate(SX(px),SY(py));x.rotate(ang);x.beginPath();x.moveTo(-size,-size);x.lineTo(0,0);x.lineTo(-size,size);x.stroke();x.restore()}
function drawGloveFx(now){
  const cx=P.x+P.w/2,cy=P.y+P.h/2,hx=cx+P.face*30,hy=cy-8,pol=!G.overloaded?G.pol:0;
  let gr;
  x.save();x.globalCompositeOperation='lighter';x.lineCap='round';x.lineJoin='round';
  try{
  if(pol){
    const inward=pol===1,col=inward?'95,212,255':'255,143,106',pulse=.75+.25*Math.sin(now*22);
    gr=x.createRadialGradient(SX(hx),SY(hy),0,SX(hx),SY(hy),58);
    gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.22,`rgba(${col},.8)`);gr.addColorStop(1,`rgba(${col},0)`);
    x.globalAlpha=pulse;x.fillStyle=gr;x.fillRect(SX(hx)-58,SY(hy)-58,116,116);
    x.globalAlpha=1;x.lineWidth=3;
    for(let k=0;k<3;k++){const t=(now*1.15+k/3)%1,r=inward?104-t*80:22+t*82;
      x.strokeStyle=`rgba(${col},${inward?.12+.55*t:.6*(1-t)})`;x.beginPath();x.arc(SX(cx),SY(cy),r,0,7);x.stroke()}
    x.lineWidth=2.6;
    for(let i=0;i<14;i++){const ang=i*.449+now*.35,ph=(now*1.5+i*.331)%1,r=inward?118-ph*98:26+ph*96,px=cx+Math.cos(ang)*r,py=cy+Math.sin(ang)*r*.9;
      x.strokeStyle=`rgba(${col},${.15+.7*(inward?ph:1-ph)})`;chevron(px,py,inward?ang+Math.PI:ang,7+3*ph)}
    x.lineWidth=2.2;x.strokeStyle=`rgba(${col},.9)`;
    for(let k=0;k<4;k++){const a=-1.2+k*.8+Math.sin(now*9+k)*.45+(P.face<0?Math.PI:0);bolt(hx,hy,a,44+16*Math.sin(now*13+k*2),k,now)}
  }
  if(G.heat>6||G.overloaded){
    const h=Math.min(1,G.heat/100),cc=G.overloaded?'255,80,60':h<.6?'95,212,255':h<.85?'255,190,80':'255,110,60';
    x.lineWidth=5;x.strokeStyle=`rgba(${cc},${.35+.4*Math.sin(now*(h>.85?30:10))*(h>.6?1:.3)})`;x.globalAlpha=.9;
    x.beginPath();x.arc(SX(cx),SY(cy),68,-Math.PI/2,-Math.PI/2+(G.overloaded?1:h)*Math.PI*2);x.stroke();
  }
  if(GL.shieldActive(G)){
    const r=Math.hypot(P.w/2+26,P.h/2+16),k=G.shieldT/G.tier.window;
    x.globalAlpha=1;gr=x.createRadialGradient(SX(cx),SY(cy),r*.4,SX(cx),SY(cy),r);gr.addColorStop(0,'rgba(89,226,194,0)');gr.addColorStop(.8,`rgba(89,226,194,${.12+.28*k})`);gr.addColorStop(1,`rgba(160,255,235,${.5*k+.2})`);
    x.fillStyle=gr;x.beginPath();x.arc(SX(cx),SY(cy),r,0,7);x.fill();
    x.lineWidth=4;x.strokeStyle=`rgba(180,255,240,${.5+.5*k})`;x.beginPath();x.arc(SX(cx),SY(cy),r,0,7);x.stroke();
  }
  }finally{x.restore()}
}
const BIX=img('bix-motion-v2.png');
function drawBix(now){
  if(!BIX.complete||!BIX.naturalWidth){box(P.x,P.y,P.w,P.h,'#59e2c2');return}
  const R=[[48,20,174,436],[305,20,176,436],[535,57,294,397],[862,57,260,397],[22,498,270,384],[301,480,260,402],[590,484,240,395],[860,457,275,330],[8,901,299,397],[311,1049,285,270],[643,879,180,451],[911,883,210,440]];
  const f=P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):P.land?9:Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  let ay=P.y+P.h;const r=R[f],dh=r[3]*.22,dw=r[2]*.22,ax=SX(P.x+P.w/2);
  if(P.hang||P.climb){const t=P.climb?1-P.climb/.45:0;ay=P.hangRect.y+(dh-4)*(1-t)}
  x.save();x.translate(ax,0);x.scale(P.face,1);x.shadowColor=G.pol===1?BLUE:G.pol===-1?RED:'#59e2c2';x.shadowBlur=G.pol?16:7;
  x.globalAlpha=P.inv&&Math.floor(performance.now()/70)%2?.48:1;
  x.drawImage(BIX,r[0],r[1],r[2],r[3],-dw/2,SY(ay)-dh,dw,dh);x.restore();
}
function draw(){
  const now=performance.now()/1000;
  x.save();x.clearRect(0,0,viewW,H);
  if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.65);
  drawBackdrop();drawWorld(now);
  D.cogs.forEach((q,i)=>cog(q,i,now));
  for(const e of enemies)drawEnemy(e,now);
  sprite('pack-assist-v2.png',packUntil>now?6:0,pack.x,pack.y+32,64,-P.face);
  drawBix(now);
  if(!core.held)drawCore(now);
  drawGloveFx(now);
  if(core.held)drawCore(now);
  const vig=x.createRadialGradient(viewW*.5,H*.45,H*.2,viewW*.5,H*.48,Math.max(viewW,H)*.72);
  vig.addColorStop(0,'transparent');vig.addColorStop(.74,'#00000014');vig.addColorStop(1,'#000a');
  x.fillStyle=vig;x.fillRect(0,0,viewW,H);
  if(flash){x.fillStyle=`rgba(255,220,170,${flash*2})`;x.fillRect(0,0,viewW,H)}
  if(endFx>0){x.fillStyle=`rgba(255,246,214,${Math.min(.92,endFx*endFx)})`;x.fillRect(0,0,viewW,H)}
  x.restore();
}
const STEP=1/120;let acc=0;   // physics always advances in 1/120 s steps, so a 60, 144 or 240 Hz screen plays the same game: the jump used to rise ~4% higher at high refresh rates
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.033,(t-last)/1000||0);last=t;acc+=dt;let n=0;while(acc>=STEP&&n<5){update(STEP);acc-=STEP;n++}if(n===5)acc=0;draw()}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);
addEventListener('orientationchange',()=>setTimeout(resize,120));
if(window.ResizeObserver)new ResizeObserver(resize).observe(c);
resize();reset(1);requestAnimationFrame(frame);
})();
