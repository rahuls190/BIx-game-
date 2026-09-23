/* Levels 1 and 2 under random input, at every frame rate the loop can hand them. The later levels each have a fuzz run in their
   own suite; these two are the oldest engines and had none, so nothing was watching for a value going NaN, a flag sticking, or the
   player leaving the world. Run from the repo root: node tests/level1-2-fuzz.cjs */
'use strict';
const assert = require('assert');
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const HOOK = 'resize();reset(1);requestAnimationFrame(frame);';
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };

// Level 1 has no harness of its own; this is the same vm sandbox the other levels use, with a clock the test drives.
function bootLevel1() {
  const S = { clock: 0 }, noop = () => {};
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
    { get: (o, k) => o[k] || noop });
  const el = () => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {}, addEventListener: noop,
    setPointerCapture: noop, querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }),
    getContext: () => ctx, focus: noop, textContent: '', onclick: null });
  const els = {};
  const sb = { console, Math, JSON, performance: { now: () => S.clock * 1000 },
    document: { getElementById: id => els[id] ??= el(), querySelectorAll: () => [], addEventListener: noop, hidden: false },
    Image: class { set src(v) { this.p = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100 } get src() { return this.p } },
    addEventListener: noop, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop, ResizeObserver: null };
  sb.window = sb; vm.createContext(sb);
  let src = fs.readFileSync(path.join(ROOT, 'dist/game.js'), 'utf8');
  if (!src.includes(HOOK)) throw new Error('boot hook string not found in dist/game.js');
  src = src.replace(HOOK, `resize();reset(1);globalThis.qa={P,K,update,reset,start,
    state:()=>({cam,cogs,breakers,power,chase,done,running})};`);
  vm.runInContext(src, sb, { filename: 'dist/game.js' });
  const q = sb.qa;
  if (!q) throw new Error('engine did not expose its test hook');
  q.S = S; q.start();
  q.clear = () => Object.keys(q.K).forEach(k => q.K[k] = 0);
  return q;
}

const { boot: bootLevel2 } = require('./level2-route.cjs');
const DTS = [1 / 30, 1 / 60, 1 / 120, 1 / 240];
const finite = v => typeof v === 'number' && Number.isFinite(v);

function fuzz(name, q, world) {
  let seed = 20260923;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let run = 0; run < 16; run++) {
    const dt = DTS[run % DTS.length];
    q.reset(1);
    q.clear();
    for (let i = 0; i < Math.round(40 / dt); i++) {
      if (i % Math.round(0.2 / dt) === 0) {                       // change what is held about five times a second
        q.clear();
        q.K.right = rnd() < .7 ? 1 : 0;
        q.K.left = rnd() < .2 ? 1 : 0;
        q.K.down = rnd() < .15 ? 1 : 0;
        if (rnd() < .45) { q.K.jump = 1; q.P.buffer = .16 }
        q.K.interact = rnd() < .25 ? 1 : 0;
      }
      q.S.clock += dt;
      q.update(dt);
      const P = q.P;
      if (!finite(P.x) || !finite(P.y) || !finite(P.vx) || !finite(P.vy))
        throw new Error(`${name}: run ${run} (dt 1/${Math.round(1 / dt)}) went non-finite at frame ${i}: ${JSON.stringify({ x: P.x, y: P.y, vx: P.vx, vy: P.vy })}`);
      const s = q.state();
      for (const [k, v] of Object.entries(s))
        if (typeof v === 'number' && !Number.isFinite(v))
          throw new Error(`${name}: run ${run} left ${k} non-finite at frame ${i}`);
      if (P.x < -400 || P.x > world + 400)
        throw new Error(`${name}: run ${run} left the world at frame ${i}, x=${Math.round(P.x)}`);
    }
    checks++;
  }
  ok(finite(q.P.x) && finite(q.P.y), `${name} is still sane after sixteen random runs`);
}

fuzz('level 1', bootLevel1(), 18100);
fuzz('level 2', (() => { const q = bootLevel2(); q.reset(1); return q })(), 24000);

// and a death does not carry anything into the next life
for (const [name, q] of [['level 1', bootLevel1()], ['level 2', bootLevel2()]]) {
  Object.assign(q.P, { vx: 620, vy: -940, ground: 0, hang: 1, climb: 1 });
  q.reset(0);
  ok(q.P.vx === 0 && q.P.vy === 0, `${name}: a respawn clears the velocity it died with`);
  ok(!q.P.hang && !q.P.climb, `${name}: a respawn clears the hang and climb it died in`);
  ok(finite(q.P.x) && finite(q.P.y), `${name}: a respawn puts him at a real position`);
}
console.log(JSON.stringify({ checks }));
