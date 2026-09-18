// Level 02 — The Furnace Below. Greybox engine.
// Reads geometry from level2-data.js, sprite crops from level2-art.js and
// enemy behaviour from level2-enemies.js. Physics constants match Level 1.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const ui=Object.fromEntries(['start','complete','dialogue','speaker','line','prompt','zone','objective','cogCount','finalCogs','finalTime','finalFalls','resultLine','touchControls','packCharge','packChargeLabel'].map(id=>[id,$(id)]));
const D=window.L2DATA,ART=window.L2ART,EN=window.L2ENEMIES;
function fatal(msg){x.setTransform(1,0,0,1,0,0);x.fillStyle='#071217';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ff8b55';x.font='600 20px system-ui';x.textAlign='center';x.fillText(msg,c.width/2,c.height/2)}
if(!D||!ART||!EN){fatal('Level 2 failed to load: '+[!D&&'level2-data.js',!ART&&'level2-art.js',!EN&&'level2-enemies.js'].filter(Boolean).join(', '));return}

const H=720,GRAV=1450,JUMP=780,RUN=285,COG_TOTAL=D.cogs.length,STUN_RANGE=150;
const K={left:0,right:0,down:0,jump:0,interact:0};
let viewW=1280,dpr=1,running=0,done=0,last=0,camX=0,camY=0,cogs=0,startTime=0,msgTime=0,msgLock=0,shake=0,flash=0;
let charge=1,heat=0,mistAt=-9,shutters=0,valves=0,cellHeld=0,cellDone=0,packMode=0,packTarget=null;

const img=s=>{const a=new Image;a.src='./assets/'+s;return a};
const IMG={};for(const k of Object.keys(ART))IMG[k]=img(k);
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const SX=v=>v-camX,SY=v=>v-camY;

const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,oldGround:0,coyote:0,buffer:0,face:1,falls:0,anim:0,land:0,hang:0,hangRect:null,climb:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0};
const pack={x:0,y:0};
let checkpoint=D.checkpoints[0]||{x:120,y:400,name:'START'};
const seen=new Set();               // checkpoints already taken
let enemies=[];

// ---- drawing helpers -------------------------------------------------------
function sprite(plate,i,cx,bottom,height,flip){
  const a=ART[plate],im=IMG[plate];if(!a||!im||!im.complete||!im.naturalWidth)return 0;
  const r=a.cells[i];if(!r)return 0;
  const w=height*r[2]/r[3];                       // per-cell aspect: cells vary a lot
  x.save();x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);
  x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,-height,w,height);x.restore();return 1;
}
function tile(plate,i,px,py,w,h){
  const a=ART[plate],im=IMG[plate];if(!a||!im||!im.complete||!im.naturalWidth)return 0;
  const r=a.cells[i];if(!r)return 0;
  const step=h*r[2]/r[3];if(step<=0)return 0;
  x.save();x.beginPath();x.rect(SX(px),SY(py),w,h);x.clip();
  for(let dx=0;dx<w+step;dx+=step)x.drawImage(im,r[0],r[1],r[2],r[3],SX(px)+dx,SY(py),step,h);
  x.restore();return 1;
}
function box(px,py,w,h,f,s){x.fillStyle=f;x.fillRect(SX(px),SY(py),w,h);if(s){x.strokeStyle=s;x.lineWidth=2;x.strokeRect(SX(px),SY(py),w,h)}}

