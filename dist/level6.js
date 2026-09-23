// Level 06: Mother Cluckzilla (Dome Threshold, Feed Line, Orchard Rows, Alarm Spine, The Grid, Nesting Bay).
// Forked from level4.js: same physics, camera, checkpoints, Pack catch and carried-object controls. Geometry comes from
// level6-data.js, the pictures from level6-art.js, crawlers from level2-enemies.js and Bix/Pack art from level2-art.js.
//
// The one new idea is the LURE. Bix carries a feed pod (E), throws it (Red/X) and calls it back (Blue/Z). A thrown pod
// bursts into a feed scatter, and Mother Cluckzilla always walks to the newest burst. She never targets Bix: he is only
// ever in the way, which is worse. He can never hurt her, and she can only hurt him by being enormous.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const ui=Object.fromEntries(['start','complete','dialogue','speaker','line','prompt','zone','objective','cogCount','slipCount','podChip','phaseChip','finalCogs','finalTime','finalFalls','resultLine','medal','saveNote','lockNote','touchControls','packCharge','packChargeLabel'].map(id=>[id,$(id)]));
const D=window.L6DATA,ART=window.L2ART,EN=window.L2ENEMIES;
function fatal(msg){x.setTransform(1,0,0,1,0,0);x.fillStyle='#100d09';x.fillRect(0,0,c.width,c.height);x.fillStyle='#f0a83a';x.font='600 20px system-ui';x.textAlign='center';x.fillText(msg,c.width/2,c.height/2)}
if(!D||!ART||!EN){fatal('Level 6 failed to load: '+[!D&&'level6-data.js',!ART&&'level2-art.js',!EN&&'level2-enemies.js'].filter(Boolean).join(', '));return}

const H=720,GRAV=1450,JUMP=780,RUN=285,COG_TOTAL=D.cogs.length,SLIP_TOTAL=D.slips.length,CARRY_MAX=65;
const POD={W:38,THROW_V:760,THROW_UP:280,CALL_RANGE:560,CALL_V:520,CATCH_R:64,PICKUP_R:96,BURST:6,REFILL:3};
const K={left:0,right:0,down:0,up:0,jump:0,interact:0,blue:0,red:0};
let viewW=1280,dpr=1,running=0,done=0,last=0,camX=0,camY=0,cogs=0,slips=0,startTime=0,msgTime=0,msgLock=0,shake=0,flash=0,dust=0;
let charge=1,prevRed=0,podDrops=0,staggered=0,ending=0,endFx=0,alarmOn=0,cartBaited=0;
let pod={x:0,y:0,w:POD.W,h:POD.W,vx:0,vy:0,held:0,ground:0,support:null,dropTime:0,burst:0,burstAt:-99,thrown:0};
let hoppers=[],baited={},fallen=new Set(),told=new Set(),sayQ=[],sayT=0,lastInc=null;
let boss={x:0,in:0,phase:'none',footT:0,footPh:0,sweepT:0,sweeping:0,lean:0,leanCol:null};

const img=s=>{const a=new Image;a.src='./assets/'+s;return a};
const IMG={};for(const k of Object.keys(ART))IMG[k]=img(k);
// Level 6's own pictures; every draw falls back to a plain shape, so a missing atlas never breaks the level
const A=window.L6ART||{atlases:{},spr:{},bg:{}};
const ATL={};for(const k of Object.keys(A.atlases))ATL[k]=img(k);
const BGI={};for(const k of Object.keys(A.bg))BGI[k]=img(A.bg[k].file);
const ready=im=>im&&im.complete&&im.naturalWidth;
function blit(name,px,py,w,h,flip,alpha){
  const s=A.spr[name],im=s&&ATL[s[0]];if(!ready(im))return 0;
  x.save();if(alpha!==undefined)x.globalAlpha=alpha;x.translate(SX(px+w/2),SY(py));if(flip<0)x.scale(-1,1);
  x.drawImage(im,s[1],s[2],s[3],s[4],-w/2,0,w,h);x.restore();return 1;
}
const sh=n=>A.spr[n]?A.spr[n][4]:0,sw=n=>A.spr[n]?A.spr[n][3]:0;
const blitH=(n,cx,bottom,h,flip,alpha)=>{const w=h*(sw(n)||1)/(sh(n)||1);return blit(n,cx-w/2,bottom-h,w,h,flip,alpha)};

const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const SX=v=>v-camX,SY=v=>v-camY;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const narrow=()=>viewW<700;
const leadTarget=()=>narrow()?(P.vx>40?.14:P.vx<-40?.55:.24):.42;
let lead=.42;
const flatCamY=()=>areaAt(P.x).camY??D.world.camY??-40;

const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,oldGround:0,coyote:0,buffer:0,face:1,falls:0,anim:0,land:0,hang:0,hangRect:null,climb:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0};
const pack={x:0,y:0};
let checkpoint=D.checkpoints[0],seen=new Set(),enemies=[],packUntil=0;

// Carried cogs (Levels 1 to 5, 0..65) unlock the level. ?banked=N is a test switch, honoured on localhost only.
const devHost=()=>{try{return !location.hostname||/^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(location.hostname)}catch(e){return true}};
function carried(){
  try{const q=devHost()?new URLSearchParams(location.search).get('banked'):null;if(q!==null&&q!==''&&isFinite(+q))return Math.max(0,Math.min(CARRY_MAX,Math.floor(+q)))}catch(e){}
  try{const p=window.Mayhem&&window.Mayhem.getProgress&&window.Mayhem.getProgress(),MP=window.MayhemProgress;if(p&&MP&&MP.carriedCogs)return MP.carriedCogs(p,'level6')}catch(e){}
  return 0;
}

