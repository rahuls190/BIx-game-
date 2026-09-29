// Level 07: Clocking In. Pack Link powers the civic route while taking Pack away from Bix's emergency catch.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const D=window.L7DATA,A=window.L7ART,BASE=window.L2ART;
const audio=window.L7Audio||{start(){},stop(){},setArea(){},sfx(){},toggle(){return true},isMuted(){return true},isAvailable(){return false}};
const sound=name=>audio.sfx(name);
const ui=Object.fromEntries(['start','complete','story','storyImage','storyKicker','storyTitle','storyCopy','storyClose','dialogue','speaker','line','prompt','zone','objective','cogCount','fragmentCount','linkChip','rangeMeter','rangeBar','rangeLabel','finalCogs','finalTime','finalFalls','resultLine','medal','saveNote','lockNote','touchControls','packCharge','packChargeLabel','audioToggle'].map(id=>[id,$(id)]));
function fatal(t){x.fillStyle='#07151a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ff806b';x.font='600 20px system-ui';x.textAlign='center';x.fillText(t,c.width/2,c.height/2)}
if(!D||!A||!BASE){fatal('Level 7 failed to load.');return}

const H=720,GRAV=1450,JUMP=780,RUN=285,STEP=1/120,COG_TOTAL=D.cogs.length,FRAG_TOTAL=D.fragments.length,CARRY_MAX=80;
const K={left:0,right:0,down:0,up:0,jump:0,interact:0,blue:0,red:0};
const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,coyote:0,buffer:0,face:1,falls:0,hang:0,hangRect:null,climb:0,climbX:0,climbTarget:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0,anim:0};
const pack={x:0,y:0,mode:'attached',relay:null,returnT:0,pulse:0};
let viewW=1280,dpr=1,last=0,acc=0,camX=0,camY=-40,lead=.42,running=0,done=0,storyOpen=0,startTime=0;
let cogs=0,fragments=0,charge=1,checkpoint=D.checkpoints[0],seen=new Set(),told=new Set(),sayQ=[],sayT=0,msgTime=0,msgLock=0;
let enemies=[],auditors=[],targetState={},moving={},ending=0,shake=0,flash=0,linkBreaks=0,lastIncident=null;
let doorCooldown=0,blackoutT=0,blackoutSeen=new Set();

const img=s=>{const q=new Image;q.src='./assets/'+s;return q};
const IMG={};for(const [k,v] of Object.entries(A.bg))IMG['bg-'+k]=img(v);
for(const [k,v] of Object.entries(A.sheets))IMG[k]=img(v);
IMG.cog=img('energy-cog-v1.png');IMG.bixMotion=img('bix-motion-v2.png');IMG.platform=img(A.platform);IMG.memory=img(A.memory);IMG.departure=img(A.departure);
const ready=q=>q&&q.complete&&q.naturalWidth;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),SX=v=>v-camX,SY=v=>v-camY;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const narrow=()=>viewW<700,leadTarget=()=>narrow()?(P.vx>40?.14:P.vx<-40?.55:.24):.42;
function gridSprite(key,i,cx,bottom,h,flip=1,alpha=1){const im=IMG[key],g=A.grid[key];if(!ready(im)||!g)return 0;const cw=im.naturalWidth/g[0],ch=im.naturalHeight/g[1],col=i%g[0],row=Math.floor(i/g[0])%g[1],edge=key==='sweeper'?12:0,top=key==='sweeper'?3:0,w=h*(cw-2*edge)/(ch-2*top);x.save();x.globalAlpha=alpha;x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);x.drawImage(im,col*cw+edge,row*ch+top,cw-2*edge,ch-2*top,-w/2,-h,w,h);x.restore();return 1}
function prop(src,px,py,w,h){if(!ready(IMG.props))return 0;x.drawImage(IMG.props,...src,SX(px),SY(py),w,h);return 1}
function baseSprite(plate,i,cx,bottom,h,flip=1){const a=BASE[plate],im=plate==='bix-motion-v2.png'?IMG.bix:img(plate);if(!a||!ready(im)||!a.cells[i])return 0;const r=a.cells[i],w=h*r[2]/r[3];x.save();x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,-h,w,h);x.restore();return 1}
function box(px,py,w,h,f,s){x.fillStyle=f;x.fillRect(SX(px),SY(py),w,h);if(s){x.strokeStyle=s;x.lineWidth=2;x.strokeRect(SX(px),SY(py),w,h)}}
function glow(px,py,r,col,a){const g=x.createRadialGradient(SX(px),SY(py),0,SX(px),SY(py),r);g.addColorStop(0,col);g.addColorStop(1,'transparent');x.save();x.globalAlpha=a;x.fillStyle=g;x.fillRect(SX(px)-r,SY(py)-r,r*2,r*2);x.restore()}

function areaAt(px){let a=D.areas[0];for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;return a}
const killYAt=px=>areaAt(px).killY||960;
const powered=id=>pack.mode==='linked'&&pack.relay&&pack.relay.target===id&&!targetState.interrupted;
function linkRatio(){if(!(pack.mode==='linked'&&pack.relay))return 0;const r=pack.relay;let d=Math.hypot(P.x+21-pack.x,P.y+48-pack.y);const rep=D.repeaters.find(q=>q.relay===r.id);if(rep)d=Math.min(d,Math.hypot(P.x+21-rep.x,P.y+48-rep.y));return d/r.range}
function movingRect(id){
  for(const b of D.bridges)if(b.id===id){const m=moving[id];return{x:b.x,y:m?m.y:b.y}}
  for(const l of D.lifts)if(l.id===id){const m=moving[id];return{x:l.x,y:m?m.y:l.y}}
  for(const t of D.trams)if(t.id===id){const m=moving[id];return{x:m?m.x:t.x0,y:t.y}}
  return null
}
function dynamicState(dt){
  for(const b of D.bridges){const want=powered(b.id)?b.onY:b.y,m=moving[b.id]||(moving[b.id]={y:b.y});m.y+=(want-m.y)*Math.min(1,dt*3)}
  for(const l of D.lifts){const want=powered(l.id)?l.onY:l.y,m=moving[l.id]||(moving[l.id]={y:l.y});m.y+=(want-m.y)*Math.min(1,dt*2.4)}
  for(const t of D.trams){const m=moving[t.id]||(moving[t.id]={x:t.x0,dir:1});if(powered(t.id)){m.x+=m.dir*t.speed*dt;if(m.x>t.x1||m.x<t.x0){m.x=clamp(m.x,t.x0,t.x1);m.dir*=-1}}}
}
function solids(){const out=[];for(const p of [...D.platforms,...D.secretPlatforms])out.push({x:p[0],y:p[1],w:p[2],h:30,climbable:1});for(const l of D.ledges)out.push({x:l.x,y:l.y,w:l.w,h:l.h,ledge:1,climbable:1});
  for(const g of D.gates)if(!powered(g.id))out.push({x:g.x,y:g.y,w:g.w,h:g.h});
  for(const b of D.bridges){const m=moving[b.id]||b;out.push({x:b.x,y:m.y,w:b.w,h:b.h,ledge:1,dynamic:b.id,climbable:1})}
  for(const l of D.lifts){const m=moving[l.id]||l;out.push({x:l.x,y:m.y,w:l.w,h:l.h,ledge:1,dynamic:l.id,climbable:1})}
  for(const t of D.trams){const m=moving[t.id]||{x:t.x0};out.push({x:m.x,y:t.y,w:t.w,h:t.h,ledge:1,dynamic:t.id,climbable:1})}return out}