// ---- world queries ---------------------------------------------------------
function moving(now){return (D.movers||[]).map((m,id)=>({id,x:m.x+(m.a==='x'?Math.sin(now*.9+(m.p||0))*m.r:0),y:m.y+(m.a==='y'?Math.sin(now*.9+(m.p||0))*m.r:0),w:m.w,h:m.h,ledge:1}))}
function pipeOut(now,i){return Math.sin(now*.8+i*1.7)>.45}              // retracting upper-route segments
function solids(now){
  const out=[];
  for(const p of D.platforms)out.push({x:p[0],y:p[1],w:p[2],h:78});
  for(const l of D.ledges)out.push({x:l[0],y:l[1],w:l[2],h:l[3],ledge:1});
  for(const b of (D.belts||[]))out.push({x:b.x,y:b.y,w:b.w,h:18,ledge:1,belt:b.dir});
  (D.pipes||[]).forEach((p,i)=>{if(pipeOut(now,i))out.push({x:p.x,y:p.y,w:p.w,h:p.h||18,ledge:1})});
  for(const g of (D.gates||[]))if(!gateOpen(g))out.push({x:g.x,y:g.y,w:g.w,h:g.h});
  return out.concat(moving(now));
}
function gateOpen(g){
  if(g.needs==='valves')return valves>=2;
  if(g.needs==='cell')return cellDone;
  if(g.needs==='shutters')return shutters>=3;
  return true;
}
function areaAt(px,py){
  let a=D.areas[0];
  for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;
  if(py!==undefined&&py<(D.world.verticalAbove??-1e9))a=D.areas[D.areas.length-1];
  return a;
}
// An area is vertical if it says so; otherwise the last area is assumed vertical.
const isVertical=a=>!!(a&&(a.vertical??(a===D.areas[D.areas.length-1])));

// ---- messages and checkpoints ---------------------------------------------
function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.45}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'PACK SPENT'}
function setCP(cp){checkpoint=cp;setCharge(1);toast('SYSTEM',`Checkpoint · ${cp.name}`,1.2,1)}

function reset(full=1){
  Object.assign(P,{x:full?(D.checkpoints[0]||{}).x??120:checkpoint.x,y:(full?(D.checkpoints[0]||{}).y??400:checkpoint.y)-P.h,
    vx:0,vy:0,ground:0,coyote:0,buffer:0,falls:full?0:P.falls+1,hang:0,hangRect:null,climb:0,support:null,dropTime:0,jumpTime:0,grabCD:.32,inv:.75});
  pack.x=P.x-65;pack.y=P.y+18;camX=Math.max(0,P.x-viewW*.38);
  camY=isVertical(areaAt(P.x,P.y))?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):0;
  heat=heatBase();mistAt=-9;        // a stale mist burst must not kill wasps after a restart
  if(full){
    cogs=valves=shutters=0;cellHeld=cellDone=done=0;setCharge(1);
    startTime=performance.now();checkpoint=D.checkpoints[0]||checkpoint;seen.clear();
    D.cogs.forEach(v=>v.got=0);(D.valves||[]).forEach(v=>v.on=0);(D.shutters||[]).forEach(v=>v.on=0);
    (D.triggers||[]).forEach(v=>v.used=0);
    enemies=(D.enemies||[]).map(e=>EN.make(e.type,e));
    ui.complete.classList.add('hidden');
  }
  ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
}
const heatBase=()=>(D.world.yMax??900)+40;

function start(){clearInput();ui.start.classList.add('hidden');ui.touchControls.classList.add('playing');running=1;startTime=performance.now();c.focus();
  toast('VELA','Cooling fault below the floor plan. Naturally, below the floor plan.',3,1)}
$('startButton').onclick=start;
$('replayButton').onclick=()=>{clearInput();reset(1);running=1;ui.complete.classList.add('hidden');ui.touchControls.classList.add('playing')};

// ---- input (same scheme as Level 1) ---------------------------------------
function key(code,on){
  if(['ArrowLeft','KeyA'].includes(code))K.left=on;
  if(['ArrowRight','KeyD'].includes(code))K.right=on;
  if(['ArrowDown','KeyS'].includes(code))K.down=on;
  if(['ArrowUp','KeyW','Space'].includes(code)){if(on&&!K.jump)P.buffer=.16;K.jump=on}
  if(['KeyE','Enter'].includes(code))K.interact=on;
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
  knob.style.transform=`translate(${jx}px,${jy}px)`;K.left=jx<-14;K.right=jx>14;K.down=jy>l*.65&&Math.abs(jy)>Math.abs(jx)*1.4}
function joyEnd(e){if(e&&e.pointerId!==jid)return;jid=null;K.left=K.right=K.down=0;if(knob)knob.style.transform='translate(0,0)'}
if(joy){joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});
  joy.addEventListener('pointermove',joyMove);joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);joy.addEventListener('lostpointercapture',joyEnd)}