function sprite(plate,i,cx,bottom,height,flip){
  const a=ART[plate],im=IMG[plate];if(!a||!ready(im))return 0;
  const r=a.cells[i];if(!r)return 0;
  const w=height*r[2]/r[3];
  x.save();x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);
  x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,-height,w,height);x.restore();return 1;
}
function box(px,py,w,h,f,s){x.fillStyle=f;x.fillRect(SX(px),SY(py),w,h);if(s){x.strokeStyle=s;x.lineWidth=2;x.strokeRect(SX(px),SY(py),w,h)}}
const glow=(px,py,r,col,a)=>{const g=x.createRadialGradient(SX(px),SY(py),0,SX(px),SY(py),r);g.addColorStop(0,col);g.addColorStop(1,'transparent');x.save();x.globalAlpha=a;x.fillStyle=g;x.fillRect(SX(px)-r,SY(py)-r,r*2,r*2);x.restore()};

// ---- world ------------------------------------------------------------------
const onDeck=r=>D.platforms.some(p=>Math.abs(p[1]-r.y)<=4&&r.x+r.w>p[0]&&r.x<p[0]+p[2]);
function solids(){
  const out=[];
  for(const p of D.platforms)out.push({x:p[0],y:p[1],w:p[2],h:78});
  for(const l of D.ledges)out.push({x:l.x,y:l.y,w:l.w,h:l.h,ledge:1});
  for(const k of D.columns||[])if(fallen.has(k.id)){const f=k.fallsTo;out.push({x:f.x,y:f.y,w:f.w,h:f.h,ledge:1,col:k.id})}
  return out;
}
function areaAt(px){let a=D.areas[0];for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;return a}
const isVertical=a=>!!(a&&a.vertical);
const killYAt=px=>areaAt(px).killY??((D.world.yMax??900)+160);
const groundAt=px=>{let best=null;for(const p of D.platforms)if(px>=p[0]-200&&px<=p[0]+p[2]+200&&(!best||p[1]<best))best=p[1];return best??410};

// ---- messages ---------------------------------------------------------------
function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.45}
const say=lines=>{for(const l of lines)sayQ.push(l)};
function pumpSay(dt){sayT=Math.max(0,sayT-dt);if(sayT<=0&&sayQ.length){const[s,t]=sayQ.shift();toast(s,t,2.5,1);sayT=2.5}}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'PACK SPENT'}
function setCP(cp){checkpoint=cp;setCharge(1);toast('SYSTEM',`Checkpoint · ${cp.name}`,1.2,0)}

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

// ---- the pod ----------------------------------------------------------------
const inTrough=cx=>(D.troughs||[]).find(t=>cx>t.x-24&&cx<t.x+t.w+24);
const podBox=()=>({x:pod.x,y:pod.y,w:pod.w,h:pod.h});
const podBurstLive=now=>pod.burst&&now-pod.burstAt<POD.BURST;
function takePod(h,now){pod.held=1;pod.burst=0;pod.thrown=0;pod.vx=pod.vy=0;pod.ground=0;if(h){h.t=POD.REFILL}ui.podChip.classList.remove('hidden')}
function setDown(){pod.held=0;pod.burst=0;pod.thrown=inTrough(P.x+P.w/2+P.face*44)?1:0;pod.vx=P.face*40;pod.vy=0;pod.x=clamp(P.x+P.w/2+P.face*44-pod.w/2,0,D.world.w-pod.w);pod.y=P.y+P.h-pod.h;pod.ground=0}
function throwPod(){pod.held=0;pod.burst=0;pod.thrown=1;pod.x=clamp(P.x+P.w/2+P.face*28-pod.w/2,0,D.world.w-pod.w);pod.y=P.y+24;pod.vx=P.face*POD.THROW_V+P.vx*.3;pod.vy=-POD.THROW_UP;pod.ground=0}
function burstPod(now){
  if(pod.burst)return;
  pod.burst=1;pod.burstAt=now;pod.vx=pod.vy=0;dust=Math.max(dust,.5);
  for(const t of D.troughs||[]){                                  // a burst inside a trough is what lures her to that column
    const cx=pod.x+pod.w/2;
    if(cx>t.x&&cx<t.x+t.w&&Math.abs(pod.y+pod.h-t.y)<70){baited[t.id]=true;          // a flag, not a timestamp: a bait at clock zero must not read as false
      if(!told.has('bait')){told.add('bait');say([['PACK','Baited. Now get well clear, Bix. Well clear.']])}}
  }
  const ct=D.cart;                                                 // and a burst on the cart deck is the ending
  if(ct&&pod.x+pod.w/2>ct.x&&pod.x+pod.w/2<ct.x+ct.w&&Math.abs(pod.y+pod.h-ct.y)<80){cartBaited=now}
}
function placePodBeside(){pod.held=0;pod.burst=0;pod.thrown=0;pod.vx=pod.vy=0;pod.ground=0;pod.x=clamp(P.x+P.w/2+P.face*48-pod.w/2,0,D.world.w-pod.w);pod.y=P.y+P.h-pod.h}
function lostPod(){
  placePodBeside();podDrops++;
  if(!told.has('lost')){told.add('lost');say([['PACK','The pod came back. They always come back. Ask the hoppers.']])}
  else toast('SYSTEM','Pod returned.',1.4,1);
}
function updatePod(dt,now,pol){
  if(pod.held){pod.x=P.x+P.w/2+P.face*22-pod.w/2;pod.y=P.y+28;pod.vx=pod.vy=0;pod.ground=0;return}
  if(pod.burst){
    if(now-pod.burstAt>POD.BURST)pod.burst=0;
    if(pod.y>killYAt(pod.x)||pod.y<D.world.yMin-300)lostPod();       // even a burst pod is recovered, so there is no state with no pod
    return}
  const cx=P.x+P.w/2,cy=P.y+P.h/2,px=pod.x+pod.w/2,py=pod.y+pod.h/2,dist=Math.hypot(cx-px,cy-py);
  if(pol===1&&!ending&&dist<POD.CALL_RANGE){                       // Blue calls it back and Bix catches it
    pod.vx=(cx-px)/(dist||1)*POD.CALL_V;pod.vy=(cy-py)/(dist||1)*POD.CALL_V;
    if(dist<POD.CATCH_R){takePod(null,now);return}
  }else{pod.vy+=GRAV*dt;if(pod.ground)pod.vx*=Math.exp(-9*dt);else pod.vx*=Math.exp(-.35*dt)}
  const wasAir=!pod.ground;
  move(pod,dt);
  if(pod.ground&&wasAir&&pod.thrown)burstPod(now);                    // a THROWN pod bursts where it lands; one set down gently does not
  if(pod.y>killYAt(pod.x)||pod.y<D.world.yMin-300)lostPod();
}

