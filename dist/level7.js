// Level 07: Clocking In. Pack Link powers the civic route while taking Pack away from Bix's emergency catch.
(()=>{
'use strict';
const c=document.getElementById('game'),x=c.getContext('2d'),$=id=>document.getElementById(id);
const D=window.L7DATA,A=window.L7ART,BASE=window.L2ART;
const ui=Object.fromEntries(['start','complete','story','storyImage','storyKicker','storyTitle','storyCopy','storyClose','dialogue','speaker','line','prompt','zone','objective','cogCount','fragmentCount','linkChip','rangeMeter','rangeBar','rangeLabel','finalCogs','finalTime','finalFalls','resultLine','medal','saveNote','lockNote','touchControls','packCharge','packChargeLabel'].map(id=>[id,$(id)]));
function fatal(t){x.fillStyle='#07151a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ff806b';x.font='600 20px system-ui';x.textAlign='center';x.fillText(t,c.width/2,c.height/2)}
if(!D||!A||!BASE){fatal('Level 7 failed to load.');return}

const H=720,GRAV=1450,JUMP=780,RUN=285,STEP=1/120,COG_TOTAL=D.cogs.length,FRAG_TOTAL=D.fragments.length,CARRY_MAX=80;
const K={left:0,right:0,down:0,up:0,jump:0,interact:0,blue:0,red:0};
const P={x:0,y:0,w:42,h:96,vx:0,vy:0,ground:0,coyote:0,buffer:0,face:1,falls:0,hang:0,hangRect:null,climb:0,grabCD:0,support:null,dropTime:0,jumpTime:0,inv:0,anim:0};
const pack={x:0,y:0,mode:'attached',relay:null,returnT:0,pulse:0};
let viewW=1280,dpr=1,last=0,acc=0,camX=0,camY=-40,lead=.42,running=0,done=0,storyOpen=0,startTime=0;
let cogs=0,fragments=0,charge=1,checkpoint=D.checkpoints[0],seen=new Set(),told=new Set(),sayQ=[],sayT=0,msgTime=0,msgLock=0;
let enemies=[],auditors=[],targetState={},moving={},ending=0,shake=0,flash=0,linkBreaks=0,lastIncident=null;

const img=s=>{const q=new Image;q.src='./assets/'+s;return q};
const IMG={};for(const [k,v] of Object.entries(A.bg))IMG['bg-'+k]=img(v);
for(const [k,v] of Object.entries(A.sheets))IMG[k]=img(v);
IMG.cog=img('energy-cog-v1.png');IMG.memory=img(A.memory);IMG.departure=img(A.departure);
const ready=q=>q&&q.complete&&q.naturalWidth;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),SX=v=>v-camX,SY=v=>v-camY;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const narrow=()=>viewW<700,leadTarget=()=>narrow()?(P.vx>40?.14:P.vx<-40?.55:.24):.42;
function gridSprite(key,i,cx,bottom,h,flip=1,alpha=1){const im=IMG[key],g=A.grid[key];if(!ready(im)||!g)return 0;const cw=im.naturalWidth/g[0],ch=im.naturalHeight/g[1],col=i%g[0],row=Math.floor(i/g[0])%g[1],w=h*cw/ch;x.save();x.globalAlpha=alpha;x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);x.drawImage(im,col*cw,row*ch,cw,ch,-w/2,-h,w,h);x.restore();return 1}
function baseSprite(plate,i,cx,bottom,h,flip=1){const a=BASE[plate],im=plate==='bix-motion-v2.png'?IMG.bix:img(plate);if(!a||!ready(im)||!a.cells[i])return 0;const r=a.cells[i],w=h*r[2]/r[3];x.save();x.translate(SX(cx),SY(bottom));if(flip<0)x.scale(-1,1);x.drawImage(im,r[0],r[1],r[2],r[3],-w/2,-h,w,h);x.restore();return 1}
function box(px,py,w,h,f,s){x.fillStyle=f;x.fillRect(SX(px),SY(py),w,h);if(s){x.strokeStyle=s;x.lineWidth=2;x.strokeRect(SX(px),SY(py),w,h)}}
function glow(px,py,r,col,a){const g=x.createRadialGradient(SX(px),SY(py),0,SX(px),SY(py),r);g.addColorStop(0,col);g.addColorStop(1,'transparent');x.save();x.globalAlpha=a;x.fillStyle=g;x.fillRect(SX(px)-r,SY(py)-r,r*2,r*2);x.restore()}

