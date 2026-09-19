// Level 2 camera framing: on a narrow (phone-portrait) screen Bix must sit in the LEFT
// part of the view so the level ahead is visible; on a wide screen he sits at ~42%.
// Runs the real engine on the real level data at both viewport sizes.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{};
function boot(width,height){
  let clock=0;
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
  const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},dataset:{},addEventListener:noop,setPointerCapture:noop,
    getBoundingClientRect:()=>({width,height,left:0,top:0}),getContext:()=>ctx,focus:noop,textContent:''});
  const els={};
  const sb={console,Math,JSON,performance:{now:()=>clock*1000},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop},
    Image:class{set src(v){this.p=v;this.complete=true;this.naturalWidth=100;this.naturalHeight=100}get src(){return this.p}},
    addEventListener:noop,devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop,ResizeObserver:null};
  sb.window=sb;vm.createContext(sb);
  for(const f of ['dist/level2-art.js','dist/level2-data.js','dist/level2-enemies.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sb);
  const hook='resize();reset(1);requestAnimationFrame(frame);';
  let src=fs.readFileSync('dist/level2.js','utf8');assert(src.includes(hook),'boot hook missing from level2.js');
  src=src.replace(hook,'resize();reset(1);globalThis.qa={P,K,D,update,start,reset,view:()=>({viewW,camX})};');
  vm.runInContext(src,sb);
  const q=sb.qa;q.start();
  return {q,tick:n=>{for(let i=0;i<n;i++){clock+=1/120;q.update(1/120)}}};
}
// Where Bix ends up across the screen (0 = left edge, 1 = right edge) once the camera settles,
// standing on a real platform well away from the world's edges.
function settle(width,height){
  const {q,tick}=boot(width,height);
  const p=q.D.platforms.find(p=>p[0]>4000&&p[0]<9000&&p[2]>=250);
  assert(p,'no mid-level platform to stand on');
  Object.assign(q.P,{x:p[0]+100,y:p[1]-q.P.h,vx:0,vy:0,ground:1,inv:999});
  tick(600);
  const {viewW,camX}=q.view();
  return {viewW:Math.round(viewW),frac:(q.P.x-camX)/viewW};
}
// Running: a treadmill high above the level (nothing to collide with) holds Bix at constant
// speed, so this measures the camera alone, not platforms and gaps.
function run(width,height,dir){
  const {q,tick}=boot(width,height);
  const sky=-3000;
  Object.assign(q.P,{x:dir>0?1000:9000,y:sky,vx:0,vy:0,inv:999});
  q.K[dir>0?'right':'left']=1;
  for(let i=0;i<600;i++){q.P.y=sky;q.P.vy=0;tick(1)}
  const {viewW,camX}=q.view();
  return {viewW:Math.round(viewW),frac:(q.P.x-camX)/viewW,speed:Math.abs(q.P.vx)};
}
const phone=settle(375,812), desktop=settle(1280,720);
const runR=run(375,812,1), runL=run(375,812,-1), runDesk=run(1280,720,1);
assert(phone.viewW<700,'phone viewport should be narrow, got '+phone.viewW);
assert(phone.frac>0.15&&phone.frac<0.32,`on a phone Bix should sit left of centre, at ${(phone.frac*100).toFixed(0)}%`);
assert(desktop.frac>0.36&&desktop.frac<0.48,`on desktop Bix should sit near 42%, at ${(desktop.frac*100).toFixed(0)}%`);
assert(runR.speed>250,'treadmill did not reach running speed: '+runR.speed);
assert(runR.frac<0.22,`running right on a phone Bix should hug the left, at ${(runR.frac*100).toFixed(0)}%`);
assert(runR.frac<phone.frac,'Bix should sit further left running than standing');
assert(runL.frac>0.42&&runL.frac<0.7,`running left on a phone Bix should swing across, at ${(runL.frac*100).toFixed(0)}%`);
assert(runDesk.frac>0.3&&runDesk.frac<0.62,`desktop framing should be unchanged while running, at ${(runDesk.frac*100).toFixed(0)}%`);
console.log(JSON.stringify({phone:{viewW:phone.viewW,bixAt:Math.round(phone.frac*100)+'%'},desktop:{viewW:desktop.viewW,bixAt:Math.round(desktop.frac*100)+'%'},runningRight:Math.round(runR.frac*100)+'%',runningLeft:Math.round(runL.frac*100)+'%',desktopRunning:Math.round(runDesk.frac*100)+'%'}));