// ---- Mother Cluckzilla -------------------------------------------------------
function phaseAt(px){let id='none';for(const ph of D.boss.phases)if(px>=ph.from)id=ph.id;return id}
function bossTarget(now){
  if(alarmOn&&podBurstLive(now))return pod.x+pod.w/2;             // the newest burst always wins
  const bt=(D.troughs||[]).find(v=>baited[v.id]&&!fallen.has(v.column));
  if(alarmOn&&bt)return bt.x+bt.w/2;                               // a baited trough keeps pulling her in after the burst fades
  return P.x+P.w/2-D.boss.leash;                                   // otherwise she walks the feed line, which runs where Bix runs
}
function updateBoss(dt,now){
  const B=D.boss;
  if(!boss.in){if(P.x>=B.enterAt){boss.in=1;boss.x=B.enterAt-1500;shake=Math.max(shake,14)}else return}
  boss.phase=phaseAt(P.x);
  const t=bossTarget(now),d=t-boss.x;
  boss.x+=clamp(d,-B.speed*dt,B.speed*dt);
  // footfalls: an amber ring on the ground, then the foot lands
  boss.footT+=dt;
  if(boss.footT>=B.footfall.period){boss.footT-=B.footfall.period;boss.footPh=1;
    const gy=groundAt(boss.x);shake=Math.max(shake,9);dust=Math.max(dust,.7);
    for(const s of [-1,1]){
      const fx=boss.x+s*B.footfall.spread;
      if(Math.abs(P.x+P.w/2-fx)<B.footfall.radius&&P.ground&&!ending){hurt('footfall');return}
    }
    if(Math.abs(P.x+P.w/2-boss.x)<B.shock.radius&&P.ground&&!ending){staggered=.45}   // the shock costs time, never health
  }
  // she leans in to feed at a baited trough, and her weight takes the column
  if(!boss.lean){
    for(const k of D.columns||[]){
      if(fallen.has(k.id)||!baited[k.trough])continue;
      const tr=(D.troughs||[]).find(q=>q.id===k.trough);
      if(tr&&Math.abs(boss.x-(tr.x+tr.w/2))<220){boss.lean=1.3;boss.leanCol=k.id;boss.sweeping=1;say([['PACK','She is leaning in. That column is not going to enjoy this.']]);break}
    }
  }else{
    boss.lean=Math.max(0,boss.lean-dt);
    if(boss.lean<=0){
      const k=(D.columns||[]).find(q=>q.id===boss.leanCol);
      if(k&&!fallen.has(k.id)){fallen.add(k.id);shake=22;flash=.16;dust=1;delete baited[k.trough];
        say([['SYSTEM','The column goes over. It lands as a walkway.']])}
      boss.leanCol=null;boss.sweeping=0;
    }
  }
  // her head sweeps the ground while she feeds: this is why you stand clear
  if(boss.sweeping&&!ending){
    const hx=boss.x-B.sweep.reach;
    if(Math.abs(P.x+P.w/2-hx)<160&&P.ground){hurt('sweep');return}
  }
  // the ending: she steps onto the baited cart and it tips
  const ct=D.cart;
  if(ct&&cartBaited&&!ending&&Math.abs(boss.x-(ct.x+ct.w/2))<200){startEnding(now)}
}

// ---- physics (ported from Level 4) ------------------------------------------
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
    if(hand<r.y-18||hand>r.y+32)continue;
    const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);
    if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;break}
  }
}
const DEATHS={
  footfall:['PACK','She put a foot down. You were under it.','Footfall. She did not notice. That is the sad part.'],
  sweep:   ['PACK','Her head came through. Stand clear when she feeds.','Swept. She was only reaching for the grain.'],
  enemy:   ['PACK','A crawler. After all this, a crawler.','Sorted by a crawler. Undignified.'],
  fall:    ['PACK','You left the dome through the floor.','Gravity, again. It never files a report.'],
  generic: ['PACK','Filed under: avoidable.','Logged. Please stop doing that.'],
};
function hurt(cause){
  if(P.inv||done||ending)return;
  const now=performance.now()/1000;
  if(charge){setCharge(0);packUntil=now+1.1;P.inv=1.3;P.vx=P.vy=0;P.buffer=P.coyote=P.jumpTime=0;P.x=checkpoint.x;P.y=checkpoint.y-P.h;shake=12;
    P.hang=0;P.climb=0;P.hangRect=null;P.support=null;P.dropTime=0;P.grabCD=.32;
    if(pod.held)takePod(null,now);else placePodBeside();
    seen.add(checkpoint);toast('PACK','Got you. That counts as overtime.',2.1,1);return}
  shake=18;flash=.18;reset(0);
  const e=DEATHS[cause]||DEATHS.generic;let v=1+((P.falls-1)%2);
  if(lastInc&&lastInc.cause===cause&&lastInc.v===v)v=v===1?2:1;
  lastInc={cause,v};toast(e[0],e[v],2.6,1);
}

