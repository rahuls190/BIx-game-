// Headless smoke harness for dist/level2.js against tests/level2-smoke-data.js.
// Mirrors the sandbox style of tests/gameplay.cjs. Run from the repo root.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
let clock = 0;
const noop = () => {};
const drawn = [];
const ctx = new Proxy({
  drawImage(im, ...a) {
    assert(im.complete && im.naturalWidth, 'missing image ' + im.src);
    if (a.length === 8) {
      const [sx, sy, sw, sh] = a;
      assert(sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && sx + sw <= im.naturalWidth && sy + sh <= im.naturalHeight,
        `crop outside ${im.src}: ${sx},${sy},${sw},${sh} of ${im.naturalWidth}x${im.naturalHeight}`);
    }
    drawn.push(im.src);
  },
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
}, { get: (o, k) => o[k] || noop });

const el = () => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {},
  addEventListener: noop, setPointerCapture: noop, getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }),
  getContext: () => ctx, focus: noop, textContent: '' });
const els = {};
const sandbox = {
  console, Math, JSON, Date, performance: { now: () => clock * 1000 },
  document: { getElementById: id => els[id] ??= el(), querySelectorAll: () => [], addEventListener: noop, hidden: false },
  Image: class { set src(v) { this.path = v; const b = fs.readFileSync('dist/' + v.replace('./', '')); this.naturalWidth = b.readUInt32BE(16); this.naturalHeight = b.readUInt32BE(20); this.complete = true } get src() { return this.path } },
  addEventListener: noop, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop, ResizeObserver: null,
};
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const f of ['dist/level2-art.js', 'tests/level2-smoke-data.js', 'dist/level2-enemies.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox);

const hook = 'resize();reset(1);requestAnimationFrame(frame);';
let src = fs.readFileSync('dist/level2.js', 'utf8');
assert(src.includes(hook), 'boot hook string not found in level2.js');
src = src.replace(hook, `resize();reset(1);globalThis.qa={P,K,D,EN,update,draw,reset,start,solids,moving,interact,
  state:()=>({running,done,cogs,charge,valves,shutters,cellHeld,cellDone,camX,camY,heat}),
  enemies:()=>enemies,cp:()=>checkpoint};`);
vm.runInContext(src, sandbox);
const q = sandbox.qa;
assert(q, 'engine did not expose its test hook');

const tick = (n = 1, dt = 1 / 120) => { for (let i = 0; i < n; i++) { clock += dt; q.update(dt) } };
const clearKeys = () => Object.keys(q.K).forEach(k => q.K[k] = 0);
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };

q.start();
ok(q.state().running === 1, 'game did not start');

// --- the level boots standing on a real floor -------------------------------
tick(120);
ok(q.P.ground === 1, 'Bix never landed on the start platform');
ok(Math.abs(q.P.y + q.P.h - 610) < 2, 'Bix did not settle on the floor, y=' + q.P.y);

// --- running right actually moves, and the camera follows -------------------
const x0 = q.P.x, cam0 = q.state().camX;
q.K.right = 1; tick(180);
ok(q.P.x > x0 + 150, `running right moved only ${(q.P.x - x0).toFixed(0)}px`);
clearKeys();
// Camera stays pinned at 0 until Bix passes the left margin, then follows and clamps.
ok(cam0 === 0 && q.state().camX === 0, 'camera should stay pinned near the world start');
Object.assign(q.P, { x: 1600, inv: 999 }); tick(120);
ok(q.state().camX > 100, 'camera did not follow once Bix passed the margin');
ok(q.state().camX <= q.D.world.w - 1280 + 1, 'camera scrolled past the world edge');
Object.assign(q.P, { x: 200, inv: 999 }); tick(120);

// --- a held jump clears a real height ---------------------------------------
tick(60);
const groundY = q.P.y; q.P.buffer = .16; q.K.jump = 1;
let peak = q.P.y; for (let i = 0; i < 90; i++) { tick(); peak = Math.min(peak, q.P.y) }
ok(groundY - peak > 140, `held jump only reached ${(groundY - peak).toFixed(0)}px`);
clearKeys(); tick(120);

// --- vertical-area inference respects an explicit flag ----------------------
ok(q.state().heat > 700, 'heat should stay parked in a non-vertical area');

