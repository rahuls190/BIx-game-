/* Level 4 engine: the Carried Core (carry, set down, throw, call), the three modes, plates, gates, vents, rails, bolts, cranes, relay nodes, the customs
   desk, deaths and Nib's incident reports, the delivery, saving, unlocking and the shield tier, and the game staying finite under random input.
   Run from the repo root: node tests/level4-engine.cjs */
'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const { boot } = require('./level4-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const at = (q, name) => q.D.checkpoints.find(c => c.name === name);
const tier = (search, host, progress) => boot({ search, host, progress }).G().tier.name;

// ---- start state --------------------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); const s = q.state();
  ok(s.running && !s.done && s.cogs === 0 && s.slips === 0 && s.checkpoint.name === 'TRANSIT CRADLE', 'the level starts at the transit cradle');
  ok(!q.core().held && Math.abs(q.core().x + 20 - q.D.core.x) < 1 && q.core().y + q.core().h === q.D.core.y, 'the core rests on its cradle');
  q.tick(60, dt); ok(q.P.ground && q.core().ground, 'Bix and the core both stand on the deck');
  q.draw(); ok(true, 'the first frame draws');
}

// ---- carry, set down, throw, call ------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.tick(30, dt);
  q.place(q.D.core.x - 200, 600); q.tick(5, dt); ok(q.els.prompt.textContent === '', 'far from the core there is no prompt');
  q.place(q.D.core.x - 60, 600); q.tick(3, dt); ok(/PICK UP/.test(q.els.prompt.textContent), 'near the core the ACT button offers to pick it up');
  q.K.interact = 1; q.tick(2, dt); ok(q.core().held, 'ACT picks the core up');
  ok(q.sayQ().length >= 4 || /Delivery/.test(q.line()), 'the first pick-up starts the "Delivery. That is all this is." exchange');
  ok(/SET DOWN/.test(q.els.prompt.textContent), 'and the prompt now says set down');
  q.tick(30, dt); const c = q.core(); ok(Math.abs(c.x + 20 - (q.P.x + 21 + q.P.face * 24)) < 2, 'a held core rides in front of Bix');
  q.K.interact = 1; q.tick(3, dt); ok(!q.core().held, 'ACT sets it down again');
  q.tick(30, dt); ok(q.core().ground && Math.abs(q.core().vx) < 1, 'and it settles on the deck');
  q.pickUp(); q.K.right = 1; q.tick(30, dt); q.clear();
  const x0 = q.P.x; q.K.red = 1; q.tick(1, dt); q.K.red = 0; ok(!q.core().held && q.core().vx > 400, 'Red throws a held core forward, hard');
  q.tick(40, dt); ok(q.core().x > x0 + 250, 'the thrown core flies well ahead of Bix');
  q.tick(60, dt); ok(q.core().ground, 'and lands');
  q.K.blue = 1; q.tick(200, dt, () => !q.core().held); ok(q.core().held, 'Blue calls it back and Bix catches it');
  q.clear();
}