function areaAt(px){let a=D.areas[0];for(const q of D.areas)if(px>=q.x0&&px<q.x1)a=q;return a}
const killYAt=px=>areaAt(px).killY||960;
const powered=id=>pack.mode==='linked'&&pack.relay&&pack.relay.target===id&&!targetState.interrupted;
function linkRatio(){if(!(pack.mode==='linked'&&pack.relay))return 0;const r=pack.relay;let d=Math.hypot(P.x+21-pack.x,P.y+48-pack.y);const rep=D.repeaters.find(q=>q.relay===r.id);if(rep)d=Math.min(d,Math.hypot(P.x+21-rep.x,P.y+48-rep.y));return d/r.range}
function dynamicState(dt){
  for(const b of D.bridges){const want=powered(b.id)?b.onY:b.y,m=moving[b.id]||(moving[b.id]={y:b.y});m.y+=(want-m.y)*Math.min(1,dt*3)}
  for(const l of D.lifts){const want=powered(l.id)?l.onY:l.y,m=moving[l.id]||(moving[l.id]={y:l.y});m.y+=(want-m.y)*Math.min(1,dt*2.4)}
  for(const t of D.trams){const m=moving[t.id]||(moving[t.id]={x:t.x0,dir:1});if(powered(t.id)){m.x+=m.dir*t.speed*dt;if(m.x>t.x1||m.x<t.x0){m.x=clamp(m.x,t.x0,t.x1);m.dir*=-1}}}
}
function solids(){const out=[];for(const p of D.platforms)out.push({x:p[0],y:p[1],w:p[2],h:78});for(const l of D.ledges)out.push({x:l.x,y:l.y,w:l.w,h:l.h,ledge:1});
  for(const g of D.gates)if(!powered(g.id))out.push({x:g.x,y:g.y,w:g.w,h:g.h});
  for(const b of D.bridges){const m=moving[b.id]||b;out.push({x:b.x,y:m.y,w:b.w,h:b.h,ledge:1,dynamic:b.id})}
  for(const l of D.lifts){const m=moving[l.id]||l;out.push({x:l.x,y:m.y,w:l.w,h:l.h,ledge:1,dynamic:l.id})}
  for(const t of D.trams){const m=moving[t.id]||{x:t.x0};out.push({x:m.x,y:t.y,w:t.w,h:t.h,ledge:1,dynamic:t.id})}return out}
function move(a,dt){const all=solids(),blocks=all.filter(q=>!q.ledge);a.x=clamp(a.x+a.vx*dt,0,D.world.w-a.w);for(const r of blocks)if(overlap(a,r)){if(a.vx>0)a.x=r.x-a.w;else if(a.vx<0)a.x=r.x+r.w;a.vx=0}const old=a.y+a.h;a.y+=a.vy*dt;a.ground=0;a.support=null;for(const r of all){if(a.x>=r.x+r.w||a.x+a.w<=r.x)continue;if(a.vy>=0&&old<=r.y+4&&a.y+a.h>=r.y&&!(r.ledge&&a.dropTime>0)){a.y=r.y-a.h;a.vy=0;a.ground=1;a.support=r}else if(!r.ledge&&a.vy<0&&overlap(a,r)){a.y=r.y+r.h;a.vy=0}}}
function grab(now){if(P.ground||P.vy<45||P.grabCD)return;const hand=P.y+19;for(const r of solids()){if(!r.ledge)continue;if(hand<r.y-18||hand>r.y+32)continue;const ok=P.face>0?(P.x+P.w<=r.x+20&&Math.abs(P.x+P.w-r.x)<34):(P.x>=r.x+r.w-20&&Math.abs(P.x-r.x-r.w)<34);if(ok){P.hang=1;P.hangAt=now;P.hangRect=r;P.x=P.face>0?r.x-P.w+5:r.x+r.w-5;P.y=r.y-19;P.vx=P.vy=P.buffer=0;break}}}

