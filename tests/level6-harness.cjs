/* Shared loader for the Level 6 tests: boots the REAL dist/level6.js against the REAL data in a Node vm sandbox, with a fake canvas
   and a controllable clock, and returns a hook (`qa`) into the engine. Same idea as tests/level4-harness.cjs. Not a test itself.

   NOTE on invulnerability: q.place() sets P.inv high so a test can position Bix without dying on the way. Any test that measures
   whether something is dangerous must set q.P.inv = 0 first. Level 3's ride tests once passed while the ride was unplayable
   because they forgot this. */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const HOOK = 'resize();reset(1);requestAnimationFrame(frame);';

function boot(opts = {}) {
  const S = { clock: 0 }, noop = () => {};
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
    { get: (o, k) => o[k] || noop });
  const el = () => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {},
    addEventListener: noop, setPointerCapture: noop, getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }),
    getContext: () => ctx, focus: noop, textContent: '' });
  const els = {}, listeners = {};
  const sb = { console, Math, JSON, URLSearchParams, performance: { now: () => S.clock * 1000 },
    location: { search: opts.search || '', hostname: opts.host },
    document: { getElementById: id => els[id] ??= el(), querySelectorAll: () => [], addEventListener: noop, hidden: false },
    Image: class { set src(v) { this.p = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100 } get src() { return this.p } },
    addEventListener: (t, fn) => { (listeners[t] ??= []).push(fn) }, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop, ResizeObserver: null };
  sb.window = sb; vm.createContext(sb);
  if (opts.mayhem) sb.Mayhem = opts.mayhem;
  if (opts.progress) sb.MayhemProgress = opts.progress;
  for (const f of ['dist/level2-art.js', 'dist/level2-enemies.js', 'dist/level6-art.js', opts.data || 'dist/level6-data.js']) {
    const full = path.join(ROOT, f);
    if (/level6-art\.js$/.test(f) && !fs.existsSync(full)) continue;          // the art is optional: the engine falls back to shapes
    vm.runInContext(fs.readFileSync(full, 'utf8'), sb, { filename: f });
  }
  let src = fs.readFileSync(path.join(ROOT, 'dist/level6.js'), 'utf8');
  if (!src.includes(HOOK)) throw new Error('boot hook string not found in dist/level6.js');
  src = src.replace(HOOK, `resize();reset(1);globalThis.qa={P,K,D,update,draw,reset,start,solids,seen,hurt,interact,finish,takePod,setDown,throwPod,burstPod,placePodBeside,startEnding,groundAt,phaseAt,
    pod:()=>pod,boss:()=>boss,hoppers:()=>hoppers,baited:()=>baited,fallen:()=>fallen,enemies:()=>enemies,sayQ:()=>sayQ,told:()=>told,
    state:()=>({done,cogs,slips,charge,ending,camX,camY,checkpoint,running,podDrops,alarmOn,cartBaited,staggered}),carried,locked,medalFor,
    setAlarm:v=>{alarmOn=v},setCart:v=>{cartBaited=v},setCP:c=>{checkpoint=c;seen.add(c)},setEnemies:v=>{enemies=v},setCogs:v=>{cogs=v}};`);
  vm.runInContext(src, sb, { filename: 'dist/level6.js' });
  const q = sb.qa;
  if (!q) throw new Error('engine did not expose its test hook');
  q.S = S; q.els = els; q.start();
  if (opts.enemies !== true) q.setEnemies([]);                                // the geometry tests measure the platforms, not the crawlers
  q.tick = (n, dt, each) => { for (let i = 0; i < n; i++) { S.clock += dt; q.update(dt); if (each && each(i) === false) return false } return true };
  q.clear = () => Object.keys(q.K).forEach(k => q.K[k] = 0);
  q.place = (px, surfaceY) => Object.assign(q.P, { x: px, y: surfaceY - q.P.h, vx: 0, vy: 0, ground: 1, inv: 999, hang: 0, climb: 0, support: null, grabCD: 0, buffer: 0, coyote: 0 });
  q.line = () => q.els.line.textContent;
  q.speaker = () => q.els.speaker.textContent;
  q.prompt = () => q.els.prompt.textContent;
  q.fire = (type, ev) => (listeners[type] || []).forEach(fn => fn({ preventDefault() {}, ...ev }));
  return q;
}
module.exports = { boot, ROOT };
