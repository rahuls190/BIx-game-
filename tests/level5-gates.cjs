/* Level 5, the three timed gates and the crane lift that feeds the first one. These are the parts that left the level unfinishable:
   the switch window counted down twice per second, a lift carried Bix through a closed gate, and a graze on a lift's top edge was
   treated as a wall and threw him backwards into the pit. Run from the repo root: node tests/level5-gates.cjs */
'use strict';
const assert = require('assert');
const { boot } = require('./level5-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const q = boot();
const D = q.D;
const gate = id => D.gates.find(g => g.id === id);
const rails = D.electrics.map(e => ({ ...e }));                     // kept, because a route test empties the live list

function fresh(opts = {}) {
  q.reset(1); q.running = 1; q.now = 0; q.clear();
  q.drones = []; q.stalkers = []; q.sentinels = [];                 // the gates are about timing, not about the patrols
  D.electrics.length = 0;
  if (opts.rails) for (const e of rails) D.electrics.push(e);
}

// ---- the window is real seconds ---------------------------------------------------------------------------------------------
{
  fresh(); q.place(5690, 424); q.P.inv = 0;
  q.update(dt);
  ok(!!q.canAct, 'the cargo switch is in reach from the end of the crane deck');
  q.act();
  const want = gate('cargoA').seconds;
  q.tick = n => { for (let i = 0; i < n; i++) q.update(dt) };
  q.tick(Math.round((want - 0.6) / dt));
  ok(q.gateBox(gate('cargoA')).open, `the cargo gate is still open ${(want - 0.6).toFixed(1)}s after the switch`);
  q.tick(Math.round(1.2 / dt));
  ok(!q.gateBox(gate('cargoA')).open, `and shut by ${(want + 0.6).toFixed(1)}s`);
}

// ---- no mover may pass through a closed gate --------------------------------------------------------------------------------
for (const m of D.movers) {
  const x0 = Math.min(m.x, m.x + m.dx), x1 = Math.max(m.x, m.x + m.dx) + m.w;
  const y0 = Math.min(m.y, m.y + m.dy), y1 = Math.max(m.y, m.y + m.dy) + m.h;
  for (const g of D.gates) {
    const b = { x: g.x, y: g.y - g.h, w: g.w, h: g.h };
    const overlap = x0 < b.x + b.w && x1 > b.x && y0 < b.y + b.h && y1 > b.y;
    ok(!overlap, `mover ${m.id} keeps clear of the ${g.id} gate`);
  }
}

// ---- the crane lift bridges the gap it is there for --------------------------------------------------------------------------
{
  const m = D.movers.find(v => v.id === 'm3'), left = { x: 5360, y: 424, w: 380 }, right = { x: 6060, y: 376 };
  ok(m.x <= left.x + left.w + 16, 'the crane lift reaches back to the near deck');
  ok(m.x + m.w >= right.x - 4, 'and forward to the far deck');
  ok(Math.abs((m.y + m.dy) - right.y) <= 12, 'and stops level with the far deck, so stepping off is a step, not a leap');
}

// ---- a graze on a lift's top edge is a landing, not a wall --------------------------------------------------------------------
{
  fresh();
  q.place(5690, 424); q.P.inv = 0; q.key.right = 1;
  let minX = 1e9, landed = false;
  for (let i = 0; i < 240; i++) {
    q.update(dt);
    minX = Math.min(minX, q.P.x);
    if (q.P.ride === 'm3') landed = true;
    if (landed) break;
  }
  ok(landed, 'walking off the crane deck lands Bix on the lift');
  ok(minX > 5600, `and never throws him backwards (furthest back ${Math.round(minX)})`);
}

// ---- each switch opens a gate its own route can actually reach in time -------------------------------------------------------
function runner(opts) {
  fresh({ rails: opts.rails });
  q.place(opts.x, opts.y); q.P.inv = 0;
  let pressed = false, t0 = null, blocked = 0, climbed = 0, lastG = -9;
  const G = gate(opts.gate), look = opts.look;
  for (let i = 0; i < 60 * 30; i++) {
    const P = q.P; if (P.ground) lastG = q.now;
    if (!pressed && q.canAct) { q.act(); pressed = true; t0 = q.now }
    q.key.right = 1; q.key.up = 0;
    const lad = (D.climbs || []).find(l => P.x + 8 < l.x + l.w && P.x + P.w - 8 > l.x && P.y + 6 < l.y + l.h && P.y + P.h - 6 > l.y);
    if (lad && opts.climb && climbed < 1) { q.key.up = 1; q.key.right = 0; if (P.y + P.h < lad.y + 12) climbed = 1 }
    else if (P.hang) { q.jumpBuf = .16; q.key.jump = 1 }
    else if (!P.climb && !P.ladder && P.vy >= 0 && (P.ground || q.now - lastG < .12)) {
      const feet = P.y + P.h, ahead = P.x + P.w + look;
      const support = q.platList().some(p => Math.abs(p.y - feet) < 30 && ahead > p.x && ahead < p.x + p.w);
      if (!support) { q.key.jump = 1; q.jumpBuf = .16 }
      else if (P.ground && Math.abs(P.vx) < 40) { blocked++; if (blocked > 8) { q.key.jump = 1; q.jumpBuf = .16; blocked = 0 } }
      else { blocked = 0; q.key.jump = opts.hold ? 1 : 0 }
    } else q.key.jump = opts.hold ? 1 : 0;
    q.update(dt);
    if (q.P.x > G.x + G.w + 6 && q.P.ground) return { ok: true, t: +(q.now - t0).toFixed(2) };
    if (q.falls > 0) return { ok: false, why: 'fell at ' + Math.round(q.P.x) };
  }
  return { ok: false, why: 'ran out of time at ' + Math.round(q.P.x) };
}
const ROUTES = [
  { gate: 'cargoA',    x: 5690,  y: 424, climb: false, from: 'the end of the crane deck' },
  { gate: 'securityA', x: 12120, y: 434, climb: true,  from: 'the ladder under the left lock' },
  { gate: 'securityB', x: 14020, y: 388, climb: true,  from: 'the right lock deck' },
];
for (const r of ROUTES) {
  let best = null;
  for (const look of [-12, -8, -4, 0, 6, 10, 16, 22]) for (const hold of [true, false]) { const got = runner({ ...r, look, hold }); if (got.ok && (!best || got.t < best.t)) best = got }
  ok(best, `the route from ${r.from} reaches the ${r.gate} gate`);
  // a rail on the way can cost at most one dark cycle, and the window has to cover that too
  const worstWait = rails.filter(e => e.x > r.x && e.x < gate(r.gate).x).reduce((s, e) => s + (e.period - e.on), 0);
  const need = best.t + worstWait;
  ok(need <= gate(r.gate).seconds - 1.5,
    `${r.gate}: ${best.t}s of running plus ${worstWait.toFixed(2)}s of waiting for rails fits the ${gate(r.gate).seconds}s window with ${(gate(r.gate).seconds - need).toFixed(2)}s to spare`);
}

// ---- nothing goes non-finite, whatever the frame rate ------------------------------------------------------------------------
{
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let run = 0; run < 8; run++) {
    fresh({ rails: true }); q.place(D.start.x, D.start.y + 74);
    const step = [1 / 30, 1 / 60, 1 / 120, 1 / 240][run % 4];
    for (let i = 0; i < 40 / step; i++) {
      if (i % 12 === 0) { q.clear(); q.key.right = rnd() < .75 ? 1 : 0; q.key.left = rnd() < .12 ? 1 : 0; q.key.up = rnd() < .2 ? 1 : 0; if (rnd() < .3) { q.key.jump = 1; q.jumpBuf = .16 } if (q.canAct && rnd() < .3) q.act() }
      q.update(step);
      if (!Number.isFinite(q.P.x) || !Number.isFinite(q.P.y) || !Number.isFinite(q.P.vx) || !Number.isFinite(q.P.vy)) throw new Error(`run ${run} went non-finite at frame ${i}`);
    }
    checks++;
  }
}
console.log(JSON.stringify({ checks }));