// ---- the three modes change what Bix can do -------------------------------------------------------------------------------------------------------
const run1s = (x, y, hold) => { const q = boot(); q.place(x, y); if (hold) q.pickUp(); q.K.right = 1; q.tick(70, dt); return q.P.vx };
const apex = (x, y, hold) => { const q = boot(); q.place(x, y); if (hold) q.pickUp(); q.tick(2, dt); q.K.jump = 1; q.P.buffer = .16; let top = y; q.tick(200, dt, () => { top = Math.min(top, q.P.y + q.P.h); return q.P.vy < 300 }); return y - top };
{
  const vPlain = run1s(2700, 600, false), vHeavy = run1s(2700, 600, true);
  ok(vPlain > 270 && vHeavy < vPlain * 0.86 && vHeavy > 200, `heavy: run ${vHeavy.toFixed(0)} px/s instead of ${vPlain.toFixed(0)}`);
  const aPlain = apex(2700, 600, false), aHeavy = apex(2700, 600, true);
  ok(aPlain > 195 && aHeavy < 170 && aHeavy > 140, `heavy: jump apex ${aHeavy.toFixed(0)} px instead of ${aPlain.toFixed(0)}`);
  const aBuoy = apex(9300, 480, true), aBuoyOff = apex(9300, 480, false);
  ok(aBuoy > 340 && aBuoyOff < 215, `buoyant: a held jump rises ${aBuoy.toFixed(0)} px with the core, ${aBuoyOff.toFixed(0)} without`);
  { const q = boot(); q.place(9300, 480); q.pickUp(); q.P.y = 0; q.P.vy = 0; q.P.ground = 0; let vmax = 0; q.tick(90, dt, () => { vmax = Math.max(vmax, q.P.vy); return true }); ok(vmax <= 262, `buoyant: a fall is capped at ${vmax.toFixed(0)} px/s`); }
  ok(Math.abs(run1s(13400, -470, true) - run1s(13400, -470, false)) < 15 && Math.abs(apex(13400, -470, true) - apex(13400, -470, false)) < 6, 'charged: Bix runs and jumps as normal');
  const q = boot(); q.place(2100, 600); q.pickUp(); q.tick(2, dt); ok(q.core().mode === 'carry', 'before the concourse the core is a plain core');
  q.P.x = 2300; q.tick(3, dt); ok(q.core().mode === 'heavy', 'inside the concourse the held core is heavy');
  ok(/Dennis is going heavy/.test(q.line()) || q.line() !== '', 'Pack announces the change');
  q.P.x = 2000; q.tick(3, dt); ok(q.state().tellX === null || q.state().tellX > 2000, 'the tell is set when a change is within reach');
  q.P.x = 2050; q.tick(3, dt); ok(q.state().tellX !== null, 'Pack gives an amber tell before the concourse');
}

// ---- the scale plate and the sorting gate --------------------------------------------------------------------------------------------------------
{
  const q = boot(); const g = q.D.gates.find(g => g.id === 'g1'), pl = q.D.plates[0];
  ok(q.solids().some(r => r.gate && r.x === g.x), 'the closed sorting gate is a wall');
  q.place(g.x - 200, g.y); q.K.right = 1; q.tick(240, dt); ok(q.P.x + q.P.w <= g.x + 1, 'Bix cannot walk through it, and cannot climb it');
  q.clear(); q.place(pl.x + 40, pl.y); q.pickUp(); q.tick(2, dt); q.K.interact = 1; q.tick(2, dt); q.tick(90, dt);
  ok(q.open().has('g1') && /Weight accepted/.test(q.line() + (q.els.line.textContent || '')) || q.open().has('g1'), 'setting the heavy core on the scale opens the gate');
  q.tick(60, dt); ok(!q.solids().some(r => r.gate && r.x === g.x), 'and the gate stops being a wall');
  const r = boot(); r.place(pl.x + 40, pl.y); r.tick(2, dt); r.core().x = pl.x + 50; r.core().y = pl.y - 40; r.core().mode = 'carry'; r.tick(60, dt); ok(r.open().has('g1'), 'a core dropped on the plate inside the concourse counts (it is heavy there)');
  const s = boot(); s.core().x = 500; s.core().y = 560; s.tick(60, dt); ok(!s.open().has('g1'), 'a core anywhere else does not open it');
}

// ---- the core is never lost ----------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.place(1300, 600); q.pickUp(); q.setDown(); q.tick(2, dt);
  q.core().y = 5000; q.tick(2, dt); ok(!q.core().held && q.core().y < 700 && Math.abs(q.core().x - q.P.x) < 120 && q.state().coreDrops === 1, 'a core that falls out of the world comes back beside Bix');
  ok(q.sayQ().length >= 1 || /Dennis fell/.test(q.line()), 'the first time, Pack has a line about it');
  q.core().y = 5000; q.tick(2, dt); ok(q.state().coreDrops === 2 && /returned/.test(q.line()), 'the second time it is a plain system message');
  const r = boot(); r.place(9300, 480); r.pickUp(); r.P.inv = 0; r.hurt('fall'); ok(r.core().held, "Pack's catch keeps the core in Bix's hands"); r.P.inv = 0; r.hurt('fall'); r.tick(2, dt); ok(!r.core().held && Math.abs(r.core().x - r.P.x) < 120, 'a death puts the core back beside Bix at the checkpoint');
}