function toast(s,t,n=2.4,force=0){if(msgLock&&!force)return;ui.speaker.textContent=s;ui.line.textContent=t;ui.dialogue.classList.toggle('system',s==='SYSTEM');ui.dialogue.classList.remove('hidden');msgTime=n;msgLock=.4}
const say=lines=>lines.forEach(l=>sayQ.push(l));
function pumpSay(dt){sayT=Math.max(0,sayT-dt);if(sayT<=0&&sayQ.length&&!storyOpen){const [s,t]=sayQ.shift();toast(s,t,2.7,1);sayT=2.7}}
function setCharge(v){charge=v;ui.packCharge.classList.toggle('spent',!v);ui.packChargeLabel.textContent=v?'PACK READY':'NO CATCH · PACK LINKED'}
function setCP(cp){checkpoint=cp;if(pack.mode==='attached')setCharge(1);toast('SYSTEM',`Checkpoint · ${cp.name}`,1.3)}
const near=(o,r=105)=>Math.hypot(P.x+P.w/2-o.x,P.y+P.h/2-(o.y-48))<r;

function deploy(r){pack.mode='linked';pack.relay=r;pack.x=r.x;pack.y=r.y-72;pack.returnT=0;targetState.interrupted=0;setCharge(0);shake=5;say([['PACK',`${r.label} linked. I will hold it from here.`]])}
function recall(reason){if(pack.mode==='attached')return;pack.mode='returning';pack.relay=null;pack.returnT=.65;targetState.interrupted=0;if(reason)toast('PACK',reason,1.8,1)}
function breakLink(){if(pack.mode!=='linked')return;linkBreaks++;targetState.interrupted=1;pack.mode='broken';pack.returnT=1;shake=10;flash=.12;setCharge(0);toast('PACK','Link lost. The machinery will hold before it resets.',2.2,1)}
function updatePack(dt){
  if(pack.mode==='attached'){pack.x+=(P.x-P.face*50-pack.x)*Math.min(1,dt*7);pack.y+=(P.y+28-pack.y)*Math.min(1,dt*7);return}
  if(pack.mode==='returning'||pack.mode==='broken'){pack.returnT-=dt;if(pack.returnT<=0){pack.mode='attached';pack.relay=null;setCharge(1);targetState.interrupted=0;return}}
  if(pack.mode==='returning'){pack.x+=(P.x+P.w/2-pack.x)*Math.min(1,dt*10);pack.y+=(P.y+30-pack.y)*Math.min(1,dt*10)}
  if(pack.mode==='linked'&&pack.relay){if(linkRatio()>1.03)breakLink()}
  pack.pulse+=dt;
}