function move(a,dt){const all=solids(),blocks=all.filter(q=>!q.ledge);a.x=clamp(a.x+a.vx*dt,0,D.world.w-a.w);for(const r of blocks)if(overlap(a,r)){if(a.vx>0)a.x=r.x-a.w;else if(a.vx<0)a.x=r.x+r.w;a.vx=0}const old=a.y+a.h;a.y+=a.vy*dt;a.ground=0;a.support=null;for(const r of all){if(a.x>=r.x+r.w||a.x+a.w<=r.x)continue;if(a.vy>=0&&old<=r.y+4&&a.y+a.h>=r.y&&!(r.ledge&&a.dropTime>0)){a.y=r.y-a.h;a.vy=0;a.ground=1;a.support=r}else if(!r.ledge&&a.vy<0&&overlap(a,r)){a.y=r.y+r.h;a.vy=0}}}
function grab(now){if(P.ground||P.vy<45||P.grabCD)return;const hand=P.y+19;for(const r of solids()){if(!r.climbable)continue;if(hand<r.y-18||hand>r.y+32)continue;const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;P.ground=0;break}}}

function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.4}
const say=lines=>lines.forEach(l=>sayQ.push(l));
function pumpSay(dt){sayT=Math.max(0,sayT-dt);if(sayT<=0&&sayQ.length&&!storyOpen){const [s,t]=sayQ.shift();toast(s,t,2.7,1);sayT=2.7}}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'NO CATCH · PACK LINKED'}
function setCP(cp){checkpoint=cp;if(pack.mode==='attached')setCharge(1);sound('checkpoint');toast('SYSTEM',`Checkpoint · ${cp.name}`,1.3)}
const near=(o,r=105)=>Math.hypot(P.x+P.w/2-o.x,P.y+P.h/2-(o.y-48))<r;

function deploy(r,anchor){pack.mode='linked';pack.relay=r;pack.x=anchor?anchor.x:r.x;pack.y=anchor?anchor.y-25:r.y-72;pack.returnT=0;targetState.interrupted=0;setCharge(0);sound('deploy');shake=5;say([['PACK',`${r.label} linked. I will hold it from here.`]])}
function recall(reason){if(pack.mode==='attached')return;pack.mode='returning';pack.relay=null;pack.returnT=.65;targetState.interrupted=0;sound('recall');if(reason)toast('PACK',reason,1.8,1)}
function breakLink(){if(pack.mode!=='linked')return;linkBreaks++;targetState.interrupted=1;pack.mode='broken';pack.returnT=1;shake=10;flash=.12;setCharge(0);sound('linkbreak');toast('PACK','Link lost. The machinery will hold before it resets.',2.2,1)}
function updatePack(dt){
  if(pack.mode==='attached'){pack.x+=(P.x-P.face*50-pack.x)*Math.min(1,dt*7);pack.y+=(P.y+28-pack.y)*Math.min(1,dt*7);return}
  if(pack.mode==='returning'||pack.mode==='broken'){pack.returnT-=dt;if(pack.returnT<=0){pack.mode='attached';pack.relay=null;setCharge(1);targetState.interrupted=0;return}}
  if(pack.mode==='returning'){pack.x+=(P.x+P.w/2-pack.x)*Math.min(1,dt*10);pack.y+=(P.y+30-pack.y)*Math.min(1,dt*10)}
  if(pack.mode==='linked'&&pack.relay){if(linkRatio()>1.03)breakLink()}
  pack.pulse+=dt;
}

