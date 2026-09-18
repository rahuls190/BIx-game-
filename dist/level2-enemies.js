/* Project Mayhem — Level 2 enemy behaviour module.
   Pure logic: no canvas, no DOM, no images, no Math.random. Loads as a plain browser
   script (defines window.L2ENEMIES) and under Node's vm (tests/level2-enemies.cjs).

   PUBLIC CONTRACT
     L2ENEMIES.make(type,cfg)        -> new enemy state object; throws on an unknown type
     L2ENEMIES.update(e,dt,now,world)-> advances e by dt seconds; mutates and returns e
     L2ENEMIES.hazard(e)             -> {x,y,w,h} lethal box right now, or null when harmless
     L2ENEMIES.tell(e)               -> 0..1 telegraph strength (drives the amber warning)
     L2ENEMIES.stun(e)               -> true if the Pack ping took, false if immune/already stunned
     L2ENEMIES.mist(e)               -> true if coolant mist kills this enemy (it is then dead)
     L2ENEMIES.phaseName(e)          -> current phase string, for art and tests
     L2ENEMIES.consts                -> {WAKE,STUN,GRAVITY,DUR,SIZE} read-only, for art/tests

   world CONTRACT (what the engine passes to update)
     {player:{x,y,w,h}, shutterOpened:<bool>, dt:<number>}
       player        top-left box of Bix. Used by claw (lane choice) and wasp (drift target).
                     May be omitted: the claw then keeps its last lane, the wasp holds still.
       shutterOpened true on the frame a cooling shutter opens. The supervisor stalls on the
                     RISING EDGE only, so the engine may leave it true while the shutter is open.
       dt            mirror of the dt argument, used only if dt is not passed. The dt ARGUMENT WINS.
     Nothing else is read. No field added beyond the three above.

   cfg FIELDS (all optional unless noted)
     common     x,y (TOP-LEFT of the enemy box), w,h, phase (seconds of cycle offset at spawn),
                wake (override the spawn tell, default 0.5), durations ({phase:seconds} merged
                over the defaults — the ONLY way to retune a cycle).
     crawler    range (patrol half-width, px, applied to the box's LEFT EDGE), speed (px/s,
                default 2*range/patrol so it arrives exactly at the edge as the leg ends).
     spitter    dir (1|-1), vx (shot speed, sign taken from dir), vy (shot speed, negative = up),
                g (shot gravity, default 1450 = Level 1's), landY (the y the shot splashes on,
                default y+220), shotW, shotH, muzzleY (muzzle offset from y, default 14).
     claw       lanes (REQUIRED, array of lane centre x on the rail), railSpeed (px/s, default
                620), reach (slam depth in px, default 260).
     wasp       speed (px/s, default 58), vent (spawn vent id, carried for the art only).
     supervisor range (sweep half-width from x), beamW, beamH.

   DESIGN RULES HELD IN CODE
     - Every enemy spawns into a WAKE state (0.5s): tell() rises, hazard() is null. So tell()
       always rises BEFORE hazard() first becomes non-null, for every type, with no exception.
     - Per-cycle tells too: the spitter charges 0.8s before it fires, the claw tracks then locks
       (tell 1.0) before it slams, the crawler's turn pause tells before it walks again, and a
       stunned enemy's tell rises through the last 0.5s of the stun so its restart is readable.
     - hazard() is a real world-space box the engine can cull; nothing damages off-screen.
     - Behaviour is a pure function of state + elapsed dt. No Math.random, no wall clock: `now`
       is stored as e.now for renderers only and never drives logic. Runs are repeatable.
     - Dead, stunned and still-waking enemies return null from hazard().
     - Stunnable: crawler, spitter, claw. NOT stunnable: wasp, supervisor (stun() returns false).
     - Killed by coolant mist: wasp only. mist() returns false for everything else.

   TIMINGS (seconds) — see docs/level-2-enemies-notes.md for the two ambiguities resolved here.
     crawler    patrol 2.0 | turn 0.6 | patrol 2.0 | turn 0.6            cycle 5.2
     spitter    charge 0.8 | fire 0.3 | cooldown 1.5                     cycle 2.6 ("every 2.6s")
     claw       track 1.4 | lock 0.4 | slam 0.6 | retract 1.4            cycle 3.8
     wasp       drift (endless)
     supervisor sweepLeft 2.2 | hold 0.5 | sweepRight 2.2 | holdRight 0  cycle 4.9, stall 2.0
*/
(()=>{
'use strict';
const G=typeof window!=='undefined'?window:globalThis;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,box=(x,y,w,h)=>({x,y,w,h}),sgn=v=>v<0?-1:1;
const WAKE=.5,STUN=2,GRAVITY=1450;
const DUR={
  crawler:{patrol:2,turn:.6},
  spitter:{charge:.8,fire:.3,cooldown:1.5},
  claw:{track:1.4,lock:.4,slam:.6,retract:1.4},
  wasp:{drift:1},
  supervisor:{sweepLeft:2.2,hold:.5,sweepRight:2.2,holdRight:0,stall:2}
};
const SIZE={crawler:[64,40],spitter:[44,52],claw:[70,64],wasp:[34,30],supervisor:[54,44]};
const STUNNABLE={crawler:1,spitter:1,claw:1},MISTABLE={wasp:1};
// Cycle legs, in order. d = duration, zero-length legs are skipped.
const LEGS={
  crawler:d=>[{n:'patrol',d:d.patrol,dir:1},{n:'turn',d:d.turn,dir:0,at:1},{n:'patrol',d:d.patrol,dir:-1},{n:'turn',d:d.turn,dir:0,at:-1}],
  spitter:d=>[{n:'charge',d:d.charge},{n:'fire',d:d.fire},{n:'cooldown',d:d.cooldown}],
  claw:d=>[{n:'track',d:d.track},{n:'lock',d:d.lock},{n:'slam',d:d.slam},{n:'retract',d:d.retract}],
  wasp:d=>[{n:'drift',d:d.drift}],
  supervisor:d=>[{n:'sweepLeft',d:d.sweepLeft},{n:'hold',d:d.hold},{n:'sweepRight',d:d.sweepRight},{n:'holdRight',d:d.holdRight}]
};
function resolve(e){let t=e.ct%e.cycle;const L=e.legs;for(let i=0;i<L.length;i++){if(L[i].d>0&&t<L[i].d)return{i,t,leg:L[i]};t-=L[i].d}return{i:0,t:0,leg:L[0]}}
function approach(cur,to,step){const d=to-cur;return Math.abs(d)<=step?to:cur+sgn(d)*step}
function nearestLane(e,p){const c=p.x+(p.w||0)/2;let b=0,bd=Infinity;for(let i=0;i<e.lanes.length;i++){const d=Math.abs(e.lanes[i]-c);if(d<bd){bd=d;b=i}}return b}
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;

function make(type,cfg){
  cfg=cfg||{};
  if(!LEGS[type])throw new Error('L2ENEMIES.make: unknown enemy type "'+type+'"');
  const dur=Object.assign({},DUR[type],cfg.durations||{});
  const e={type,dur,legs:LEGS[type](dur),cycle:0,pn:'wake',leg:-1,t:0,ct:0,now:0,
    x:num(cfg.x,0),y:num(cfg.y,0),x0:num(cfg.x,0),y0:num(cfg.y,0),
    w:num(cfg.w,SIZE[type][0]),h:num(cfg.h,SIZE[type][1]),
    phase:num(cfg.phase,0),wake:num(cfg.wake,WAKE),stun:0,dead:0,vx:0,vy:0};
  e.cycle=e.legs.reduce((s,l)=>s+l.d,0);
  if(type==='crawler'){e.range=Math.abs(num(cfg.range,140));e.speed=Math.abs(num(cfg.speed,2*e.range/dur.patrol));e.left=e.x0-e.range;e.right=e.x0+e.range;e.dir=1;e.x=e.left}
  if(type==='spitter'){e.dir=num(cfg.dir,1)<0?-1:1;e.sx=Math.abs(num(cfg.vx,330))*e.dir;e.sy=num(cfg.vy,-430);e.g=Math.abs(num(cfg.g,GRAVITY));
    e.shotW=num(cfg.shotW,18);e.shotH=num(cfg.shotH,18);e.muzzleY=num(cfg.muzzleY,14);e.landY=num(cfg.landY,e.y+220);
    e.shot=null;e.shotT=0;e.shotLandX=0;e.lastLand=null;e.shots=0}
  if(type==='claw'){e.lanes=(cfg.lanes&&cfg.lanes.length?cfg.lanes:[e.x0]).slice();e.railSpeed=Math.abs(num(cfg.railSpeed,620));
    e.reach=Math.abs(num(cfg.reach,260));e.lane=0;e.lockLane=0;e.headX=e.lanes[0];e.slamX=e.lanes[0];e.headY=e.y}
  if(type==='wasp'){e.speed=Math.abs(num(cfg.speed,58));e.vent=cfg.vent===undefined?null:cfg.vent}
  if(type==='supervisor'){e.range=Math.abs(num(cfg.range,420));e.beamW=Math.abs(num(cfg.beamW,46));e.beamH=Math.abs(num(cfg.beamH,420));
    e.left=e.x0-e.range;e.right=e.x0+e.range;e.beamX=e.right;e.stall=0;e.shutterWas=0}
  return e;
}

// One enemy, one leg of its cycle. r = {i,t,leg} from resolve(); entered = true on the first tick of that leg.
function step(e,r,dt,world,entered){
  const n=r.leg.n,p=world.player;
  if(e.type==='crawler'){
    if(n==='patrol'){const span=e.range*2,tr=Math.min(e.speed*r.t,span);e.dir=r.leg.dir;e.x=r.leg.dir>0?e.left+tr:e.right-tr;e.vx=tr<span?r.leg.dir*e.speed:0}
    else{e.x=r.leg.at>0?e.right:e.left;e.vx=0}
    e.x=clamp(e.x,e.left,e.right);
  } else if(e.type==='spitter'){
    if(n==='fire'&&entered)shoot(e);
    if(e.shot){e.shot.age+=dt;const a=Math.min(e.shot.age,e.shotT);
      e.shot.x=e.shot.x0+e.sx*a;e.shot.y=e.shot.y0+e.sy*a+.5*e.g*a*a;e.shot.vx=e.sx;e.shot.vy=e.sy+e.g*a;
      if(e.shot.age>=e.shotT){e.lastLand={x:e.shot.x+e.shot.w/2,y:e.landY,t:e.shotT};e.shot=null}}
  } else if(e.type==='claw'){
    if(n==='track'){if(p)e.lane=nearestLane(e,p);e.headX=approach(e.headX,e.lanes[e.lane],e.railSpeed*dt);e.headY=e.y}
    else if(n==='lock'){if(entered)e.lockLane=e.lane;e.headX=approach(e.headX,e.lanes[e.lockLane],e.railSpeed*dt);e.headY=e.y}
    else if(n==='slam'){if(entered)e.slamX=e.lanes[e.lockLane];e.headX=e.slamX;const q=clamp(r.t/e.dur.slam,0,1);e.headY=e.y+e.reach*q*q}
    else{e.headX=e.slamX;const q=clamp(r.t/e.dur.retract,0,1);e.headY=e.y+e.reach*(1-q*q*(3-2*q))}
    e.vy=e.headY-e.y;
  } else if(e.type==='wasp'){
    if(p){const cx=e.x+e.w/2,cy=e.y+e.h/2,dx=p.x+(p.w||0)/2-cx,dy=p.y+(p.h||0)/2-cy,d=Math.hypot(dx,dy);
      if(d>1e-9){const s=Math.min(e.speed*dt,d);e.x+=dx/d*s;e.y+=dy/d*s;e.vx=dx/d*e.speed;e.vy=dy/d*e.speed}else{e.vx=0;e.vy=0}}
    else{e.vx=0;e.vy=0}
  } else if(e.type==='supervisor'){
    const L=e.left,R=e.right,was=e.beamX;
    if(n==='sweepLeft')e.beamX=R+(L-R)*clamp(r.t/e.dur.sweepLeft,0,1);
    else if(n==='hold')e.beamX=L;
    else if(n==='sweepRight')e.beamX=L+(R-L)*clamp(r.t/e.dur.sweepRight,0,1);
    else e.beamX=R;
    e.vx=dt>0?(e.beamX-was)/dt:0;
  }
}

// Fixed parabola: muzzle, shot velocity and gravity never vary, so the landing point is solved
// once, analytically, and every shot from this turret lands on exactly the same spot.
function shoot(e){
  const mx=e.dir>0?e.x+e.w:e.x-e.shotW,my=e.y+e.muzzleY,c=my+e.shotH-e.landY,
    disc=Math.max(0,e.sy*e.sy-2*e.g*c),t=(-e.sy+Math.sqrt(disc))/e.g;
  e.shotT=t;e.shotLandX=mx+e.sx*t;e.shots++;
  e.shot={x:mx,y:my,x0:mx,y0:my,w:e.shotW,h:e.shotH,age:0,vx:e.sx,vy:e.sy};
}

function update(e,dt,now,world){
  if(!e)return e;
  world=world||{};
  dt=num(dt,num(world.dt,0));if(dt<0)dt=0;
  e.now=num(now,e.now);
  if(e.dead)return e;
  // Shutter is an external event: rising edge only, read before anything else can freeze.
  if(e.type==='supervisor'){const s=world.shutterOpened?1:0;if(s&&!e.shutterWas)e.stall=e.dur.stall;e.shutterWas=s}
  if(e.stun>0){e.stun=Math.max(0,e.stun-dt);return e}          // frozen solid, harmless
  if(e.wake>0){                                                 // spawn tell, no cycle, no hazard
    e.wake=Math.max(0,e.wake-dt);
    if(e.wake>0)return e;
    e.ct=((e.phase%e.cycle)+e.cycle)%e.cycle;
    const r0=resolve(e);e.leg=r0.i;e.t=r0.t;e.pn=r0.leg.n;step(e,r0,0,world,false);
    return e;
  }
  if(e.type==='supervisor'&&e.stall>0){e.stall=Math.max(0,e.stall-dt);return e} // beam frozen + harmless
  e.ct=(e.ct+dt)%e.cycle;
  const r=resolve(e),entered=r.i!==e.leg;
  e.leg=r.i;e.t=r.t;e.pn=r.leg.n;
  step(e,r,dt,world,entered);
  return e;
}

function phaseName(e){return !e?'none':e.dead?'dead':e.stun>0?'stunned':e.wake>0?'wake':(e.type==='supervisor'&&e.stall>0)?'stall':e.pn}

function hazard(e){
  if(!e||e.dead||e.stun>0||e.wake>0)return null;
  switch(e.type){
    case 'crawler':return box(e.x,e.y,e.w,e.h);
    case 'spitter':return e.shot?box(e.shot.x,e.shot.y,e.shot.w,e.shot.h):null;
    case 'claw':return e.pn==='slam'?box(e.headX-e.w/2,e.headY,e.w,e.h):null;
    case 'wasp':return box(e.x,e.y,e.w,e.h);
    case 'supervisor':return e.stall>0?null:box(e.beamX-e.beamW/2,e.y,e.beamW,e.beamH);
  }
  return null;
}

function tell(e){
  if(!e||e.dead)return 0;
  if(e.stun>0)return clamp((.5-e.stun)/.5,0,1);                 // wakes up visibly
  if(e.wake>0)return clamp(1-e.wake/(WAKE||1),0,1);
  const n=e.pn,t=e.t,d=e.dur;
  switch(e.type){
    case 'crawler':return n==='turn'?clamp(.3+.7*(t/d.turn),0,1):.25;
    // .08 floor on the charge: the port keeps a dim glow, so the amber tell never blinks to zero
    // between the spawn tell and the first charge.
    case 'spitter':return n==='charge'?clamp(.08+.92*(t/d.charge),0,1):n==='fire'?1:e.shot?.5:clamp(1-t/.4,0,1);
    case 'claw':return n==='track'?clamp(.2+.3*(t/d.track),0,1):n==='lock'?1:n==='slam'?1:clamp(1-t/.5,0,1);
    case 'wasp':return .45;
    case 'supervisor':return e.stall>0?(e.stall>.4?.15:clamp((.4-e.stall)/.4,0,1)):.6;
  }
  return 0;
}

function stun(e){if(!e||e.dead||!STUNNABLE[e.type]||e.stun>0)return false;e.stun=STUN;return true}
function mist(e){if(!e||e.dead||!MISTABLE[e.type])return false;e.dead=1;e.vx=e.vy=0;return true}

G.L2ENEMIES={make,update,hazard,tell,stun,mist,phaseName,consts:{WAKE,STUN,GRAVITY,DUR,SIZE,STUNNABLE,MISTABLE}};
})();
