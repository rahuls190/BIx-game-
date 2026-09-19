// Player progress, sign-in wiring and cloud-save safety. Runs offline: no Firebase, no network.
// The pieces that need a real Firebase project (the live sign-in, the rules engine) are covered structurally here
// and listed as untested in docs/login-setup.md.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const P=require('../dist/progress.js');
const pending=[];   // async assertions, awaited at the end
let checks=0;const ok=(c,m)=>{assert(c,m);checks++};const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);checks++};

// ---------- sanitize: junk in, valid record out ----------
const E=P.emptyProgress();
for(const junk of [null,undefined,'x',42,[],{},{levels:5},{levels:{level1:'x'}}])eq(P.sanitize(junk),E,'junk should become an empty record: '+JSON.stringify(junk));
const dirty=P.sanitize({v:99,evil:'<script>',updatedAt:-5,levels:{level1:{completed:'yes',bestTimeSec:-3,bestCogs:999,fewestFalls:1.5,plays:-1,extra:1},level9:{completed:true}}});
eq(dirty.levels.level1,{completed:false,bestTimeSec:null,bestCogs:0,fewestFalls:null,plays:0},'out-of-range values must be dropped, not clamped into something plausible');
ok(!('level9' in dirty.levels)&&!('evil' in dirty),'unknown levels and fields must be dropped');
eq(dirty.updatedAt,0,'a negative timestamp must be dropped');
ok(P.sanitize({levels:{level1:{completed:true,bestTimeSec:200,bestCogs:12,fewestFalls:3,plays:2}}}).levels.level1.bestCogs===12,'a valid record must survive');
ok(P.sanitize({levels:{level1:{bestCogs:13}}}).levels.level1.bestCogs===0,'level 1 has 12 cogs, so 13 is invalid');
ok(P.sanitize({levels:{level2:{bestCogs:14}}}).levels.level2.bestCogs===14,'level 2 has 14 cogs');

// ---------- applyResult ----------
let p=P.applyResult(E,'level1',{timeSec:300,cogs:8,falls:5},1000);
eq(p.levels.level1,{completed:true,bestTimeSec:300,bestCogs:8,fewestFalls:5,plays:1},'the first run sets every best');
ok(p.updatedAt===1000,'a result stamps updatedAt');
p=P.applyResult(p,'level1',{timeSec:400,cogs:6,falls:9},2000);
eq(p.levels.level1,{completed:true,bestTimeSec:300,bestCogs:8,fewestFalls:5,plays:2},'a worse run must never lower a best, but still counts as a play');
p=P.applyResult(p,'level1',{timeSec:250,cogs:12,falls:1},3000);
eq(p.levels.level1,{completed:true,bestTimeSec:250,bestCogs:12,fewestFalls:1,plays:3},'a better run improves each best');
for(const bad of [{timeSec:0,cogs:1,falls:0},{timeSec:NaN,cogs:1,falls:0},{timeSec:100,cogs:99,falls:0},{timeSec:100,cogs:1,falls:-2},{timeSec:'abc',cogs:1,falls:0},{timeSec:1e9,cogs:1,falls:0},null])
  eq(P.applyResult(p,'level1',bad,9),p,'a nonsense result must be ignored: '+JSON.stringify(bad));
eq(P.applyResult(p,'level9',{timeSec:100,cogs:1,falls:0},9),p,'an unknown level must be ignored');
ok(P.applyResult(E,'level2',{timeSec:100,cogs:14,falls:0},1).levels.level2.bestCogs===14,'level 2 accepts 14 cogs');
ok(P.applyResult(E,'level1',{timeSec:100.9,cogs:3.7,falls:0.2},1).levels.level1.bestTimeSec===100,'fractions are floored');