// ---- reset ------------------------------------------------------------------
function buildWorldState(full){
  if(full){fallen=new Set();baited={};told=new Set();lastInc=null;podDrops=0;slips=0;alarmOn=0;cartBaited=0;endFx=0;
    boss={x:0,in:0,phase:'none',footT:0,footPh:0,sweepT:0,sweeping:0,lean:0,leanCol:null}}
  hoppers=(D.hoppers||[]).map(h=>({...h,t:0}));
}
function reset(full=1){
  Object.assign(P,{x:full?D.start.x:checkpoint.x,y:(full?D.start.y:checkpoint.y)-P.h,
    vx:0,vy:0,ground:0,coyote:0,buffer:0,falls:full?0:P.falls+1,hang:0,hangRect:null,climb:0,support:null,dropTime:0,jumpTime:0,grabCD:.32,inv:.75});
  lead=leadTarget();pack.x=P.x-65;pack.y=P.y+18;camX=Math.max(0,P.x-viewW*lead);
  camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin,Math.min(D.world.yMax-H,P.y-H*.52)):flatCamY();
  enemies=spawnEnemies();buildWorldState(full);sayQ.length=0;sayT=0;ending=0;staggered=0;
  if(full){
    cogs=0;done=0;setCharge(1);startTime=performance.now();checkpoint=D.checkpoints[0];seen=new Set();
    D.cogs.forEach(v=>v.got=0);D.slips.forEach(v=>v.got=0);(D.triggers||[]).forEach(v=>v.used=0);
    pod.held=0;pod.burst=0;pod.x=D.hoppers[0].x-pod.w/2;pod.y=D.hoppers[0].y-pod.h;pod.vx=pod.vy=0;
    ui.complete.classList.add('hidden');ui.podChip.classList.add('hidden');
    try{const q=devHost()?new URLSearchParams(location.search).get('at'):null,cp=q!==null&&D.checkpoints[+q];
      if(cp){checkpoint=cp;seen.add(cp);Object.assign(P,{x:cp.x,y:cp.y-P.h});
        if(D.checkpoints.indexOf(cp)>=4)alarmOn=1;                 // past the alarm, the pods are already live
        camX=Math.max(0,P.x-viewW*lead);camY=isVertical(areaAt(P.x))?Math.max(D.world.yMin,Math.min(D.world.yMax-H,P.y-H*.52)):flatCamY();
        placePodBeside();takePod(null,0)}}catch(e){}
  }else{placePodBeside()}
  ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;ui.slipCount.textContent=`${slips} / ${SLIP_TOTAL}`;
}

// Level 6 opens once Levels 1 to 5 have carried 33 of their 65 cogs (progress.js holds the rule)
const UNLOCK=(window.MayhemProgress&&window.MayhemProgress.LEVEL6_UNLOCK_COGS)||33;
const locked=()=>carried()<UNLOCK;
function refreshLock(){
  const l=locked(),b=$('startButton');
  if(b)b.disabled=l;
  if(ui.lockNote){ui.lockNote.hidden=!l;ui.lockNote.textContent=l?`Level 6 is locked. Carry ${UNLOCK} of the 65 cogs from Levels 1 to 5 to open it (${carried()} so far).`:''}
}
function start(){clearInput();ui.start.classList.add('hidden');ui.touchControls.classList.add('playing');running=1;startTime=performance.now();c.focus()}
$('startButton').onclick=()=>{if(locked()){refreshLock();return}start()};
refreshLock();
try{if(window.Mayhem&&window.Mayhem.subscribe)window.Mayhem.subscribe(refreshLock)}catch(e){}
$('replayButton').onclick=()=>{clearInput();reset(1);running=1;ui.complete.classList.add('hidden');ui.touchControls.classList.add('playing')};