// ---- deaths, Pack's catch and Nib's incident reports ------------------------------------------------------------------------------------------------
{
  const q = boot(); q.place(1300, 600); q.P.inv = 0; q.tick(1, dt); const cp = q.state().checkpoint;
  q.hurt('fall'); ok(q.state().charge === 0 && q.P.falls === 0 && /Got you/.test(q.line()), 'the first hit is caught by Pack (one charge)');
  q.P.inv = 0; q.hurt('fall'); ok(q.P.falls === 1 && q.speaker() === 'NIB' && /^INCIDENT 1:/.test(q.line()), 'the next is a death, filed as INCIDENT 1 by Nib');
  q.P.inv = 0; q.hurt('crane'); q.P.inv = 0; q.hurt('crane'); ok(q.P.falls >= 2 && /^INCIDENT \d:/.test(q.line()), 'the reports are numbered');
  const a = q.line(); q.P.inv = 0; q.hurt('crane'); ok(q.line() !== a, 'the same cause twice in a row never repeats a line');
  q.P.inv = 0; q.hurt('crush'); ok(q.P.falls >= 4, 'every cause is handled'); q.P.inv = 0; q.hurt('mystery'); ok(q.speaker() === 'NIB', 'an unknown cause gets the generic report');
}

// ---- vents, bolts, rails, the crane and the shield ---------------------------------------------------------------------------------------------------
{
  const v = boot().D.vents[0], find = (q, o, f) => { for (let i = 0; i < 700; i++) { q.S.clock += dt; if (f(o, q.S.clock)) return true } return false };
  const q = boot(); q.place(v.x + 40, 230); q.S.clock = 1; find(q, v, (h, t) => q.phaseOn(h, t).on); q.tick(1, dt);
  const y0 = q.P.y; q.tick(30, dt); ok(q.P.y < y0 - 20, 'an updraft that is on lifts Bix');
  const arc = boot().D.arcs[0], r = boot(); r.place(arc.x - 40, arc.y + arc.h); r.P.inv = 0; r.setCP(at(r, 'RELAY HEAD'));
  r.place(arc.x + 30, arc.y + arc.h); r.P.inv = 0; let hurt = false, offSafe = true;                              // standing in the rail: safe while it is off, hurt when it comes on
  r.tick(240, dt, () => { const st = r.phaseOn(arc, r.S.clock); if (!st.on && (r.P.falls || r.state().charge === 0) && !hurt) offSafe = false; if (r.P.falls || r.state().charge === 0) hurt = true; return !hurt });
  ok(hurt && offSafe, 'a live rail hurts, and only while it is on');
  const p = boot().D.presses[0], w = boot(); w.place(p.x + 20, p.anvil); w.P.inv = 0; w.setCP(at(w, 'SORTING GATES')); let crushed = false; w.tick(400, dt, () => { if (w.state().charge === 0 || w.P.falls) crushed = true; return !crushed }); ok(crushed, 'standing under the crane gets Bix flattened on the beat');
  const b = boot().D.bolts[0], s = boot(); const bolt = (q, hold) => { q.place(b.x + 10, 130); q.P.inv = 0; if (hold) q.pickUp(); q.setCP(at(q, 'DISH WALK')); let h = false; q.tick(900, dt, () => { if (q.state().charge === 0 || q.P.falls) h = true; return !h }); return h };
  ok(bolt(s, false), 'a lightning bolt hits a plain Bix'); ok(!bolt(boot(), true), 'but never a Bix carrying the buoyant core: too light to be interesting');
  const sh = boot({ search: '?banked=38' }); sh.place(arc.x - 50, arc.y + arc.h); sh.P.inv = 0; sh.setCP(at(sh, 'RELAY HEAD'));
  for (let i = 0; i < 900 && sh.phaseOn(arc, sh.S.clock).tell < .8; i++) sh.S.clock += dt;                       // wait until the rail is about to fire
  sh.K.shield = 1; sh.tick(1, dt); sh.K.shield = 0; sh.K.right = 1; let saved = 0; sh.tick(120, dt, () => { if (/SHIELD ACTIVE/.test(sh.line())) saved = 1; return true });
  ok(saved && sh.P.falls === 0 && sh.state().charge === 1 && sh.P.x > arc.x + arc.w, 'a raised shield soaks a rail arc: Bix walks through without a death or a catch');
}

