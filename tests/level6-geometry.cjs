/* Level 6 geometry: the data is well formed, every jump on the route works in the REAL engine's physics, every cog and slip is
   collectable, and no state leaves the player stuck. Run from the repo root: node tests/level6-geometry.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level6-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const D = boot().D;
const plats = D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2] }));
const ledges = D.ledges.map(l => ({ id: l.id, x: l.x, y: l.y, w: l.w }));
const cols = D.columns.map(k => ({ id: k.id, ...k.fallsTo }));
const all = [...plats, ...ledges, ...cols];
const byId = Object.fromEntries([...plats, ...ledges].map(s => [s.id, s]));

// ---- the data is well formed ----------------------------------------------------------------------------------------------
ok(D.cogs.length === 15 && new Set(D.cogs.map(c => c.id)).size === 15, '15 cogs with unique ids');
ok(D.checkpoints.length === 7 && D.checkpoints.every((c, i) => i === 0 || c.x > D.checkpoints[i - 1].x), '7 checkpoints in order along the level');
ok(D.slips.length >= 1 && D.slips.every((s, i) => s.id === i + 1 && s.t.length <= 70), 'the story slips are numbered and fit the HUD box');
ok(D.areas.length === 6 && D.areas.every((a, i) => i === 0 ? a.x0 === 0 : a.x0 === D.areas[i - 1].x1) && D.areas[5].x1 === D.world.w, 'six areas end to end across the whole world');
ok(D.columns.length === 3 && D.troughs.length === 3, 'three columns and three troughs');
for (const k of D.columns) ok(D.troughs.some(t => t.id === k.trough), `column ${k.id} has its trough`);
for (const t of D.troughs) ok(D.columns.some(k => k.trough === t.id), `trough ${t.id} belongs to a column`);
ok(D.hoppers.length >= 8, `${D.hoppers.length} pod hoppers spread along the level`);
{
  const lines = [];
  for (const t of D.triggers) for (const [who, txt] of t.say) lines.push([who, txt]);
  ok(lines.length >= 15 && lines.every(([w, t]) => w && t.length <= 70), `every story line (${lines.length}) is at most 70 characters`);
  const xs = D.triggers.map(t => t.x); ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), 'triggers are in order along the level');
}
for (const c of D.checkpoints) ok(all.some(s => s.y === c.y && c.x >= s.x && c.x + 42 <= s.x + s.w), `checkpoint ${c.name} rests on a surface with the whole player width on it`);
for (const c of D.checkpoints) ok(D.areas.find(a => c.x >= a.x0 && c.x < a.x1).id === c.area, `checkpoint ${c.name} is in area ${c.area}`);
{
  const inside = o => D.platforms.some(p => o.x > p[0] && o.x < p[0] + p[2] && o.y > p[1] - 4 && o.y < p[1] + 78);
  for (const o of [...D.cogs, ...D.slips]) ok(!inside(o), `${o.id ?? 'slip ' + o.id} is not buried inside a platform`);
}
// every hopper and trough stands on something
for (const h of D.hoppers) ok(all.some(s => s.y === h.y && h.x >= s.x && h.x <= s.x + s.w), `hopper ${h.id} stands on a surface`);
for (const t of D.troughs) ok(all.some(s => s.y === t.y && t.x >= s.x && t.x + t.w <= s.x + s.w), `trough ${t.id} stands on a surface`);
ok(all.some(s => s.y === D.alarm.y && D.alarm.x >= s.x && D.alarm.x <= s.x + s.w), 'the alarm stands on a surface');

// ---- the three column gaps cannot be jumped, and the fallen column bridges each one ------------------------------------------
{
  const v0 = 780, g = 1450, run = 285, reach = rise => { const d = v0 * v0 - 2 * g * rise; return d < 0 ? -1 : run * ((v0 + Math.sqrt(d)) / g) - 77 };
  ok(Math.round(reach(0)) === 230, `a flat jump clears a gap of ${Math.round(reach(0))} px`);
  for (const k of D.columns) {
    const left = plats.filter(p => p.x + p.w <= k.fallsTo.x + 4).sort((a, b) => b.x - a.x)[0];
    const right = plats.filter(p => p.x >= k.fallsTo.x + k.fallsTo.w - 4).sort((a, b) => a.x - b.x)[0];
    const gap = right.x - (left.x + left.w);
    ok(gap > reach(0) + 200, `the ${k.id} gap is ${gap} px: far past a ${Math.round(reach(0))} px jump`);
    ok(k.fallsTo.x <= left.x + left.w + 4 && k.fallsTo.x + k.fallsTo.w >= right.x - 4, `the fallen ${k.id} bridges its gap end to end`);
  }
}

// ---- every jump on the route works in the real engine ---------------------------------------------------------------------
const ROUTE = ['p0','p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14',
  's0','s1','s2','s3','p15','p16','p17','p18','k1','p19','k2','p20','k3','p21','p22','p23','p24'];
const at = id => byId[id] || cols.find(c => c.id === id);
function jump(A, B, lead, hold) {
  const q = boot(); D.columns.forEach(k => q.fallen().add(k.id));        // with every column down, so the grid crossings are testable
  const a = at(A), b = at(B);
  q.place(a.x + a.w - 70, a.y);
  q.K.right = 1; let jumped = false, landed = false, jf = 0;
  for (let i = 0; i < 260 && !landed; i++) {
    q.S.clock += dt; q.update(dt);
    const edge = a.x + a.w - (q.P.x + q.P.w);
    if (!jumped && edge <= lead && q.P.ground) { q.K.jump = 1; q.P.buffer = .16; jumped = true; jf = i }
    if (jumped && hold && i - jf >= hold) q.K.jump = 0;
    if (jumped && q.P.ground && q.P.support && Math.abs(q.P.y + q.P.h - b.y) < 2 && q.P.x + q.P.w > b.x && q.P.x < b.x + b.w) landed = true;
  }
  return landed;
}
const reachable = (A, B) => { for (const hold of [0, 14, 22, 30]) for (const lead of [40, 30, 20, 12, 6, 0, -6]) if (jump(A, B, lead, hold)) return true; return false };
let edges = 0;
for (let i = 0; i + 1 < ROUTE.length; i++) {
  const A = ROUTE[i], B = ROUTE[i + 1];
  if (A === 'p14' && B === 's0') { edges++; continue }                   // the spine foot to the first rung is a step up, checked below
  ok(reachable(A, B), `${A} -> ${B} is reachable`); edges++;
}
ok(edges === ROUTE.length - 1, `all ${edges} steps of the route were simulated`);
{
  const q = boot(); const s0 = byId['s0'];
  q.place(s0.x - 60, 330); q.K.right = 1; let up = false;
  for (let i = 0; i < 180; i++) { if (i === 20) { q.K.jump = 1; q.P.buffer = .16 } if (i === 44) q.K.jump = 0; q.S.clock += dt; q.update(dt); if (q.P.ground && Math.abs(q.P.y + q.P.h - s0.y) < 2) up = true }
  ok(up, 'the spine foot reaches the first rung');
}

// ---- cogs and slips ---------------------------------------------------------------------------------------------------------
function collect(list, item, allColumns) {
  const q = boot(); if (allColumns) D.columns.forEach(k => q.fallen().add(k.id));
  const below = all.filter(s => item.x >= s.x - 30 && item.x <= s.x + s.w + 30 && s.y >= item.y).sort((a, b) => a.y - b.y)[0];
  if (!below) return false;
  q.place(Math.max(below.x, Math.min(item.x - 21, below.x + below.w - 42)), below.y);
  const before = list === 'cogs' ? q.state().cogs : q.state().slips;
  for (let i = 0; i < 260; i++) {
    const dx = item.x - (q.P.x + 21); q.K.right = dx > 12 ? 1 : 0; q.K.left = dx < -12 ? 1 : 0;
    if (i % 60 === 20) { q.K.jump = 1; q.P.buffer = .16 }
    q.S.clock += dt; q.update(dt);
    if ((list === 'cogs' ? q.state().cogs : q.state().slips) > before) return true;
  }
  return false;
}
for (const c of D.cogs.filter(c => c.route !== 'mastery')) ok(collect('cogs', c, true), `cog ${c.id} can be collected`);
for (const s of D.slips) ok(collect('slips', s, true), `slip ${s.id} can be collected`);
{
  const m = D.cogs.find(c => c.route === 'mastery');
  ok(!collect('cogs', m, false), 'the mastery cog cannot be reached with the columns still standing');
  ok(collect('cogs', m, true), 'but it can once a column has fallen');
}

// ---- a pod is always replaceable, from every checkpoint ------------------------------------------------------------------------
for (const cp of D.checkpoints) {
  const nearest = D.hoppers.map(h => Math.hypot(h.x - cp.x, h.y - cp.y)).sort((a, b) => a - b)[0];
  ok(nearest < 2600, `checkpoint ${cp.name} has a pod hopper within ${Math.round(nearest)} px, so the player is never left without a pod`);
}
console.log(JSON.stringify({ checks }));
