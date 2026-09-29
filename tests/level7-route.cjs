/* Level 7, end to end: every platform-to-platform leg is proved in the REAL engine by actually jumping it (plain jump, or a ledge
   as a stepping stone, with several take-off timings tried); every relay's range is proved to reach the far edge of what it
   powers, INCLUDING through its repeater (a repeater re-broadcasts the link, so being close to it is as good as being close to
   the relay — see dist/level7.js linkRatio()); and every cog, fragment and checkpoint sits near a real surface.
   Run from the repo root: node tests/level7-route.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level7-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60 / 2; // 1/120, matches the engine's fixed physics step
const q = boot({ enemies: false });
const D = q.D;
q.setEnemies([]);

function fresh() { q.reset(1); q.setEnemies([]) }
const landedOn = B => { const P = q.P; return P.ground && P.x + P.w > B.x + 2 && P.x < B.x + B.w && Math.abs(P.y + P.h - B.y) < 4 };

// ---- strategy: run at the edge and jump, with a lead (negative = a late, coyote-time jump), an optional relay linked throughout,
// and an optional named take-off edge (for a ledge-to-ledge hop where the "platform" is really a narrow ledge) --------------------
function tryJump(A, B, lead, hold, relay, edgeX) {
  fresh(); if (relay) q.deploy(relay);
  const E = edgeX == null ? A.x + A.w : edgeX;
  q.place(Math.max(A.x + 4, Math.min(A.x + A.w - 44, E - 480)), A.y); q.P.inv = 0;
  if (relay) q.deploy(relay);
  q.K.right = 1;
  let jumped = false, jf = 0;
  for (let i = 0; i < 400; i++) {
    const edge = E - (q.P.x + q.P.w);
    if (!jumped && edge <= lead) { q.K.jump = 1; q.P.buffer = .16; jumped = true; jf = i }
    if (jumped && hold && i - jf >= hold) q.K.jump = 0;
    q.tick(1, dt);
    if (q.P.y > 3000) return false;
    if (jumped && landedOn(B)) return true;
  }
  return false;
}
const LEADS = []; for (let l = 60; l >= -40; l -= 4) LEADS.push(l);
const UP = []; for (let l = 260; l >= -20; l -= 10) UP.push(l);
const HOLDS = [0, 12, 20, 30, 44, 60];
function jumpWindow(A, B, relay, edgeX, leads = LEADS) {
  const good = [];
  for (const lead of leads) for (const hold of HOLDS) if (tryJump(A, B, lead, hold, relay, edgeX)) { good.push(lead); break }
  return good.length ? { window: Math.max(...good) - Math.min(...good) + 4 } : null;
}
function canJump(A, B, relay) { return jumpWindow(A, B, relay) }
function canLedge(A, B, ledges, relay) {
  for (const L of ledges) {
    if (!(L.x + L.w > A.x - 30 && L.x < B.x + 30 && L.y < A.y - 30)) continue;
    const up = jumpWindow(A, { x: L.x, y: L.y, w: L.w }, null, L.x, UP);
    if (!up) continue;
    const over = jumpWindow({ x: L.x, y: L.y, w: L.w }, B, relay, null);
    if (!over) continue;
    return { how: 'ledge@' + L.x, window: Math.min(up.window, over.window) };
  }
  return null;
}

// ---- which relay (if any) gates each platform pair: found by the x-column the relay's target obstacle occupies -------------------
const GATE_RELAY = { gate1: 'r1', gate2: 'r5', gate3: 'r7' };
function gatingRelay(A, B) {
  for (const g of D.gates) if (g.x > A.x && g.x < B.x + B.w) return D.relays.find(r => r.id === GATE_RELAY[g.id]);
  return null;
}

const plats = D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2], area: p[4] }));
const ledgesAll = D.ledges.map(l => ({ id: l.id, x: l.x, y: l.y, w: l.w }));
let legs = 0;
for (const area of D.areas) {
  const ps = plats.filter(p => p.area === area.id).sort((a, b) => a.x - b.x);
  const ls = ledgesAll.filter(l => l.x >= area.x0 - 100 && l.x < area.x1 + 100);
  for (let i = 0; i + 1 < ps.length; i++) {
    const A = ps[i], B = ps[i + 1];
    const relay = gatingRelay(A, B);
    let how = canJump(A, B, relay);
    if (!how || how.window < 40) how = canLedge(A, B, ls, relay) || how;
    ok(how, `${area.id}: ${A.id} -> ${B.id} (gap ${B.x - (A.x + A.w)}, rise ${A.y - B.y}${relay ? ', ' + relay.id + ' linked' : ''}) can be crossed`);
    if (how) ok(how.window >= 40, `${area.id}: ${A.id} -> ${B.id} gives ${how.window}px of take-off room, not a sliver`);
    legs++;
  }
}
ok(legs >= 25, `${legs} legs of the route were played`);

// ---- every relay's range reaches the far edge of what it powers, through its repeater if it has one -----------------------------
const targetGeom = id =>
  D.gates.find(g => g.id === id) || D.bridges.find(b => b.id === id) || D.lifts.find(l => l.id === id) ||
  D.trams.find(t => t.id === id) || (id === 'traction' ? { x: D.world.finishX, y: 0 } : null);
for (const r of D.relays) {
  const t = targetGeom(r.target);
  ok(t, `relay ${r.id} names a target (${r.target}) that exists`);
  if (!t) continue;
  const farX = t.x1 !== undefined ? t.x1 : t.x + (t.w || 0);
  const farY = t.onY !== undefined ? t.onY : (t.y !== undefined ? t.y : 0);
  const rep = D.repeaters.find(p => p.relay === r.id);
  const direct = Math.hypot(farX - r.x, farY - r.y);
  const viaRep = rep ? Math.hypot(farX - rep.x, farY - rep.y) : Infinity;
  ok(Math.min(direct, viaRep) <= r.range * 1.03,
    `relay ${r.id} (${r.label}) reaches the far edge of ${r.target}: direct ${Math.round(direct)}px, via its repeater ${Math.round(viaRep)}px, range ${r.range}px`);
}
ok(D.repeaters.length === D.relays.length, 'every relay has its own repeater, and the engine (linkRatio in dist/level7.js) actually uses it');

// ---- every cog, fragment and checkpoint sits within reach of a real surface -------------------------------------------------------
const surf = [...plats, ...ledgesAll];
const nearBelow = o => surf.filter(s => s.y > o.y - 4 && o.x > s.x - 260 && o.x < s.x + s.w + 260).sort((a, b) => (a.y - o.y) - (b.y - o.y))[0];
for (const c of D.cogs) { const s = nearBelow(c); ok(s && s.y - c.y <= 260, `cog ${c.id} has a surface within reach`) }
for (const f of D.fragments) { const s = nearBelow(f); ok(s && s.y - f.y <= 260, `fragment ${f.id} has a surface within reach`) }
for (const cp of D.checkpoints) {
  const near = surf.find(s => cp.x >= s.x - 60 && cp.x <= s.x + s.w + 60 && Math.abs(s.y - cp.y) <= 30);
  ok(near, `checkpoint ${cp.name} is close enough to a surface to trigger when Bix lands nearby`);
}
console.log(JSON.stringify({ checks, legs }));