// ---------- merge: best of each, order-independent, idempotent ----------
const a=P.applyResult(P.applyResult(E,'level1',{timeSec:300,cogs:8,falls:5},10),'level2',{timeSec:900,cogs:3,falls:20},11);
const b=P.applyResult(P.applyResult(E,'level1',{timeSec:250,cogs:5,falls:8},20),'level2',{timeSec:1200,cogs:14,falls:4},21);
const m=P.merge(a,b);
eq(m.levels.level1,{completed:true,bestTimeSec:250,bestCogs:8,fewestFalls:5,plays:1},'merge keeps the best of each field');
eq(m.levels.level2,{completed:true,bestTimeSec:900,bestCogs:14,fewestFalls:4,plays:1},'merge keeps the best of each field (level 2)');
eq(P.merge(a,b),P.merge(b,a),'merge must not depend on order');
eq(P.merge(a,a),P.sanitize(a),'merging a record with itself changes nothing');
eq(P.merge(a,null),P.sanitize(a),'merging with nothing changes nothing');
eq(P.merge(P.merge(a,b),a),P.merge(a,b),'merging again is stable');
ok(P.same(a,JSON.parse(JSON.stringify(a))),'same() ignores object identity');
ok(!P.same(a,b),'same() tells different records apart');

// ---------- the app object, on a fake device ----------
const fake=()=>{const d={};return {d,getItem:k=>k in d?d[k]:null,setItem:(k,v)=>{d[k]=String(v)}}};
{ // dormant: no config, so no message and nothing shown
  const s=fake(),M=P.makeMayhem(s,null);
  ok(M.configured===false,'no config must mean not configured');
  return_(M.recordResult('level1',{timeSec:200,cogs:5,falls:1}),'','a dormant site must say nothing on the finish screen');
  ok(JSON.parse(s.d[P.KEY]).levels.level1.bestTimeSec===200,'a result is kept on the device even with accounts off');
  const M2=P.makeMayhem(s,null);
  ok(M2.getProgress().levels.level1.bestTimeSec===200,'progress survives a page reload');
}
function return_(promise,expected,msg){pending.push(promise.then(t=>{assert.strictEqual(t,expected,msg+' (got '+JSON.stringify(t)+')');checks++}))}
const CFG={apiKey:'AIzaSyExample123',authDomain:'mayhem-test.firebaseapp.com',projectId:'mayhem-test',appId:'1:123456789:web:abc123'};
{ // configured but signed out: tells the player how to keep it
  const M=P.makeMayhem(fake(),CFG);ok(M.configured===true,'a full config switches accounts on');
  return_(M.recordResult('level1',{timeSec:100,cogs:1,falls:0}),'Saved on this device. Sign in from the home page to keep your progress on every device.','signed-out message');
}
{ // signed in: saved to the account
  const M=P.makeMayhem(fake(),CFG);let saved=null;
  M.setCloud({save:pr=>{saved=pr;return Promise.resolve()}});
  return_(M.recordResult('level2',{timeSec:500,cogs:14,falls:2}),'Saved to your account.','signed-in message');
  pending.push(Promise.resolve().then(()=>{ok(saved&&saved.levels.level2.bestCogs===14,'the cloud receives the sanitized record')}));
}
{ // cloud down: the run is still kept, and the player is told
  const M=P.makeMayhem(fake(),CFG);M.setCloud({save:()=>Promise.reject(new Error('offline'))});
  return_(M.recordResult('level1',{timeSec:100,cogs:1,falls:0}),'Saved on this device. Could not reach your account just now.','cloud failure message');
  ok(M.getProgress().levels.level1.completed,'a cloud failure must not lose the run');
}
{ // sign-in merges what the guest earned with what the cloud has, and reports the merge
  const M=P.makeMayhem(fake(),CFG);M.recordResult('level1',{timeSec:300,cogs:4,falls:6});
  const merged=M.mergeIn(P.applyResult(E,'level1',{timeSec:280,cogs:2,falls:9},5));
  eq(merged.levels.level1,{completed:true,bestTimeSec:280,bestCogs:4,fewestFalls:6,plays:1},'signing in keeps the best of guest and cloud');
  ok(P.same(M.getProgress(),merged),'the merged record is what the device now holds');
  const hostile=M.mergeIn({levels:{level1:{completed:true,bestTimeSec:-1,bestCogs:9999,fewestFalls:-5,plays:1e12}}});
  ok(hostile.levels.level1.bestCogs===4&&hostile.levels.level1.bestTimeSec===280,'a hostile cloud record cannot corrupt the device copy');
}
{ // storage that throws, or holds garbage, must not break the game
  const bad={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}};
  const M=P.makeMayhem(bad,null);M.recordResult('level1',{timeSec:100,cogs:1,falls:0});
  ok(M.getProgress().levels.level1.completed,'progress still works in memory when storage is blocked');
  const junk=fake();junk.d[P.KEY]='{not json';
  eq(P.makeMayhem(junk,null).getProgress(),E,'corrupt stored data starts a fresh record instead of crashing');
}
{ // subscribers: called at once, on change, and one bad subscriber cannot stop the rest
  const M=P.makeMayhem(fake(),CFG);const seen=[];
  M.subscribe(()=>{throw new Error('bad listener')});
  const off=M.subscribe(s=>seen.push(s.user&&s.user.name));
  M.setUser({uid:'u',name:'Rahul'});off();M.setUser(null);
  eq(seen,[null,'Rahul'],'listeners get the current state, then each change until they unsubscribe');
}