function spawnEnemies(){return D.enemies.map((e,i)=>{const ground=(e.type==='sweeper'||e.type==='ram')&&D.platforms.find(p=>e.x>=p[0]&&e.x<=p[0]+p[2]&&Math.abs(e.y-p[1])<5);const margin=e.type==='sweeper'?55:53;return {...e,id:i,x0:e.x,x:e.x,y2:e.y,t:i*.31,phase:0,alert:0,scan:0,dir:1,warned:0,chargeCycle:-1,dormant:!!e.ambushAt,emergeTime:0,w:e.type==='sweeper'?110:e.type==='ram'?100:e.type==='clamp'?70:72,h:e.type==='clamp'?150:70,walkMin:ground?ground[0]+margin:e.x-e.range,walkMax:ground?ground[0]+ground[2]-margin:e.x+e.range}})}
function spawnAuditors(){return D.auditors.map((a,i)=>({...a,p:.08+i*.05,dir:1,stun:0,active:0}))}
function hurt(cause){if(P.inv||done||ending||storyOpen)return;const now=performance.now()/1000;sound('hurt');if(charge&&pack.mode==='attached'){setCharge(0);P.inv=1.2;P.x=checkpoint.x;P.y=checkpoint.y-P.h;P.vx=P.vy=0;toast('PACK','Caught you. I remain in favour of proximity.',2,1);return}shake=16;flash=.14;reset(0);const lines={sweeper:'Municipal cleaning remains aggressively thorough.',ticket:'Fare rejected. Relay interrupted. Dignity unaffected.',ram:'Access denied with unusual enthusiasm.',clamp:'Maintenance has reserved our ladder.',auditor:'Inspection failed. Reroute first, then reconnect.',fall:'No catch from the socket. Resetting your route.'};toast('PACK',lines[cause]||'That route was not approved.',2.3,1);lastIncident=cause}
function updateEnemies(dt,now){for(const e of enemies){
    if(e.dormant){if(P.x+300<e.ambushAt)continue;e.dormant=0;e.emergeTime=.7;toast('SYSTEM','UNSCHEDULED MAINTENANCE UNIT RELEASED',1.7,1)}
    e.emergeTime=Math.max(0,e.emergeTime-dt);e.t+=dt;
    if(e.type==='sweeper'){
      const close=Math.abs(P.x+21-e.x)<390&&Math.abs(P.y+P.h-e.y)<95;
      e.alert+=(Number(close)-e.alert)*Math.min(1,dt*5);
      if(e.alert>.55&&!e.warned){e.warned=1;sound('alert')}if(e.alert<.1)e.warned=0;
      const old=e.x,patrol=e.x0+Math.sin(e.t*.7)*e.range;
      e.x=clamp(e.x+(close?(P.x+21>e.x?1:-1)*220*dt:(patrol-e.x)*Math.min(1,dt*3)),Math.max(e.walkMin,e.x0-e.range),Math.min(e.walkMax,e.x0+e.range));
      e.dir=e.x!==old?(e.x>old?1:-1):close?(P.x+21>e.x?1:-1):(patrol>e.x?1:-1);e.phase=Math.floor(e.t*(close?8:5))%8;
      if(Math.abs(P.x+21-e.x)<70&&Math.abs(P.y+P.h-e.y)<82)hurt('sweeper')
    }else if(e.type==='ticket'){
      e.x=e.x0+Math.sin(e.t*.65)*e.range;e.y2=e.y+Math.sin(e.t*2.8)*8;
      const z=e.t%4.2,previousScan=e.scan;e.scan=z<2.2?0:z<2.9?1:z<3.6?2:0;if(e.scan===1&&previousScan!==1&&Math.abs(P.x-e.x)<700)sound('alert');
      e.phase=e.scan===2?5:e.scan===1?2+Math.floor(e.t*7)%2:Math.floor(e.t*2)%2;
      if(e.scan===2&&Math.abs(P.x+21-e.x)<155&&Math.abs(P.y+45-(e.y2-90))<145){targetState.interrupted=.65;hurt('ticket')}
    }else if(e.type==='ram'){
      const z=e.t%4.4,cycle=Math.floor(e.t/4.4);if(cycle!==e.chargeCycle){e.chargeCycle=cycle;const toward=P.x+21>e.x0?1:-1,roomRight=e.walkMax-e.x0,roomLeft=e.x0-e.walkMin;e.dir=Math.abs(P.x+21-e.x0)<420&&Math.abs(P.y+P.h-e.y)<95&&((toward>0?roomRight:roomLeft)>75)?toward:(roomRight>=roomLeft?1:-1)}
      if(z>=1.05&&z<1.5&&!e.warned){e.warned=1;if(Math.abs(P.x-e.x)<700)sound('alert')}if(z<1.05)e.warned=0;
      e.phase=z<1.05?Math.floor(e.t*2)%3:z<1.5?4:z<2.45?5+Math.floor((z-1.5)*9)%3:1;
      e.x=clamp(e.x0+(z>1.5&&z<2.45?(z-1.5)/.95*e.range*e.dir:z>=2.45?e.range*e.dir:0),e.walkMin,e.walkMax);
      e.alert=z>=1.05&&z<2.45?1:0;
      if(z>1.5&&z<2.55&&Math.abs(P.x+21-e.x)<70&&Math.abs(P.y+P.h-e.y)<95)hurt('ram')
    }else if(e.type==='clamp'){
      const z=e.t%4.8;e.alert=z>=1.15&&z<3.1?1:0;
      if(z>=1.15&&z<1.55&&!e.warned){e.warned=1;if(Math.abs(P.x-e.x)<700)sound('alert')}if(z<1.15)e.warned=0;
      e.phase=z<1.15?0:z<1.55?4:z<3.1?5+Math.floor((z-1.55)*5)%3:1;
      e.y2=e.y+(z>1.55&&z<3.1?Math.sin((z-1.55)/1.55*Math.PI)*260:0);
      if(z>1.55&&z<3.1&&Math.abs(P.x+21-e.x)<55&&P.y<e.y2+e.h&&P.y+P.h>e.y2)hurt('clamp')
    }
  }
  if(targetState.interrupted)targetState.interrupted=Math.max(0,targetState.interrupted-dt)}
function updateAuditors(dt){for(const a of auditors){const live=pack.mode==='linked'&&pack.relay&&pack.relay.id===a.relay;if(!live){a.active=0;a.p=.08;continue}a.active=1;a.stun=Math.max(0,a.stun-dt);if(!a.stun)a.p+=a.speed*a.dir*dt;if(a.p<.05){a.p=.05;a.dir=1}if(a.p>=.96){a.p=.96;targetState.interrupted=.9;a.stun=.9;shake=7;toast('SYSTEM','Relay inspection interrupted.',1.3,1)}if(K.blue){a.p=Math.max(.05,a.p-.32);a.dir=-1;a.stun=.18}if(K.red){a.p=.22;a.dir=1;a.stun=.55}}}

function buildWorld(full){if(full){targetState={interrupted:0};moving={};enemies=spawnEnemies();auditors=spawnAuditors();told=new Set();linkBreaks=0;blackoutSeen=new Set();blackoutT=0;D.cogs.forEach(q=>q.got=0);D.fragments.forEach(q=>q.got=0);D.triggers.forEach(q=>q.used=0);D.terminals.forEach(q=>q.used=0);D.hiddenDoors.forEach(q=>q.discovered=0)}else{enemies=spawnEnemies();targetState.interrupted=0}doorCooldown=0;dynamicState(0)}
function reset(full=1){Object.assign(P,{x:full?D.start.x:checkpoint.x,y:(full?D.start.y:checkpoint.y)-P.h,vx:0,vy:0,ground:0,coyote:0,buffer:0,face:1,falls:full?0:P.falls+1,hang:0,hangRect:null,climb:0,grabCD:.3,support:null,dropTime:0,jumpTime:0,inv:.8});
  if(full){cogs=fragments=0;checkpoint=D.checkpoints[0];seen=new Set();done=0;ending=0;startTime=performance.now();ui.complete.classList.add('hidden');pack.mode='attached';pack.relay=null;setCharge(1)}else{pack.mode='attached';pack.relay=null;setCharge(1)}
  buildWorld(full);pack.x=P.x-50;pack.y=P.y+28;lead=leadTarget();camX=Math.max(0,P.x-viewW*lead);camY=clamp(P.y-H*.5,D.world.yMin,D.world.yMax-H);sayQ.length=0;sayT=0;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;ui.fragmentCount.textContent=`${fragments} / ${FRAG_TOTAL}`;
  try{const q=devHost()?new URLSearchParams(location.search).get('at'):null,cp=full&&q!==null&&D.checkpoints[+q];if(cp){checkpoint=cp;seen.add(cp);P.x=cp.x;P.y=cp.y-P.h;camX=Math.max(0,P.x-viewW*lead);camY=clamp(P.y-H*.5,D.world.yMin,D.world.yMax-H)}}catch(e){}
}

