// Regression tests for the engine bugs found in the physics + graphics reviews.
// Runs the REAL engine on the REAL level data. Each check fails on the code from before the fix.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{};let clock=0;const drawn=[],rots=[];
const ctx=new Proxy({
  drawImage(im,...a){drawn.push({src:String(im.src),a})},
  rotate(r){rots.push(r)},
  createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},dataset:{},addEventListener:noop,setPointerCapture:noop,
  getBoundingClientRect:()=>({width:1280,height:720,left:0,top:0}),getContext:()=>ctx,focus:noop,textContent:''});
const els={};
const sb={console,Math,JSON,performance:{now:()=>clock*1000},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop},
  Image:class{set src(v){this.p=v;this.complete=true;this.naturalWidth=1000;this.naturalHeight=1000}get src(){return this.p}},
  addEventListener:noop,devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop,ResizeObserver:null};
sb.window=sb;vm.createContext(sb);
for(const f of ['dist/level2-art.js','dist/level2-data.js','dist/level2-enemies.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sb);
const hook='resize();reset(1);requestAnimationFrame(frame);';
let src=fs.readFileSync('dist/level2.js','utf8');assert(src.includes(hook),'boot hook missing from level2.js');
src=src.replace(hook,`resize();reset(1);globalThis.qa={P,K,D,EN,update,draw,start,reset,hurt,solids,enemyPose,
  enemies:()=>enemies,state:()=>({charge,camY}),setCP:c=>{checkpoint=c;seen.add(c)}};`);
vm.runInContext(src,sb);const q=sb.qa;q.start();
const tick=(n=1)=>{for(let i=0;i<n;i++){clock+=1/120;q.update(1/120)}};
const stand=(x,surfaceY)=>Object.assign(q.P,{x,y:surfaceY-q.P.h,vx:0,vy:0,ground:1,inv:999,hang:0,climb:0});
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
let checks=0;const ok=(c,m)=>{assert(c,m);checks++};
const D=q.D;

// 1. Crawlers walk ON a surface and their whole patrol stays on it (not buried in the deck,
//    and not out in the air past the platform's end).
for(const cfg of D.enemies.filter(e=>e.type==='crawler')){
  const top=[...D.platforms,...D.ledges].find(s=>Math.abs(s[1]-cfg.y)<=3&&cfg.x>=s[0]&&cfg.x<=s[0]+s[2]);
  ok(top,`no surface under the crawler authored at ${cfg.x},${cfg.y}`);
  const c=q.enemies().find(e=>e.type==='crawler'&&Math.abs(e.x0-cfg.x)<400&&Math.abs(e.y+e.h-top[1])<=1);
  ok(c,`the crawler at ${cfg.x} does not stand on its surface (top ${top[1]})`);
  ok(c.left>=top[0]&&c.right+c.w<=top[0]+top[2],`the crawler at ${cfg.x} patrols off its platform: ${c.left}..${c.right+c.w} vs ${top[0]}..${top[0]+top[2]}`);
  q.EN.update(c,1,0,{player:{x:0,y:0,w:42,h:96},dt:1});   // past its 0.5s wake, so it is lethal
  const hz=q.EN.hazard(c);ok(hz,'crawler was not lethal after waking');
  ok(overlap({x:hz.x,y:top[1]-96,w:42,h:96},hz),'a player standing on the deck cannot touch the crawler on it');
}

// 2. Spitters fire the way the data says (data says `face`, the module reads `dir`).
const spitters=D.enemies.filter(e=>e.type==='spitter'),built=q.enemies().filter(e=>e.type==='spitter');
ok(spitters.length&&spitters.every((d,i)=>built[i].dir===d.face),'a spitter ignores its `face` from the data');

// 3. Pack's catch cancels a hang or mantle, so the rescue is not undone.
const cp=D.checkpoints[0];q.setCP(cp);
const ledge=D.ledges[3];
Object.assign(q.P,{x:ledge[0]+20,y:ledge[1]-19,hang:1,hangAt:clock,face:1,hangRect:{x:ledge[0],y:ledge[1],w:ledge[2],h:ledge[3],ledge:1},ground:0,inv:0});
q.hurt('test');tick(60);
ok(Math.abs(q.P.x-cp.x)<8,`the catch was undone: Bix is at ${q.P.x.toFixed(0)}, checkpoint is ${cp.x}`);
ok(!q.P.hang&&!q.P.climb,'the catch left Bix hanging or climbing');

// 4. Every respawn rebuilds the enemies, so none stays parked on a checkpoint.
const before=q.enemies();q.reset(0);
ok(q.enemies()!==before,'reset(0) did not rebuild the enemies');
ok(q.enemies().length===D.enemies.length,'enemy count changed on respawn');
ok(q.enemies().every(e=>e.wake>0),'respawned enemies should be waking, not lethal');

// 5. Down on a belt must not drop Bix through the solid deck under it.
for(const b of D.belts){
  q.reset(1);q.start();
  stand(b.x+b.w/2-21,b.y);tick(20);
  ok(q.P.ground&&Math.abs(q.P.y+q.P.h-b.y)<1,`could not stand on belt at ${b.x}`);
  q.K.down=1;tick(90);q.K.down=0;
  ok(Math.abs(q.P.y+q.P.h-b.y)<40,`Down on the belt at ${b.x} dropped Bix through the deck (feet at ${q.P.y+q.P.h})`);
}

// 6. A vent flagged `safe` never hurts, and honours its own period.
const safe=D.vents.find(v=>v.safe);ok(safe,'the level has no safe vent');
q.reset(1);q.start();stand(safe.x-21,safe.y);q.P.inv=0;
const falls0=q.P.falls;
for(let i=0;i<Math.ceil((safe.period||4.2)*2*120);i++){q.P.inv=0;q.P.vx=0;q.P.x=safe.x-21;q.P.y=safe.y-96;q.P.vy=0;tick(1)}
ok(q.P.falls===falls0&&q.state().charge===1,'a vent flagged safe hurt Bix');

// 7. The molten channel is inside the visible band, not just off the bottom of the screen.
q.reset(1);q.start();
const lava=D.lava[0],p=D.platforms.find(p=>p[0]<lava.x&&p[0]+p[2]>lava.x-300&&p[2]>=200)||D.platforms[5];
stand(p[0]+40,p[1]);tick(600);
const camY=q.state().camY;
ok(lava.y+30<=camY+720,`the molten channel (y ${lava.y}) is off screen: the view ends at ${camY+720}`);
ok(camY<=D.ledges.reduce((m,l)=>Math.min(m,l[3]&&l[0]<14380?l[1]:1e9),1e9)-40,'camera hides the highest ledges');

// 8. Each enemy is drawn where its hitbox is.
q.reset(1);q.start();
for(const e of q.enemies()){
  q.EN.update(e,1,0,{player:{x:0,y:0,w:42,h:96},dt:1});
  const pose=q.enemyPose(e),hz=q.EN.hazard(e);
  if(e.type==='claw'){
    q.EN.update(e,9,0,{player:{x:e.lanes[1],y:400,w:42,h:96},dt:9});
    let guard=0;while(q.EN.phaseName(e)!=='slam'&&guard++<4000)q.EN.update(e,1/60,0,{player:{x:e.lanes[1],y:400,w:42,h:96},dt:1/60});
    for(let i=0;i<24;i++)q.EN.update(e,1/60,0,{player:{x:e.lanes[1],y:400,w:42,h:96},dt:1/60});   // 0.4s into the 0.6s slam: the head has dropped
    ok(e.headY>e.y+20,'the claw head did not drop during its slam');
    const h=q.EN.hazard(e);ok(h,'claw never reached its slam');
    const c=q.enemyPose(e);
    ok(Math.abs(c.cx-(h.x+h.w/2))<1,'claw picture is not over its lethal box (x)');
    ok(Math.abs(c.bottom-(h.y+h.h))<1,'claw picture does not end at its lethal box (y)');
  }else if(hz&&e.type!=='supervisor'&&e.type!=='spitter'){
    ok(Math.abs(pose.cx-(hz.x+hz.w/2))<1,`${e.type} picture is not centred on its hitbox`);
    ok(pose.bottom>=hz.y+hz.h&&pose.bottom<=hz.y+hz.h+8,`${e.type} picture floats or sinks relative to its hitbox`);
  }
}

// 9. Belts are drawn AFTER the platforms they lie on, or the deck paints over them.
q.reset(1);q.start();drawn.length=0;clock=5;q.draw();
const lastDeck=drawn.map(d=>d.src).map((s,i)=>/platform-atlas/.test(s)?i:-1).filter(i=>i>=0).pop();
const firstBelt=drawn.findIndex(d=>/conveyor-belt/.test(d.src));
ok(firstBelt>=0,'no belt was drawn');
ok(firstBelt>lastDeck,'belts are drawn before the platforms, so the deck covers them');

// 10. Cogs use the same painted, spinning art as Level 1 (not placeholder circles).
q.reset(1);q.start();drawn.length=0;rots.length=0;clock=5;q.draw();
const cogDraws=drawn.filter(d=>/energy-cog-v1\.png/.test(d.src));
ok(cogDraws.length===D.cogs.length,`expected ${D.cogs.length} painted cogs, drew ${cogDraws.length}`);
ok(cogDraws.every(d=>d.a.slice(0,4).join()==='53,57,1148,1117'),'cogs are not cropped to the painted gear (Level 1 crop 53,57,1148,1117)');
ok(cogDraws.every(d=>Math.abs(d.a[7]-54)<.01&&Math.abs(d.a[6]/d.a[7]-1148/1117)<.001),'the cog is not drawn at Level 1 size (54px tall) and true proportions');
const rot5=rots.slice();rots.length=0;clock=7;q.draw();
ok(rot5.length===D.cogs.length&&rots.some((r,i)=>Math.abs(r-rot5[i])>.3),'the cogs are not spinning');
ok(Math.sign(rot5[0])!==Math.sign(rot5[1]),'neighbouring cogs should spin in opposite directions, as in Level 1');
// a collected cog is not drawn
D.cogs[0].got=1;drawn.length=0;q.draw();
ok(drawn.filter(d=>/energy-cog-v1\.png/.test(d.src)).length===D.cogs.length-1,'a collected cog was still drawn');
D.cogs[0].got=0;

// 11. The coolant gate is drawn with the shutter-panel art (not a placeholder box), fills its whole
//     collision box while closed, and slides away once both valves are turned.
const gate=D.gates[0],cell2=sb.L2ART['furnace-prop-atlas-v2.png'].cells[2];
const gatePanels=()=>drawn.filter(d=>/furnace-prop-atlas-v2/.test(d.src)&&d.a.slice(0,4).join()===cell2.join()&&Math.abs(d.a[7]-120)>.5);
D.valves.forEach(v=>v.on=0);q.reset(1);q.start();drawn.length=0;clock=5;q.draw();
const closed=gatePanels();
ok(closed.length>=1,'the closed gate is not drawn with the shutter art');
ok(Math.abs(closed.reduce((t,d)=>t+d.a[7],0)-gate.h)<1,`the gate art does not fill its ${gate.h}px collision box`);
D.valves.forEach(v=>v.on=1);
drawn.length=0;clock=5;q.draw();
ok(gatePanels().length>=1,'the gate vanished the instant it opened, with no slide');
drawn.length=0;clock=6;q.draw();
ok(gatePanels().length===0,'an open gate is still drawn a second later');
D.valves.forEach(v=>v.on=0);

console.log(JSON.stringify({checks,crawlers:q.enemies().filter(e=>e.type==='crawler').length,belts:D.belts.length,camY:Math.round(camY)}));
