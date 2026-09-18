/* Level 2 enemy behaviour tests. Run from the repo root: node tests/level2-enemies.cjs
   No dependencies. Loads dist/level2-enemies.js in a vm sandbox, exactly like tests/gameplay.cjs. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),FILE=path.join(ROOT,'dist','level2-enemies.js');
const SRC=fs.readFileSync(FILE,'utf8');
const sandbox={console};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(SRC,sandbox);
const E=sandbox.window.L2ENEMIES;

let N=0;
function fail(m){console.error('FAIL: '+m);process.exit(1)}
function ok(c,m){N++;if(!c)fail(m)}
function near(a,b,eps,m){N++;if(!(Math.abs(a-b)<=eps))fail(`${m} — got ${a}, expected ${b} +/- ${eps}`)}
function eq(a,b,m){N++;if(a!==b)fail(`${m} — got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`)}
function throws(fn,m){N++;let t=0;try{fn()}catch(_){t=1}if(!t)fail(m)}

const DT=1/240,EPS=.012;
const P=(x,y)=>({x,y,w:42,h:96});
const W=(player,shutterOpened)=>({player,shutterOpened:!!shutterOpened,dt:DT});
const ticks=s=>Math.round(s/DT);
function run(e,secs,world,cb,dt){dt=dt||DT;const n=Math.round(secs/dt);for(let i=0;i<n;i++){E.update(e,dt,i*dt,world||{});if(cb)cb(e,i*dt,i)}return e}
function until(e,world,pred,maxSec,dt){dt=dt||DT;const n=Math.round((maxSec||30)/dt);for(let i=0;i<n;i++){E.update(e,dt,i*dt,world||{});if(pred(e))return i*dt}return -1}
// Run-length encode the phase names over `secs` seconds.
function phases(e,world,secs,dt){dt=dt||DT;const out=[];let cur=null,len=0;
  for(let i=0;i<Math.round(secs/dt);i++){E.update(e,dt,i*dt,world||{});const n=E.phaseName(e);
    if(n!==cur){if(cur!==null)out.push([cur,len]);cur=n;len=0}len+=dt}
  out.push([cur,len]);return out}
function seq(list){return list.map(q=>q[0])}
const K=E.consts,S={};

/* 1 — module surface and type validation ------------------------------------------------ */
for(const f of ['make','update','hazard','tell','stun','mist','phaseName'])ok(typeof E[f]==='function','L2ENEMIES.'+f+' must be a function');
throws(()=>E.make('goblin',{}),'make() must reject an unknown enemy type');
throws(()=>E.make(undefined,{}),'make() must reject a missing enemy type');
const TYPES=['crawler','spitter','claw','wasp','supervisor'];
for(const t of TYPES){const e=E.make(t,{x:100,y:100,lanes:[100,300]});eq(e.type,t,'make('+t+') keeps its type');eq(E.phaseName(e),'wake','fresh '+t+' starts in the wake tell');eq(E.hazard(e),null,'fresh '+t+' is harmless while waking')}
const CODE=SRC.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
ok(!/Math\s*\.\s*random/.test(CODE),'module must contain no Math.random');
ok(!/document|canvas|getContext|new Image/.test(CODE),'module code must not touch the DOM or canvas');