// ---- physics (ported from Level 1, plus conveyor drift) --------------------
function move(a,dt,now){
  const all=solids(now),blocks=all.filter(q=>!q.ledge);
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
  for(const r of solids(now)){
    if(hand<r.y-18||hand>r.y+32)continue;
    const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);
    if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;break}
  }
}
// Pack's catch spends the single charge to save a death; otherwise respawn.
function hurt(t){
  if(P.inv||done)return;
  if(charge){setCharge(0);P.inv=1.2;P.vx=0;P.vy=0;P.x=checkpoint.x;P.y=checkpoint.y-P.h;shake=12;
    seen.add(checkpoint);       // the catch lands ON the checkpoint; don't let it refund the charge
    toast('PACK','Got you. That counts as overtime.',2.1,1);return}
  shake=18;flash=.18;reset(0);toast('PACK',t,2.1,1);
}

// ---- update ----------------------------------------------------------------
function update(dt){
  if(!running||done)return;
  const now=performance.now()/1000;
  msgLock=Math.max(0,msgLock-dt);P.inv=Math.max(0,P.inv-dt);P.dropTime=Math.max(0,P.dropTime-dt);
  P.jumpTime=Math.max(0,P.jumpTime-dt);P.grabCD=Math.max(0,P.grabCD-dt);

  if(P.hangRect&&P.hangRect.id!==undefined)P.hangRect=moving(now)[P.hangRect.id];
  if(P.ground&&P.support&&P.support.id!==undefined){const m=moving(now)[P.support.id];P.x+=m.x-P.support.x;P.y+=m.y-P.support.y;P.support=m}
  if(K.down&&P.ground&&P.support?.ledge){P.dropTime=.25;P.ground=0;P.y+=5;P.coyote=0}

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
    if(P.ground&&P.support&&P.support.belt)P.x+=P.support.belt*95*dt;     // conveyors carry you
    P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);
    if(P.buffer&&P.coyote){P.vy=-JUMP;P.jumpTime=.18;P.buffer=P.coyote=0;P.ground=0;P.support=null}
    if(!K.jump&&!P.jumpTime&&P.vy<0)P.vy+=1500*dt;
    P.vy+=GRAV*dt;P.oldGround=P.ground;move(P,dt,now);grab(now);
  }
  if(P.ground&&!P.oldGround)P.land=.14;P.land=Math.max(0,P.land-dt);P.anim+=Math.abs(P.vx)*dt/58;

  pack.x+=(P.x-P.face*58-pack.x)*Math.min(1,dt*5);pack.y+=(P.y+18-pack.y)*Math.min(1,dt*4);

  // enemies
  const world={player:{x:P.x,y:P.y,w:P.w,h:P.h},shutterOpened:now-mistAt<.25,dt};
  for(const e of enemies){
    EN.update(e,dt,now,world);
    if(now-mistAt<.6&&EN.mist(e)&&Math.hypot(e.x-mistX,e.y-mistY)<340)e.dead=1;
    const hz=EN.hazard(e);
    if(hz&&overlap(P,hz))hurt('Reclassified as scrap. Briefly.');
  }
  enemies=enemies.filter(e=>!e.dead);

  // hazards from the level data
  for(const [i,v] of (D.vents||[]).entries()){const h=ventHeight(v,i,now);if(h>30&&overlap(P,{x:v.x-25,y:v.y-h,w:50,h}))hurt('Molten metal: one. Bix: recast.')}
  for(const g of (D.lasers||[])){const z=(now+(g.p||0))%4,on=g.pair?(z>2.4&&z<3.6):(z>1.05&&z<2.35);
    if(on&&overlap(P,{x:g.x-8,y:g.y0,w:16,h:g.y1-g.y0}))hurt('Laser gate: one. Bix: sliced.')}
  for(const L of (D.lava||[]))if(overlap(P,{x:L.x,y:L.y,w:L.w,h:60}))hurt('The channel was clearly marked.')
  if(P.y>(D.world.yMax??900)+160)hurt('Gravity remains fully operational.');

  // area 5: heat rises, and each shutter makes the supervisor speed the cycle
  const area=areaAt(P.x,P.y);
  if(isVertical(area)){heat-=(26+shutters*14)*dt;if(P.y+P.h>heat)hurt('It got hot. It was always going to get hot.')}
  else heat=heatBase();

  // pickups, checkpoints, story
  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;cogs++;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
    toast('PACK',cogs===COG_TOTAL?'All cogs recovered. The supervisor would call that theft.':`Cog ${cogs} secured.`,1.4,1)}
  for(const t of (D.triggers||[]))if(!t.used&&P.x>t.x){t.used=1;toast(t.s,t.t,2.8,1)}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&P.x>cp.x-40&&Math.abs(P.y+P.h-cp.y)<220){seen.add(cp);setCP(cp)}

  interact(now);

  // camera: 2D, but only the vertical area lets it leave the floor line
  const tx=Math.max(0,Math.min(D.world.w-viewW,P.x-viewW*.42));
  const ty=isVertical(area)?Math.max(D.world.yMin??0,Math.min((D.world.yMax??H)-H,P.y-H*.52)):0;
  camX+=(tx-camX)*(1-Math.exp(-4.5*dt));camY+=(ty-camY)*(1-Math.exp(-4.5*dt));
  shake=Math.max(0,shake-30*dt);flash=Math.max(0,flash-dt);

  ui.zone.textContent=area?area.name:'';
  ui.objective.textContent=objective(area);
  if(msgTime>0){msgTime-=dt;if(msgTime<=0)ui.dialogue.classList.add('hidden')}
  if(D.exit&&shutters>=3&&Math.hypot(P.x-D.exit.x,P.y-D.exit.y)<90)finish();
}
function ventHeight(v,i,now){const z=(now+(v.p||0))%4.2;return z>.72&&z<2.05?(175+Math.sin(now*16+i)*16)*Math.min(1,(z-.72)/.2)*Math.min(1,(2.05-z)/.3):0}
function objective(a){
  if(!a)return'';
  if(a.id==='cooling'||a.needs==='valves')return valves>=2?'Coolant restored · head for the sorter':`Restore both coolant valves · ${valves}/2`;
  if(a.id==='sorter')return cellDone?'Power cell installed · find the way down':cellHeld?'Carry the power cell to its socket':'Find the power cell';
  if(isVertical(a))return shutters>=3?'Board the emergency lift':`Open the cooling shutters · ${shutters}/3`;
  return a.objective||'';
}