function spawnEnemies(){return D.enemies.map((e,i)=>({...e,id:i,x0:e.x,x:e.x,t:i*.31,phase:0,w:e.type==='sweeper'?110:e.type==='ram'?100:e.type==='clamp'?70:72,h:e.type==='clamp'?150:70}))}
function spawnAuditors(){return D.auditors.map((a,i)=>({...a,p:.08+i*.05,dir:1,stun:0,active:0}))}
function hurt(cause){if(P.inv||done||ending||storyOpen)return;const now=performance.now()/1000;if(charge&&pack.mode==='attached'){setCharge(0);P.inv=1.2;P.x=checkpoint.x;P.y=checkpoint.y-P.h;P.vx=P.vy=0;toast('PACK','Caught you. I remain in favour of proximity.',2,1);return}shake=16;flash=.14;reset(0);const lines={sweeper:'Municipal cleaning remains aggressively thorough.',ticket:'Fare rejected. Relay interrupted. Dignity unaffected.',ram:'Access denied with unusual enthusiasm.',clamp:'Maintenance has reserved our ladder.',auditor:'Inspection failed. Reroute first, then reconnect.',fall:'No catch from the socket. Resetting your route.'};toast('PACK',lines[cause]||'That route was not approved.',2.3,1);lastIncident=cause}
function updateEnemies(dt,now){for(const e of enemies){e.t+=dt;if(e.type==='sweeper'){e.x=e.x0+Math.sin(e.t*.85)*e.range;e.phase=Math.floor(e.t*5)%8;if(Math.abs(P.x+21-e.x)<72&&Math.abs(P.y+P.h-e.y)<85)hurt('sweeper')}
    else if(e.type==='ticket'){e.x=e.x0+Math.sin(e.t*.7)*e.range;e.phase=Math.floor(e.t*4)%8;const scanning=(e.t%4.2)>2.8;if(scanning&&Math.abs(P.x+21-e.x)<170&&Math.abs(P.y+45-(e.y-90))<150){targetState.interrupted=.65;hurt('ticket')}}
    else if(e.type==='ram'){const z=e.t%4.4,dir=Math.sin(e.t*.21)>0?1:-1;e.phase=z<1.3?Math.floor(z*3)%3:4;e.x=e.x0+(z>1.3&&z<2.3?(z-1.3)*e.range*dir:z>=2.3?e.range*dir:0);if(z>1.3&&z<2.5&&Math.abs(P.x+21-e.x)<70&&Math.abs(P.y+P.h-e.y)<95)hurt('ram')}
    else if(e.type==='clamp'){const z=e.t%4.8;e.phase=Math.floor(z/4.8*8);e.y2=e.y+(z>1.5&&z<3.1?Math.sin((z-1.5)/1.6*Math.PI)*260:0);if(Math.abs(P.x+21-e.x)<55&&P.y<e.y2+e.h&&P.y+P.h>e.y2)hurt('clamp')}}
  if(targetState.interrupted)targetState.interrupted=Math.max(0,targetState.interrupted-dt)}
function updateAuditors(dt){for(const a of auditors){const live=pack.mode==='linked'&&pack.relay&&pack.relay.id===a.relay;if(!live){a.active=0;a.p=.08;continue}a.active=1;a.stun=Math.max(0,a.stun-dt);if(!a.stun)a.p+=a.speed*a.dir*dt;if(a.p<.05){a.p=.05;a.dir=1}if(a.p>=.96){a.p=.96;targetState.interrupted=.9;a.stun=.9;shake=7;toast('SYSTEM','Relay inspection interrupted.',1.3,1)}if(K.blue){a.p=Math.max(.05,a.p-.32);a.dir=-1;a.stun=.18}if(K.red){a.p=.22;a.dir=1;a.stun=.55}}}

function buildWorld(full){if(full){targetState={interrupted:0};moving={};enemies=spawnEnemies();auditors=spawnAuditors();told=new Set();linkBreaks=0;D.cogs.forEach(q=>q.got=0);D.fragments.forEach(q=>q.got=0);D.triggers.forEach(q=>q.used=0);D.terminals.forEach(q=>q.used=0)}else{enemies=spawnEnemies();targetState.interrupted=0}dynamicState(0)}
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
function start(){clearInput();ui.start.classList.add('hidden');ui.touchControls.classList.add('playing');running=1;startTime=performance.now();c.focus()}
$('startButton').onclick=()=>{if(locked()){refreshLock();return}start()};$('replayButton').onclick=()=>{clearInput();reset(1);running=1;ui.complete.classList.add('hidden');ui.touchControls.classList.add('playing')};
refreshLock();try{window.Mayhem&&window.Mayhem.subscribe&&window.Mayhem.subscribe(refreshLock)}catch(e){}