/* 2 — full cycles run at the agreed durations -------------------------------------------- */
{ // crawler 2.0 / 0.6 / 2.0 / 0.6
  const e=E.make('crawler',{x:600,y:560,range:150,phase:0});
  const p=phases(e,W(P(0,0)),13);
  near(p[0][1],K.WAKE,EPS,'crawler wake tell lasts 0.5s');
  eq(seq(p).slice(0,5).join(','),'wake,patrol,turn,patrol,turn','crawler cycle order');
  near(p[1][1],2,EPS,'crawler PATROL out is 2.0s');near(p[2][1],.6,EPS,'crawler TURN pause is 0.6s');
  near(p[3][1],2,EPS,'crawler PATROL back is 2.0s');near(p[4][1],.6,EPS,'crawler second TURN is 0.6s');
  near(p[1][1]+p[2][1]+p[3][1]+p[4][1],5.2,EPS*2,'crawler full cycle is 5.2s');
  S.crawlerCycle=+(p[1][1]+p[2][1]+p[3][1]+p[4][1]).toFixed(3);
}
{ // spitter 0.8 / 0.3 / 1.5 = 2.6
  const e=E.make('spitter',{x:900,y:300,dir:1});
  const p=phases(e,W(P(0,0)),8);
  eq(seq(p).slice(0,4).join(','),'wake,charge,fire,cooldown','spitter cycle order');
  near(p[1][1],.8,EPS,'spitter CHARGE is 0.8s');near(p[2][1],.3,EPS,'spitter FIRE is 0.3s');near(p[3][1],1.5,EPS,'spitter COOLDOWN is 1.5s');
  near(p[1][1]+p[2][1]+p[3][1],2.6,EPS*2,'spitter fires every 2.6s');
  S.spitterCycle=+(p[1][1]+p[2][1]+p[3][1]).toFixed(3);
}
{ // claw 1.4 / 0.4 / 0.6 / 1.4
  const e=E.make('claw',{x:400,y:120,lanes:[200,400,600]});
  const p=phases(e,W(P(180,500)),10);
  eq(seq(p).slice(0,5).join(','),'wake,track,lock,slam,retract','claw cycle order');
  near(p[1][1],1.4,EPS,'claw TRACK is 1.4s');near(p[2][1],.4,EPS,'claw LOCK is 0.4s');
  near(p[3][1],.6,EPS,'claw SLAM is 0.6s');near(p[4][1],1.4,EPS,'claw RETRACT is 1.4s');
  near(p[2][1]+p[3][1]+p[4][1]+p[1][1],3.8,EPS*2,'claw lock-to-lock cycle');
  S.clawCycle=+(p[1][1]+p[2][1]+p[3][1]+p[4][1]).toFixed(3);
}
{ // supervisor 2.2 / 0.5 / 2.2
  const e=E.make('supervisor',{x:800,y:150,range:400});
  const p=phases(e,W(P(0,0)),12);
  eq(seq(p).slice(0,4).join(','),'wake,sweepLeft,hold,sweepRight','supervisor cycle order');
  near(p[1][1],2.2,EPS,'supervisor SWEEP LEFT is 2.2s');near(p[2][1],.5,EPS,'supervisor HOLD is 0.5s');near(p[3][1],2.2,EPS,'supervisor SWEEP RIGHT is 2.2s');
  near(p[1][1]+p[2][1]+p[3][1],4.9,EPS*2,'supervisor full cycle is 4.9s');
  S.supervisorCycle=+(p[1][1]+p[2][1]+p[3][1]).toFixed(3);
}
{ // wasp never stops and never changes phase
  const e=E.make('wasp',{x:300,y:300,speed:58,vent:2});
  const p=phases(e,W(P(1200,400)),6);
  eq(seq(p).join(','),'wake,drift','wasp drifts forever with no idle phase');
  eq(e.vent,2,'wasp remembers its spawn vent id');
}

/* 3 — every lethal enemy tells BEFORE it can kill ----------------------------------------- */
const cfgFor=t=>({crawler:{x:600,y:560,range:150},spitter:{x:900,y:300,dir:1},claw:{x:400,y:120,lanes:[200,400,600]},wasp:{x:300,y:300},supervisor:{x:800,y:150,range:400}}[t]);
const tellLead={};
for(const t of TYPES){
  const e=E.make(t,cfgFor(t));const world=W(P(180,500));
  let telling=0,lead=-1,lastTell=0,peak=0;
  for(let i=0;i<ticks(12);i++){
    E.update(e,DT,i*DT,world);
    const h=E.hazard(e),tl=E.tell(e);
    if(h){lead=telling;break}
    if(tl>0)telling+=DT;else telling=0;
    lastTell=tl;peak=Math.max(peak,tl);
  }
  ok(lead>0,t+': hazard must eventually become lethal, preceded by a tell');
  ok(lead>=.4,t+': tell must be non-zero for an unbroken interval before the first hazard (got '+lead.toFixed(3)+'s)');
  ok(lastTell>0,t+': the tick immediately before the first hazard is already telegraphing');
  ok(peak>=.9,t+': the pre-hazard tell reaches near full strength');
  tellLead[t]=+lead.toFixed(3);
}
{ // and the claw's per-cycle tell: LOCK is fully telegraphed while still harmless
  const e=E.make('claw',{x:400,y:120,lanes:[200,400,600]});const world=W(P(180,500));
  until(e,world,q=>E.phaseName(q)==='lock',6);
  eq(E.hazard(e),null,'claw is harmless during LOCK');eq(E.tell(e),1,'claw telegraphs at full strength during LOCK');
}
{ // and the spitter's charge tell rises from 0 to 1 while still harmless
  const e=E.make('spitter',{x:900,y:300,dir:1});const world=W(P(0,0));
  until(e,world,q=>E.phaseName(q)==='charge',3);
  const t0=E.tell(e);run(e,.7,world);const t1=E.tell(e);
  ok(t1>t0,'spitter charge tell rises');ok(t1>.8,'spitter charge tell reaches near full before firing');
  eq(E.hazard(e),null,'spitter is harmless while charging');
}