// ---- input ------------------------------------------------------------------
function key(code,on){
  if(['ArrowLeft','KeyA'].includes(code))K.left=on;
  if(['ArrowRight','KeyD'].includes(code))K.right=on;
  if(['ArrowDown','KeyS'].includes(code))K.down=on;
  if(['ArrowUp','KeyW','Space'].includes(code)){if(on&&!K.jump)P.buffer=.16;K.jump=on}
  if(['ArrowUp','KeyW'].includes(code))K.up=on;
  if(['KeyE','Enter'].includes(code))K.interact=on;
  if(code==='KeyZ')K.blue=on;
  if(code==='KeyX')K.red=on;
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

// ---- the ending --------------------------------------------------------------
function startEnding(now){
  ending=11;pod.burst=0;shake=20;
  say([['SYSTEM','She steps onto the cart. The cart does not argue.'],
       ['PACK','It is tipping. It is tipping, Bix.'],
       ['SYSTEM','The bedding takes her weight. She settles.'],
       ['PACK','She is... going to sleep.'],
       ['BIX','She was only ever hungry.'],
       ['SYSTEM','The feed line shuts off. The dome is quiet.'],
       ['PACK','Eleven years. First quiet in eleven years.'],
       ['BIX','Come on. There is a door up there somewhere.']]);
}

// ---- update ------------------------------------------------------------------
function update(dt){
  if(!running||done)return;
  const now=performance.now()/1000;
  msgLock=Math.max(0,msgLock-dt);P.inv=Math.max(0,P.inv-dt);P.dropTime=Math.max(0,P.dropTime-dt);
  P.jumpTime=Math.max(0,P.jumpTime-dt);P.grabCD=Math.max(0,P.grabCD-dt);staggered=Math.max(0,staggered-dt);
  dust=Math.max(0,dust-dt*.6);
  const pol=K.blue&&!K.red?1:K.red&&!K.blue?-1:0;
  pumpSay(dt);
  for(const h of hoppers)h.t=Math.max(0,h.t-dt);

  if(ending){ending-=dt;P.vx=0;P.vy=0;P.buffer=0;if(endFx<1)endFx=Math.min(1,endFx+dt*.16);if(ending<=0)finish()}
  else{
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
      const input=staggered>0?0:(K.right?1:0)-(K.left?1:0);
      if(input)P.face=input;
      P.vx+=(input*RUN-P.vx)*(1-Math.exp(-(P.ground?(input?10:16):(input?4.6:1.6))*dt));
      if(!input&&Math.abs(P.vx)<.6)P.vx=0;
      P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);
      if(P.buffer&&P.coyote&&staggered<=0){P.vy=-JUMP;P.jumpTime=.18;P.buffer=P.coyote=0;P.ground=0;P.support=null}
      if(!K.jump&&!P.jumpTime&&P.vy<0)P.vy+=1500*dt;
      P.vy+=GRAV*dt;
      P.oldGround=P.ground;move(P,dt);grab(now);
    }
  }
  if(P.ground&&!P.oldGround)P.land=.14;P.land=Math.max(0,P.land-dt);P.anim+=Math.abs(P.vx)*dt/58;

  if(!ending&&pod.held&&K.red&&!prevRed){throwPod()}
  prevRed=K.red;
  updatePod(dt,now,pol);
  if(!ending)updateBoss(dt,now);

  if(packUntil<=now)packUntil=0;
  pack.x+=(P.x-P.face*58-pack.x)*Math.min(1,dt*5);pack.y+=(P.y+18-pack.y)*Math.min(1,dt*4);

  const world={player:{x:P.x,y:P.y,w:P.w,h:P.h},dt};
  for(const e of enemies)EN.update(e,dt,now,world);
  for(const e of enemies){const hz=EN.hazard(e);if(hz&&overlap(P,hz)){hurt('enemy');break}}
  enemies=enemies.filter(e=>!e.dead||now-(e.dissolveAt??now)<.55);
  if(!ending&&P.y>killYAt(P.x))hurt('fall');

  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;cogs++;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;
    toast('PACK',cogs===COG_TOTAL?'Every cog in the dome. Nib will want to see this.':`Cog ${cogs} secured.`,cogs===COG_TOTAL?3:1.4,1)}
  for(const q of D.slips)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+40-q.y)<65){q.got=1;slips++;ui.slipCount.textContent=`${slips} / ${SLIP_TOTAL}`;
    toast('SYSTEM',`Slip ${slips}/${SLIP_TOTAL}: ${q.t}`,4.2,1)}
  for(const t of D.triggers||[])if(!t.used&&P.x>t.x){t.used=1;say(t.say)}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&D.checkpoints.indexOf(cp)>D.checkpoints.indexOf(checkpoint)&&P.x>cp.x-40&&Math.abs(P.y+P.h-cp.y)<80){seen.add(cp);setCP(cp)}

  interact(now);

  lead+=(leadTarget()-lead)*(1-Math.exp(-3*dt));
  const area=areaAt(P.x);
  const tx=Math.max(0,Math.min(D.world.w-viewW,P.x+(narrow()?P.vx*.22:0)-viewW*lead));
  const ty=isVertical(area)?Math.max(D.world.yMin,Math.min(D.world.yMax-H,P.y-H*.52)):flatCamY();
  camX+=(tx-camX)*(1-Math.exp(-4.5*dt));camY+=(ty-camY)*(1-Math.exp(-4.5*dt));
  shake=Math.max(0,shake-30*dt);flash=Math.max(0,flash-dt);

  ui.zone.textContent=area?area.name:'';ui.objective.textContent=area?area.objective:'';
  hud(now);
  if(msgTime>0){msgTime-=dt;if(msgTime<=0)ui.dialogue.classList.add('hidden')}
}
function hud(now){
  const txt=pod.held?'POD · CARRIED':pod.burst?'POD · BURST':'POD · LOOSE';
  if(ui.podChip.textContent!==txt)ui.podChip.textContent=txt;
  ui.podChip.classList.toggle('hidden',!pod.held&&!pod.burst&&!boss.in);
  const ph=!boss.in?'':alarmOn?(fallen.size<3?`GRID · ${fallen.size}/3 COLUMNS DOWN`:'NESTING BAY'):'PURSUIT · THE PODS DO NOTHING YET';
  if(ui.phaseChip.textContent!==ph)ui.phaseChip.textContent=ph;
  ui.phaseChip.classList.toggle('hidden',!ph);
}