// --- enemies exist, run, and stay non-lethal during their wake tell ---------
q.reset(1); q.start(); clearKeys();      // fresh enemies, so the wake tell is still running
const es = q.enemies();
ok(es.length === 3, 'expected 3 smoke enemies, got ' + es.length);
ok(es.every(e => q.EN.hazard(e) === null), 'an enemy was lethal during its wake tell');
ok(es.every(e => q.EN.tell(e) >= 0), 'an enemy had no tell value');
tick(240);
ok(es.some(e => q.EN.hazard(e) !== null), 'no enemy ever became lethal');

// --- Pack: one charge, spent by PING, restored at a checkpoint --------------
ok(q.state().charge === 1, 'Pack should start charged');
// ACT is contextual and valves/terminals outrank PING, so test on clean ground.
const foe = q.enemies().find(e => e.type === 'crawler');
foe.x = foe.x0 = 800; foe.left = 740; foe.right = 860; foe.y = 610;
Object.assign(q.P, { x: 780, y: foe.y - q.P.h, vx: 0, vy: 0, inv: 999 });
q.K.interact = 1; tick();
ok(q.state().charge === 0, 'PING did not spend the charge');
ok(foe.stun > 0, 'PING did not stun the crawler');

// --- valves drive the gate and the objective --------------------------------
for (const v of q.D.valves) { Object.assign(q.P, { x: v.x - 10, y: v.y - q.P.h, vx: 0, vy: 0, inv: 999 }); q.K.interact = 1; tick() }
ok(q.state().valves === 2, 'valves did not both turn');
const gate = q.D.gates[0];
ok(!q.solids(clock).some(s => s.x === gate.x && s.w === gate.w), 'gate stayed solid after both valves');

// --- the power cell can be taken and installed ------------------------------
const cell = q.D.pickups[0];
Object.assign(q.P, { x: cell.x - 10, y: cell.y - q.P.h, vx: 0, vy: 0, inv: 999 }); q.K.interact = 1; tick();
ok(q.state().cellHeld === 1, 'power cell was not picked up');
const sock = q.D.sockets[0];
Object.assign(q.P, { x: sock.x - 10, y: sock.y - q.P.h, vx: 0, vy: 0, inv: 999 }); q.K.interact = 1; tick();
ok(q.state().cellDone === 1, 'power cell was not installed');

// --- three shutters, then the exit finishes the level -----------------------
for (const s of q.D.shutters) { Object.assign(q.P, { x: s.x - 10, y: s.y - q.P.h, vx: 0, vy: 0, inv: 999 }); q.K.interact = 1; tick() }
ok(q.state().shutters === 3, 'shutters did not all open');
Object.assign(q.P, { x: q.D.exit.x, y: q.D.exit.y, vx: 0, vy: 0, inv: 999 }); tick();
ok(q.state().done === 1, 'reaching the exit did not finish the level');

// --- falling out of the world costs a life, not a crash ---------------------
q.reset(1); q.start(); clearKeys();
const falls0 = q.P.falls;
ok(q.state().charge === 1, 'Pack should be charged after a full reset');
tick(2);                                     // let the spawn checkpoint register first
q.P.inv = 0;                                 // clear the 0.75s spawn protection
q.P.y = 4000; tick(2);                       // first fall: Pack spends its charge to catch
ok(q.state().charge === 0, 'the catch did not spend Pack’s charge');
ok(q.P.falls === falls0, 'a caught fall should not count as a fall');
q.P.inv = 0; q.P.y = 4000; tick(2);          // second fall: no charge left, so a real respawn
ok(q.P.falls === falls0 + 1, 'falling with no charge did not count a fall');
ok(q.P.y < 2000, 'respawn left Bix outside the world');

// --- draw() runs clean over a long stretch, with valid crops ----------------
q.reset(1); q.start(); drawn.length = 0;
for (let n = 0; n < 200; n++) { clock = 6 + n * .05; q.update(1 / 60); q.draw() }
ok(drawn.length > 0, 'draw() drew nothing');
const plates = new Set(drawn.map(s => s.replace('./assets/', '')));
ok(plates.has('furnace-background-v2.png'), 'background never drawn');
ok(plates.has('bix-motion-v2.png'), 'Bix never drawn');

console.log(JSON.stringify({ checks, platesDrawn: plates.size, drawCalls: drawn.length, enemies: q.enemies().length }));