function showStory(kind){storyOpen=1;const full=kind==='departure';ui.storyImage.src='./assets/'+(full?A.departure:A.memory);ui.storyImage.alt=full?'Bix and Pack boarding the first train at sunrise':'An archive recording of Bix and Pack entering the civic district eleven years earlier';ui.storyKicker.textContent=full?'FIRST TRAIN':'ARCHIVE RECORD';ui.storyTitle.textContent=full?'ON TIME':'BX-7';ui.storyCopy.textContent=full?'The doors close after Pack returns. The board changes from eleven years delayed to on time. The destination remains unnamed.':'The archive shows Bix entering this district eleven years ago with a newly issued Pack. The shift never ended; the city has simply been waiting.';ui.story.classList.remove('hidden')}
ui.storyClose.onclick=()=>{ui.story.classList.add('hidden');storyOpen=0;if(ending)finish()};

function interact(now){let label='',act=null;const r=D.relays.find(q=>near(q,115));const t=D.terminals.find(q=>near(q,115));
  if(t&&t.kind==='memory'&&!t.used){label='ACT · OPEN BX-7 RECORD';act=()=>{t.used=1;showStory('memory')}}
  else if(t&&t.kind==='board'&&!t.used){label='ACT · READ THE DEPARTURE BOARD';act=()=>{t.used=1;const words=D.fragments.map(q=>q.got?q.word:'____').join(' ');say([['VELA',words+'.'],['SYSTEM','Unauthorized message cleared.']])}}
  else if(t&&t.kind==='reset'){label='ACT · RESET RELAY COURT';act=()=>{pack.mode='attached';pack.relay=null;setCharge(1);targetState.interrupted=0;toast('SYSTEM','Relay arrangement restored.',1.5,1)}}
  else if(r&&pack.mode==='attached'){label=`ACT · LINK PACK · ${r.label}`;act=()=>deploy(r)}
  else if(pack.mode==='linked'&&near(pack,115)){label='ACT · RECALL PACK';act=()=>recall('Coming back.')}
  else if(pack.mode==='linked'){label='ACT · REMOTE RECALL';act=()=>recall('Remote recall received.')}
  ui.prompt.textContent=label;ui.prompt.classList.toggle('hidden',!label);if(!K.interact)return;K.interact=0;if(act)act()}

