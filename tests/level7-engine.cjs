'use strict';
const assert=require('assert'),fs=require('fs');const {boot}=require('./level7-harness.cjs');let checks=0;const ok=(c,m)=>{assert(c,m);checks++},dt=1/60;
{
  const q=boot();ok(q.state().running&&!q.state().done&&q.state().cogs===0&&q.state().fragments===0,'starts at Dome Exit');q.tick(60,dt);ok(q.P.ground,'Bix lands on the opening deck');q.draw();ok(true,'opening frame draws');
}
{
  const q=boot(),edge=q.D.platforms[1];Object.assign(q.P,{x:edge[0]-q.P.w-3,y:edge[1]-19,vy:100,vx:0,ground:0,face:1,grabCD:0});q.tick(1,dt);
  ok(q.P.hang&&q.P.hangRect?.climbable,'Bix grabs a full platform edge');q.tick(60,dt);
  ok(!q.P.hang&&q.P.climb===0&&q.P.ground&&q.P.y+q.P.h===edge[1],'Bix climbs onto the platform and leaves the climb pose');
}
{
  const q=boot(),r=q.D.relays[0];q.place(r.x-21,r.y);q.tick(2,dt);ok(/LINK PACK/.test(q.prompt()),'ACT offers Pack Link at a socket');q.K.interact=1;q.tick(2,dt);ok(q.pack().mode==='linked'&&q.pack().relay.id===r.id,'Pack deploys into the socket');ok(q.state().charge===0&&q.powered(r.target),'deploying removes the catch and powers the target');q.K.interact=1;q.tick(2,dt);ok(q.pack().mode==='returning','ACT recalls Pack');q.tick(60,dt);ok(q.pack().mode==='attached'&&q.state().charge===1,'Pack returns and restores the catch');
}
{
  // a repeater re-broadcasts the relay's link (dist/level7.js linkRatio()), so breaking it means clearing BOTH the relay's own
  // range AND its repeater's — placed relay-range-and-then-some past the repeater itself, not just past the relay
  const q=boot(),r=q.D.relays[1],rep=q.D.repeaters.find(p=>p.relay===r.id);q.deploy(r);q.place(rep.x+r.range+100,rep.y);q.tick(4,dt);ok(q.pack().mode==='broken'&&q.state().linkBreaks===1,'crossing the link radius breaks it');q.tick(80,dt);ok(q.pack().mode==='attached','a broken link safely returns Pack');
}
{
  // the actual bug: r1's own range (1050) does not reach gate1 (1313px away), only its repeater does. Standing well past the
  // relay's own range but still within the repeater's must NOT break the link, or none of the level's longer relays are crossable.
  const q=boot(),r=q.D.relays[0],rep=q.D.repeaters.find(p=>p.relay===r.id);
  ok(Math.hypot(rep.x-r.x,rep.y-r.y)+400>r.range,`the fixture repeater is far enough from ${r.id} that only the repeater path can carry the link this far`);
  q.deploy(r);q.place(rep.x-100,rep.y);q.tick(30,dt);
  ok(q.pack().mode==='linked'&&q.state().linkBreaks===0,'standing past the relay\'s own range but near its repeater keeps the link alive');
}
{
  const q=boot(),r=q.D.relays[0],rep=q.D.repeaters.find(p=>p.relay===r.id);q.place(r.x-21,r.y);q.deploy(r);
  const near=q.linkPath(0);ok(near.length>10&&near.every(p=>Math.abs(p.x-r.x)<200),'near Pack, the animated signal stays local instead of shooting toward the distant repeater');
  q.place(rep.x+150,rep.y);const far=q.linkPath(0);ok(far.some(p=>Math.abs(p.x-rep.x)<1),'farther away, the signal visibly routes through the repeater');q.draw();
}
{
  // standing on a moving surface must move with it — Bix used to stay put in world space while a bridge or the tram slid out from
  // under him, since nothing carried him along (every other level does; this one never did)
  const q=boot(),r=q.D.relays.find(v=>v.target==='bridge1'),b=q.D.bridges.find(v=>v.id==='bridge1');
  q.place(r.x,r.y);q.deploy(r);q.tick(120,dt);   // let the bridge rise fully, as the powered-position test above does
  // land on it naturally (q.place() alone clears P.support, which is a test artefact, not how a player ever actually arrives)
  Object.assign(q.P,{x:b.x+b.w/2-21,y:q.moving()[b.id].y-q.P.h-40,vx:0,vy:50,ground:0,support:null});
  q.tick(20,dt);
  ok(q.P.support&&q.P.support.dynamic==='bridge1','Bix lands on the bridge');
  const beforeY=q.P.y;q.recall();q.tick(20,dt);   // recall sends it back down; a stationary Bix must travel down with it
  ok(q.P.support&&q.P.support.dynamic==='bridge1'&&q.P.y>beforeY+5,'standing still as a bridge lowers, Bix rides it down rather than staying put in the air');
  const t=q.D.trams[0],rt=q.D.relays.find(v=>v.target===t.id);
  q.reset(1);q.place(rt.x,rt.y);q.deploy(rt);q.tick(90,dt);
  const m0=q.moving()[t.id];
  Object.assign(q.P,{x:m0.x+t.w/2-21,y:t.y-q.P.h-40,vx:0,vy:50,ground:0,support:null});
  q.tick(20,dt);
  ok(q.P.support&&q.P.support.dynamic===t.id,'Bix lands on the tram');
  const tx0=q.P.x;q.tick(60,dt);
  ok(q.P.support&&q.P.support.dynamic===t.id&&(q.P.x-tx0)>50,'standing on the tram as it moves, Bix travels with it rather than falling off the back');
}
{
  for(const lift of boot().D.lifts){
    const q=boot(),r=q.D.relays.find(v=>v.target===lift.id);
    q.place(r.x,r.y);q.deploy(r);q.tick(120,dt);
    Object.assign(q.P,{x:lift.x+lift.w/2-21,y:q.moving()[lift.id].y-q.P.h-40,vx:0,vy:50,ground:0,support:null});
    q.tick(20,dt);ok(q.P.support?.dynamic===lift.id,`${lift.id} supports Bix after landing`);
    const beforeY=q.P.y;q.recall();q.tick(20,dt);
    ok(q.P.support?.dynamic===lift.id&&q.P.y>beforeY+5,`${lift.id} carries Bix down when power is recalled`);
  }
}
{
  const q=boot(),r=q.D.relays.find(v=>v.target==='bridge1'),b=q.D.bridges.find(v=>v.id==='bridge1');q.place(r.x,r.y);q.deploy(r);q.tick(120,dt);ok(Math.abs(q.moving()[b.id].y-b.onY)<10,'a linked bridge reaches its powered position');q.recall();q.tick(120,dt);ok(Math.abs(q.moving()[b.id].y-b.y)<12,'recalling Pack returns the bridge');
}
{
  const q=boot(),b=q.D.bridges.find(v=>v.id==='bridge1');q.place(b.x+b.w/2-21,b.y);q.tick(2,dt);
  ok(/RAISE BRIDGE/.test(q.prompt()),'a lowered bridge offers a local Pack link so Bix cannot be stranded');
  q.K.interact=1;q.tick(1,dt);ok(q.pack().mode==='linked'&&q.pack().relay.target===b.id,'Pack links from the bridge deck');
  q.tick(120,dt);ok(q.moving()[b.id].y<b.y-150&&q.P.support?.dynamic===b.id,'the bridge raises Bix to the upper walkway');
}
{
  const q=boot(),r=q.D.relays.find(v=>v.id==='r3');q.place(r.x,r.y);q.deploy(r);q.tick(2,dt);const a=q.auditors().find(v=>v.relay===r.id),p=a.p;q.K.blue=1;q.tick(1,dt);ok(a.p<p&&a.dir===-1,'Ping sends a Signal Auditor back');q.K.red=1;q.tick(1,dt);ok(a.p<=.23&&a.stun>0,'Reroute diverts and stalls it');
}
{
  const q=boot(),r=q.D.relays.find(v=>v.target==='gate4'),gate=q.D.gates.find(v=>v.id==='gate4');
  q.place(r.x-21,r.y);q.deploy(r);ok(q.powered('gate4'),'linking the transfer relay opens its shutter');
  q.target().interrupted=.9;q.place(gate.x-q.P.w-3,gate.y+gate.h);q.tick(4,dt);
  ok(q.powered('gate4')&&!q.solids().some(s=>s.x===gate.x&&s.y===gate.y&&s.w===gate.w),'auditor interruption cannot shut the transfer shutter in front of Bix');
  q.K.right=1;q.tick(45,dt);ok(q.P.x>gate.x+gate.w,'Bix can cross the shutter after the auditor interrupts the link');
  q.recall();ok(q.powered('gate4'),'the transfer shutter remains open after Pack returns');
  q.reset(1);ok(!q.powered('gate4'),'a new run resets the transfer shutter');
}
{
  const q=boot(),r=q.D.relays.find(v=>v.id==='r7');q.place(r.x,r.y);q.deploy(r);
  const a=q.auditors().find(v=>v.relay===r.id);a.p=.959;a.dir=1;q.tick(1,dt);
  ok(a.dir===-1&&q.target().interrupted>0,'an auditor turns around after reaching the link endpoint');
  q.tick(120,dt);ok(q.target().interrupted===0&&a.p<.96,'the interruption expires while the auditor retreats');
}
{
  const q=boot(),cg=q.D.cogs[0],fr=q.D.fragments[0];q.place(cg.x-21,cg.y+54);q.tick(1,dt);ok(q.state().cogs===1,'cog collects');q.place(fr.x-21,fr.y+54);q.tick(1,dt);ok(q.state().fragments===1&&/Shift fragment/.test(q.line()),'VELA fragment collects and speaks');
}
{
  const q=boot(),entry=q.D.hiddenDoors.find(d=>d.id==='closet-in'),exit=q.D.hiddenDoors.find(d=>d.id==='closet-out');
  q.place(entry.x-21,entry.y);q.K.interact=1;q.tick(1,dt);
  ok(entry.discovered&&exit.discovered&&Math.abs(q.P.y+q.P.h-exit.y)<3,'hidden door reveals its pair and enters the closet');
  q.place(exit.x-21,exit.y);q.tick(45,dt);q.K.interact=1;q.tick(1,dt);
  ok(Math.abs(q.P.y+q.P.h-entry.y)<3,'return door leads back to the public route');
  const b=q.D.blackouts[0];q.place(b.x0+50,250);q.tick(1,dt);ok(/lost its lights/i.test(q.line()),'court blackout fires when entered');
}
{
  for(const prefix of ['records','zero']){
    const q=boot(),entry=q.D.hiddenDoors.find(d=>d.id===prefix+'-in'),exit=q.D.hiddenDoors.find(d=>d.id===prefix+'-out');
    q.place(entry.x-21,entry.y);q.K.interact=1;q.tick(1,dt);
    ok(entry.discovered&&exit.discovered&&Math.abs(q.P.y+q.P.h-exit.y)<3,`${prefix} hidden door reaches its room`);
    q.tick(45,dt);q.place(exit.x-21,exit.y);q.K.interact=1;q.tick(1,dt);
    ok(Math.abs(q.P.y+q.P.h-entry.y)<3,`${prefix} return door reaches the public route`);
  }
}
{
  const q=boot(),cp=q.D.checkpoints[5];q.setCP(cp);q.place(cp.x,cp.y);q.deploy(q.D.relays[0]);q.P.inv=0;q.P.y=cp.y+1200;
  q.tick(1,dt);ok(q.P.falls===1&&Math.abs(q.P.y+q.P.h-cp.y)<3,'a fall restores the last checkpoint');
}
{
  const saved=[],mayhem={getProgress:()=>({levels:{level6:{completed:true,bestCogs:15}}}),subscribe(){},recordResult:(id,r)=>{saved.push([id,r]);return Promise.resolve('Saved.')}};const q=boot({mayhem});q.setCogs(16);q.setFragments(5);q.S.clock=1100;q.finish();ok(q.state().done&&!q.state().running,'finish ends the level');ok(saved.length===1&&saved[0][0]==='level7'&&saved[0][1].cogs===16,'finish saves a Level 7 result');ok(q.medalFor(16,10,1800).name==='GOLD'&&q.medalFor(10,24,2400).name==='SILVER'&&q.medalFor(0,99,9999).name==='BRONZE','medal thresholds match the extended route');
}
{
  const P=require('../dist/progress.js'),mk=(done,cogs)=>({levels:{level1:{bestCogs:cogs[0]||0},level2:{bestCogs:cogs[1]||0},level3:{bestCogs:cogs[2]||0},level4:{bestCogs:cogs[3]||0},level5:{bestCogs:cogs[4]||0},level6:{bestCogs:cogs[5]||0,completed:done}}});
  ok(!P.level7Unlocked(mk(false,[12,14,12,12,15,15])),'Level 6 completion is mandatory');ok(!P.level7Unlocked(mk(true,[10,10,10,9,0,0])),'39 cogs stay locked');ok(P.level7Unlocked(mk(true,[10,10,10,10,0,0])),'completion plus 40 carried cogs unlocks Level 7');
}
{
  const q=boot({enemies:true});for(const cp of q.D.checkpoints){q.setCP(cp);q.place(cp.x,cp.y);q.tick(3,dt);q.draw()}for(const r of q.D.relays){q.deploy(r);q.tick(3,dt);q.draw();q.recall();q.tick(3,dt)}ok(true,'every checkpoint and linked target draws');
}
{
  const q=boot({enemies:true});q.place(150,410);
  for(let i=0;i<1200;i++){q.tick(1,dt);for(const e of q.enemies().filter(e=>e.type==='sweeper'||e.type==='ram'))ok(e.x>=e.walkMin-.01&&e.x<=e.walkMax+.01,`${e.type} at ${e.x0} remains over its deck`)}
}
{
  const rng=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};let runs=0;for(const fps of [30,60,120])for(let seed=1;seed<=3;seed++){const q=boot({enemies:true}),r=rng(seed*7919+fps),d=1/fps;q.setCP(q.D.checkpoints[Math.floor(r()*q.D.checkpoints.length)]);q.reset(0);for(let i=0;i<20*fps;i++){if(i%Math.max(1,Math.floor(fps/5))===0)Object.keys(q.K).forEach(k=>q.K[k]=r()<.3?1:0);q.tick(1,d);if(![q.P.x,q.P.y,q.P.vx,q.P.vy,q.pack().x,q.pack().y].every(Number.isFinite))assert.fail('non-finite Level 7 state')}runs++}ok(runs===9,'random input stays finite at three frame rates');
}
const src=fs.readFileSync('dist/level7.js','utf8');ok(/showStory\('departure'\)/.test(src)&&/BX-7, DO NOT CLOCK IN/.test(src),'departure and complete VELA warning are wired');
console.log(JSON.stringify({checks}));