/* 4 — crawler stays inside its patrol span and never drifts -------------------------------- */
{
  const dt=.002,e=E.make('crawler',{x:600,y:560,range:150,phase:0});
  until(e,{},q=>q.wake===0,2,dt);
  let lo=Infinity,hi=-Infinity,bad=0;const trace=[];
  for(let i=0;i<Math.round(5.2/dt)*4;i++){E.update(e,dt,0,{});lo=Math.min(lo,e.x);hi=Math.max(hi,e.x);
    if(e.x<e.left-1e-6||e.x>e.right+1e-6)bad++;trace.push(e.x)}
  eq(bad,0,'crawler never leaves its patrol span');
  near(lo,e.left,.6,'crawler reaches its left edge');near(hi,e.right,.6,'crawler reaches its right edge');
  const cyc=Math.round(5.2/dt);let drift=0;
  for(let i=0;i<cyc;i++)drift=Math.max(drift,Math.abs(trace[i]-trace[i+cyc]),Math.abs(trace[i]-trace[i+cyc*2]));
  ok(drift<.01,'crawler repeats its span exactly every cycle (drift '+drift.toFixed(6)+'px)');
  const hz=E.hazard(e);ok(hz&&hz.x>=e.left-1e-6&&hz.x+hz.w<=e.right+e.w+1e-6,'crawler hazard box stays on its span');
  // The span must be crossed at an even rate over exactly the 2.0s leg, not merely end up clamped
  // at the edges: sample the leg at its quarter points.
  const f=E.make('crawler',{x:600,y:560,range:150,phase:0});
  until(f,{},q=>q.wake===0,2,dt);
  const mid=(f.left+f.right)/2;
  run(f,.5,{},null,dt);near(f.x,f.left+75,.05,'crawler is a quarter along its span 0.5s into PATROL');
  run(f,.5,{},null,dt);near(f.x,mid,.05,'crawler is exactly mid-span 1.0s into PATROL');
  run(f,.5,{},null,dt);near(f.x,mid+75,.05,'crawler is three quarters along 1.5s into PATROL');
  run(f,.5,{},null,dt);near(f.x,f.right,.05,'crawler arrives at the edge exactly as PATROL ends');
  eq(E.phaseName(f),'turn','crawler is turning once it reaches the edge');
  S.crawlerDrift=+drift.toFixed(6);
}

/* 5 — spitter lands on the same spot three cycles running ---------------------------------- */
{
  const e=E.make('spitter',{x:900,y:300,dir:1}),world=W(P(0,0)),lands=[];
  let seen=0;
  run(e,9,world,q=>{if(q.lastLand&&q.shots>seen&&!q.shot){seen=q.shots;lands.push(q.lastLand.x)}});
  ok(lands.length>=3,'spitter must fire and land at least three shots in 9s (got '+lands.length+')');
  const spread=Math.max(...lands.slice(0,3))-Math.min(...lands.slice(0,3));
  ok(spread<=2,'spitter landing spot varies by at most 2px over three cycles (got '+spread.toFixed(4)+')');
  ok(lands[0]>e.x+e.w,'spitter shot travels forward of the muzzle');
  { const left=E.make('spitter',{x:900,y:300,dir:-1});const l2=[];let s2=0;
    run(left,6,world,q=>{if(q.lastLand&&q.shots>s2&&!q.shot){s2=q.shots;l2.push(q.lastLand.x)}});
    ok(l2.length>=2&&l2[0]<900,'dir:-1 spitter fires the mirrored parabola');
    ok(Math.abs(l2[0]-l2[1])<=2,'mirrored spitter is just as repeatable'); }
  S.spitterLandSpread=+spread.toFixed(4);S.spitterLandX=+lands[0].toFixed(2);
}

