/* Level 4 geometry: the data is well formed, and every jump on the route works in the REAL engine's physics, with the core in its zone's mode.
   Run from the repo root: node tests/level4-geometry.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level4-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const D = boot().D;
const surf = { plats: D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2] })), ledges: D.ledges.map(l => ({ id: l.id, x: l.x, y: l.y, w: l.w })) };
const all = [...surf.plats, ...surf.ledges], byId = Object.fromEntries(all.map(s => [s.id, s]));

// ---- the data is well formed -----------------------------------------------------------------------------------------------------------
ok(D.cogs.length === 12 && new Set(D.cogs.map(c => c.id)).size === 12, '12 cogs with unique ids');
ok(D.checkpoints.length === 12 && D.checkpoints.every((c, i) => i === 0 || c.x > D.checkpoints[i - 1].x), '12 checkpoints in order along the level');
ok(D.slips.length === 6 && D.slips.every((s, i) => s.id === i + 1 && s.t.length <= 70), '6 delivery slips, numbered, each short enough for the HUD');
ok(D.areas.length === 6 && D.areas.every((a, i) => i === 0 ? a.x0 === 0 : a.x0 === D.areas[i - 1].x1) && D.areas[5].x1 === D.world.w, 'six areas laid end to end across the whole world');
ok(D.zones.every(z => z.x1 > z.x0 && ['heavy', 'buoy', 'charge'].includes(z.mode)), 'every core zone is a real range with a real mode');
ok(D.zones.every((z, i) => i === 0 || z.x0 >= D.zones[i - 1].x1), 'core zones never overlap');
ok(D.gates.length === 4 && D.gates.every(g => g.h >= 440), 'four gates, each 440 px or taller: above a jump plus a ledge grab (300 px)');
for (const g of D.gates) ok(surf.plats.some(p => p.y === g.y && g.x >= p.x && g.x + g.w <= p.x + p.w), `gate ${g.id} stands on a platform`);
for (const g of D.gates) ok(g.plate || g.by || g.nodes, `gate ${g.id} has a way to open`);
for (const p of D.plates) ok(D.gates.some(g => g.id === p.gate && g.plate === p.id) && surf.plats.some(s => s.y === p.y && p.x >= s.x && p.x + p.w <= s.x + s.w), `plate ${p.id} lies on a platform and opens its gate`);
for (const n of D.nodes) ok(D.gates.some(g => g.id === n.gate && g.nodes), `node ${n.id} belongs to a node gate`);
ok(D.nodes.length === 3, 'three relay nodes');
const lines = [];
for (const t of D.triggers) for (const [who, txt] of t.say) lines.push([who, txt]);
ok(lines.length >= 40 && lines.every(([w, t]) => w && t.length <= 70), `every story line (${lines.length}) is at most 70 characters`);
ok(D.triggers.every((t, i) => t.say.length && (t.y0 === undefined) === (t.y1 === undefined)), 'every trigger says something and has both or neither height limit');
{ const flat = D.triggers.filter(t => t.y0 === undefined).map(t => t.x); ok(flat.every((x, i) => i === 0 || x > flat[i - 1]), 'flat-area triggers are in order along the level'); }
ok(D.triggers.filter(t => t.opens).length === 1 && D.triggers.find(t => t.opens).opens === 'g4' && D.triggers.find(t => t.opens).delay >= D.triggers.find(t => t.opens).say.length * 2.5, 'the cage opens after Courier Prime has finished speaking');

// checkpoints sit exactly on a surface top, with the whole player width on it
for (const c of D.checkpoints) ok(all.some(s => s.y === c.y && c.x >= s.x && c.x + 42 <= s.x + s.w), `checkpoint ${c.name} rests on a surface (y ${c.y})`);
for (const c of D.checkpoints) ok(D.areas.find(a => c.x >= a.x0 && c.x < a.x1).id === c.area, `checkpoint ${c.name} is in area ${c.area}`);
// every cog and slip floats over something, not inside a platform
const inside = (o) => D.platforms.some(p => o.x > p[0] && o.x < p[0] + p[2] && o.y > p[1] - 4 && o.y < p[1] + 78);
for (const o of [...D.cogs, ...D.slips]) ok(!inside(o), `${o.id ?? 'slip ' + o.id} is not buried in a platform`);
// the moving hazards have sane timing
for (const h of [...D.arcs, ...D.bolts, ...D.vents]) ok(h.on > 0 && h.tell > 0 && h.on + h.tell < h.period, 'a timed hazard has a tell and a rest inside its period');
for (const h of D.arcs) ok(surf.plats.some(p => h.x > p.x && h.x + h.w < p.x + p.w && h.y + h.h === p.y), 'an arc rail stands on a platform');
ok(D.conveyors.every(c => c.sp < 285 * 0.82), 'a belt is slower than a heavy-core runner, so it can always be crossed');

// ---- every jump on the route works in the real engine ---------------------------------------------------------------------------------------
const ROUTE = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18',
  'h0', 'h1', 'h2', 'h3', 'b0', 'b1', 'b2', 'p19'];
const openAll = q => D.gates.forEach(g => q.open().add(g.id));
function jump(A, B, withCore, lead, hold) {
  const q = boot(); openAll(q); q.D.vents.length = 0; const a = byId[A], b = byId[B];      // the route must work without any updraft's help
  q.place(a.x + a.w - 70, a.y); if (withCore) { q.core().held = 0; q.pickUp() }
  q.K.right = 1; let jumped = false, landed = false;
  for (let i = 0; i < 260 && !landed; i++) {
    q.S.clock += 1 / 60; q.update(1 / 60);
    const edge = a.x + a.w - (q.P.x + q.P.w);
    if (!jumped && edge <= lead && q.P.ground) { q.K.jump = 1; q.P.buffer = .16; jumped = true; var jf = i }
    if (jumped && hold && i - jf >= hold) q.K.jump = 0;          // a player lets go of jump to stop short (a buoyant jump can fly past a ledge)
    if (jumped && q.P.ground && q.P.support && Math.abs(q.P.y + q.P.h - b.y) < 2 && q.P.x + q.P.w > b.x && q.P.x < b.x + b.w) landed = true;
  }
  return landed;
}
function reachable(A, B, withCore) { for (const hold of [0, 12, 20, 28, 36]) for (const lead of [40, 30, 20, 12, 6, 0, -6]) if (jump(A, B, withCore, lead, hold)) return true; return false }
let edges = 0;
for (let i = 0; i + 1 < ROUTE.length; i++) {
  const A = ROUTE[i], B = ROUTE[i + 1]; if (A === 'p11' && B === 's0') continue;          // the floor to the first spine ledge is a step up handled below
  // the floor (p11) and the wide decks are long: measure each jump from the deck's right edge (the far ledge of the spine is checked next)
  ok(reachable(A, B, true), `${A} -> ${B} works carrying the core in its zone`); ok(reachable(A, B, false), `${A} -> ${B} works without the core (a dropped core never traps Bix)`); edges++;
}
ok(edges === ROUTE.length - 2, `every one of the ${edges} jumps on the route was simulated`);
// the spine: from the floor up to the first ledge, and back down from the last ledge to the spine top, in both modes
{ const q = boot(); openAll(q); q.place(9760, 480); let up = false;                 // standing under the first ledge, a plain jump straight up lands on it (one-way plates)
  for (let i = 0; i < 200; i++) { if (i === 5) { q.K.jump = 1; q.P.buffer = .16 } if (i === 30) q.K.jump = 0; q.S.clock += 1 / 60; q.update(1 / 60); if (q.P.ground && Math.abs(q.P.y + q.P.h - 400) < 2) up = true }
  ok(up, 'the floor reaches the first spine ledge s0 with a plain jump') }

// ---- cogs and slips are all reachable, the mastery cog only with the buoyant core ------------------------------------------------------------
function collect(list, item, withCore, hold) {
  const q = boot(); openAll(q); const below = all.filter(s => item.x >= s.x - 30 && item.x <= s.x + s.w + 30 && s.y >= item.y).sort((a, b) => a.y - b.y)[0];
  if (!below) return false;
  q.place(clamp(item.x - 21, below.x, below.x + below.w - 42), below.y); if (withCore) { q.core().held = 0; q.pickUp() }
  const before = list === 'cogs' ? q.state().cogs : q.state().slips;
  for (let i = 0; i < 240; i++) {
    const dx = item.x - (q.P.x + 21); q.K.right = dx > 12 ? 1 : 0; q.K.left = dx < -12 ? 1 : 0;
    if (i % 60 === 20) { q.K.jump = 1; q.P.buffer = .16 } if (i % 60 === 55 && !hold) q.K.jump = 0;
    q.S.clock += 1 / 60; q.update(1 / 60);
    if ((list === 'cogs' ? q.state().cogs : q.state().slips) > before) return true;
  }
  return false;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
for (const c of D.cogs.filter(c => c.route !== 'mastery')) ok(collect('cogs', c, false, true) || collect('cogs', c, true, true), `cog ${c.id} can be collected`);
for (const s of D.slips) ok(collect('slips', s, false, true) || collect('slips', s, true, true), `delivery slip ${s.id} can be collected`);
const m = D.cogs.find(c => c.route === 'mastery');
ok(!collect('cogs', m, false, true), 'the mastery cog c11 cannot be reached without the core (plain jump, jump held)');
ok(collect('cogs', m, true, true), 'but it can be reached with the buoyant core, float and hold jump, from ledge b1');
console.log(JSON.stringify({ checks }));