// ---- interaction (one ACT button, context label) ---------------------------
let mistX=0,mistY=0;
function nearest(list,r){let best=null,bd=r;for(const q of (list||[])){const d=Math.hypot(P.x+21-q.x,P.y+48-q.y);if(d<bd){bd=d;best=q}}return best}
function interact(now){
  const valve=nearest((D.valves||[]).filter(v=>!v.on),120);
  const shut=nearest((D.shutters||[]).filter(v=>!v.on),120);
  const term=nearest(D.terminals,120);
  const cell=!cellHeld&&!cellDone?nearest((D.pickups||[]).filter(p=>p.type==='cell'),110):null;
  const sock=cellHeld?nearest(D.sockets,120):null;
  let foe=null;
  if(charge){let bd=STUN_RANGE;for(const e of enemies){if(!canStun(e)||e.stun)continue;const d=Math.hypot(P.x+21-e.x,P.y+48-e.y);if(d<bd){bd=d;foe=e}}}

  const label=P.hang?'AUTO CLIMB · DOWN TO DROP':valve?'ACT · TURN VALVE':shut?'ACT · OPEN SHUTTER':sock?'ACT · INSTALL CELL':cell?'ACT · TAKE CELL':term?('ACT · '+(term.label||'OPEN')):foe?'ACT · PING':'';
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);
  if(!K.interact)return;
  K.interact=0;
  if(valve){valve.on=1;valves++;toast('PACK',valves>=2?'Coolant flowing. The pipes seem relieved.':`Valve ${valves} of 2. Pressure is thinking about it.`,2.2,1);
    if(valves>=2)toast('SUPERVISOR','Unscheduled activity detected. Beginning inspection.',2.6,1);return}
  if(shut){shut.on=1;shutters++;mistAt=now;mistX=shut.x;mistY=shut.y;shake=10;
    toast('PACK',shutters>=3?'All three open. Go, go, go.':`Shutter ${shutters} of 3. Cooling responds. Sulkily.`,2,1);return}
  if(sock){cellDone=1;cellHeld=0;toast('PACK','Socket charged. It is the little things.',2,1);return}
  if(cell){cellHeld=1;toast('PACK','Cell secured. It is in my chest. Do not think about it.',2,1);return}
  if(term){term.on=1;packMode=1;packTarget=term;toast('PACK','Doing the thing.',1.6,1);return}
  if(foe){EN.stun(foe);setCharge(0);toast('PACK','Zapped. That was my only charge, by the way.',2,1)}
}
const canStun=e=>!!EN.consts.STUNNABLE[e.type];

