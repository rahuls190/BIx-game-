/* Level 5, end to end: every leg of the route from the sky dock to the beacon is proved in the REAL engine, by actually playing it.
   A leg passes if a plain run-and-jump works, or a coyote jump, or the crane lift in that gap carries him, or a collapsing plate
   takes his weight long enough. A leg that no strategy clears is a wall the player cannot pass, which is what this file exists to
   catch. Run from the repo root: node tests/level5-route.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level5-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const q = boot();
const D = q.D;
const rails = D.electrics.map(e => ({ ...e }));
const plats = D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2] })).sort((a, b) => a.x - b.x);

function fresh(withRails) {
  q.reset(1); q.running = 1; q.now = 0; q.clear();
  q.drones = []; q.stalkers = []; q.sentinels = [];      // the route is about geometry; the patrols are their own problem
  D.electrics.length = 0;
  if (withRails) for (const e of rails) D.electrics.push(e);
  for (const g of D.gates) q.switches[g.need] = 1e9;     // every gate open: the windows are proved in level5-gates.cjs
}
const landedOn = (B) => q.P.ground && q.P.x + q.P.w > B.x + 2 && q.P.x < B.x + B.w && Math.abs(q.P.y + q.P.h - B.y) < 4;

// ---- strategy 1: run at the edge and jump, with a lead (negative = a late, coyote-time jump) ---------------------------------
function tryJump(A, B, lead, hold, edgeX, wait) {
  fresh();
  if (wait) for (let i = 0; i < Math.round(wait / dt); i++) q.update(dt);
  const E = edgeX == null ? A.x + A.w : edgeX;
  q.place(Math.max(A.x + 4, Math.min(A.x + A.w - 44, E - 420)), A.y); q.P.inv = 0; q.key.right = 1;
  let jumped = false, jf = 0;
  for (let i = 0; i < 320; i++) {
    const edge = E - (q.P.x + q.P.w);
    if (!jumped && edge <= lead) { q.key.jump = 1; q.jumpBuf = .16; jumped = true; jf = i }
    if (jumped && hold && i - jf >= hold) q.key.jump = 0;
    q.update(dt);
    if (q.falls > 0) return false;
    if (jumped && landedOn(B)) return true;
  }
  return false;
}
// How much room for error the jump has: every take-off point that works, in pixels before (or after) the edge.
const canJump = (A, B) => {
  const gusty = D.gusts.some(g => g.x < B.x + 60 && g.x + g.w > A.x + A.w - 60);
  const waits = gusty ? [0, .8, 1.6, 2.4] : [0];       // a duct blowing across the gap must not make the jump a phase lottery
  let worst = null;
  for (const wait of waits) {
    const leads = [];
    for (let lead = 60; lead >= -40; lead -= 4) {
      for (const hold of [0, 12, 20, 30, 44]) if (tryJump(A, B, lead, hold, null, wait)) { leads.push(lead); break }
    }
    if (!leads.length) return null;
    const w = { how: 'jump', window: Math.max(...leads) - Math.min(...leads) + 4, from: Math.min(...leads), to: Math.max(...leads) };
    if (!worst || w.window < worst.window) worst = w;
  }
  return worst;
};

// ---- strategy 2: take the crane lift that fills the gap --------------------------------------------------------------------
function tryLift(A, B, m, wait) {
  fresh();
  q.place(Math.max(A.x + 4, A.x + A.w - 300), A.y); q.P.inv = 0;
  for (let i = 0; i < Math.round(wait / dt); i++) q.update(dt);
  for (let i = 0; i < 60 * 16; i++) {
    const P = q.P;
    q.key.right = 1;
    if (P.ride === m.id) { const r = q.moverRect(m); q.key.right = r.y <= B.y + 6 ? 1 : 0 }
    if (P.ground && Math.abs(P.vx) < 40 && q.key.right) { q.key.jump = 1; q.jumpBuf = .16 } else q.key.jump = 0;
    q.update(dt);
    if (!q.P.ride && landedOn(B)) return true;
    if (q.falls > 0) return false;
  }
  return false;
}
function canRide(A, B) {
  const m = D.movers.find(v => v.x >= A.x + A.w - 30 && v.x + v.w <= B.x + B.w + 30 && v.x + v.w > A.x + A.w);
  if (!m) return null;
  let every = true;
  for (let w = 0; w < (m.period || 4); w += 0.3) if (!tryLift(A, B, m, w)) every = false;
  return every ? { how: 'lift ' + m.id } : null;
}

// ---- strategy 3: go up and over on a hang ledge, the way the crane and lock decks are meant to be crossed ------------------
function jumpWindow(A, B, edgeX, leads) {
  const good = [];
  for (const lead of leads) { for (const hold of [0, 12, 20, 30, 44]) if (tryJump(A, B, lead, hold, edgeX)) { good.push(lead); break } }
  return good.length ? { window: Math.max(...good) - Math.min(...good) + 4, from: Math.min(...good), to: Math.max(...good) } : null;
}
const DOWN = []; for (let l = 60; l >= -40; l -= 4) DOWN.push(l);
const UP = []; for (let l = 240; l >= -20; l -= 10) UP.push(l);
function canLedge(A, B) {
  for (const L of D.ledges) {
    if (!(L.x + L.w > A.x && L.x < B.x && L.y < A.y - 40)) continue;
    const up = jumpWindow(A, { x: L.x, y: L.y, w: L.w }, L.x, UP);
    if (!up) continue;
    const over = jumpWindow({ x: L.x, y: L.y, w: L.w }, B, null, DOWN);
    if (!over) continue;
    return { how: 'ledge at ' + L.x, window: Math.min(up.window, over.window), from: up.from, to: over.to };
  }
  return null;
}

// ---- strategy 4: hop across a collapsing plate ------------------------------------------------------------------------------
function tryPlate(A, B, c, lead, hold, hop) {
  fresh();
  q.place(Math.max(A.x + 4, A.x + A.w - 420), A.y); q.P.inv = 0; q.key.right = 1;
  let jumped = false, jf = 0, onPlate = 0;
  for (let i = 0; i < 400; i++) {
    const edge = A.x + A.w - (q.P.x + q.P.w);
    if (!jumped && edge <= lead) { q.key.jump = 1; q.jumpBuf = .16; jumped = true; jf = i }
    if (jumped && hold && i - jf >= hold) q.key.jump = 0;
    const P = q.P;
    if (P.ground && P.x + P.w > c.x && P.x < c.x + c.w && Math.abs(P.y + P.h - c.y) < 6) {
      onPlate++; if (onPlate >= hop) { q.key.jump = 1; q.jumpBuf = .16 }
    }
    q.update(dt);
    if (q.falls > 0) return false;
    if (landedOn(B)) return true;
  }
  return false;
}
function canPlate(A, B) {
  const c = (D.collapses || []).find(v => v.x > A.x + A.w - 40 && v.x + v.w < B.x + 40);
  if (!c) return null;
  for (const hold of [0, 20, 30, 44]) for (let lead = 60; lead >= -20; lead -= 8) for (const hop of [1, 3, 6, 10])
    if (tryPlate(A, B, c, lead, hold, hop)) return { how: 'plate ' + c.id, lead, hold, hop };
  return null;
}

// ---- prove every leg --------------------------------------------------------------------------------------------------------
const legs = [];
for (let i = 0; i + 1 < plats.length; i++) {
  const A = plats[i], B = plats[i + 1];
  if (B.x <= A.x + A.w) continue;
  // a bare jump is the route only if it has room for error; otherwise the ledge, the lift or the plate is the real way over
  let how = canJump(A, B);
  if (!how || how.window < 24) how = canLedge(A, B) || canRide(A, B) || canPlate(A, B) || how;
  legs.push({ A: A.id, B: B.id, gap: B.x - (A.x + A.w), rise: A.y - B.y, how });
  ok(how, `${A.id} -> ${B.id} (gap ${B.x - (A.x + A.w)}, rise ${A.y - B.y}) can be crossed`);
  // a leg the player can only clear from one exact pixel is a leg they will read as broken
  if (how.window != null) ok(how.window >= 32,
    `${A.id} -> ${B.id} by ${how.how} gives ${how.window}px of take-off room, not a single frame`);
}
ok(legs.length >= 30, `${legs.length} legs of the route were played`);

// ---- no mover may cut through a deck, a closed gate, or a pulse rail --------------------------------------------------------
for (const m of D.movers) {
  const box = { x: Math.min(m.x, m.x + m.dx), y: Math.min(m.y, m.y + m.dy),
    w: Math.abs(m.dx) + m.w, h: Math.abs(m.dy) + m.h };
  const cuts = plats.filter(p => box.x < p.x + p.w - 2 && box.x + box.w > p.x + 2 && box.y < p.y + 80 - 2 && box.y + box.h > p.y + 2);
  if (D.movers.indexOf(m) < 0) continue;
  ok(cuts.length === 0 || m.dx !== 0, `mover ${m.id}: a lift that fills a gap must not sweep through a deck (${cuts.map(c => c.id).join(',') || 'clear'})`);
}
for (const m of D.movers.filter(v => v.dx === 0)) {
  const inShaft = rails.filter(e => e.x + e.w > m.x && e.x < m.x + m.w && e.y + e.h > m.y + m.dy && e.y < m.y + m.h);
  ok(inShaft.length === 0, `no pulse rail stands inside the ${m.id} lift shaft, where a rider could not dodge it`);
}

// ---- a closed gate is a wall, not a perch ------------------------------------------------------------------------------------
for (const g of D.gates) {
  const deck = plats.filter(p => p.x <= g.x && p.x + p.w >= g.x + g.w)[0];
  if (!deck) continue;
  let mounted = false;
  for (let start = g.x - 200; start < g.x - 30; start += 20) for (let jf = 0; jf < 40; jf += 4) {
    fresh(); q.switches[g.need] = -1;                 // this one shut
    q.place(start, deck.y); q.P.inv = 0; q.key.right = 1;
    for (let i = 0; i < 160; i++) {
      if (i === jf) { q.key.jump = 1; q.jumpBuf = .16 }
      q.update(dt);
      if (q.P.ground && q.P.x + q.P.w > g.x && q.P.x < g.x + g.w && q.P.y + q.P.h < g.y - 40) mounted = true;
      if (q.falls > 0) break;
    }
  }
  ok(!mounted, `the closed ${g.id} gate cannot be climbed on top of`);
}

// ---- every cog can be reached, and every checkpoint stands on something -------------------------------------------------------
const surfaces = [...plats, ...D.ledges.map((l, i) => ({ id: 'l' + i, x: l.x, y: l.y, w: l.w }))];
function cogReachable(c) {
  const near = surfaces.filter(s => s.y > c.y - 10 && s.y - c.y < 300 && c.x > s.x - 300 && c.x < s.x + s.w + 300)
    .sort((a, b) => (Math.abs(c.x - (a.x + a.w / 2)) + a.y) - (Math.abs(c.x - (b.x + b.w / 2)) + b.y));
  for (const s of near.slice(0, 3)) for (const jf of [0, 8, 14, 20, 26, 34, 44]) {
    fresh();
    q.place(Math.max(s.x + 2, Math.min(c.x - 21, s.x + s.w - 44)), s.y); q.P.inv = 0;
    const before = q.cogs;
    for (let i = 0; i < 260; i++) {
      const dx = c.x - (q.P.x + 21);
      q.key.right = dx > 10 ? 1 : 0; q.key.left = dx < -10 ? 1 : 0;
      if (i % 46 === jf % 46) { q.key.jump = 1; q.jumpBuf = .16 } else q.key.jump = 0;
      q.update(dt);
      if (q.cogs > before) return true;
      if (q.falls > 0) break;
    }
  }
  return false;
}
for (const c of D.cogs) ok(cogReachable(c), `the cog at ${c.x},${c.y} can be collected`);
for (const cp of D.checkpoints) {
  const on = surfaces.some(s => cp.x >= s.x - 10 && cp.x + 42 <= s.x + s.w + 10 && s.y >= cp.y && s.y - cp.y < 200);
  ok(on, `checkpoint ${cp.name} is over a surface`);
}

// ---- nothing in the shutdown run makes you wait ------------------------------------------------------------------------------
{
  const chase = D.areas.find(a => a.chase);
  const waits = D.movers.filter(m => m.dx === 0 && m.x > chase.x0 && m.x < chase.x1);
  for (const m of waits) {
    const A = plats.filter(p => p.x + p.w <= m.x + 20).sort((a, b) => b.x - a.x)[0];
    const B = plats.filter(p => p.x >= m.x + m.w - 20).sort((a, b) => a.x - b.x)[0];
    ok(canJump(A, B), `${A.id} -> ${B.id} is jumpable without waiting for the ${m.id} lift, because the shutdown wall is coming`);
  }
  checks++;
}
const tight = legs.filter(l => l.how.window != null).sort((a, b) => a.how.window - b.how.window)[0];
console.log(JSON.stringify({ checks, legs: legs.length,
  tightest: `${tight.A}->${tight.B} ${tight.how.window}px window`,
  notPlainJumps: legs.filter(l => l.how.how !== 'jump').map(l => `${l.A}->${l.B} ${l.how.how}`) }, null, 1));