/* 6 — claw commits at LOCK ------------------------------------------------------------------ */
{
  const lanes=[200,400,600];
  // Control: the player stays on the far lane, so the claw tracks and slams there.
  const a=E.make('claw',{x:400,y:120,lanes});const wa=W(P(580,500));
  until(a,wa,q=>E.phaseName(q)==='slam',8);run(a,.3,wa);
  const ha=E.hazard(a);ok(ha,'claw slam is lethal');
  near(ha.x+ha.w/2,600,1,'claw tracks the player lane and slams on it');
  // Commit: the player is on lane 0 through TRACK, then runs away after LOCK.
  const b=E.make('claw',{x:400,y:120,lanes});const wb=W(P(180,500));
  until(b,wb,q=>E.phaseName(q)==='lock',8);
  eq(b.lockLane,0,'claw locks the lane the player was in');
  wb.player=P(580,500);                      // player bolts for the far lane, too late
  run(b,.15,wb);
  wb.player=P(590,500);
  until(b,wb,q=>E.phaseName(q)==='slam',2);run(b,.3,wb);
  const hb=E.hazard(b);ok(hb,'claw still slams after the player moves');
  near(hb.x+hb.w/2,200,1,'claw cannot correct after LOCK: it slams on the committed lane');
  eq(b.lockLane,0,'claw lock lane is unchanged by the player moving');
  // It does re-track on the next cycle.
  until(b,wb,q=>E.phaseName(q)==='track',3);run(b,1.3,wb);
  until(b,wb,q=>E.phaseName(q)==='slam',3);run(b,.3,wb);
  near(E.hazard(b).x+E.hazard(b).w/2,600,1,'claw re-targets on the following cycle');
  S.clawCommit=true;
}

/* 7 — wasp always closes, never overshoots, never jitters ----------------------------------- */
{
  const e=E.make('wasp',{x:300,y:220,speed:58}),world=W(P(1000,400));
  until(e,world,q=>q.wake===0,1);
  const d=q=>Math.hypot(world.player.x+world.player.w/2-(q.x+q.w/2),world.player.y+world.player.h/2-(q.y+q.h/2));
  let prev=d(e),rises=0,worst=0,d0=prev;
  const pos=[];
  run(e,14,world,q=>{const cur=d(q);if(cur>prev+1e-9)rises++;worst=Math.max(worst,cur-prev);prev=cur;pos.push([q.x,q.y])});
  eq(rises,0,'wasp distance to the player never increases');
  ok(prev<.001,'wasp closes all the way to the player (left '+prev.toFixed(6)+'px)');
  ok(d0>300,'wasp test actually started far away');
  let jitter=0;for(let i=pos.length-200;i<pos.length-1;i++)jitter=Math.max(jitter,Math.abs(pos[i][0]-pos[i+1][0])+Math.abs(pos[i][1]-pos[i+1][1]));
  ok(jitter<1e-9,'wasp settles instead of oscillating around the player (jitter '+jitter+')');
  ok(E.hazard(e)!==null,'wasp is lethal on contact');
  // A retreating player is still chased down, because the wasp never stops.
  const f=E.make('wasp',{x:300,y:300,speed:58}),wf=W(P(900,300));
  until(f,wf,q=>q.wake===0,1);
  const start=Math.hypot(wf.player.x-f.x,wf.player.y-f.y);let rises2=0,pd=start;
  run(f,20,wf,(q,t)=>{wf.player=P(900+30*t,300);const cur=Math.hypot(wf.player.x+21-(q.x+q.w/2),wf.player.y+48-(q.y+q.h/2));if(cur>pd+1e-6)rises2++;pd=cur});
  ok(pd<start,'wasp gains on a player who keeps running (from '+start.toFixed(1)+' to '+pd.toFixed(1)+')');
  ok(rises2<=2,'wasp does not yo-yo while chasing a moving player');
  S.waspSettle=+prev.toFixed(6);
}