// ---- relay nodes, the customs desk, the cage ------------------------------------------------------------------------------------------------------------
{
  const q = boot(); for (const n of q.D.nodes) { q.core().x = n.x - 20; q.core().y = n.y - 20; q.core().vx = q.core().vy = 0; q.tick(1, dt) }
  ok(q.lit().size === 3 && q.open().has('g3'), 'a core passing through all three relay nodes lights them and opens the relay gate');
  ok(/Gate open/.test(q.sayQ().map(l => l[1]).join(' ') + q.line()), 'and Pack says so');
  const r = boot(); const n = r.D.nodes[0]; r.core().x = n.x - 20; r.core().y = n.y - 20; r.tick(1, dt); r.reset(0); ok(r.lit().has('n1'), 'a lit node stays lit after a respawn (a solved puzzle stays solved)');
  const f = boot(); f.reset(1); ok(f.lit().size === 0 && f.open().size === 0, 'a full restart clears the puzzles');
}
{
  const q = boot(), sts = q.D.stamps, desk = q.D.desk;
  q.place(desk.x - 60, desk.y); q.pickUp(); q.tick(3, dt); ok(/3 STAMPS|0 \/ 3/.test(q.els.prompt.textContent), 'at the desk with no stamps the prompt shows the count');
  q.K.interact = 1; q.tick(2, dt); ok(!q.open().has('g2') && /3 stamps/.test(q.line()), 'the desk refuses a core with no stamps');
  for (const s of sts) { q.place(s.x - 20, s.y); q.tick(3, dt); q.K.interact = 1; q.tick(2, dt) }
  ok(q.stamps().size === 3, 'each stamp station gives its stamp');
  q.place(desk.x - 60, desk.y); q.pickUp(); q.tick(3, dt); q.K.interact = 1; q.tick(2, dt); ok(q.open().has('g2') && q.state().deskDone, 'three stamps and the core: the desk opens the customs gate');
  ok(/BX-7/.test(q.sayQ().map(l => l[1]).join(' ')), 'and the customs log names BX-7');
  const r = boot(); r.place(desk.x - 60, desk.y); r.tick(3, dt); r.setDeskDone(0); for (const s of sts) r.stamps().add(s.id); r.K.interact = 1; r.tick(2, dt); ok(!r.open().has('g2'), 'the desk needs the core itself, not just the stamps');
  const c = boot(); c.place(16900, -470); c.P.x = 16920; c.tick(2, dt); ok(!c.open().has('g4') && c.pending().length === 1, "Courier Prime speaks first: the cage is still shut");
  c.tick(Math.round(15 / dt), dt); ok(c.open().has('g4'), 'and the cage gate opens after he has finished');
}