// ---- interaction --------------------------------------------------------------
const near=(o,r)=>Math.hypot(P.x+P.w/2-o.x,P.y+P.h/2-(o.y-48))<r;
const nearPod=r=>Math.hypot(P.x+P.w/2-(pod.x+pod.w/2),P.y+P.h/2-(pod.y+pod.h/2))<r;
function interact(now){
  let label='',act=null;
  const h=hoppers.find(q=>near(q,120)&&!q.t);
  if(!ending&&!alarmOn&&near(D.alarm,130)){label='ACT · PULL THE DOME ALARM';act=()=>{alarmOn=1;flash=.3;shake=14;
    say([['SYSTEM','The work lights come up across the whole dome.'],
         ['PACK','Bix. She never turned. Not once.'],
         ['BIX','She is not chasing us.'],
         ['PACK','She is following the feed line. We have been running along it.'],
         ['PACK','The pods will work now. She will come to whichever is newest.']])}}
  else if(!ending&&!pod.held&&h){label='ACT · TAKE A FEED POD';act=()=>{pod.x=h.x-pod.w/2;pod.y=h.y-pod.h;takePod(h,now);
    if(!told.has('take')){told.add('take');say([['BIX','One pod.'],['PACK','Throw it with Red. Call it back with Blue.'],['PACK','It bursts where it lands. Things come to the burst.']])}}}
  else if(!ending&&pod.held){label=inTrough(P.x+P.w/2+P.face*44)?'ACT · DROP THE POD IN THE TROUGH':'ACT · SET THE POD DOWN';act=()=>setDown()}
  else if(!ending&&!pod.held&&!pod.burst&&nearPod(POD.PICKUP_R)){label='ACT · PICK UP THE POD';act=()=>takePod(null,now)}
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);
  if(!K.interact)return;
  K.interact=0;
  if(act)act();
}

// Medals. Gold: 12 cogs, 10 falls, 20:00. Silver: 7 cogs, 25 falls, 28:00. Bronze: any finish.
const MEDALS=[
  {name:'GOLD',cogs:12,falls:10,sec:1200,who:'PACK',line:'Fed, bedded and filed. Nib would call that a clean shift.'},
  {name:'SILVER',cogs:7,falls:25,sec:1680,who:'PACK',line:'She is asleep and you are standing. Both count.'},
  {name:'BRONZE',cogs:0,falls:1e9,sec:1e9,who:'BIX',line:'She was only ever hungry.'},
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
  ui.resultLine.textContent=`${m.who}: “${m.line}”`+(podDrops===0?' Careful Courier: the pod never left the level.':'')+(slips===SLIP_TOTAL?' Every slip found.':'');
  ui.complete.classList.remove('hidden');
  saveResult('level6',sec,cogs,P.falls);
}

// ---- drawing -------------------------------------------------------------------
const AREA_COL={threshold:['#2a2318','#141009'],feedline:['#33240f','#150f07'],orchard:['#1d2a14','#0d1408'],
  alarmspine:['#222a2c','#0d1214'],grid:['#16241c','#08110c'],nestingbay:['#2b2114','#120d08']};