const devHost=()=>{try{return !location.hostname||/^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(location.hostname)}catch(e){return true}};
function carried(){try{const q=devHost()?new URLSearchParams(location.search).get('banked'):null;if(q!==null&&q!==''&&isFinite(+q))return clamp(Math.floor(+q),0,CARRY_MAX)}catch(e){}try{const p=window.Mayhem&&window.Mayhem.getProgress&&window.Mayhem.getProgress(),MP=window.MayhemProgress;return p&&MP?MP.carriedCogs(p,'level7'):0}catch(e){return 0}}
function level6Done(){try{if(devHost()&&new URLSearchParams(location.search).get('unlocked')==='1')return true;const p=window.Mayhem&&window.Mayhem.getProgress&&window.Mayhem.getProgress();return !!(p&&p.levels&&p.levels.level6&&p.levels.level6.completed)}catch(e){return false}}
const UNLOCK=(window.MayhemProgress&&window.MayhemProgress.LEVEL7_UNLOCK_COGS)||40;
const locked=()=>!level6Done()||carried()<UNLOCK;
function refreshLock(){const l=locked(),b=$('startButton');if(b)b.disabled=l;if(ui.lockNote){ui.lockNote.hidden=!l;ui.lockNote.textContent=l?`Level 7 opens after Level 6 is complete and ${UNLOCK} of 80 cogs are carried forward (${carried()} so far).`:''}}
function refreshAudioButton(){if(!ui.audioToggle)return;const off=audio.isMuted()||!audio.isAvailable();ui.audioToggle.textContent=off?'♪ SOUND OFF':'♪ SOUND ON';ui.audioToggle.setAttribute('aria-pressed',String(off));ui.audioToggle.setAttribute('aria-label',off?'Unmute music and sound':'Mute music and sound')}
function toggleAudio(){audio.toggle();refreshAudioButton()}
if(ui.audioToggle){ui.audioToggle.onclick=toggleAudio;refreshAudioButton()}
function start(){clearInput();ui.start.classList.add('hidden');ui.touchControls.classList.add('playing');running=1;startTime=performance.now();audio.setArea(areaAt(P.x).id);audio.start();c.focus()}
$('startButton').onclick=()=>{if(locked()){refreshLock();return}start()};$('replayButton').onclick=()=>{clearInput();reset(1);running=1;audio.setArea('dome');audio.start();ui.complete.classList.add('hidden');ui.touchControls.classList.add('playing')};
refreshLock();try{window.Mayhem&&window.Mayhem.subscribe&&window.Mayhem.subscribe(refreshLock)}catch(e){}

function showStory(kind){storyOpen=1;const full=kind==='departure';ui.storyImage.src='./assets/'+(full?A.departure:A.memory);ui.storyImage.alt=full?'Bix and Pack boarding the first train at sunrise':'An archive recording of Bix and Pack entering the civic district eleven years earlier';ui.storyKicker.textContent=full?'FIRST TRAIN':'ARCHIVE RECORD';ui.storyTitle.textContent=full?'ON TIME':'BX-7';ui.storyCopy.textContent=full?'The doors close after Pack returns. The board changes from eleven years delayed to on time. The destination remains unnamed.':'The archive shows Bix entering this district eleven years ago with a newly issued Pack. The shift never ended; the city has simply been waiting.';ui.story.classList.remove('hidden')}
ui.storyClose.onclick=()=>{ui.story.classList.add('hidden');storyOpen=0;if(ending)finish()};

function useHiddenDoor(d){
  d.discovered=1;const pair=D.hiddenDoors.find(q=>q!==d&&q.id.split('-')[0]===d.id.split('-')[0]);if(pair)pair.discovered=1;
  P.x=d.toX-21;P.y=d.toY-P.h;P.vx=P.vy=0;P.ground=0;P.hang=P.climb=0;P.hangRect=null;P.grabCD=.45;P.inv=.7;
  pack.x=P.x-50;pack.y=P.y+28;doorCooldown=.7;
  camX=clamp(P.x-viewW*lead,0,D.world.w-viewW);camY=clamp(P.y-H*.5,D.world.yMin,D.world.yMax-H);
  sound('door');toast('PACK',d.returnDoor?'Back on the public route.':`${d.room}. The public map left this out.`,2.4,1)
}
function interact(now){let label='',act=null;const r=D.relays.find(q=>near(q,115));const t=D.terminals.find(q=>near(q,115));const door=doorCooldown?null:D.hiddenDoors.find(q=>near(q,95));const bridge=D.bridges.find(b=>P.support?.dynamic===b.id&&!powered(b.id));
  if(t&&t.kind==='memory'&&!t.used){label='ACT · OPEN BX-7 RECORD';act=()=>{t.used=1;showStory('memory')}}
  else if(t&&t.kind==='board'&&!t.used){label='ACT · READ THE DEPARTURE BOARD';act=()=>{t.used=1;const words=D.fragments.map(q=>q.got?q.word:'____').join(' ');say([['VELA',words+'.'],['SYSTEM','Unauthorized message cleared.']])}}
  else if(t&&t.kind==='reset'){label='ACT · RESET RELAY COURT';act=()=>{pack.mode='attached';pack.relay=null;setCharge(1);targetState.interrupted=0;toast('SYSTEM','Relay arrangement restored.',1.5,1)}}
  else if(door){label=pack.mode!=='attached'?'ACT · RECALL PACK FOR THE DOOR':door.returnDoor?'ACT · RETURN TO THE PUBLIC ROUTE':door.discovered?'ACT · OPEN HIDDEN DOOR':'ACT · INSPECT WALL SEAM';act=()=>pack.mode==='attached'?useHiddenDoor(door):recall('Come back. There is a door here.')}
  else if(bridge&&pack.mode==='attached'){const socket=D.relays.find(q=>q.target===bridge.id);if(socket){label='ACT · LINK PACK · RAISE BRIDGE';act=()=>deploy(socket,{x:P.x+P.w/2,y:P.y+P.h-10})}}
  else if(r&&pack.mode==='attached'){label=`ACT · LINK PACK · ${r.label}`;act=()=>deploy(r)}
  else if(pack.mode==='linked'&&near(pack,115)){label='ACT · RECALL PACK';act=()=>recall('Coming back.')}
  else if(pack.mode==='linked'){label='ACT · REMOTE RECALL';act=()=>recall('Remote recall received.')}
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);if(!K.interact)return;K.interact=0;if(act)act()}