function finish(){
  done=1;running=0;ui.touchControls.classList.remove('playing');
  const sec=Math.floor((performance.now()-startTime)/1000);
  ui.finalCogs.textContent=`${cogs} / ${COG_TOTAL}`;
  ui.finalTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  ui.finalFalls.textContent=P.falls;
  ui.resultLine.textContent=cogs===COG_TOTAL?'Pack has filed this as “reclaimed with distinction.”':'Shift complete. Several cogs have been reclassified as landfill.';
  ui.complete.classList.remove('hidden');
}

// ---- draw ------------------------------------------------------------------
function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;
  dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const s=c.height/H;viewW=c.width/s;x.setTransform(s,0,0,s,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high'}

function draw(){
  const now=performance.now()/1000;
  x.save();x.clearRect(0,0,viewW,H);
  if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.65);
  const grd=x.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#10303a');grd.addColorStop(.58,'#0a1a21');grd.addColorStop(1,'#1d0d05');
  x.fillStyle=grd;x.fillRect(-20,-20,viewW+40,H+40);
  const bgN='furnace-background-v1.png',bg=IMG[bgN];
  if(bg&&bg.complete&&bg.naturalWidth){const bw=1720,bx=-((camX*.1)%bw);x.globalAlpha=.8;
    x.drawImage(bg,bx-2,0,bw+4,H);x.drawImage(bg,bx+bw-2,0,bw+4,H);x.globalAlpha=1}

  for(const L of (D.lava||[]))tile('lava-channel-v1.png',0,L.x,L.y,L.w,56)||box(L.x,L.y,L.w,56,'#ff7a00');
  for(const b of (D.belts||[]))tile('conveyor-belt-v1.png',0,b.x,b.y,b.w,20)||box(b.x,b.y,b.w,18,'#152830','#48707a');
  D.platforms.forEach((p,i)=>slab(p[0],p[1],p[2],i%2?1:0,78));
  D.ledges.forEach((l,i)=>slab(l[0],l[1],l[2],2,32));
  (D.pipes||[]).forEach((p,i)=>{if(pipeOut(now,i))slab(p.x,p.y,p.w,5,26);else{x.save();x.globalAlpha=.25;slab(p.x,p.y,p.w,5,26);x.restore()}});
  moving(now).forEach(m=>{if(!sprite('casting-mold-v1.png',0,m.x+m.w/2,m.y+m.h+16,46))box(m.x,m.y,m.w,m.h,'#3a2418','#ff9d23')});
  for(const g of (D.gates||[]))if(!gateOpen(g))box(g.x,g.y,g.w,g.h,'#2a1420','#ff4d3a');

  (D.vents||[]).forEach((v,i)=>{prop(0,v.x,v.y,104,86);const h=ventHeight(v,i,now);
    if(h>4){x.save();x.globalCompositeOperation='lighter';const gr=x.createLinearGradient(0,SY(v.y),0,SY(v.y-h));
      gr.addColorStop(0,'#fffbd8');gr.addColorStop(.35,'#ff8a00');gr.addColorStop(1,'rgba(120,10,0,0)');x.fillStyle=gr;
      x.fillRect(SX(v.x)-22,SY(v.y-h),44,h);x.restore()}});
  (D.lasers||[]).forEach(g=>{prop(4,g.x,g.y0+40,92,98);const z=(now+(g.p||0))%4,on=g.pair?(z>2.4&&z<3.6):(z>1.05&&z<2.35),warn=g.pair?(z>1.95&&z<=2.4):(z>.6&&z<=1.05);
    x.save();x.globalCompositeOperation='lighter';
    if(warn){x.strokeStyle=`rgba(255,180,60,${.3+Math.sin(now*24)*.2})`;x.setLineDash([8,14]);x.lineWidth=2;x.beginPath();x.moveTo(SX(g.x),SY(g.y0));x.lineTo(SX(g.x),SY(g.y1));x.stroke();x.setLineDash([])}
    if(on){x.shadowColor='#ff174e';x.shadowBlur=30;x.strokeStyle='#ff245d';x.lineWidth=8;x.beginPath();x.moveTo(SX(g.x),SY(g.y0));x.lineTo(SX(g.x),SY(g.y1));x.stroke()}
    x.restore()});

  (D.terminals||[]).forEach(t=>prop(1,t.x,t.y,74,96));
  (D.valves||[]).forEach(v=>{x.save();if(v.on)x.globalAlpha=1;else x.globalAlpha=.75;prop(3,v.x,v.y,84,84);x.restore()});
  (D.shutters||[]).forEach(s=>{x.save();x.globalAlpha=s.on?.3:1;prop(2,s.x,s.y,86,120);x.restore()});
  (D.sockets||[]).forEach(s=>prop(5,s.x,s.y,92,74));
  (D.pickups||[]).forEach(p=>{if(!cellHeld&&!cellDone)prop(5,p.x,p.y,54,54)});
  if(D.exit)prop(6,D.exit.x,D.exit.y,120,150);

  D.cogs.forEach((q,i)=>{if(q.got)return;const bob=Math.sin(now*2+i)*5;
    x.save();x.shadowColor='#5ff7de';x.shadowBlur=9;
    const im=IMG['energy-cog-v1.png'];
    x.fillStyle='#ffd75a';x.beginPath();x.arc(SX(q.x),SY(q.y+bob),16,0,7);x.fill();
    x.fillStyle='#3a3010';x.beginPath();x.arc(SX(q.x),SY(q.y+bob),8,0,7);x.fill();x.restore()});

  for(const e of enemies)drawEnemy(e,now);
  if(now-mistAt<.7){const k=Math.min(7,Math.floor((now-mistAt)/.7*8));sprite('coolant-mist-v1.png',k,mistX,mistY+40,180,1)}

  // Pack, then Bix
  const packPlate='pack-assist-v1.png';
  sprite(packPlate,cellHeld?3:charge?0:4,pack.x,pack.y+32,64,-P.face);
  drawBix();

  if(isVertical(areaAt(P.x,P.y))){x.save();x.globalCompositeOperation='lighter';
    const g2=x.createLinearGradient(0,SY(heat),0,SY(heat)-220);g2.addColorStop(0,'rgba(255,90,0,.8)');g2.addColorStop(1,'rgba(255,60,0,0)');
    x.fillStyle=g2;x.fillRect(0,SY(heat)-220,viewW,240);x.restore()}

  const vig=x.createRadialGradient(viewW*.5,H*.45,H*.2,viewW*.5,H*.48,Math.max(viewW,H)*.72);
  vig.addColorStop(0,'transparent');vig.addColorStop(.74,'#00000014');vig.addColorStop(1,'#000a');
  x.fillStyle=vig;x.fillRect(0,0,viewW,H);
  if(flash){x.fillStyle=`rgba(255,220,170,${flash*2})`;x.fillRect(0,0,viewW,H)}
  x.restore();
}
function slab(px,py,w,cell,h){
  const a=ART['furnace-platform-atlas-v1.png'],im=IMG['furnace-platform-atlas-v1.png'];
  if(!a||!im||!im.complete||!im.naturalWidth||!a.cells[cell]){box(px,py,w,h,'#1a2e36','#48707a');x.fillStyle='#ffc84a';x.fillRect(SX(px)+8,SY(py)-1,Math.max(0,w-16),2);return}
  const r=a.cells[cell],cap=Math.min(42,w*.24),mid=Math.max(0,w-cap*2),cs=Math.min(r[2]*.22,52);
  x.drawImage(im,r[0],r[1],cs,r[3],SX(px),SY(py)-2,cap,h);
  if(mid)x.drawImage(im,r[0]+cs,r[1],r[2]-cs*2,r[3],SX(px)+cap,SY(py)-2,mid,h);
  x.drawImage(im,r[0]+r[2]-cs,r[1],cs,r[3],SX(px)+w-cap,SY(py)-2,cap,h);
  x.fillStyle='#ffc84a';x.fillRect(SX(px)+8,SY(py)-1,Math.max(0,w-16),2);
}
function prop(cell,px,py,w,h){return sprite('furnace-prop-atlas-v1.png',cell,px,py,h)||box(px-w/2,py-h,w,h,'#243d43','#638086')}
const ENEMY_PLATE={crawler:'enemy-crawler-v1.png',spitter:'enemy-spitter-v1.png',claw:'enemy-claw-v1.png',wasp:'enemy-wasp-v1.png',supervisor:'supervisor-head-v1.png'};
function drawEnemy(e,now){
  const plate=ENEMY_PLATE[e.type];if(!plate)return;
  const ph=EN.phaseName?EN.phaseName(e):'',tell=EN.tell?EN.tell(e):0;
  let cell=0;
  if(e.type==='crawler')cell=e.stun?6:ph==='turn'?4:Math.floor(now*7)%4;
  else if(e.type==='spitter')cell=ph==='charge'?(tell>.6?2:1):ph==='fire'?3:0;
  else if(e.type==='claw')cell=ph==='slam'?4:ph==='lock'?2:ph==='retract'?6:1;
  else if(e.type==='wasp')cell=Math.floor(now*9)%4;
  else if(e.type==='supervisor')cell=ph==='stall'?4:ph==='sweepLeft'?1:ph==='sweepRight'?2:0;
  const hz=EN.hazard(e);
  if(tell>0&&!hz){x.save();x.globalAlpha=.25+tell*.5;x.fillStyle='#ffb43c';x.beginPath();x.arc(SX(e.x),SY(e.y-40),14+tell*10,0,7);x.fill();x.restore()}
  sprite(plate,cell,e.x,e.y+30,e.type==='wasp'?42:e.type==='supervisor'?96:74,e.dir<0?-1:1);
  if(e.shot){sprite(plate,7,e.shot.x+e.shot.w/2,e.shot.y+e.shot.h,30,e.dir<0?-1:1)||
    (x.fillStyle='#ff9d23',x.beginPath(),x.arc(SX(e.shot.x+9),SY(e.shot.y+9),9,0,7),x.fill())}
  if(hz&&e.type==='supervisor'){x.save();x.globalCompositeOperation='lighter';x.fillStyle='rgba(255,77,58,.16)';
    x.fillRect(SX(hz.x),SY(hz.y),hz.w,hz.h);x.restore()}
}
function drawBix(){
  const bix=BIX;
  if(!bix.complete||!bix.naturalWidth){box(P.x,P.y,P.w,P.h,'#59e2c2');return}
  const R=[[48,20,174,436],[305,20,176,436],[535,57,294,397],[862,57,260,397],[22,498,270,384],[301,480,260,402],[590,484,240,395],[860,457,275,330],[8,901,299,397],[311,1049,285,270],[643,879,180,451],[911,883,210,440]];
  let f=P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):P.land?9:Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  let ay=P.y+P.h;const r=R[f],dh=r[3]*.22,dw=r[2]*.22,ax=SX(P.x+P.w/2);
  if(P.hang||P.climb){const t=P.climb?1-P.climb/.45:0;ay=P.hangRect.y+(dh-4)*(1-t)}
  x.save();x.translate(ax,0);x.scale(P.face,1);x.shadowColor='#59e2c2';x.shadowBlur=7;
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
