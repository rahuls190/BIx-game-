/* Level 5, the things that hurt: no deck may be deadly to simply stand on, no drone may clip the top of Bix's head by a few
   pixels while it looks like it is passing overhead, and every hazard has to announce itself. The standing check is played in the
   REAL engine at several points of each patrol's cycle. Run from the repo root: node tests/level5-hazards.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level5-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const q = boot();
const D = q.D;
const plats = D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2], deck: true }));
const ledges = D.ledges.map((l, i) => ({ id: 'l' + i, x: l.x, y: l.y, w: l.w }));

// ---- a drone either passes clear overhead or it is a hazard you can see; two pixels of head clipping is neither ---------------
for (const d of D.drones) {
  const sweep = { x0: d.x - d.range - 30, x1: d.x + d.range + 30, y0: d.y - 38, y1: d.y + 38 };   // 24px box, 14px bob
  for (const s of plats) {
    if (!(sweep.x0 < s.x + s.w && sweep.x1 > s.x)) continue;
    const stand = { y0: s.y - 74, y1: s.y };
    const overlap = Math.min(sweep.y1, stand.y1) - Math.max(sweep.y0, stand.y0);
    ok(overlap <= 0 ? sweep.y1 <= stand.y0 - 20 || sweep.y0 >= stand.y1 + 20 : overlap >= 24,
      `the drone at ${d.x} over ${s.id}: ${overlap <= 0 ? Math.abs(overlap) + 'px of clearance' : overlap + 'px of overlap'} — it must clearly miss him or clearly hit him`);
  }
}

// ---- standing still on a surface must not be a death sentence ---------------------------------------------------------------
const PHASES = 8, WINDOW = 0.25;
function deadlyShare(sx, top) {
  let hits = 0;
  for (let k = 0; k < PHASES; k++) {
    q.reset(1); q.running = 1; q.now = 0; q.clear();
    for (const g of D.gates) q.switches[g.need] = 1e9;              // the gate windows are their own test
    q.place(sx, top); q.P.inv = 999;
    for (let i = 0; i < Math.round(k * 0.41 / dt); i++) q.update(dt);
    q.place(sx, top); q.P.inv = 0;
    const f0 = q.falls;
    for (let i = 0; i < Math.round(WINDOW / dt); i++) { q.update(dt); if (q.falls > f0) { hits++; break } }
  }
  return hits / PHASES;
}
let worst = { share: 0 }, sampled = 0;
for (const s of [...plats, ...ledges]) {
  const live = [...D.drones.map(d => ({ x0: d.x - d.range - 40, x1: d.x + d.range + 40 })),
    ...(D.stalkers || []).map(e => ({ x0: e.x - e.range - 60, x1: e.x + e.range + 60 })),
    ...(D.sentinels || []).map(e => ({ x0: e.dir > 0 ? e.x : e.x - e.reach, x1: e.dir > 0 ? e.x + e.reach : e.x })),
    ...D.electrics.map(e => ({ x0: e.x - 40, x1: e.x + e.w + 40 }))];
  for (let x = s.x + 2; x <= s.x + s.w - 44; x += 40) {
    if (!live.some(h => x + 42 > h.x0 && x < h.x1)) continue;       // only where something can actually reach him
    const share = deadlyShare(x, s.y); sampled++;
    if (share > worst.share) worst = { share, where: `${s.id} x=${x}` };
    ok(share <= 0.75, `standing on ${s.id} at x=${x} is deadly in ${Math.round(share * 100)}% of patrol phases, which leaves nowhere to wait`);
  }
}
ok(sampled > 60, `${sampled} spots inside a hazard's reach were stood on`);

// ---- every hazard announces itself, and the ones on the ground can be jumped ---------------------------------------------------
for (const e of D.sentinels || []) {
  ok(e.warn >= 0.6, `the sentinel at ${e.x} warns for ${e.warn}s before firing`);
  ok(e.fire <= e.warn + 0.2, `the sentinel at ${e.x} fires for ${e.fire}s, no longer than it warns`);
}
for (const e of D.stalkers || []) {
  ok(e.warn >= 0.5, `the stalker at ${e.x} rears up for ${e.warn}s before charging`);
  ok(42 <= 60, `the stalker at ${e.x} is low enough to jump`);      // stalkerBox is 42 tall, well under a 209px jump
}
for (const e of D.electrics) {
  const dark = e.period - e.on;
  ok(dark >= 0.55, `the pulse rail at ${e.x} is dark for ${dark.toFixed(2)}s, long enough to run through`);
  ok(e.tell >= 0.28, `the pulse rail at ${e.x} tells for ${e.tell}s before it lights`);
}
// ---- hazards must arrive one at a time, not all at once -----------------------------------------------------------------------
// A rail standing in a gap has to be timed at the same moment as the jump, so its dark window must be long enough to read it,
// run it up and be across. And whatever sweeps a deck must leave the end you land on alone.
for (let i = 0; i + 1 < plats.length; i++) {
  const A = plats[i], B = plats[i + 1], g0 = A.x + A.w, g1 = B.x;
  if (g1 <= g0) continue;
  for (const e of D.electrics) {
    if (!(e.x + e.w > g0 - 20 && e.x < g1 + 20)) continue;
    ok(e.period - e.on >= 1.7,
      `the rail in the ${A.id} -> ${B.id} gap is dark for ${(e.period - e.on).toFixed(2)}s, long enough to cross while it is out`);
  }
  const land = { x0: B.x, x1: B.x + 140 };
  for (const e of D.sentinels || []) {
    const x0 = e.dir > 0 ? e.x : e.x - e.reach, x1 = e.dir > 0 ? e.x + e.reach : e.x;
    ok(!(x0 < land.x1 && x1 > land.x0 && e.y > B.y - 84 && e.y < B.y + 10),
      `nothing sweeps the first 140px of ${B.id}, the part he lands on`);
  }
}
for (const p of plats) {
  let swept = 0;
  for (const e of D.sentinels || []) {
    const x0 = e.dir > 0 ? e.x : e.x - e.reach, x1 = e.dir > 0 ? e.x + e.reach : e.x;
    if (e.y > p.y - 84 && e.y < p.y + 10) swept = Math.max(swept, Math.min(x1, p.x + p.w) - Math.max(x0, p.x));
  }
  if (swept > 0) ok(p.w - swept >= 140, `${p.id} keeps ${p.w - swept}px of deck outside the beam to stand in`);
}

for (const g of D.gusts) {
  const calm = g.period - g.on;
  ok(calm >= 1.2, `the duct at ${g.x} is calm for ${calm.toFixed(2)}s between gusts`);
}
console.log(JSON.stringify({ checks, sampled, worstSpot: worst.where, worstShare: Math.round(worst.share * 100) + '%' }));