function update(dt){if(!running||done||storyOpen)return;const now=performance.now()/1000;P.inv=Math.max(0,P.inv-dt);P.grabCD=Math.max(0,P.grabCD-dt);P.dropTime=Math.max(0,P.dropTime-dt);msgTime=Math.max(0,msgTime-dt);msgLock=Math.max(0,msgLock-dt);if(msgTime<=0&&sayQ.length===0)ui.dialogue.classList.add('hidden');pumpSay(dt);
  dynamicState(dt);updatePack(dt);updateEnemies(dt,now);updateAuditors(dt);
  if(P.hang){P.vx=P.vy=0;if(K.down){P.hang=0;P.dropTime=.24;P.grabCD=.25;P.vy=80}else if(P.buffer>0||K.up){P.hang=0;P.climb=.22;P.vy=-JUMP*.72;P.vx=P.face*RUN*.34;P.buffer=0}}
  else{const axis=(K.right?1:0)-(K.left?1:0);if(axis)P.face=axis;const max=targetState.interrupted?RUN*.82:RUN;P.vx+=(axis*max-P.vx)*Math.min(1,dt*(P.ground?18:8));if(!axis)P.vx*=Math.exp(-(P.ground?15:2.5)*dt);P.coyote=P.ground?.13:Math.max(0,P.coyote-dt);P.buffer=Math.max(0,P.buffer-dt);if(P.buffer>0&&P.coyote>0){P.vy=-JUMP;P.ground=0;P.coyote=0;P.buffer=0;P.jumpTime=.25}P.vy+=GRAV*dt;if(!K.jump&&P.vy<0)P.vy+=1500*dt;move(P,dt);grab(now)}
  P.anim+=Math.abs(P.vx)*dt/55;
  if(P.y>killYAt(P.x)||P.y<D.world.yMin-240)hurt('fall');
  for(const q of D.cogs)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+42-q.y)<62){q.got=1;cogs++;ui.cogCount.textContent=`${cogs} / ${COG_TOTAL}`;toast('PACK',`Cog ${cogs} secured.`,1.2)}
  for(const q of D.fragments)if(!q.got&&Math.hypot(P.x+21-q.x,P.y+42-q.y)<68){q.got=1;fragments++;ui.fragmentCount.textContent=`${fragments} / ${FRAG_TOTAL}`;toast('VELA',`Shift fragment ${fragments}/${FRAG_TOTAL} · ${q.word}`,2.2,1)}
  for(const cp of D.checkpoints)if(!seen.has(cp)&&D.checkpoints.indexOf(cp)>D.checkpoints.indexOf(checkpoint)&&P.x>cp.x-50&&Math.abs(P.y+P.h-cp.y)<130){seen.add(cp);setCP(cp)}
  for(const q of D.triggers)if(!q.used&&P.x>=q.x){q.used=1;say(q.say)}
  interact(now);if(powered('traction')&&P.x>D.world.finishX&&!ending){ending=1;running=0;showStory('departure')}
  const a=areaAt(P.x),ty=a.vertical?clamp(P.y-H*.5,D.world.yMin,D.world.yMax-H):(a.camY??-40);camY+=(ty-camY)*Math.min(1,dt*4.5);lead+=(leadTarget()-lead)*Math.min(1,dt*4);camX+=(clamp(P.x-viewW*lead,0,D.world.w-viewW)-camX)*Math.min(1,dt*5);
  hud();K.blue=K.red=0;
}
function hud(){const a=areaAt(P.x);ui.zone.textContent=a.name;ui.objective.textContent=a.objective;const linked=pack.mode==='linked'&&pack.relay;ui.linkChip.textContent=linked?`PACK LINK · ${pack.relay.label}`:pack.mode==='attached'?'PACK · ATTACHED':pack.mode==='broken'?'LINK · BROKEN':'PACK · RETURNING';ui.linkChip.className='link-chip '+(linked?'live':pack.mode==='broken'?'broken':'');ui.rangeMeter.classList.toggle('hidden',!linked);if(linked){const ratio=clamp(linkRatio(),0,1);ui.rangeBar.style.width=`${ratio*100}%`;ui.rangeLabel.textContent=`LINK ${Math.round(ratio*100)}%`;ui.rangeMeter.classList.toggle('warn',ratio>.7);ui.rangeMeter.classList.toggle('danger',ratio>.9)}}

const MEDALS=[{name:'GOLD',cogs:12,falls:8,sec:1200,line:'The shift starts before the city can object.'},{name:'SILVER',cogs:7,falls:20,sec:1680,line:'A very respectable late arrival.'},{name:'BRONZE',cogs:0,falls:9999,sec:99999,line:'Eleven years late still counts as present.'}];
const medalFor=(cg,f,t)=>MEDALS.find(m=>cg>=m.cogs&&f<=m.falls&&t<=m.sec);
function finish(){done=1;running=0;ui.touchControls.classList.remove('playing');const sec=Math.max(1,Math.floor((performance.now()-startTime)/1000)),m=medalFor(cogs,P.falls,sec);ui.finalCogs.textContent=`${cogs} / ${COG_TOTAL}`;ui.finalTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;ui.finalFalls.textContent=P.falls;ui.medal.textContent=m.name;ui.medal.dataset.medal=m.name.toLowerCase();ui.resultLine.textContent=`PACK: “${m.line}”`+(fragments===FRAG_TOTAL?' VELA warning complete: BX-7, DO NOT CLOCK IN.':'');ui.complete.classList.remove('hidden');const M=window.Mayhem;if(M&&ui.saveNote)M.recordResult('level7',{timeSec:sec,cogs,falls:P.falls}).then(t=>{ui.saveNote.textContent=t;ui.saveNote.hidden=!t}).catch(()=>{})}

