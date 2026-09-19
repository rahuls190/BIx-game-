// Level 2 can actually be finished, using the REAL level data (not the engine fixture).
// Guards the ending: the exit sits on the lift deck's surface, so a finish check
// measured from the wrong point can make the level impossible to complete.
const fs=require('fs'),vm=require('vm'),assert=require('assert');let clock=0;const noop=()=>{};
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},dataset:{},addEventListener:noop,setPointerCapture:noop,getBoundingClientRect:()=>({width:1280,height:720,left:0,top:0}),getContext:()=>ctx,focus:noop,textContent:''});
const els={};
const sandbox={console,Math,JSON,performance:{now:()=>clock*1000},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop},
  Image:class{set src(v){this.p=v;this.complete=true;this.naturalWidth=100;this.naturalHeight=100}get src(){return this.p}},
  addEventListener:noop,devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop,ResizeObserver:null};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const f of ['dist/level2-art.js','dist/level2-data.js','dist/level2-enemies.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sandbox);
const hook='resize();reset(1);requestAnimationFrame(frame);';
let src=fs.readFileSync('dist/level2.js','utf8');assert(src.includes(hook),'boot hook missing from level2.js');
src=src.replace(hook,'resize();reset(1);globalThis.qa={P,K,D,update,start,solids,state:()=>({done,shutters,valves})};');
vm.runInContext(src,sandbox);const q=sandbox.qa;q.start();
const tick=(n=1)=>{for(let i=0;i<n;i++){clock+=1/120;q.update(1/120)}};
const stand=(x,surfaceY)=>Object.assign(q.P,{x,y:surfaceY-q.P.h,vx:0,vy:0,ground:1,inv:999});
const surfaces=[...q.D.platforms,...q.D.ledges];
// The closest real standing spot to an interactable, i.e. where a player would press ACT.
function standNear(t){let best=null;for(const [x,y,w] of surfaces)for(let px=x;px<=x+w-42;px+=4){const d=Math.hypot(px+21-t.x,y-48-t.y);if(!best||d<best.d)best={d,px,y}}stand(best.px,best.y);return best.d}

// Cooling Works gate: solid until BOTH valves are turned, then open.
const gate=q.D.gates[0];
const gateSolid=()=>q.solids(clock).some(s=>s.x===gate.x&&s.y===gate.y&&s.w===gate.w);
assert(gateSolid(),'Cooling Works gate is open before any valve is turned');
for(const v of q.D.valves){assert(standNear(v)<120,'valve '+v.id+' is out of ACT range');q.K.interact=1;tick()}
assert.strictEqual(q.state().valves,q.D.valves.length,'not every valve turned');
assert(!gateSolid(),'Cooling Works gate stayed shut after both valves');

// The lift refuses to finish until all three shutters are open.
const deck=q.D.platforms.find(p=>p[1]===q.D.exit.y&&q.D.exit.x>=p[0]&&q.D.exit.x<=p[0]+p[2]);
assert(deck,'no lift deck under the exit');
stand(q.D.exit.x-21,deck[1]);tick(2);
assert.strictEqual(q.state().done,0,'level finished before the shutters were open');

// Open each shutter from a real standing spot, the way a player does.
for(const s of q.D.shutters){assert(standNear(s)<120,'shutter '+s.id+' is out of ACT range');q.K.interact=1;tick()}
assert.strictEqual(q.state().shutters,3,'not all shutters opened');

// Standing on the lift deck now finishes the level, anywhere near the exit.
for(const dx of [-100,0,100]){
  q.P.inv=999;stand(q.D.exit.x-21+dx,deck[1]);tick(2);
  if(q.state().done)break;
}
assert.strictEqual(q.state().done,1,'standing on the lift deck with 3 shutters open did not finish Level 2');
console.log(JSON.stringify({gateBlocksUntilValves:true,liftLockedUntilShutters:true,shuttersOpened:3,finished:true}));
