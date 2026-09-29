'use strict';
const assert=require('assert'),fs=require('fs');const {boot}=require('./level7-harness.cjs');let checks=0;const ok=(c,m)=>{assert(c,m);checks++},dt=1/60;
{
  const q=boot();ok(q.state().running&&!q.state().done&&q.state().cogs===0&&q.state().fragments===0,'starts at Dome Exit');q.tick(60,dt);ok(q.P.ground,'Bix lands on the opening deck');q.draw();ok(true,'opening frame draws');
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
  const q=boot(),r=q.D.relays.find(v=>v.target==='bridge1'),b=q.D.bridges.find(v=>v.id==='bridge1');q.place(r.x,r.y);q.deploy(r);q.tick(120,dt);ok(Math.abs(q.moving()[b.id].y-b.onY)<10,'a linked bridge reaches its powered position');q.recall();q.tick(120,dt);ok(Math.abs(q.moving()[b.id].y-b.y)<12,'recalling Pack returns the bridge');
}
{
  const q=boot(),r=q.D.relays.find(v=>v.id==='r3');q.place(r.x,r.y);q.deploy(r);q.tick(2,dt);const a=q.auditors().find(v=>v.relay===r.id),p=a.p;q.K.blue=1;q.tick(1,dt);ok(a.p<p&&a.dir===-1,'Ping sends a Signal Auditor back');q.K.red=1;q.tick(1,dt);ok(a.p<=.23&&a.stun>0,'Reroute diverts and stalls it');
}
{
  const q=boot(),cg=q.D.cogs[0],fr=q.D.fragments[0];q.place(cg.x-21,cg.y+54);q.tick(1,dt);ok(q.state().cogs===1,'cog collects');q.place(fr.x-21,fr.y+54);q.tick(1,dt);ok(q.state().fragments===1&&/Shift fragment/.test(q.line()),'VELA fragment collects and speaks');
}
{
  const saved=[],mayhem={getProgress:()=>({levels:{level6:{completed:true,bestCogs:15}}}),subscribe(){},recordResult:(id,r)=>{saved.push([id,r]);return Promise.resolve('Saved.')}};const q=boot({mayhem});q.setCogs(12);q.setFragments(5);q.S.clock=1100;q.finish();ok(q.state().done&&!q.state().running,'finish ends the level');ok(saved.length===1&&saved[0][0]==='level7'&&saved[0][1].cogs===12,'finish saves a Level 7 result');ok(q.medalFor(12,8,1200).name==='GOLD'&&q.medalFor(7,20,1680).name==='SILVER'&&q.medalFor(0,99,9999).name==='BRONZE','medal thresholds match the plan');
}
{
  const P=require('../dist/progress.js'),mk=(done,cogs)=>({levels:{level1:{bestCogs:cogs[0]||0},level2:{bestCogs:cogs[1]||0},level3:{bestCogs:cogs[2]||0},level4:{bestCogs:cogs[3]||0},level5:{bestCogs:cogs[4]||0},level6:{bestCogs:cogs[5]||0,completed:done}}});
  ok(!P.level7Unlocked(mk(false,[12,14,12,12,15,15])),'Level 6 completion is mandatory');ok(!P.level7Unlocked(mk(true,[10,10,10,9,0,0])),'39 cogs stay locked');ok(P.level7Unlocked(mk(true,[10,10,10,10,0,0])),'completion plus 40 carried cogs unlocks Level 7');
}
{
  const q=boot({enemies:true});for(const cp of q.D.checkpoints){q.setCP(cp);q.place(cp.x,cp.y);q.tick(3,dt);q.draw()}for(const r of q.D.relays){q.deploy(r);q.tick(3,dt);q.draw();q.recall();q.tick(3,dt)}ok(true,'every checkpoint and linked target draws');
}
{
  const rng=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};let runs=0;for(const fps of [30,60,120])for(let seed=1;seed<=3;seed++){const q=boot({enemies:true}),r=rng(seed*7919+fps),d=1/fps;q.setCP(q.D.checkpoints[Math.floor(r()*q.D.checkpoints.length)]);q.reset(0);for(let i=0;i<20*fps;i++){if(i%Math.max(1,Math.floor(fps/5))===0)Object.keys(q.K).forEach(k=>q.K[k]=r()<.3?1:0);q.tick(1,d);if(![q.P.x,q.P.y,q.P.vx,q.P.vy,q.pack().x,q.pack().y].every(Number.isFinite))assert.fail('non-finite Level 7 state')}runs++}ok(runs===9,'random input stays finite at three frame rates');
}
const src=fs.readFileSync('dist/level7.js','utf8');ok(/showStory\('departure'\)/.test(src)&&/BX-7, DO NOT CLOCK IN/.test(src),'departure and complete VELA warning are wired');
console.log(JSON.stringify({checks}));