function update(dt){if(!running||done||storyOpen)return;const now=performance.now()/1000;P.inv=Math.max(0,P.inv-dt);P.grabCD=Math.max(0,P.grabCD-dt);P.dropTime=Math.max(0,P.dropTime-dt);doorCooldown=Math.max(0,doorCooldown-dt);blackoutT=Math.max(0,blackoutT-dt);msgTime=Math.max(0,msgTime-dt);msgLock=Math.max(0,msgLock-dt);if(msgTime<=0&&sayQ.length===0)ui.dialogue.classList.add('hidden');pumpSay(dt);
  for(const b of D.blackouts)if(!blackoutSeen.has(b.x0)&&P.x>=b.x0&&P.x<b.x1){blackoutSeen.add(b.x0);blackoutT=b.seconds;sound('blackout');toast('PACK',b.line,2.4,1)}
  // carry Bix along with whatever dynamic surface he is standing on (a bridge, a lift, or the tram) before it advances this
  // frame. Bridges and lifts only move vertically, so the normal landing re-check happened to paper over the gap; the tram
  // moves horizontally, where nothing else corrects for it, and he would simply be left behind as it slid out from under him.
  const dynBefore=(P.ground&&P.support&&P.support.dynamic)?{id:P.support.dynamic,...movingRect(P.support.dynamic)}:null;
  dynamicState(dt);
  if(dynBefore){const r=movingRect(dynBefore.id);if(r){P.x+=r.x-dynBefore.x;P.y+=r.y-dynBefore.y}}
  updatePack(dt);updateEnemies(dt,now);updateAuditors(dt);
  if(P.hangRect?.dynamic)P.hangRect=solids().find(r=>r.dynamic===P.hangRect.dynamic)||P.hangRect;
  if(P.climb){P.climb=Math.max(0,P.climb-dt);const r=P.hangRect,p=1-P.climb/.45,e=p*p*(3-2*p);P.vx=P.vy=0;P.ground=0;P.x=P.climbX+(P.climbTarget-P.climbX)*e;P.y=r.y-19-(P.h-19)*e;if(!P.climb){P.y=r.y-P.h;P.ground=1;P.support=r;P.hangRect=null;P.grabCD=.28}}
  else if(P.hang){P.vx=P.vy=0;P.ground=0;if(K.down||(P.face>0&&K.left)||(P.face<0&&K.right)){P.hang=0;P.hangRect=null;P.dropTime=.24;P.grabCD=.35;P.vy=100}else if(P.buffer>0||K.up||now-P.hangAt>.18){P.hang=0;P.climb=.45;P.climbX=P.x;P.climbTarget=P.face>0?P.hangRect.x+8:P.hangRect.x+P.hangRect.w-P.w-8;P.buffer=0}}
  else{const axis=(K.right?1:0)-(K.left?1:0);if(axis)P.face=axis;const max=targetState.interrupted?RUN*.82:RUN;P.vx+=(axis*max-P.vx)*Math.min(1,dt*(P.ground?18:8));if(!axis)P.vx*=Math.exp(-(P.ground?15:2.5)*dt);P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);if(P.buffer>0&&P.coyote>0){P.vy=-JUMP;P.ground=0;P.coyote=0;P.buffer=0;P.jumpTime=.25;sound('jump')}P.vy+=GRAV*dt;if(!K.jump&&P.vy<0)P.vy+=1500*dt;const wasAirborne=!P.ground;move(P,dt);if(wasAirborne&&P.ground)sound('land');grab(now)}
  P.anim+=Math.abs(P.vx)*dt/55;
  if(P.y>killYAt(P.x)||P.y<D.world.yMin-240)hurt('fall');
  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+42-q.y)<62){q.got=1;cogs++;sound('cog');ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;toast('PACK',`Cog ${cogs} secured.`,1.2)}
  for(const q of D.fragments)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+42-q.y)<68){q.got=1;fragments++;sound('fragment');ui.fragmentCount.textContent=`${fragments} / ${FRAG_TOTAL}`;toast('VELA',`Shift fragment ${fragments}/${FRAG_TOTAL} · ${q.word}`,2.2,1)}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&D.checkpoints.indexOf(cp)>D.checkpoints.indexOf(checkpoint)&&P.x>cp.x-50&&Math.abs(P.y+P.h-cp.y)<130){seen.add(cp);setCP(cp)}
  for(const q of D.triggers)if(!q.used&&P.x>=q.x){q.used=1;say(q.say)}
  interact(now);if(powered('traction')&&P.x>D.world.finishX&&!ending){ending=1;running=0;showStory('departure')}
  const a=areaAt(P.x),ty=a.vertical?clamp(P.y-H*.5,D.world.yMin,D.world.yMax-H):(a.camY??-40);audio.setArea(a.id);camY+=(ty-camY)*Math.min(1,dt*4.5);lead+=(leadTarget()-lead)*Math.min(1,dt*4);camX+=(clamp(P.x-viewW*lead,0,D.world.w-viewW)-camX)*Math.min(1,dt*5);
  hud();K.blue=K.red=0;
}
function hud(){
  const a=areaAt(P.x),room=D.hiddenDoors.find(d=>d.returnDoor&&Math.abs(P.x-d.x)<380&&Math.abs(P.y+P.h-d.y)<180);
  const lowered=D.bridges.find(b=>P.support?.dynamic===b.id&&!powered(b.id));
  ui.zone.textContent=room?room.room:a.name;
  ui.objective.textContent=room?'Search the hidden room, then find the return door':lowered?'Bridge lowered · press E to link Pack and lift it':a.objective;
  const linked=pack.mode==='linked'&&pack.relay;
  ui.linkChip.textContent=linked?`PACK LINK · ${pack.relay.label}`:pack.mode==='attached'?'PACK · ATTACHED':pack.mode==='broken'?'LINK · BROKEN':'PACK · RETURNING';
  ui.linkChip.className='link-chip '+(linked?'live':pack.mode==='broken'?'broken':'');
  ui.rangeMeter.classList.toggle('hidden',!linked);
  if(linked){const ratio=clamp(linkRatio(),0,1);ui.rangeBar.style.width=`${ratio*100}%`;ui.rangeLabel.textContent=`LINK ${Math.round(ratio*100)}%`;ui.rangeMeter.classList.toggle('warn',ratio>.7);ui.rangeMeter.classList.toggle('danger',ratio>.9)}
}