// ---------- isConfigured refuses placeholders ----------
for(const c of [null,undefined,{},'x',{apiKey:'YOUR_API_KEY',authDomain:'a.b',projectId:'p',appId:'1:2:web:3'},{apiKey:'PASTE_HERE',authDomain:'a.b',projectId:'p',appId:'a1b2c3'},{apiKey:'AIzaSyOK',authDomain:'a.b',projectId:'p'}])
  ok(!P.isConfigured(c),'a placeholder or partial config must not switch accounts on: '+JSON.stringify(c));
ok(P.isConfigured(CFG),'a complete config switches accounts on');

// ---------- the committed config is dormant or complete, and never holds a private key ----------
{
  const sb={window:{}};vm.createContext(sb);
  const src=fs.readFileSync('dist/firebase-config.js','utf8');
  vm.runInContext(src,sb);
  const c=sb.window.MAYHEM_FIREBASE;
  ok(c===null||P.isConfigured(c),'firebase-config.js must be null (off) or a complete web config, not something half-pasted');
  ok(!/private_key|client_secret|service[_-]?account|BEGIN (RSA )?PRIVATE/i.test(src.replace(/\/\*[\s\S]*?\*\//,'')),'firebase-config.js appears to contain a secret; a Firebase web config is public, a private key must never go in this repo');
}

// ---------- firestore.rules: locked to the owner, and limits match the code ----------
{
  const r=fs.readFileSync('firestore.rules','utf8');
  ok(/allow read, delete: if isOwner\(uid\)/.test(r),'reads and deletes must be owner-only');
  ok(/allow create, update: if isOwner\(uid\)/.test(r)&&/hasOnly\(\['progress'\]\)/.test(r)&&/validProgress\(request\.resource\.data\.progress\)/.test(r),'writes must be owner-only and validated');
  ok(!/if\s+true/.test(r),'the rules must never say "if true"');
  ok((r.match(/match \/[^{]*\{[^}]*\}/g)||[]).filter(x=>!/databases|players/.test(x)).length===0,'the rules must not open any collection besides players/{uid}');
  for(const [id,cfg] of Object.entries(P.LEVELS)){
    const m=r.match(new RegExp('validLevel\\(p\\.levels\\.'+id+',\\s*(\\d+)\\)'));
    ok(m&&Number(m[1])===cfg.cogs,`the rules allow ${m&&m[1]} cogs for ${id} but progress.js says ${cfg.cogs}`);
  }
  ok(/bestTimeSec <= 86399/.test(r)&&/fewestFalls <= 9999/.test(r)&&/plays <= 1000000/.test(r),'the rules limits must match progress.js (time 86399, falls 9999, plays 1000000)');
  ok(/hasOnly\(\['completed', 'bestTimeSec', 'bestCogs', 'fewestFalls', 'plays'\]\)/.test(r),'the rules must list exactly the fields progress.js writes');
}

// ---------- pages load things in a safe order, and the widget is hidden until accounts are on ----------
{
  const idx=(h,s)=>h.indexOf(s);
  for(const page of ['index.html','level1.html','level2.html']){
    const h=fs.readFileSync('dist/'+page,'utf8');
    const cfg=idx(h,'firebase-config.js'),prog=idx(h,'progress.js'),auth=idx(h,'auth.js');
    ok(cfg>0&&prog>cfg&&auth>prog,page+': scripts must load config, then progress, then auth');
    ok(/auth\.js"\s+defer/.test(h),page+': auth.js must be deferred so it never delays the game');
  }
  const land=fs.readFileSync('dist/index.html','utf8');
  ok(/id="account"[^>]*\bhidden\b/.test(land),'the account widget must be hidden by default');
  ok(/id="privacy"[^>]*\bhidden\b/.test(land)&&/Firebase/.test(land),'the privacy line must exist, be hidden until accounts are on, and name Firebase');
  ok(!/no name, email or photo/i.test(land),'the privacy line must not claim that no name or email is stored');
  const ui=fs.readFileSync('dist/account-ui.js','utf8');
  const code=ui.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');   // judge the code, not what its comments say
  ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(code),'account-ui.js must set text with textContent only');
  ok(/import\(SDK/.test(fs.readFileSync('dist/auth.js','utf8'))&&!/^\s*import\s/m.test(fs.readFileSync('dist/auth.js','utf8')),'Firebase must load on demand (dynamic import), never at page load');
}

// ---------- the games hand their runs to progress.js ----------
ok(/saveResult\('level1',sec,cogs,P\.falls\)/.test(fs.readFileSync('dist/game.js','utf8')),'Level 1 does not record its result');
{ // Level 2, run through the real engine with a recording Mayhem
  let clock=0;const noop=()=>{};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
  const el=()=>({classList:{add:noop,remove:noop,toggle:noop},style:{},dataset:{},addEventListener:noop,setPointerCapture:noop,getBoundingClientRect:()=>({width:1280,height:720,left:0,top:0}),getContext:()=>ctx,focus:noop,textContent:'',hidden:true});
  const els={},calls=[];
  const sb={console,Math,JSON,performance:{now:()=>clock*1000},document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener:noop},
    Image:class{set src(v){this.p=v;this.complete=true;this.naturalWidth=100;this.naturalHeight=100}get src(){return this.p}},
    addEventListener:noop,devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:noop,ResizeObserver:null};
  sb.window=sb;sb.Mayhem={recordResult:(l,r)=>{calls.push([l,r]);return Promise.resolve('Saved to your account.')}};
  vm.createContext(sb);
  for(const f of ['dist/level2-art.js','dist/level2-data.js','dist/level2-enemies.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sb);
  const hook='resize();reset(1);requestAnimationFrame(frame);';
  let src=fs.readFileSync('dist/level2.js','utf8');assert(src.includes(hook),'boot hook missing');
  src=src.replace(hook,'resize();reset(1);globalThis.qa={D,update,start,P,finish:()=>finish(),shutters:()=>0};');
  vm.runInContext(src,sb);const q=sb.qa;q.start();
  clock=125;              // two minutes and five seconds after the run started
  q.P.falls=3;q.finish();
  ok(calls.length===1&&calls[0][0]==='level2','finishing Level 2 must record exactly one result for level2');
  eq(JSON.parse(JSON.stringify(calls[0][1])),{timeSec:125,cogs:0,falls:3},'the recorded run must carry the real time, cogs and falls');
  pending.push(Promise.resolve().then(()=>{ok(els.saveNote.textContent==='Saved to your account.'&&els.saveNote.hidden===false,'the finish screen must show where the run was saved')}));
}

Promise.all(pending).then(()=>console.log(JSON.stringify({checks}))).catch(e=>{console.error(e);process.exit(1)});