function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;
  dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const s=c.height/H;viewW=c.width/s;x.setTransform(s,0,0,s,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high'}
function bgStrip(id,alpha){
  const b=A.bg[id],im=BGI[id];if(!b||!ready(im))return 0;
  const dh=H*1.08,dw=b.w*dh/b.h,oy=Math.max(-(dh-H),Math.min(0,-(dh-H)*.5-(camY-(D.world.camY??-40))*.05));
  let ox=-((camX*.28)%dw);x.save();x.globalAlpha=Math.max(0,Math.min(1,alpha));
  let ti=Math.floor((camX*.28)/dw);
  for(;ox<viewW;ox+=dw,ti++){
    if(ti&1){x.save();x.translate(Math.round(ox)+Math.ceil(dw)+1,0);x.scale(-1,1);x.drawImage(im,0,oy,Math.ceil(dw)+1,dh);x.restore()}
    else x.drawImage(im,Math.round(ox),oy,Math.ceil(dw)+1,dh)}
  x.restore();return 1;
}
function drawBackdrop(){
  const a=areaAt(camX+viewW/2),col=AREA_COL[a.id]||AREA_COL.threshold,g=x.createLinearGradient(0,0,0,H);
  g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);x.fillStyle=g;x.fillRect(-20,-20,viewW+40,H+40);
  const mid=camX+viewW/2,as=D.areas,k=as.indexOf(a),blend=260,prev=as[k-1],next=as[k+1];
  if(bgStrip(a.id,1)){
    if(prev&&mid<a.x0+blend)bgStrip(prev.id,1-(mid-(a.x0-blend))/(2*blend));
    if(next&&mid>a.x1-blend)bgStrip(next.id,(mid-(a.x1-blend))/(2*blend));
    x.fillStyle='rgba(10,7,4,.18)';x.fillRect(-20,-20,viewW+40,H+40);
  }
}
function drawBoss(now){
  if(!boss.in)return;
  const B=D.boss,gy=groundAt(boss.x),legH=900,bodyH=520;
  const bodyBottom=gy-legH;
  // the two near legs, and the two far legs behind them
  const stride=Math.sin(now*3.2)*40;
  for(const [s,dep] of [[-1,.55],[1,.55],[-1,1],[1,1]]){
    const fx=boss.x+s*B.footfall.spread*(dep<1?.55:1)+(dep<1?stride*.5:-stride*.5);
    const lift=dep<1?Math.max(0,Math.sin(now*3.2+s)*26):0;
    x.save();x.globalAlpha=dep<1?.55:1;
    if(!blitH(lift>3?'cluck-leg-lift':'cluck-leg-plant',fx,gy-lift,legH*dep))
      {x.fillStyle=dep<1?'#4a3f2c':'#6b5940';x.fillRect(SX(fx-16),SY(bodyBottom),32,legH*dep)}
    x.restore();
  }
  // her underside and body: mostly above the top of the screen, which is the point
  const bw=1500;
  if(!blit('cluck-underside',boss.x-bw/2,bodyBottom-60,bw,180))box(boss.x-bw/2,bodyBottom-60,bw,180,'#3a3123','#6b5940');
  if(!blit('cluck-body',boss.x-bw/2,bodyBottom-60-bodyH,bw,bodyH))box(boss.x-bw/2,bodyBottom-60-bodyH,bw,bodyH,'#5a4a34','#8a7350');
  // the head: down at the feed when she is feeding, otherwise up out of frame
  const feeding=boss.sweeping||boss.lean>0;
  const hx=boss.x-B.sweep.reach,hy=feeding?gy-40:bodyBottom-120;
  if(!blitH(feeding?'cluck-head-feed':'cluck-head',hx,hy,feeding?300:360))
    {x.fillStyle='#6b5940';x.beginPath();x.arc(SX(hx),SY(hy-120),120,0,7);x.fill()}
  if(feeding)glow(hx,gy-30,220,'#f0a83a',.35);
  // the footfall tell: an amber ring on the ground before the foot lands
  const tellLeft=B.footfall.period-boss.footT;
  if(tellLeft<B.footfall.tell){
    const k=1-tellLeft/B.footfall.tell;
    for(const s of [-1,1]){const fx=boss.x+s*B.footfall.spread;
      x.save();x.strokeStyle=`rgba(240,168,58,${.35+.55*k})`;x.lineWidth=3+3*k;x.setLineDash([9,8]);
      x.beginPath();x.ellipse(SX(fx),SY(gy),B.footfall.radius*(1.4-.4*k),22,0,0,7);x.stroke();x.restore()}
  }
}
function drawWorld(now){
  D.platforms.forEach(p=>{
    const th=Math.max(60,Math.min(100,p[2]/4.9)),aid=areaAt(p[0]+p[2]/2).id;
    if(A.spr['deck-'+aid]){const y0=p[1]-8+th-6,hh=Math.min(150,(p[3]||78)+30);
      if(A.spr['hull-'+aid])blit('hull-'+aid,p[0]+4,y0-6,p[2]-8,hh);
      blit('deck-'+aid,p[0]-6,p[1]-8,p[2]+12,th);return}
    box(p[0],p[1],p[2],p[3]||78,'#2a2318','#6b5940');x.fillStyle='#f0a83a';x.fillRect(SX(p[0]),SY(p[1]),p[2],4)});
  for(const l of D.ledges){if(blit('ledge-'+areaAt(l.x+l.w/2).id,l.x-4,l.y-8,l.w+8,34))continue;
    box(l.x,l.y,l.w,l.h,'#4a3f2c','#8a7350');x.fillStyle='#f0a83a';x.fillRect(SX(l.x),SY(l.y),l.w,3)}
  // the columns: standing, leaning as she takes one, or down as a walkway
  for(const k of D.columns||[]){
    if(fallen.has(k.id)){const f=k.fallsTo;
      if(!blit('column-fallen',f.x,f.y-14,f.w,60))box(f.x,f.y,f.w,f.h,'#2f4a32','#7bbf6a');continue}
    const leaning=boss.leanCol===k.id;
    if(leaning){const t=1-boss.lean/1.3,ang=t*0.9;
      x.save();x.translate(SX(k.x),SY(k.y));x.rotate(-ang);
      const w=120,im=A.spr['column-leaning']||A.spr.column;
      if(im){const s=A.spr['column-leaning']?'column-leaning':'column';const sp=A.spr[s],at=ATL[sp[0]];
        if(ready(at))x.drawImage(at,sp[1],sp[2],sp[3],sp[4],-w/2,-k.h,w,k.h)}
      else{x.fillStyle='#2f4a32';x.fillRect(-w/2,-k.h,w,k.h)}
      x.restore();continue}
    const w=120;
    if(!blit('column',k.x-w/2,k.y-k.h,w,k.h))box(k.x-w/2,k.y-k.h,w,k.h,'#2f4a32','#7bbf6a');
  }
  for(const t of D.troughs||[]){const on=!!baited[t.id];
    if(!blit(on?'trough-baited':'trough',t.x-6,t.y-40,t.w+12,46))box(t.x,t.y-16,t.w,16,on?'#7a5a24':'#3a3226','#8a7350');
    if(on)glow(t.x+t.w/2,t.y-24,90,'#f0a83a',.45)}
  for(const h of hoppers){const empty=h.t>0;
    if(!blitH(empty?'pod-hopper-empty':'pod-hopper',h.x,h.y,120))box(h.x-26,h.y-90,52,90,empty?'#2f2a20':'#4a3f2c','#8a7350');
    if(!empty)glow(h.x,h.y-40,60,'#f0a83a',.25)}
  {const a=D.alarm;if(!blitH(alarmOn?'alarm-on':'alarm',a.x,a.y,110))box(a.x-22,a.y-84,44,84,alarmOn?'#7a3a24':'#3a3226','#8a7350');
   if(alarmOn)glow(a.x,a.y-60,110,'#f0a83a',.4+.15*Math.sin(now*6))}
  {const ct=D.cart;if(!blit('bedding-cart',ct.x,ct.y-120,ct.w,130))box(ct.x,ct.y-90,ct.w,90,'#4a3a22','#c9b38a');
   x.strokeStyle='#8a7350';x.lineWidth=4;x.beginPath();x.moveTo(SX(ct.x-120),SY(ct.y+8));x.lineTo(SX(ct.x+ct.w+120),SY(ct.y+8));x.stroke();
   if(cartBaited)glow(ct.x+ct.w/2,ct.y-60,160,'#f0a83a',.5)}
  for(const q of D.slips)if(!q.got){if(blitH('slip',q.x,q.y+16+Math.sin(now*2+q.id)*4,34))continue;
    x.save();x.translate(SX(q.x),SY(q.y));x.fillStyle='#e8ecef';x.fillRect(-11,-14,22,28);x.restore()}
}
function drawPod(now){
  if(pod.burst){const k=(now-pod.burstAt)/POD.BURST,cx=pod.x+pod.w/2,cy=pod.y+pod.h/2;
    glow(cx,cy,140*(1-k*.4),'#f0a83a',.55*(1-k));
    if(!blitH('feed-pod-burst',cx,cy+22,64))
      {x.fillStyle='#e0a13a';for(let i=0;i<10;i++){const a=i*.63+now;x.fillRect(SX(cx+Math.cos(a)*(18+i*3))-2,SY(cy+Math.sin(a)*9+6),4,4)}}
    return}
  const cx=pod.x+pod.w/2,cy=pod.y+pod.h/2;
  glow(cx,cy,pod.held?46:36,'#f0a83a',.3);
  if(blitH('feed-pod',cx,cy+20,42))return;
  x.save();x.translate(SX(cx),SY(cy));x.fillStyle='#5a4a34';x.strokeStyle='#f0a83a';x.lineWidth=3;
  x.beginPath();x.arc(0,0,18,0,7);x.fill();x.stroke();x.restore();
}
function cog(q,i,now){
  if(q.got)return;
  const bob=Math.sin(now*2+i)*5;
  x.save();x.translate(SX(q.x),SY(q.y+bob));x.rotate(now*.55*(i%2?1:-1));x.shadowColor='#5ff7de';x.shadowBlur=9;
  if(ready(cogImg)){const[sx,sy,sw2,sh2]=COG_SRC,h=54,w=h*sw2/sh2;x.drawImage(cogImg,sx,sy,sw2,sh2,-w/2,-h/2,w,h)}
  else{x.fillStyle=q.route==='mastery'?'#ff9d23':'#ffd75a';x.beginPath();x.arc(0,0,16,0,7);x.fill()}
  x.restore();
}
const cogImg=img('energy-cog-v1.png'),COG_SRC=[53,57,1148,1117];
function drawEnemy(e,now){
  const ph=EN.phaseName?EN.phaseName(e):'',tell=EN.tell?EN.tell(e):0;
  const cell=e.stun?6:ph==='wake'?5:ph==='turn'?4:Math.hypot(P.x-e.x,P.y-e.y)<72?7:Math.floor(now*7)%4;
  const cx=e.x+e.w/2,bottom=e.y+e.h+3;
  if(tell>0&&!EN.hazard(e)){x.save();x.globalAlpha=.25+tell*.5;x.fillStyle='#f0a83a';x.beginPath();x.arc(SX(cx),SY(bottom-80),14+tell*10,0,7);x.fill();x.restore()}
  if(!sprite('enemy-crawler-v2.png',cell,cx,bottom,62,e.dir<0?-1:1))box(e.x,e.y,e.w,e.h,'#8a2a20','#ff4d3a');
}
const BIX=img('bix-motion-v2.png');
function drawBix(){
  if(!ready(BIX)){box(P.x,P.y,P.w,P.h,'#59e2c2');return}
  const R=[[48,20,174,436],[305,20,176,436],[535,57,294,397],[862,57,260,397],[22,498,270,384],[301,480,260,402],[590,484,240,395],[860,457,275,330],[8,901,299,397],[311,1049,285,270],[643,879,180,451],[911,883,210,440]];
  const f=P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):P.land?9:Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  let ay=P.y+P.h;const r=R[f],dh=r[3]*.22,dw=r[2]*.22,ax=SX(P.x+P.w/2);
  if(P.hang||P.climb){const t=P.climb?1-P.climb/.45:0;ay=P.hangRect.y+(dh-4)*(1-t)}
  x.save();x.translate(ax,0);x.scale(P.face,1);x.shadowColor=staggered>0?'#f0a83a':'#59e2c2';x.shadowBlur=staggered>0?18:7;
  x.globalAlpha=P.inv&&Math.floor(performance.now()/70)%2?.48:1;
  x.drawImage(BIX,r[0],r[1],r[2],r[3],-dw/2,SY(ay)-dh,dw,dh);x.restore();
}
function draw(){
  const now=performance.now()/1000;
  x.save();x.clearRect(0,0,viewW,H);
  if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.65);
  drawBackdrop();
  drawBoss(now);                       // she is behind the platforms: the player runs in front of her
  drawWorld(now);
  D.cogs.forEach((q,i)=>cog(q,i,now));
  for(const e of enemies)drawEnemy(e,now);
  sprite('pack-assist-v2.png',packUntil>now?6:0,pack.x,pack.y+32,64,-P.face);
  drawBix();
  drawPod(now);
  if(dust>0){x.save();x.globalAlpha=Math.min(.5,dust*.5);x.fillStyle='#c9b38a';
    for(let i=0;i<40;i++){const px=(i*137+Math.floor(camX))%viewW,py=(i*89+Math.floor(now*40))%H;x.fillRect(px,py,2,2)}x.restore()}
  const vig=x.createRadialGradient(viewW*.5,H*.45,H*.2,viewW*.5,H*.48,Math.max(viewW,H)*.72);
  vig.addColorStop(0,'transparent');vig.addColorStop(.74,'#00000014');vig.addColorStop(1,'#000a');
  x.fillStyle=vig;x.fillRect(0,0,viewW,H);
  if(flash){x.fillStyle=`rgba(255,220,170,${flash*2})`;x.fillRect(0,0,viewW,H)}
  if(endFx>0){x.fillStyle=`rgba(20,14,8,${Math.min(.88,endFx)})`;x.fillRect(0,0,viewW,H)}
  x.restore();
}
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw()}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);
addEventListener('orientationchange',()=>setTimeout(resize,120));
if(window.ResizeObserver)new ResizeObserver(resize).observe(c);
resize();reset(1);requestAnimationFrame(frame);
})();