/* 8 — supervisor stalls 2.0s on shutterOpened, then resumes ---------------------------------- */
{
  const e=E.make('supervisor',{x:800,y:150,range:400}),world=W(P(0,0));
  run(e,2.4,world);                              // mid sweep
  const before=e.beamX;ok(E.hazard(e)!==null,'supervisor beam is lethal while sweeping');
  world.shutterOpened=true;E.update(e,DT,0,world);world.shutterOpened=false;
  eq(E.phaseName(e),'stall','supervisor stalls when a shutter opens');
  let stalled=DT,frozen=true,safe=E.hazard(e)===null;
  for(let i=0;i<ticks(5);i++){E.update(e,DT,0,world);if(E.phaseName(e)!=='stall')break;
    stalled+=DT;if(Math.abs(e.beamX-before)>1e-9)frozen=false;if(E.hazard(e)!==null)safe=false}
  near(stalled,2,EPS*2,'supervisor stall lasts 2.0s');
  ok(frozen,'supervisor beam holds still while stalled');
  ok(safe,'stalled beam is harmless — that is the players window');
  run(e,.3,world);
  ok(E.hazard(e)!==null,'supervisor resumes sweeping after the stall');
  ok(Math.abs(e.beamX-before)>1,'supervisor beam moves again after the stall');
  // The stall triggers on the rising edge only, so a shutter left open does not freeze it forever.
  const f=E.make('supervisor',{x:800,y:150,range:400}),wf=W(P(0,0),true);
  run(f,3,wf);
  ok(E.phaseName(f)!=='stall','a shutter held open re-triggers nothing; the stall is edge driven');
  S.supervisorStall=+stalled.toFixed(3);
}

/* 9 — the Pack ping: who it works on, and what it does -------------------------------------- */
{
  for(const t of ['crawler','spitter','claw']){
    const e=E.make(t,cfgFor(t));run(e,1,W(P(180,500)));
    ok(E.stun(e)===true,t+' is stunnable by the Pack ping');
    eq(E.phaseName(e),'stunned',t+' reports the stunned phase');
    eq(E.hazard(e),null,t+' is harmless the instant it is stunned');
    ok(E.stun(e)===false,t+' refuses a second ping while already stunned');
  }
  for(const t of ['wasp','supervisor']){
    const e=E.make(t,cfgFor(t));run(e,1,W(P(180,500)));
    ok(E.stun(e)===false,t+' is NOT stunnable');
    ok(E.phaseName(e)!=='stunned',t+' never enters the stunned phase');
  }
  // Duration and freeze, on the enemy that is lethal at all times.
  const e=E.make('crawler',{x:600,y:560,range:150});const world=W(P(0,0));
  run(e,1.4,world);const atStun=e.x;ok(E.hazard(e)!==null,'crawler is lethal before the ping');
  E.stun(e);
  let harmless=true,still=true,dur=0;
  for(let i=0;i<ticks(4);i++){E.update(e,DT,0,world);if(E.phaseName(e)!=='stunned')break;
    dur+=DT;if(E.hazard(e)!==null)harmless=false;if(Math.abs(e.x-atStun)>1e-9)still=false}
  near(dur,K.STUN,EPS*2,'stun lasts about 2.0s');
  ok(harmless,'stunned enemy hazard() is null for the whole stun');
  ok(still,'stunned enemy is frozen in place');
  run(e,.1,world);
  ok(E.hazard(e)!==null,'crawler is lethal again once the stun ends');
  // The stun is telegraphed on the way out.
  const g=E.make('crawler',{x:600,y:560,range:150});run(g,1,world);E.stun(g);
  run(g,.2,world);const early=E.tell(g);run(g,1.7,world);const late=E.tell(g);
  ok(early<.2&&late>.5,'a stunned enemy telegraphs its restart (tell '+early.toFixed(2)+' -> '+late.toFixed(2)+')');
  S.stunSeconds=+dur.toFixed(3);
}