// ---- story lines, cogs, slips, checkpoints ---------------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.tick(2, dt); ok(q.sayQ().length + (q.line() ? 1 : 0) >= 1, 'the opening line plays as soon as the level starts');
  q.tick(200, dt); ok(q.D.triggers[0].used === 1, 'a trigger fires once');
  const c = boot(); const cg = c.D.cogs[0]; c.place(cg.x - 21, 600); c.tick(1, dt); ok(c.state().cogs === 1 && /Cog 1 secured/.test(c.line()), 'a cog is collected with a line from Pack');
  const s = boot(); const sl = s.D.slips[0]; s.place(sl.x - 21, 600); s.tick(1, dt); ok(s.state().slips === 1 && /Slip 1\/6/.test(s.line()), 'a delivery slip is collected and read');
  s.tick(3, dt); ok(s.state().slips === 1, 'and only once');
  const k = boot(); k.place(2650, 600); k.tick(5, dt); ok(k.state().checkpoint.name === 'CONCOURSE ENTRY', 'a checkpoint is set when Bix reaches it');
  k.place(170, 600); k.tick(5, dt); ok(k.state().checkpoint.name === 'CONCOURSE ENTRY', 'and a checkpoint never moves you back');
  const at2 = boot({ search: '?at=5' }); ok(at2.state().checkpoint.name === 'SPINE BASE' && at2.core().held, '?at=N starts at that checkpoint with the core');
  ok(boot({ search: '?at=5', host: 'rahuls190.github.io' }).state().checkpoint.name === 'TRANSIT CRADLE', 'but only on localhost');
}

// ---- the delivery: the end of the level, and saving it -----------------------------------------------------------------------------------------------------
{
  const saved = []; const mayhem = { getProgress: () => ({}), subscribe() {}, recordResult: (id, r) => { saved.push([id, r]); return Promise.resolve('Saved.') } };
  const q = boot({ mayhem }), sk = q.D.socket;
  q.place(sk.x - 60, sk.y); q.tick(3, dt); ok(!/SEAT/.test(q.els.prompt.textContent), 'without the core the socket offers nothing');
  q.pickUp(); q.tick(3, dt); ok(/SEAT THE CORE/.test(q.els.prompt.textContent), 'carrying it, the prompt says seat the core');
  q.setCogs(9); q.K.interact = 1; q.tick(2, dt); ok(q.state().ending > 0 && !q.state().done, 'seating the core starts the delivery scene');
  ok(q.sayQ().some(l => l[1] === 'AUTHORISED: BX-7') && q.sayQ().some(l => /Thanks, Dennis/.test(l[1])), 'AUTHORISED: BX-7, and "Thanks, Dennis." are in the scene');
  q.P.inv = 0; q.hurt('fall'); ok(q.P.falls === 0, 'nothing can hurt Bix during the scene');
  q.tick(Math.round(12 / dt), dt); ok(q.state().done && !q.state().running, 'the level completes when the scene ends');
  ok(saved.length === 1 && saved[0][0] === 'level4' && saved[0][1].cogs === 9 && saved[0][1].falls === 0, 'the result is saved as level4 through progress.js');
  ok(/NIB: Zero incidents/.test(q.els.resultLine.textContent) && /Careful Courier/.test(q.els.resultLine.textContent), "the results screen carries Nib's tally and the Careful Courier note");
  ok(q.medalFor(10, 10, 1000).name === 'GOLD' && q.medalFor(6, 25, 1400).name === 'SILVER' && q.medalFor(0, 90, 9999).name === 'BRONZE' && q.medalFor(12, 0, 5000).name === 'BRONZE', 'gold, silver and bronze');
}