const MEDALS=[{name:'GOLD',cogs:16,falls:10,sec:1800,line:'The shift starts before the city can object.'},{name:'SILVER',cogs:10,falls:24,sec:2400,line:'A very respectable late arrival.'},{name:'BRONZE',cogs:0,falls:9999,sec:99999,line:'Eleven years late still counts as present.'}];
const medalFor=(cg,f,t)=>MEDALS.find(m=>cg>=m.cogs&&f<=m.falls&&t<=m.sec);
function finish(){done=1;running=0;audio.stop();sound('finish');ui.touchControls.classList.remove('playing');const sec=Math.max(1,Math.floor((performance.now()-startTime)/1000)),m=medalFor(cogs,P.falls,sec);ui.finalCogs.textContent=`${cogs} / ${COG_TOTAL}`;ui.finalTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;ui.finalFalls.textContent=P.falls;ui.medal.textContent=m.name;ui.medal.dataset.medal=m.name.toLowerCase();ui.resultLine.textContent=`PACK: “${m.line}”`+(fragments===FRAG_TOTAL?' VELA warning complete: BX-7, DO NOT CLOCK IN.':'');ui.complete.classList.remove('hidden');const M=window.Mayhem;if(M&&ui.saveNote)M.recordResult('level7',{timeSec:sec,cogs,falls:P.falls}).then(t=>{ui.saveNote.textContent=t;ui.saveNote.hidden=!t}).catch(()=>{})}

