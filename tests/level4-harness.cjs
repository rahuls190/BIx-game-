/* Shared loader for the Level 4 tests: boots the REAL dist/level4.js against the REAL data in a Node vm sandbox, with a fake canvas and a
   controllable clock, and returns a hook (`qa`) into the engine. Same idea as tests/level3-harness.cjs. Not a test itself. */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const HOOK = 'resize();reset(1);requestAnimationFrame(frame);';

function boot(opts = {}) {
  const S = { clock: 0 }, noop = () => {};
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
    { get: (o, k) => o[k] || noop });
  const el = id => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {},
    addEventListener: noop, setPointerCapture: noop, getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }), getContext: () => ctx, focus: noop, textContent: '' });
  const els = {}, listeners = {};
  const sb = { console, Math, JSON, URLSearchParams, performance: { now: () => S.clock * 1000 },
    location: { search: opts.search || '', hostname: opts.host },
    document: { getElementById: id => els[id] ??= el(id), querySelectorAll: () => [], addEventListener: noop, hidden: false },
    Image: class { set src(v) { this.p = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100 } get src() { return this.p } },
    addEventListener: (t, fn) => { (listeners[t] ??= []).push(fn) }, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop, ResizeObserver: null };
  sb.window = sb; vm.createContext(sb);
  if (opts.mayhem) sb.Mayhem = opts.mayhem;
  if (opts.progress) sb.MayhemProgress = opts.progress;
  for (const f of ['dist/level2-art.js', 'dist/level2-enemies.js', 'dist/level3-glove.js', 'dist/level4-core.js', opts.data || 'dist/level4-data.js'])
    vm.runInContext(fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'), sb, { filename: f });
  let src = fs.readFileSync(path.join(ROOT, 'dist/level4.js'), 'utf8');
  if (!src.includes(HOOK)) throw new Error('boot hook string not found in dist/level4.js');
  src = src.replace(HOOK, `resize();reset(1);globalThis.qa={P,K,D,GL,CO,update,draw,reset,start,solids,seen,pressState,phaseOn,hurt,pickUp,setDown,throwCore,placeCoreBeside,interact,finish,seatCore,
    G:()=>G,core:()=>core,open:()=>open,lit:()=>lit,stamps:()=>stamps,enemies:()=>enemies,pending:()=>pending,sayQ:()=>sayQ,told:()=>told,gateAnim:()=>gateAnim,
    state:()=>({done,cogs,slips,charge,ending,camX,camY,checkpoint,running,coreDrops,deskDone,tellX,lastMode}),carried,locked,medalFor,
    setCP:c=>{checkpoint=c;seen.add(c)},setEnemies:v=>{enemies=v},setCogs:v=>{cogs=v},setDeskDone:v=>{deskDone=v}};`);
  vm.runInContext(src, sb, { filename: 'dist/level4.js' });
  const q = sb.qa;
  if (!q) throw new Error('engine did not expose its test hook');
  q.S = S; q.els = els; q.start();
  if (opts.enemies !== true) q.setEnemies([]);                    // the geometry tests measure the platforms, not the hazards
  q.tick = (n, dt, each) => { for (let i = 0; i < n; i++) { S.clock += dt; q.update(dt); if (each && each(i) === false) return false } return true };
  q.clear = () => Object.keys(q.K).forEach(k => q.K[k] = 0);
  q.place = (px, surfaceY) => Object.assign(q.P, { x: px, y: surfaceY - q.P.h, vx: 0, vy: 0, ground: 1, inv: 999, hang: 0, climb: 0, support: null, grabCD: 0, buffer: 0, coyote: 0 });
  q.line = () => q.els.line.textContent;
  q.speaker = () => q.els.speaker.textContent;
  q.fire = (type, ev) => (listeners[type] || []).forEach(fn => fn({ preventDefault() {}, ...ev }));
  return q;
}
module.exports = { boot, ROOT };