/* 10 — coolant mist kills wasps and nothing else ---------------------------------------------- */
{
  const w=E.make('wasp',{x:300,y:300});run(w,1,W(P(900,300)));
  ok(E.mist(w)===true,'coolant mist kills a wasp');
  eq(E.phaseName(w),'dead','a misted wasp is dead');
  eq(E.hazard(w),null,'a dead wasp is harmless');
  eq(E.tell(w),0,'a dead wasp stops telegraphing');
  ok(E.mist(w)===false,'mist does nothing to an already dead wasp');
  const held={x:w.x,y:w.y};run(w,2,W(P(0,0)));
  ok(w.x===held.x&&w.y===held.y,'a dead wasp stops moving');
  for(const t of ['crawler','spitter','claw','supervisor']){const e=E.make(t,cfgFor(t));run(e,1,W(P(180,500)));
    ok(E.mist(e)===false,t+' is not killed by coolant mist');ok(!e.dead,t+' survives the mist')}
}

/* 11 — hazard boxes are real, finite, cullable world-space rectangles -------------------------- */
{
  let boxes=0,bad=0;
  for(const t of TYPES){const e=E.make(t,cfgFor(t)),world=W(P(180,500));
    run(e,12,world,q=>{const h=E.hazard(q);if(!h)return;boxes++;
      if(!isFinite(h.x)||!isFinite(h.y)||!(h.w>0)||!(h.h>0))bad++;
      if(Math.abs(h.x)>1e6||Math.abs(h.y)>1e6)bad++})}
  eq(bad,0,'every hazard box is finite with a positive size');
  ok(boxes>1000,'the sweep actually produced hazard boxes to check ('+boxes+')');
  let tbad=0;for(const t of TYPES){const e=E.make(t,cfgFor(t)),world=W(P(180,500));
    run(e,12,world,q=>{const v=E.tell(q);if(!(v>=0&&v<=1))tbad++})}
  eq(tbad,0,'tell() always returns 0..1');
  S.hazardBoxes=boxes;
}

/* 12 — determinism: same seed state, same inputs, identical results ----------------------------- */
{
  const cfgs={crawler:{x:600,y:560,range:150,phase:1.3},spitter:{x:900,y:300,dir:1,phase:.4},
    claw:{x:400,y:120,lanes:[200,400,600],phase:2.1},wasp:{x:300,y:300,speed:58,phase:0},supervisor:{x:800,y:150,range:400,phase:3}};
  const play=t=>{const e=E.make(t,cfgs[t]),out=[];
    for(let i=0;i<2000;i++){const px=400+300*Math.sin(i*.011),world={player:P(px,420+80*Math.sin(i*.003)),shutterOpened:i===900||i===1500,dt:DT};
      E.update(e,DT,i*DT,world);
      if(i%25===0)out.push([E.phaseName(e),E.tell(e).toFixed(6),JSON.stringify(E.hazard(e))].join('|'))}
    return {trace:out.join(';'),state:JSON.stringify(e)}};
  for(const t of TYPES){const a=play(t),b=play(t);
    eq(a.trace,b.trace,t+': identical inputs give an identical trace');
    eq(a.state,b.state,t+': identical inputs give an identical final state')}
  // A phase offset genuinely shifts the cycle (so the determinism above is not just a frozen enemy).
  const p1=E.make('crawler',{x:600,y:560,range:150,phase:0}),p2=E.make('crawler',{x:600,y:560,range:150,phase:2.6});
  run(p1,1.2,{});run(p2,1.2,{});
  ok(Math.abs(p1.x-p2.x)>50,'phase offset staggers two otherwise identical crawlers');
  S.deterministic=true;
}

/* 13 — nothing damages while waking, dead or stunned ------------------------------------------- */
{
  let leaks=0;
  for(const t of TYPES){const e=E.make(t,cfgFor(t)),world=W(P(180,500));
    run(e,.49,world,q=>{if(E.hazard(q)!==null)leaks++;if(!(E.tell(q)>=0))leaks++})}
  eq(leaks,0,'no enemy is lethal during its spawn tell');
}

console.log(JSON.stringify(Object.assign({assertions:N,enemies:TYPES.length},S,{tellLeadSeconds:tellLead})));
