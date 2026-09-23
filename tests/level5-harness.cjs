/* Shared loader for the Level 5 tests: boots the REAL dist/level5.js against the REAL data in a Node vm sandbox, with a fake canvas
   and a controllable clock, and returns a hook (`qa`) into the engine. Same idea as tests/level6-harness.cjs. Not a test itself.

   Level 5 keeps its own clock in `now` and advances it inside update(), so a test drives it by calling q.update(dt) and reading
   q.now. q.place() puts Bix on a surface with P.inv high so he can be positioned without dying on the way; any test that measures
   whether something is dangerous must set q.P.inv = 0 first. */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const HOOK = 'function loop(t){';

function boot(opts = {}) {
  const noop = () => {};
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
    { get: (o, k) => o[k] || noop });
  const el = () => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {},
    addEventListener: noop, setPointerCapture: noop, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }),
    getContext: () => ctx, focus: noop, textContent: '', onclick: null });
  const els = {}, listeners = {};
  const sb = { console, Math, JSON, URL, URLSearchParams, performance: { now: () => 0 },
    location: { search: opts.search || '', hostname: opts.host || '', href: 'http://localhost/level5.html' + (opts.search || '') },
    document: { getElementById: id => els[id] ??= el(), querySelectorAll: () => [], addEventListener: noop, hidden: false },
    Image: class { set src(v) { this.p = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100 } get src() { return this.p } },
    addEventListener: (t, fn) => { (listeners[t] ??= []).push(fn) }, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop };
  sb.window = sb; vm.createContext(sb);
  if (opts.progress) sb.MayhemProgress = opts.progress;
  for (const f of ['dist/level2-art.js', opts.data || 'dist/level5-data.js']) {
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)) continue;
    vm.runInContext(fs.readFileSync(full, 'utf8'), sb, { filename: f });
  }
  let src = fs.readFileSync(path.join(ROOT, 'dist/level5.js'), 'utf8');
  if (!src.includes(HOOK)) throw new Error('boot hook string not found in dist/level5.js');
  src = src.replace(HOOK, `globalThis.qa={key,touch,D,update,draw,reset,start,moverRect,platList,gateBox,switchOn,respawn,
    get P(){return P},get now(){return now},set now(v){now=v},get running(){return running},set running(v){running=v},
    get done(){return done},get falls(){return falls},set falls(v){falls=v},get cogs(){return cogs},get canAct(){return canAct},
    get switches(){return switches},get activeCP(){return activeCP},set activeCP(v){activeCP=v},
    get cpIndex(){return cpIndex},set cpIndex(v){cpIndex=v},set jumpBuf(v){jumpBuf=v},get jumpBuf(){return jumpBuf},
    set drones(v){drones=v},set stalkers(v){stalkers=v},set sentinels(v){sentinels=v},get chaseLive(){return chaseLive},set chaseLive(v){chaseLive=v}};` + HOOK);
  vm.runInContext(src, sb, { filename: 'dist/level5.js' });
  const q = sb.qa;
  if (!q) throw new Error('engine did not expose its test hook');
  q.els = els;
  q.start(); q.running = 1;
  if (opts.enemies !== true) { q.drones = []; q.stalkers = []; q.sentinels = [] }   // the geometry tests measure the platforms, not the patrols
  q.tick = (n, dt, each) => { for (let i = 0; i < n; i++) { q.update(dt); if (each && each(i) === false) return false } return true };
  q.clear = () => { Object.keys(q.key).forEach(k => q.key[k] = 0); Object.keys(q.touch).forEach(k => q.touch[k] = 0) };
  q.place = (px, surfaceY) => Object.assign(q.P, { x: px, y: surfaceY - q.P.h, vx: 0, vy: 0, ground: 1, inv: 999,
    ride: null, hang: null, climb: null, ladder: null, grabCD: 0 });
  q.act = () => { if (q.canAct) { q.canAct(); return true } return false };   // what pressing E does
  q.line = () => q.els.line.textContent;
  q.prompt = () => q.els.prompt.textContent;
  return q;
}
module.exports = { boot, ROOT };