function resize(){const r=c.getBoundingClientRect();if(!r.width||!r.height)return;dpr=Math.min(2,devicePixelRatio||1);viewW=H*r.width/r.height;c.width=Math.round(viewW*dpr);c.height=Math.round(H*dpr);lead=leadTarget()}
addEventListener('resize',resize);
function drawBackdrop(){const a=areaAt(P.x),im=IMG['bg-'+a.id];if(ready(im)){const s=H/im.naturalHeight,dw=im.naturalWidth*s,par=camX*.08,ox=-((par%dw)+dw)%dw;x.globalAlpha=.78;for(let q=ox-dw;q<viewW+dw;q+=dw)x.drawImage(im,q,0,dw,H);x.globalAlpha=1}else{x.fillStyle='#10272d';x.fillRect(0,0,viewW,H)}const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#06151a44');g.addColorStop(1,'#031014cc');x.fillStyle=g;x.fillRect(0,0,viewW,H)}
function drawPlatform(r,mat){box(r[0],r[1],r[2],r[3]||80,mat==='dome'?'#29372d':'#263a3e','#74949a');box(r[0],r[1],r[2],7,'#d9b63b');for(let q=r[0]+28;q<r[0]+r[2];q+=110)box(q,r[1]+26,52,4,'#45646a')}
function drawWorld(now){for(const p of D.platforms)drawPlatform(p,p[4]);for(const l of D.ledges){box(l.x,l.y,l.w,l.h,'#31535a','#6f989d');box(l.x,l.y,l.w,4,'#ffd75a')}
  for(const g of D.gates){if(powered(g.id)){x.save();x.globalAlpha=.25;box(g.x,g.y,g.w,g.h,'#59e2c2');x.restore()}else{box(g.x,g.y,g.w,g.h,'#9a3850','#ff5e78');for(let y=g.y+20;y<g.y+g.h;y+=34)box(g.x+8,y,g.w-16,5,'#ff8b55')}}
  for(const b of D.bridges){const m=moving[b.id]||b;box(b.x,m.y,b.w,b.h,'#3b5559','#ffd75a')}for(const l of D.lifts){const m=moving[l.id]||l;box(l.x,m.y,l.w,l.h,'#3e5f63','#59e2c2')}for(const t of D.trams){const m=moving[t.id]||{x:t.x0};box(m.x,t.y,t.w,t.h,'#455d60','#ffd75a')}
  for(const r of D.relays){const on=pack.relay===r&&pack.mode==='linked';glow(r.x,r.y-50,on?75:36,on?'#59e2c2':'#ffd75a',on?.35:.16);box(r.x-24,r.y-68,48,68,on?'#7dbdb2':'#d5ddd5','#17262a');box(r.x-10,r.y-50,20,18,on?'#59e2c2':'#342e24','#0c171a')}
  for(const q of D.repeaters){box(q.x-14,q.y-48,28,48,'#95bdb7','#203a40');glow(q.x,q.y-40,30,'#59e2c2',.13)}for(const t of D.terminals){box(t.x-22,t.y-72,44,72,'#81aaa5','#17333a')}
  for(const q of D.cogs)if(!q.got)drawCog(q,now);for(const q of D.fragments)if(!q.got){glow(q.x,q.y,38,'#59e2c2',.25);x.save();x.translate(SX(q.x),SY(q.y));x.rotate(Math.sin(now*2+q.id)*.12);x.fillStyle='#b9fff0';x.fillRect(-15,-20,30,40);x.fillStyle='#17434a';x.fillRect(-9,-13,18,3);x.fillRect(-9,-6,13,3);x.restore()}}
function drawCog(q,now){x.save();x.translate(SX(q.x),SY(q.y+Math.sin(now*2+q.x)*4));x.rotate(now);x.strokeStyle='#ffd75a';x.lineWidth=6;x.beginPath();x.arc(0,0,17,0,Math.PI*2);x.stroke();x.fillStyle='#ffd75a';for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillRect(13,-4,11,8)}x.restore()}
function drawLink(now){if(pack.mode!=='linked'||!pack.relay)return;const r=pack.relay,cx=P.x+21,cy=P.y+45,rep=D.repeaters.find(q=>q.relay===r.id);x.save();x.strokeStyle=targetState.interrupted?'#ff4f63':'#59e2c2';x.lineWidth=3;x.setLineDash([8,10]);x.lineDashOffset=-now*80;x.beginPath();x.moveTo(SX(pack.x),SY(pack.y+20));if(rep)x.lineTo(SX(rep.x),SY(rep.y-30));x.lineTo(SX(cx),SY(cy));x.stroke();x.restore();for(const a of auditors)if(a.active){const ax=pack.x+(cx-pack.x)*a.p,ay=pack.y+20+(cy-(pack.y+20))*a.p;gridSprite('auditor',Math.floor(now*5)%8,ax,ay+38,64)}}
function drawEnemies(now){for(const e of enemies){if(e.type==='sweeper')gridSprite('sweeper',e.phase,e.x,e.y,105);else if(e.type==='ticket')gridSprite('ticket',e.phase,e.x,e.y,78);else if(e.type==='ram')gridSprite('ram',e.phase,e.x,e.y,92);else gridSprite('clamp',e.phase,e.x,e.y2+145,145)}}
function drawPack(now){const frame=pack.mode==='linked'?6:pack.mode==='returning'?7:pack.mode==='broken'?5:0,scale=pack.mode==='attached'?72:90;gridSprite('pack',frame,pack.x,pack.y+scale*.62,scale,pack.mode==='attached'?-P.face:1);if(pack.mode==='linked')glow(pack.x,pack.y+10,70,'#59e2c2',.22+.08*Math.sin(now*8))}
function drawBix(){const cell=P.hang||P.climb?4:!P.ground?(P.vy<-80?7:6):Math.abs(P.vx)>30?6:1;if(gridSprite('bix',cell,P.x+21,P.y+P.h,118,P.face))return;box(P.x,P.y,P.w,P.h,'#59e2c2')}
function draw(){x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,viewW,H);x.save();if(shake)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawBackdrop();const now=performance.now()/1000;drawLink(now);drawWorld(now);drawEnemies(now);drawPack(now);drawBix();x.restore();if(flash){x.fillStyle=`rgba(255,90,70,${flash})`;x.fillRect(0,0,viewW,H);flash=Math.max(0,flash-.02)}shake*=.88}

