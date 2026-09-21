/* Level 3 physics regressions found by the physics review. Run from the repo root: node tests/level3-physics.cjs
     - a gate is a wall, not a ledge to hang from (even a short one)
     - Kinetic Recoil never slows a jump that is already going up faster
     - a repel-pad launch cannot be cancelled by an armed coyote jump
     - a jump press made while climbing / tethered is not kept for later
     - Up / W climb the wall strip instead of kicking off
     - hanging on something that moves follows it
     - dropping through a ledge does not re-grab it; a respawn lets Pack go
     - the game stays finite and exception-free under random input at four frame rates */
'use strict';
const assert = require('assert');
const { boot } = require('./level3-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;

// ---- a gate is not a ledge ---------------------------------------------------------------------------------------------------------------
{
  const q = boot(); const g = q.D.gates[0]; g.h = 300;         // even the old 300 px gate, exactly the mantle limit
  let passed = 0, tried = 0;
  for (let run = 60; run <= 320; run += 20) for (let lead = 0; lead <= 0.5; lead += 0.1) {
    const b = boot(); b.D.gates[0].h = 300; b.D.lasers = []; b.D.chutes = []; b.setDrones([]); b.place(g.x - run, b.D.platforms[18][1]); b.K.right = 1; let t = 0, j = 0; tried++;
    while (t < 4 && b.P.x < g.x + 60) { const d = g.x - (b.P.x + b.P.w); if (!j && d < 40 + lead * 285) { b.K.jump = 1; b.P.buffer = 0.16; j = 1 } if (b.P.hang) b.K.jump = 1; b.tick(1, dt); t += dt }
    if (b.P.x >= g.x + g.w) passed++;
  }
  ok(passed === 0, `a 300 px gate cannot be climbed either: the grab ignores gates (${passed} of ${tried} passed)`);
}

// ---- Kinetic Recoil -----------------------------------------------------------------------------------------------------------------------
{
  const apex = (recoilTapFrame) => {
    const q = boot(); q.setCogs(8); q.D.lasers = []; q.place(400, 600); q.K.jump = 1; q.P.buffer = 0.16; let top = 600;
    for (let i = 0; i < 120; i++) { if (i === recoilTapFrame) q.K.red = 1; if (i === recoilTapFrame + 1) q.K.red = 0; q.tick(1, dt); top = Math.min(top, q.P.y + q.P.h); if (i > 10 && q.P.vy > 300) break }
    return 600 - top;
  };
  const plain = apex(-1), early = apex(2);
  ok(plain > 190, `a held jump rises ${plain.toFixed(0)} px`); ok(early >= plain - 6, `a Red tap one frame into the jump does not cut it short (${early.toFixed(0)} px vs ${plain.toFixed(0)} px)`);
}

// ---- pad launch and coyote -----------------------------------------------------------------------------------------------------------------
{
  const rise = (jumpDelay) => {
    const q = boot(), pad = q.D.pads[0]; q.place(pad.x + 40, pad.y); q.tick(30, dt); q.K.red = 1; let top = pad.y, i = 0;
    for (; i < 90; i++) { q.tick(1, dt); if (i === jumpDelay) { q.K.jump = 1; q.P.buffer = 0.16 } top = Math.min(top, q.P.y + q.P.h) }
    return pad.y - top;
  };
  const clean = rise(-1), withJump = rise(3);
  ok(clean > 390, `the pad launch rises ${clean.toFixed(0)} px`); ok(withJump > clean - 25, `pressing Space just after the launch does not cancel it (${withJump.toFixed(0)} px vs ${clean.toFixed(0)} px)`);
}

// ---- stale jump presses ----------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.setGlove(1);
  Object.assign(q.P, { climb: 0.4, hangRect: { x: 0, y: 0, w: 10, h: 10 }, climbX: 0, climbTarget: 5 }); q.P.buffer = 0.16; q.tick(1, dt);
  ok(q.P.buffer === 0, 'a jump press during a ledge climb is dropped');
  const t = boot(); const cp = t.D.checkpoints[6]; t.place(cp.x, cp.y); t.P.buffer = 0.16; t.P.inv = 0; t.setCP(cp); t.hurt('test'); t.tick(1, dt); ok(t.P.buffer === 0, 'and so is one that was pending when Pack catches Bix');
}