function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;dpr=Math.min(2,devicePixelRatio||1);viewW=H*r.width/r.height;c.width=Math.round(viewW*dpr);c.height=Math.round(H*dpr);lead=leadTarget()}
addEventListener('resize',resize);
function drawBackdrop(){const a=areaAt(P.x);x.fillStyle='#10272d';x.fillRect(0,0,viewW,H);
  function layer(id,opacity){const im=IMG['bg-'+id];if(!ready(im)||opacity<=0)return;const s=H/im.naturalHeight,dw=im.naturalWidth*s,par=camX*.08,ox=-((par%dw)+dw)%dw;x.globalAlpha=.78*opacity;for(let q=ox-dw;q<viewW+dw;q+=dw)x.drawImage(im,q,0,dw,H);x.globalAlpha=1}
  const boundary=D.areas.find((q,i)=>i>0&&Math.abs(P.x-q.x0)<240);
  if(boundary){const i=D.areas.indexOf(boundary),mix=clamp((P.x-boundary.x0+240)/480,0,1);layer(D.areas[i-1].id,1);layer(boundary.id,mix)}else layer(a.id,1);
  if(a.id==='deadhead'){
    x.fillStyle='#07191b99';x.fillRect(0,0,viewW,H);
    const off=((camX*.24)%440+440)%440;
    for(let bx=-off-440;bx<viewW+440;bx+=440){
      x.fillStyle='#15292b';x.fillRect(bx+46,0,16,H);x.fillRect(bx+340,0,11,H);
      x.strokeStyle='#4c777144';x.lineWidth=3;x.beginPath();x.moveTo(bx+52,30);x.lineTo(bx+345,310);x.moveTo(bx+345,30);x.lineTo(bx+52,310);x.stroke();
      x.fillStyle='#d4ad58';x.fillRect(bx+175,86,90,4);x.fillStyle='#8eae9b';x.fillRect(bx+206,90,28,11);
      const beam=x.createLinearGradient(bx+220,102,bx+220,440);beam.addColorStop(0,'#b1ffe122');beam.addColorStop(1,'#b1ffe100');x.fillStyle=beam;x.beginPath();x.moveTo(bx+206,102);x.lineTo(bx+110,440);x.lineTo(bx+330,440);x.lineTo(bx+234,102);x.fill();
    }
  }
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#06151a44');g.addColorStop(1,'#031014cc');x.fillStyle=g;x.fillRect(0,0,viewW,H)}
function drawPlatform(r){
  const [px,py,w]=r;
  // Slim underframe makes a high walkway read as a built structure without turning it into a solid wall.
  x.save();x.strokeStyle='#17373a99';x.lineWidth=6;
  for(let d=90;d<w-90;d+=340){const cx=px+d,low=py+116;x.beginPath();x.moveTo(SX(cx-60),SY(py+25));x.lineTo(SX(cx),SY(low));x.lineTo(SX(cx+60),SY(py+25));x.stroke();box(cx-29,low-4,58,7,'#37585b')}
  x.restore();
  box(px,py,w,30,'#263a3e');box(px,py,w,4,'#d9b63b');
  if(ready(IMG.platform)){
    // Crop from the opaque middle of the art. Its tapered outer edges leave a V-shaped gap when repeated.
    const tile=460,src=[420,300,900,224];
    for(let d=0;d<w;d+=tile){const dw=Math.min(tile,w-d);x.drawImage(IMG.platform,src[0],src[1],src[2]*dw/tile,src[3],SX(px+d),SY(py),dw,28)}
  }
  box(px,py+28,w,2,'#15272b');
}
function drawDeck(px,py,w,h,kind){
  if(kind==='ledge'){
    const top=py-160;x.save();x.strokeStyle='#7ca5a07f';x.lineWidth=4;
    for(const cx of [px+28,px+w-28]){x.beginPath();x.moveTo(SX(cx),SY(top));x.lineTo(SX(cx),SY(py));x.stroke();box(cx-7,top-6,14,10,'#788e88');box(cx-6,py-9,12,12,'#ad8b4e')}
    x.strokeStyle='#315b5caa';x.lineWidth=3;x.beginPath();x.moveTo(SX(px+28),SY(top+24));x.lineTo(SX(px+w-28),SY(py-12));x.moveTo(SX(px+w-28),SY(top+24));x.lineTo(SX(px+28),SY(py-12));x.stroke();x.restore();
  }
  box(px,py,w,h,kind==='lift'?'#3e5f63':'#3b5559',kind==='lift'?'#59e2c2':'#ffd75a');
  if(kind==='lift')prop([782,485,324,155],px-8,py-5,w+16,Math.max(38,h+22));
  else prop([60,485,700,150],px-6,py-5,w+12,Math.max(38,h+22));
}
function drawLiftGuide(o,now){
  const top=Math.min(o.onY,o.y),bottom=Math.max(o.onY,o.y)+o.h,live=powered(o.id),col=live?'#63ffe3':'#d5ae59';
  x.save();x.globalAlpha=.65;
  for(const gx of [o.x+34,o.x+o.w-34]){box(gx-5,top+5,10,bottom-top,'#244448');box(gx-1,top+5,2,bottom-top,col);for(let y=top+24;y<bottom-8;y+=34)box(gx-11,y,22,3,'#68817a')}
  box(o.x+17,top-9,o.w-34,7,col);x.globalAlpha=.25;box(o.x+17,bottom+5,o.w-34,4,col);x.restore();
  if(!live){x.save();x.fillStyle='#ffe0a0';x.font='800 14px system-ui';x.textAlign='center';x.fillText('PACK LINK ↑',SX(o.x+o.w/2),SY((top+bottom)/2));x.restore()}
  else{const pulse=top+((now*75)%(bottom-top));glow(o.x+o.w/2,pulse,34,col,.18)}
}
function drawWorld(now){for(const b of [...D.bridges,...D.lifts])drawLiftGuide(b,now);for(const p of [...D.platforms,...D.secretPlatforms])drawPlatform(p);for(const l of D.ledges)drawDeck(l.x,l.y,l.w,l.h,'ledge');
  for(const g of D.gates){if(powered(g.id)){x.save();x.globalAlpha=.25;box(g.x,g.y,g.w,g.h,'#59e2c2');x.restore()}else{box(g.x,g.y,g.w,g.h,'#9a3850','#ff5e78');prop([76,666,342,352],g.x-30,g.y,104,g.h)}}
  for(const b of D.bridges){const m=moving[b.id]||b;drawDeck(b.x,m.y,b.w,b.h,'bridge');glow(b.x+b.w/2,m.y-8,28,powered(b.id)?'#59e2c2':'#ffd75a',.22);box(b.x+b.w/2-13,m.y-6,26,6,powered(b.id)?'#59e2c2':'#d9b63b')}for(const l of D.lifts){const m=moving[l.id]||l;drawDeck(l.x,m.y,l.w,l.h,'lift')}for(const t of D.trams){const m=moving[t.id]||{x:t.x0};drawDeck(m.x,t.y,t.w,t.h,'tram')}
  for(const r of D.relays){const on=pack.relay===r&&pack.mode==='linked';glow(r.x,r.y-50,on?75:36,on?'#59e2c2':'#ffd75a',on?.35:.16);if(!prop([430,676,320,345],r.x-32,r.y-92,64,92))box(r.x-24,r.y-68,48,68,'#d5ddd5','#17262a');if(on)gridSprite('effects',2,r.x,r.y-25,86)}
  for(const q of D.repeaters){if(!prop([434,360,64,185],q.x-14,q.y-70,28,70))box(q.x-14,q.y-48,28,48,'#95bdb7','#203a40');glow(q.x,q.y-40,30,'#59e2c2',.13)}for(const t of D.terminals){if(!prop([1130,365,340,305],t.x-37,t.y-93,74,93))box(t.x-22,t.y-72,44,72,'#81aaa5','#17333a')}
  for(const d of D.hiddenDoors){x.save();x.globalAlpha=d.discovered?1:.35;if(!prop([76,666,342,352],d.x-27,d.y-94,54,94))box(d.x-22,d.y-82,44,82,'#6b9290','#d5b44c');x.restore();if(!d.discovered){box(d.x+16,d.y-54,3,20,'#cda94a');glow(d.x+18,d.y-43,16,'#ffd75a',.18)}else glow(d.x,d.y-50,40,'#59e2c2',.18)}
  for(const q of D.cogs)if(!q.got)drawCog(q,now);for(const q of D.fragments)if(!q.got){glow(q.x,q.y,38,'#59e2c2',.25);x.save();x.translate(SX(q.x),SY(q.y));x.rotate(Math.sin(now*2+q.id)*.12);x.fillStyle='#b9fff0';x.fillRect(-15,-20,30,40);x.fillStyle='#17434a';x.fillRect(-9,-13,18,3);x.fillRect(-9,-6,13,3);x.restore()}}
function drawCog(q,now){x.save();x.translate(SX(q.x),SY(q.y+Math.sin(now*2+q.x)*4));x.rotate(now);if(ready(IMG.cog))x.drawImage(IMG.cog,53,57,1148,1117,-22,-22,44,44);else{x.strokeStyle='#ffd75a';x.lineWidth=6;x.beginPath();x.arc(0,0,17,0,Math.PI*2);x.stroke()}x.restore()}
function linkPath(now){
  const from={x:pack.x,y:pack.y+18},to={x:P.x+P.w/2,y:P.y+43},r=pack.relay,rep=D.repeaters.find(q=>q.relay===r.id);
  const via=rep&&Math.hypot(to.x-from.x,to.y-from.y)>r.range*.8;
  const stops=via?[from,{x:rep.x,y:rep.y-42},to]:[from,to],points=[];
  for(let s=0;s<stops.length-1;s++){
    const a=stops[s],b=stops[s+1],distance=Math.hypot(b.x-a.x,b.y-a.y),lift=Math.min(105,24+distance*.12),steps=Math.max(12,Math.ceil(distance/22));
    const control={x:(a.x+b.x)/2,y:Math.min(a.y,b.y)-lift+Math.sin(now*1.6+s)*5};
    for(let i=s?1:0;i<=steps;i++){const t=i/steps,u=1-t;points.push({x:u*u*a.x+2*u*t*control.x+t*t*b.x,y:u*u*a.y+2*u*t*control.y+t*t*b.y})}
  }
  return points;
}
function drawLink(now){
  if(pack.mode!=='linked'||!pack.relay)return;
  const points=linkPath(now),dist=[0];for(let i=1;i<points.length;i++)dist[i]=dist[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
  const total=dist[dist.length-1]||1,at=t=>{const d=((t%1)+1)%1*total;let i=1;while(i<dist.length-1&&dist[i]<d)i++;const f=(d-dist[i-1])/Math.max(.001,dist[i]-dist[i-1]);return{x:points[i-1].x+(points[i].x-points[i-1].x)*f,y:points[i-1].y+(points[i].y-points[i-1].y)*f}};
  const danger=targetState.interrupted||linkRatio()>.94,color=danger?'#ff6678':linkRatio()>.78?'#ffd45f':'#63ffe3';
  x.save();x.lineCap='round';x.lineJoin='round';
  for(const [width,alpha] of [[16,.09],[8,.2],[2.6,.9]]){
    x.beginPath();x.moveTo(SX(points[0].x),SY(points[0].y));for(let i=1;i<points.length;i++)x.lineTo(SX(points[i].x),SY(points[i].y));x.strokeStyle=color;x.globalAlpha=alpha;x.lineWidth=width;x.stroke();
  }
  for(const side of [-1,1]){
    x.beginPath();for(let i=0;i<points.length;i++){
      const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],len=Math.hypot(next.x-prev.x,next.y-prev.y)||1;
      const wave=Math.sin(i*.72-now*7+side)*3.5*side,px=SX(points[i].x-(next.y-prev.y)/len*wave),py=SY(points[i].y+(next.x-prev.x)/len*wave);
      if(!i)x.moveTo(px,py);else x.lineTo(px,py);
    }
    x.strokeStyle=color;x.globalAlpha=.36;x.lineWidth=1.1;x.stroke();
  }
  for(let i=0;i<3;i++){
    const p=at(now*.19+i/3),sx=SX(p.x),sy=SY(p.y),radius=i===0?6:3.4;
    x.globalAlpha=.85;x.shadowBlur=18;x.shadowColor=color;x.fillStyle='#e9fff9';x.beginPath();x.arc(sx,sy,radius,0,Math.PI*2);x.fill();x.shadowBlur=0;
  }
  for(const p of [points[0],points[points.length-1]]){x.globalAlpha=.55+.25*Math.sin(now*5);x.strokeStyle=color;x.lineWidth=2;x.beginPath();x.arc(SX(p.x),SY(p.y),11+2*Math.sin(now*4),0,Math.PI*2);x.stroke()}
  x.restore();
  for(const a of auditors)if(a.active){const p=at(a.p);gridSprite('auditor',Math.floor(now*5)%8,p.x,p.y+38,64)}
}
function drawEnemies(now){for(const e of enemies){
    if(e.dormant)continue;
    const blink=e.emergeTime&&Math.floor(now*10)%2;if(blink)continue;
    if(e.type==='sweeper'){
      if(e.alert>.25)glow(e.x,e.y-25,70,'#ff9452',e.alert*.22);
      gridSprite('sweeper',e.phase,e.x,e.y,105,e.dir<0?-1:1);
    }else if(e.type==='ticket'){
      if(e.scan){x.save();x.globalAlpha=e.scan===2?.27:.12;x.fillStyle=e.scan===2?'#ff5e78':'#59e2c2';x.beginPath();x.moveTo(SX(e.x),SY(e.y2-18));x.lineTo(SX(e.x-150),SY(e.y2+115));x.lineTo(SX(e.x+150),SY(e.y2+115));x.closePath();x.fill();x.restore()}
      gridSprite('ticket',e.phase,e.x,e.y2,82);
    }else if(e.type==='ram'){
      if(e.alert){glow(e.x,e.y-55,80,'#ff5e78',.22);box(e.x-48,e.y+2,96,4,'#ff765e')}
      gridSprite('ram',e.phase,e.x,e.y,106,e.dir<0?-1:1);
    }else{
      if(e.alert)glow(e.x,e.y2+40,85,'#ff5e78',.19);
      gridSprite('clamp',e.phase,e.x,e.y2+145,155);
    }
  }}
function drawPack(now){const frame=pack.mode==='linked'?6:pack.mode==='returning'?7:pack.mode==='broken'?5:Math.abs(P.vx)>30?Math.floor(P.anim)%5:0,scale=pack.mode==='attached'?72:90;gridSprite('pack',frame,pack.x,pack.y+scale*.62,scale,pack.mode==='attached'?-P.face:1);if(pack.mode==='linked')glow(pack.x,pack.y+10,70,'#59e2c2',.22+.08*Math.sin(now*8))}
function drawBix(){
  const im=IMG.bixMotion;
  if(!ready(im)){box(P.x,P.y,P.w,P.h,'#59e2c2');return}
  const frames=[[48,20,174,436],[305,20,176,436],[535,57,294,397],[862,57,260,397],[22,498,270,384],[301,480,260,402],[590,484,240,395],[860,457,275,330],[8,901,299,397],[311,1049,285,270],[643,879,180,451],[911,883,210,440]];
  if(K.interact&&P.ground&&pack.mode==='attached'&&D.relays.some(r=>Math.abs(r.x-(P.x+21))<90)){
    if(gridSprite('bix',2,P.x+21,P.y+P.h,96,P.face))return;
  }
  const frame=P.hang?10:P.climb?11:!P.ground?(P.vy<-120?6:P.vy<120?7:8):Math.abs(P.vx)>30?2+Math.floor(P.anim)%4:0;
  const r=frames[frame],h=96,w=h*r[2]/r[3],ground=P.y+P.h;
  x.save();x.translate(SX(P.x+P.w/2),0);x.scale(P.face,1);
  x.globalAlpha=P.inv&&Math.floor(performance.now()/70)%2?.48:1;
  x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,SY(ground)-h,w,h);x.restore();
}
function draw(){x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,viewW,H);x.save();if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawBackdrop();const now=performance.now()/1000;drawLink(now);drawWorld(now);drawEnemies(now);drawPack(now);drawBix();x.restore();if(blackoutT){x.save();x.globalAlpha=.34+.09*Math.sin(now*23);x.fillStyle='#03151b';x.fillRect(0,0,viewW,H);x.restore();glow(P.x+21,P.y+42,110,'#59e2c2',.18)}if(flash){x.fillStyle=`rgba(255,90,70,${flash})`;x.fillRect(0,0,viewW,H);flash=Math.max(0,flash-.02)}shake*=.88}