function key(code,on){if(['ArrowLeft','KeyA'].includes(code))K.left=on;if(['ArrowRight','KeyD'].includes(code))K.right=on;if(['ArrowDown','KeyS'].includes(code))K.down=on;if(['ArrowUp','KeyW','Space'].includes(code)){if(on&&!K.jump)P.buffer=.16;K.jump=on}if(['ArrowUp','KeyW'].includes(code))K.up=on;if(['KeyE','Enter'].includes(code))K.interact=on;if(code==='KeyZ'&&on)K.blue=1;if(code==='KeyX'&&on)K.red=1;if(code==='KeyR'&&on&&running)reset(0)}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();key(e.code,1)});addEventListener('keyup',e=>key(e.code,0));
function clearInput(){Object.keys(K).forEach(k=>K[k]=0);P.buffer=0;joyEnd()}addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput()});
document.querySelectorAll('#touchControls button').forEach(b=>{const k=b.dataset.key,set=v=>{if(k==='jump'&&v&&!K.jump)P.buffer=.16;if((k==='blue'||k==='red')&&v)K[k]=1;else K[k]=v};b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(1)});b.addEventListener('pointerup',()=>set(0));b.addEventListener('pointercancel',()=>set(0))});
const joy=$('joystick'),knob=$('joystickKnob');let jid=null;function joyMove(e){if(e.pointerId!==jid)return;const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=r.width*.3,m=Math.hypot(dx,dy)||1,k=Math.min(1,l/m);knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;K.left=dx<-10;K.right=dx>10;K.down=dy>18;K.up=dy<-22}function joyEnd(e){if(e&&e.pointerId!==jid)return;jid=null;K.left=K.right=K.down=K.up=0;if(knob)knob.style.transform='translate(0,0)'}joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);joyMove(e)});joy.addEventListener('pointermove',joyMove);joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.033,(t-last)/1000||0);last=t;acc+=dt;let n=0;while(acc>=STEP&&n<5){update(STEP);acc-=STEP;n++}if(n===5)acc=0;draw()}
resize();reset(1);requestAnimationFrame(frame);
})();
