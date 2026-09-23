// Sound (dist/audio.js): every effect builds without throwing, mute and distance work, the scene loop schedules and stops, a browser without
// Web Audio is harmless, and Levels 1 and 2 load the sound file before their game script and call it only through a guard.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
let checks=0;const ok=(c,m)=>{assert(c,m);checks++};
const src=fs.readFileSync('dist/audio.js','utf8');

function mockCtx(){
  const made={osc:0,noise:0,gain:0};
  const param=()=>({value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){this.value=v},cancelScheduledValues(){}});
  const node=(extra={})=>({connect(){},disconnect(){},start(){},stop(){},...extra});
  class AC{
    constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination=node();AC.last=this}
    createGain(){made.gain++;return node({gain:param()})}
    createOscillator(){made.osc++;return node({frequency:param(),type:''})}
    createBiquadFilter(){return node({frequency:param(),Q:param(),type:''})}
    createDynamicsCompressor(){return node({threshold:param(),ratio:param()})}
    createConvolver(){return node({buffer:null})}
    createWaveShaper(){return node({curve:null})}
    createBuffer(c,l){return{getChannelData:()=>new Float32Array(l)}}
    createBufferSource(){made.noise++;return node({playbackRate:param(),loop:false})}
    resume(){this.state='running';return Promise.resolve()}
    suspend(){this.state='suspended';return Promise.resolve()}
  }
  return{AC,made};
}
// The game ships muted, so every test that is about sound asks for sound; pass {} to test the state a new player arrives in.
function load(withAudio=true,store0={'mayhem.muted':'0'}){
  const {AC,made}=mockCtx(),store={...store0},handlers={},timers=[],gains=[];
  const el=()=>({style:{},children:[],addEventListener(){},setAttribute(){},appendChild(c){this.children.push(c)},blur(){}});
  const sb={console,Math,Float32Array,Promise,setInterval:(f)=>{timers.push(f);return timers.length},clearInterval(){},setTimeout:()=>0,
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
    document:{readyState:'complete',body:el(),createElement:el,addEventListener(t,f){handlers['doc:'+t]=f},hidden:false}};
  sb.window=sb;sb.addEventListener=(t,f)=>{handlers[t]=f};
  if(withAudio)sb.AudioContext=AC;
  vm.createContext(sb);vm.runInContext(src,sb);
  return{sb,A:sb.MayhemAudio,made,store,handlers,timers,AC};
}