function key(code,on){if(['ArrowLeft','KeyA'].includes(code))K.left=on;if(['ArrowRight','KeyD'].includes(code))K.right=on;if(['ArrowDown','KeyS'].includes(code))K.down=on;if(['ArrowUp','KeyW','Space'].includes(code)){if(on&&!K.jump)P.buffer=.16;K.jump=on}if(['ArrowUp','KeyW'].includes(code))K.up=on;if(['KeyE','Enter'].includes(code))K.interact=on;if(code==='KeyZ'&&on){K.blue=1;sound('ping')}if(code==='KeyX'&&on){K.red=1;sound('reroute')}if(code==='KeyM'&&on)toggleAudio();if(code==='KeyR'&&on&&running)reset(0)}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.repeat&&['KeyM','KeyZ','KeyX'].includes(e.code))return;key(e.code,1)});addEventListener('keyup',e=>key(e.code,0));
function clearInput(){Object.keys(K).forEach(k=>K[k]=0);P.buffer=0;joyEnd()}addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();audio.stop()}else if(running)audio.start()});
document.querySelectorAll('#touchControls button').forEach(b=>{const k=b.dataset.key,set=v=>{if(k==='jump'&&v&&!K.jump)P.buffer=.16;if((k==='blue'||k==='red')&&v){K[k]=1;sound(k==='blue'?'ping':'reroute')}else K[k]=v};b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(1)});b.addEventListener('pointerup',()=>set(0));b.addEventListener('pointercancel',()=>set(0))});
const joy=$('joystick'),knob=$('joystickKnob');let jid=null;function joyMove(e){if(e.pointerId!==jid)return;const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=r.width*.3,m=Math.hypot(dx,dy)||1,k=Math.min(1,l/m);knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;K.left=dx<-10;K.right=dx>10;K.down=dy>18;K.up=dy<-22}function joyEnd(e){if(e&&e.pointerId!==jid)return;jid=null;K.left=K.right=K.down=K.up=0;if(knob)knob.style.transform='translate(0,0)'}joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);joyMove(e)});joy.addEventListener('pointermove',joyMove);joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.033,(t-last)/1000||0);last=t;acc+=dt;let n=0;while(acc>=STEP&&n<5){update(STEP);acc-=STEP;n++}if(n===5)acc=0;draw()}
resize();reset(1);requestAnimationFrame(frame);
})();