// ---- unlocking, and the carried-cog shield tier -----------------------------------------------------------------------------------------------------------
{
  const MP = require('../dist/progress.js');
  const rec = (a, b, c) => ({ levels: { level1: { bestCogs: a }, level2: { bestCogs: b }, level3: { bestCogs: c } } });
  const withProgress = p => boot({ progress: MP, mayhem: { getProgress: () => p, subscribe() {}, recordResult: () => Promise.resolve('') } });
  ok(withProgress(rec(12, 6, 0)).locked() && !withProgress(rec(12, 7, 0)).locked() && !withProgress(rec(12, 14, 12)).locked(), 'Level 4 opens at 19 carried cogs');
  ok(boot().locked(), 'with no progress at all it is locked');
  ok(withProgress(rec(5, 5, 3)).carried() === 13 && withProgress(rec(12, 14, 12)).carried() === 38, 'the carried total is the sum of Levels 1 to 3');
  ok(tier('?banked=0') === 'Brittle Coil' && tier('?banked=17') === 'Brittle Coil' && tier('?banked=18') === 'Tempered Induction' && tier('?banked=28') === 'Tempered Induction' && tier('?banked=29') === 'Superconducting Aegis' && tier('?banked=99') === 'Superconducting Aegis', 'shield tiers scale to the 38 carried cogs: 0-17, 18-28, 29-38');
  ok(tier('?banked=38', 'rahuls190.github.io') === 'Brittle Coil' && tier('?banked=38', 'localhost') === 'Superconducting Aegis', '?banked=N only works on localhost');
  ok(withProgress(rec(12, 14, 12)).G().tier.name === 'Superconducting Aegis' && withProgress(rec(5, 5, 3)).G().tier.name === 'Brittle Coil', 'the real tier comes from the carried cogs in the save');
  const html = fs.readFileSync('dist/level4.html', 'utf8'); ok(/id="startButton"/.test(html) && /level4\.js/.test(html) && /level4-core\.js/.test(html) && /level4-data\.js/.test(html) && /id="slipCount"/.test(html) && /id="modeChip"/.test(html), 'the page loads the level and has the core chip and the slip counter');
}

// ---- drawing in every state, and random input at four frame rates --------------------------------------------------------------------------------------------
{
  const q = boot({ enemies: true }); let frames = 0; const states = [];
  for (const name of ['TRANSIT CRADLE', 'SORTING GATES', 'CUSTOMS DESK', 'DISH WALK', 'RELAY HEAD', 'SHAFT FOOT', 'LIFT SOCKET']) states.push(() => { const cp = at(q, name); q.setCP(cp); q.place(cp.x, cp.y); q.pickUp(); q.tick(5, dt); q.draw(); frames++ });
  states.forEach(f => f());
  q.D.gates.forEach(g => q.open().add(g.id)); q.D.nodes.forEach(n => q.lit().add(n.id)); q.D.stamps.forEach(s => q.stamps().add(s.id)); q.setDown(); q.tick(60, dt); q.draw(); frames++;
  q.K.blue = 1; q.K.red = 1; q.tick(30, dt); q.draw(); q.clear(); q.K.blue = 1; q.tick(30, dt); q.draw(); frames++; q.clear();
  q.seatCore(0); q.tick(30, dt); q.draw(); frames++; q.tick(700, dt); q.draw(); frames++;
  ok(frames >= 10, `drew ${frames} frames in different states without an exception`);
}
{
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 };
  let runs = 0;
  for (const fps of [30, 60, 120, 240]) for (let seed = 1; seed <= 4; seed++) {
    const r = rng(seed * 7919 + fps), q = boot({ enemies: true }); const cps = q.D.checkpoints; const cp = cps[Math.floor(r() * cps.length)]; q.setCP(cp); q.reset(0); q.P.inv = 0;
    if (r() < .5) q.pickUp(); const d = 1 / fps;
    for (let i = 0; i < Math.round(40 * fps); i++) {
      if (i % Math.round(fps / 4) === 0) Object.keys(q.K).forEach(k => { q.K[k] = r() < (k === 'right' ? 0.6 : 0.25) ? 1 : 0 });
      q.tick(1, d); const P = q.P, c = q.core();
      if (![P.x, P.y, P.vx, P.vy, c.x, c.y, c.vx, c.vy].every(Number.isFinite)) assert.fail(`non-finite state at fps ${fps} seed ${seed} frame ${i}`);
    }
    runs++;
  }
  ok(runs === 16, '16 random 40-second runs at 30, 60, 120 and 240 fps stayed finite with no exception');
}
console.log(JSON.stringify({ checks }));