// ---- Up climbs the strip ----------------------------------------------------------------------------------------------------------------------
{
  const q = boot(), s = q.D.strips[0];
  Object.assign(q.P, { x: s.x + 6, y: 330, vx: 0, vy: 0, ground: 0, support: null, inv: 999, gird: null, cling: null, latchCD: 0, grabCD: 0, hang: 0, climb: 0 });
  q.K.blue = 1; q.tick(3, dt); ok(q.P.cling === s, 'clinging to the strip');
  const y0 = q.P.y; q.fire('keydown', { code: 'ArrowUp' }); q.tick(30, dt);
  ok(q.P.cling === s && q.P.y < y0 - 40, `pressing Up (a fresh press) climbs: still clinging, ${(y0 - q.P.y).toFixed(0)} px higher`);
  q.fire('keyup', { code: 'ArrowUp' }); q.tick(3, dt); q.fire('keydown', { code: 'Space' }); q.tick(2, dt);
  ok(!q.P.cling && q.P.vx > 100, 'Space still kicks off the wall'); q.fire('keyup', { code: 'Space' });
}

// ---- hanging on a moving island -----------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.setEnemies([]); q.setDrones([]); const v = q.isl()[1];
  q.tick(1, dt); const rect = q.solids().find(r => r.mv === v.id);
  Object.assign(q.P, { hang: 1, hangAt: q.S.clock, hangRect: rect, x: rect.x - q.P.w + 5, y: rect.y - 19, vx: 0, vy: 0, ground: 0, support: null, face: 1, inv: 999, climb: 0 });
  const rel0 = { x: q.P.x - v.x, y: q.P.y - v.y };
  q.S.clock += 1.5; q.tick(1, dt);         // the island has moved on
  ok(Math.abs((q.P.x - v.x) - rel0.x) < 2 && Math.abs((q.P.y - v.y) - rel0.y) < 2, 'a hanging Bix stays with the island as it orbits');
}

// ---- drop-through and Pack ---------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); const l = q.D.ledges.find(x => x.id === 'L2'); q.place(l.x + 20, l.y); q.tick(2, dt); q.K.down = 1; q.tick(2, dt);
  ok(q.P.grabCD > 0.2, 'dropping through a ledge blocks re-grabbing it for a moment');
  const t = boot(); const T0 = t.D.terminals[0]; t.place(T0.x - 21, T0.y); t.K.interact = 1; t.tick(2, dt); t.K.interact = 0; ok(t.packUntil() > 0, 'Pack is holding the terminal');
  t.P.inv = 0; t.reset(0); ok(t.packUntil() === 0, 'a respawn lets Pack go');
}

// ---- fuzz: random input at four frame rates never throws or produces a non-finite number -------------------------------------------------------
{
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 };
  let runs = 0;
  for (const fps of [30, 60, 120, 240]) for (let seed = 1; seed <= 4; seed++) {
    const r = rng(seed * 7919 + fps), q = boot({ enemies: true }); q.setCogs(seed * 3); const cps = q.D.checkpoints; const cp = cps[Math.floor(r() * cps.length)]; q.setCP(cp); q.reset(0); q.P.inv = 0;
    const d = 1 / fps; let frames = Math.round(45 * fps);
    for (let i = 0; i < frames; i++) {
      if (i % Math.round(fps / 4) === 0) Object.keys(q.K).forEach(k => { q.K[k] = r() < (k === 'right' ? 0.6 : 0.25) ? 1 : 0 });
      q.tick(1, d);
      const P = q.P; if (!(Number.isFinite(P.x) && Number.isFinite(P.y) && Number.isFinite(P.vx) && Number.isFinite(P.vy))) assert.fail(`non-finite player at fps ${fps} seed ${seed} frame ${i}`);
    }
    runs++;
  }
  ok(runs === 16, `16 random 45-second runs at 30, 60, 120 and 240 fps stayed finite with no exception`);
}
console.log(JSON.stringify({ checks }));
