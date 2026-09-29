'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.join(__dirname,'..'),HOOK='resize();reset(1);requestAnimationFrame(frame);';
function boot(opts={}){
  const S={clock:0},noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
  const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},dataset:{},hidden:false,addEventListener:noop,setPointerCapture:noop,getBoundingClientRect:()=>({width:1280,height:720,left:0,top:0}),getContext:()=>ctx,focus:noop,textContent:'',src:'',alt:''});
  const els={},listeners={};
  const sb={console,Math,JSON,URLSearchParams,performance:{now:()=>S.clock*1000},location:{search:opts.search||'?unlocked=1',hostname:opts.host||'localhost'},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop,hidden:false},Image:class{set src(v){this.p=v;this.complete=true;this.naturalWidth=1536;this.naturalHeight=864}get src(){return this.p}},addEventListener:(t,fn)=>(listeners[t]??=[]).push(fn),devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop,ResizeObserver:null};
  sb.window=sb;if(opts.mayhem)sb.Mayhem=opts.mayhem;if(opts.progress)sb.MayhemProgress=opts.progress;vm.createContext(sb);
  for(const f of ['dist/level2-art.js','dist/level7-art.js',opts.data||'dist/level7-data.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
  let src=fs.readFileSync(path.join(ROOT,'dist/level7.js'),'utf8');if(!src.includes(HOOK))throw new Error('Level 7 boot hook missing');
  src=src.replace(HOOK,`resize();reset(1);globalThis.qa={P,K,D,update,draw,reset,start,solids,hurt,interact,deploy,recall,breakLink,finish,powered,medalFor,carried,locked,showStory,
    pack:()=>pack,enemies:()=>enemies,auditors:()=>auditors,moving:()=>moving,target:()=>targetState,sayQ:()=>sayQ,
    state:()=>({running,done,storyOpen,cogs,fragments,charge,checkpoint,ending,linkBreaks,camX,camY}),
    setCP:q=>{checkpoint=q;seen.add(q)},setEnemies:q=>{enemies=q},setCogs:q=>{cogs=q},setFragments:q=>{fragments=q},setRunning:q=>{running=q}};`);
  vm.runInContext(src,sb,{filename:'dist/level7.js'});const q=sb.qa;if(!q)throw new Error('Level 7 engine hook failed');q.S=S;q.els=els;q.start();if(opts.enemies!==true)q.setEnemies([]);
  q.tick=(n,dt,each)=>{for(let i=0;i<n;i++){S.clock+=dt;q.update(dt);if(each&&each(i)===false)return false}return true};q.clear=()=>Object.keys(q.K).forEach(k=>q.K[k]=0);q.place=(px,surfaceY)=>Object.assign(q.P,{x:px,y:surfaceY-q.P.h,vx:0,vy:0,ground:1,inv:999,hang:0,climb:0,support:null,grabCD:0,buffer:0,coyote:0});q.prompt=()=>els.prompt.textContent;q.line=()=>els.line.textContent;return q;
}
module.exports={boot,ROOT};
