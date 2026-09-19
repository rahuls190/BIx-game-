// Level 2 platform art must never be visibly stretched.
// Every drawImage of the platform atlas is checked: the on-screen aspect ratio must stay
// close to the source crop's. The old renderer smeared a 126px strip across 900px platforms
// (a 7x stretch) and squashed ledges to 46% height.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{};let clock=0;const calls=[];
const ctx=new Proxy({
  drawImage(im,...a){if(a.length===8&&/furnace-platform-atlas/.test(im.src)){const [sx,sy,sw,sh,dx,dy,dw,dh]=a;calls.push({sw,sh,dw,dh})}},
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
src=src.replace(hook,'resize();reset(1);globalThis.qa={D,start,draw};');
vm.runInContext(src,sb);const q=sb.qa;q.start();
clock=5;q.draw();

const expected=q.D.platforms.length+q.D.ledges.length;
assert(calls.length>=expected,`expected at least ${expected} platform draws, saw ${calls.length}`);
let worst=1,worstLow=1;
for(const c of calls){
  const stretch=(c.dw/c.dh)/(c.sw/c.sh);          // 1.0 = drawn at the art's true proportions
  worst=Math.max(worst,stretch);worstLow=Math.min(worstLow,stretch);
  assert(stretch>0.6&&stretch<1.6,`platform art drawn ${stretch.toFixed(2)}x its true width:height (src ${c.sw}x${c.sh} -> ${c.dw.toFixed(0)}x${c.dh.toFixed(0)})`);
}
console.log(JSON.stringify({platformDraws:calls.length,widestStretch:+worst.toFixed(2),narrowestSquash:+worstLow.toFixed(2)}));