// every effect builds sound nodes without throwing
{
  const {A,made,handlers}=load();
  ok(A.names.length>=20,'the sound set has the effects the games use');
  handlers.pointerdown&&handlers.pointerdown();           // the first click unlocks audio
  let n=0;for(const name of A.names){const before=made.osc+made.noise;A.play(name);ok(made.osc+made.noise>before,`${name} makes a sound`);n++}
  ok(n===A.names.length,'all effects played');
}
// the names the games call all exist
{
  const {A}=load();
  const used=new Set();
  for(const f of ['dist/game.js','dist/level2.js'])for(const m of fs.readFileSync(f,'utf8').matchAll(/SFX\('([a-z]+)'/g))used.add(m[1]);
  for(const m of fs.readFileSync('dist/game.js','utf8').matchAll(/SFX\(s==='PACK'\?'(\w+)':s==='BIX'\?'(\w+)':s==='VELA'\?'(\w+)':'(\w+)'/g))m.slice(1).forEach(x=>used.add(x));
  ok(used.size>=15,'the games ask for a good number of sounds ('+used.size+')');
  for(const n of used)ok(A.names.includes(n),`the games call SFX('${n}') but audio.js has no such sound`);
}
// mute silences everything and is remembered; the M key toggles it
{
  const fresh=load(true,{});fresh.handlers.pointerdown();
  fresh.A.play('jump');ok(fresh.made.osc===0,'a player who has never chosen hears nothing: the game starts muted');
  const {A,made,store,handlers}=load(true,{'mayhem.muted':'0'});handlers.pointerdown();
  A.play('jump');const a=made.osc;ok(a>0,'a sound plays once the player turns it on');
  ok(A.toggleMute()===true&&A.isMuted()&&store['mayhem.muted']==='1','mute is switched on and remembered');
  A.play('jump');ok(made.osc===a,'a muted sound makes no nodes');
  handlers.keydown({code:'KeyM'});ok(!A.isMuted()&&store['mayhem.muted']==='0','the M key switches it back');
}
// a remembered mute is honoured on load
{
  const {A,made,handlers}=load(true,{'mayhem.muted':'1'});handlers.pointerdown();
  ok(A.isMuted(),'a saved mute is restored');A.play('jump');ok(made.osc===0,'and nothing plays');
}
// distance: near is louder than far, and very far is skipped
{
  const {A,made,handlers}=load();handlers.pointerdown();
  const n0=made.osc;A.play('blast',{d:2000});ok(made.osc===n0,'a sound 2000 px away is skipped');
  A.play('blast',{d:100});ok(made.osc>n0,'the same sound nearby plays');
}
// rapid repeats are thinned (footsteps, blips), but a later one plays
{
  const {A,made,handlers,AC}=load();handlers.pointerdown();
  A.play('step');const a=made.noise;A.play('step');ok(made.noise===a,'two footsteps in the same instant play once');
  AC.last.currentTime+=0.5;A.play('step');ok(made.noise>a,'a footstep half a second later plays');
}
// scenes start a bed and a scheduler, and stop cleanly
{
  const {A,made,timers,handlers,AC}=load();handlers.pointerdown();
  A.scene('facility');ok(timers.length===1&&made.osc>=6,'the facility scene starts detuned drones and a scheduler');
  AC.last.currentTime+=2;timers[0]();ok(made.osc>3,'the scheduler adds notes');
  A.scene('furnace');A.scene(null);A.scene('nonsense');ok(true,'switching and stopping scenes is safe');
}
// no Web Audio: everything is a harmless no-op
{
  const {A}=load(false);
  A.unlock();A.play('jump');A.scene('facility');A.scene(null);ok(typeof A.toggleMute()==='boolean','without Web Audio the calls do nothing and do not throw');
}
// volume: effects and music are separate, clamped, remembered, and applied to the right buses; the panel and the [ ] keys drive them
{
  const {A,handlers,store,AC}=load();handlers.pointerdown();
  ok(A.getVolume().sfx===1&&A.getVolume().music===0.7,'default volumes: effects full, music 70%');
  A.setVolume('sfx',0.4);A.setVolume('music',0.2);
  ok(A.getVolume().sfx===0.4&&A.getVolume().music===0.2,'volumes are set');
  ok(JSON.parse(store['mayhem.volume']).sfx===0.4&&JSON.parse(store['mayhem.volume']).music===0.2,'and remembered on the device');
  A.setVolume('sfx',5);A.setVolume('music',-3);ok(A.getVolume().sfx===1&&A.getVolume().music===0,'out-of-range values are clamped');
  A.setVolume('bogus',0.5);ok(A.getVolume().sfx===1,'an unknown kind is ignored');
  A.setVolume('sfx','junk');ok(A.getVolume().sfx===0,'junk counts as silence rather than breaking anything');
  handlers.keydown({code:'BracketRight'});ok(Math.abs(A.getVolume().sfx-0.1)<1e-9,'] raises the effects volume by 10%');
  handlers.keydown({code:'BracketLeft'});handlers.keydown({code:'BracketLeft'});ok(A.getVolume().sfx===0,'[ lowers it and stops at zero');
  A.toggleMute();ok(A.isMuted(),'muted');A.setVolume('music',0.5);ok(!A.isMuted(),'raising a volume while muted turns the sound back on');
  // a saved volume is honoured on load; junk in storage is ignored
  const b=load(true,{'mayhem.volume':JSON.stringify({sfx:0.25,music:0.9})});ok(b.A.getVolume().sfx===0.25&&b.A.getVolume().music===0.9,'saved volumes are restored');
  const c=load(true,{'mayhem.volume':'{not json'});ok(c.A.getVolume().sfx===1,'corrupt saved volumes fall back to the defaults');
  const d=load(true,{'mayhem.volume':JSON.stringify({sfx:'x',music:7})});ok(d.A.getVolume().sfx===0&&d.A.getVolume().music===1,'and odd values are clamped');
  void AC;
}
// recorded samples: every file the engine asks for exists; they are trimmed, levelled and played instead of the synth; a missing one falls back
{
  const asked=[...src.matchAll(/f: \[([^\]]*)\]/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
  ok(asked.length>=10,'the engine asks for the recordings ('+asked.length+')');
  for(const f of asked)ok(fs.existsSync('dist/sfx/'+f+'.mp3')&&fs.statSync('dist/sfx/'+f+'.mp3').size>2000,`dist/sfx/${f}.mp3 is missing or empty`);
  ok(fs.readdirSync('dist/sfx').every(f=>asked.includes(f.replace('.mp3',''))),'every file in dist/sfx is used');

  const starts=[];
  function withSamples(missing){
    const {AC,made}=mockCtx();
    const sr=8000,data=new Float32Array(sr*2);for(let i=0;i<sr*0.5;i++)data[i]=0.001;            // half a second of near-silence, then a hit, then a long quiet tail
    for(let i=sr*0.5;i<sr*0.6;i++)data[i]=0.2*(i%2?1:-1);for(let i=sr*0.6;i<data.length;i++)data[i]=0.0005;
    const orig=AC.prototype.createBufferSource;
    AC.prototype.createBufferSource=function(){const n=orig.call(this);n.start=(...a)=>starts.push(a);n.stop=()=>{};return n};
    AC.prototype.decodeAudioData=function(ab,res){res({sampleRate:sr,duration:2,getChannelData:()=>data})};
    const store={},handlers={},el=()=>({style:{},addEventListener(){},setAttribute(){},appendChild(){},blur(){}});
    const sb={console,Math,Float32Array,Promise,setInterval(){return 1},clearInterval(){},setTimeout:()=>0,localStorage:{getItem:k=>k==='mayhem.muted'?'0':null,setItem(){}},   // this block is about the recordings, so it asks for sound
      fetch:u=>missing&&/jump/.test(u)?Promise.resolve({ok:false,status:404}):Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(8))}),
      document:{readyState:'complete',body:el(),createElement:el,addEventListener(){},hidden:false,currentScript:{src:'http://x/y/audio.js?v=3'}}};
    sb.window=sb;sb.addEventListener=(t,f)=>{handlers[t]=f};sb.AudioContext=AC;vm.createContext(sb);vm.runInContext(src,sb);
    return{A:sb.MayhemAudio,made,handlers};
  }
  (async()=>{
    const {A,made,handlers}=withSamples(false);handlers.pointerdown();
    await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
    ok(A.sampled().includes('jump')&&A.sampled().includes('cog')&&A.sampled().length>=10,'the recordings load: '+A.sampled().length);
    starts.length=0;const oscBefore=made.osc;A.play('land');
    ok(starts.length===1&&made.osc===oscBefore,'an action with a recording plays it, not the synth');
    ok(Math.abs(starts[0][1]-0.492)<0.02,'the silence before the hit is trimmed (starts at '+starts[0][1].toFixed(3)+' s)');
    ok(starts[0][2]<0.4,'and the long quiet tail is cut (plays '+starts[0][2].toFixed(2)+' s)');
    A.play('ui');ok(made.osc>oscBefore,'an action with no recording still plays the synth');
    const m=withSamples(true);m.handlers.pointerdown();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
    ok(!m.A.sampled().includes('jump')&&m.A.sampled().includes('land'),'a recording that fails to load is skipped');
    const o2=m.made.osc;m.A.play('jump');ok(m.made.osc>o2,'and its action falls back to the synth');
      })().catch(e=>{console.error(e);process.exit(1)});
}
// wiring in the pages
for(const [page,game] of [['level1.html','game.js'],['level2.html','level2.js']]){
  const h=fs.readFileSync('dist/'+page,'utf8'),a=h.indexOf('audio.js'),g=h.indexOf(game);
  ok(a>0&&g>a,`${page} loads audio.js before ${game}`);
}
for(const f of ['dist/game.js','dist/level2.js']){
  const s=fs.readFileSync(f,'utf8');
  ok(/window\.MayhemAudio&&window\.MayhemAudio\.play/.test(s),`${f} reaches the sound only through a guard`);
  ok(!/[^.]MayhemAudio\.play\(/.test(s.replace(/window\.MayhemAudio&&window\.MayhemAudio\.play/g,'')),`${f} has an unguarded call to the sound engine`);
}
console.log(JSON.stringify({checks}));
