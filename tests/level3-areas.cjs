/* Level 3, Areas 4-6 and the ending: the Polarity Lab, the Ore Train, the High Vault, the transit door and the archive.
   Run from the repo root: node tests/level3-areas.cjs
   Everything here plays the REAL dist/level3.js through tests/level3-harness.cjs. The lab, the train and the vault are all proven completable
   by a scripted player, and each hazard is proven to be a hazard (standing still or doing the wrong thing loses) and to have its answer. */
'use strict';
const assert = require('assert');
const { boot } = require('./level3-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (got ${a}, wanted ${b} +- ${tol})`);
const dt = 1 / 60;
const at = name => boot().D.checkpoints.find(c => c.name === name);

// ================================================================ AREA 4: the Polarity Lab
{
  const q = boot({ enemies: true }); q.D.drones.forEach(d => { d.dead = 1 }); q.setDrones([]);
  const T0 = q.D.terminals[0], T1 = q.D.terminals[1], SA = q.D.sockets[0], SB = q.D.sockets[1];
  ok(q.D.cogs.length === 12 && q.D.terminals.length === 2 && q.D.cores.length === 2 && q.D.gates.length === 1, 'the lab has two terminals, two cores, a gate; the level has 12 cogs');
  ok(q.gateBlocking() && q.solids().some(s => s.gate), 'the boarding gate starts shut and is solid');

  // ACT at a terminal sends Pack to hold it for 24 s
  q.place(T0.x - 21, T0.y); q.K.interact = 1; q.tick(2, dt);
  ok(q.terms()[0].t > 23.8 && q.terms()[0].t <= 24, 'ACT at a terminal starts a 24 s hold'); ok(/Holding the terminal/.test(q.line()), 'Pack says so');
  q.K.interact = 0;
  // the hold runs out: an unseated core drops back
  q.cores()[0].x = 9000; q.tick(Math.round(24.2 / dt), dt);
  ok(q.terms()[0].t === 0 && q.cores()[0].x === q.D.cores[0].start, 'when the hold ends an unseated core drops back to its start');

  // Core A: Blue pulls it to Bix, who stands at socket A on the pedestal
  const q2 = boot(); q2.setEnemies([]); q2.setDrones([]); q2.D.lasers = []; q2.D.chutes = [];
  q2.place(T0.x - 21, T0.y); q2.K.interact = 1; q2.tick(2, dt); q2.K.interact = 0;
  q2.place(SA.x - 30, SA.y); q2.K.blue = 1; let t = 0;
  while (t < 8 && !q2.seated().has('SA')) { q2.tick(1, dt); t += dt }
  ok(q2.seated().has('SA'), 'holding Blue at socket A pulls core A in and seats it'); ok(t > 1.8 && t < 3.5, `core A seats in ${t.toFixed(1)} s (240 px/s over about 540 px)`);
  ok(/Core seated/.test(q2.line()), 'Pack says "Core seated"'); ok(q2.cores()[0].x === SA.x, 'the core sits on its socket'); ok(q2.gateBlocking(), 'one socket does not open the gate');
  // without Pack holding a terminal the glove does nothing to a core
  const q3 = boot(); q3.setEnemies([]); q3.setDrones([]); q3.place(SA.x - 30, SA.y); q3.K.blue = 1; q3.tick(300, dt);
  ok(q3.cores()[0].x === q3.D.cores[0].start, 'a core does not move unless Pack is holding its terminal');

  // only one terminal can be held at a time
  q2.K.blue = 0; q2.place(T1.x - 21, T1.y); q2.K.interact = 1; q2.tick(2, dt); q2.K.interact = 0;
  ok(q2.terms()[1].t > 23 && q2.terms()[0].t === 0, 'holding the second terminal lets go of the first (Pack is one robot)');
  // Core B: Red pushes it away along the rail into socket B
  q2.G().heat = 0; q2.K.red = 1; t = 0;       // the walk between the two puzzles cools the glove
  while (t < 9 && !q2.seated().has('SB')) { q2.tick(1, dt); t += dt }
  ok(q2.seated().has('SB'), 'holding Red at the second terminal pushes core B into socket B'); ok(t > 2.5 && t < 5, `core B seats in ${t.toFixed(1)} s`);
  ok(!q2.gateBlocking() && !q2.solids().some(s => s.gate), 'both sockets seated: the gate opens and is no longer solid'); ok(/Unscheduled rail usage/.test(q2.line()), 'VELA comments on the gate');
  // solved puzzles stay solved through a respawn; a full restart clears them
  q2.P.inv = 0; q2.reset(0); ok(q2.seated().has('SA') && q2.seated().has('SB') && q2.cores()[0].x === SA.x, 'a respawn keeps the seated cores');
  q2.reset(1); ok(q2.seated().size === 0 && q2.cores()[0].x === q2.D.cores[0].start && q2.gateBlocking(), 'a full restart puts the lab back');
  // the gate really blocks
  const q4 = boot(); q4.setEnemies([]); q4.setDrones([]); q4.place(q4.D.gates[0].x - 200, q4.D.gates[0].y); q4.K.right = 1; q4.tick(200, dt);
  ok(q4.P.x + q4.P.w <= q4.D.gates[0].x + 1, 'a shut gate stops Bix');
  // Core A can also be pushed from the terminal side (either colour works, as the design allows)
  const q5 = boot(); q5.setEnemies([]); q5.setDrones([]); q5.place(T0.x - 21, T0.y); q5.K.interact = 1; q5.tick(2, dt); q5.K.interact = 0; q5.K.red = 1; q5.tick(Math.round(6 / dt), dt);
  ok(q5.seated().has('SA'), 'core A can be pushed home with Red from the terminal too');
  // Field Boost (4 cogs) makes cores 30% faster
  const q6 = boot(); q6.setEnemies([]); q6.setDrones([]); q6.setCogs(4); q6.place(T0.x - 21, T0.y); q6.K.interact = 1; q6.tick(2, dt); q6.K.interact = 0; q6.K.red = 1;
  const x0 = q6.cores()[0].x; q6.tick(60, dt); near(q6.cores()[0].x - x0, 240 * 1.3, 10, 'from 4 cogs a core moves 30% faster');
}

// ---- lasers, the chute, the drones ---------------------------------------------------------------------------------------------
{
  const q = boot({ enemies: true }); q.setDrones([]); const L = q.D.lasers[0];
  const st = c => { q.S.clock = c; return q.laserState(L, c) };
  ok(!st(0.2).on && st(0.2).tell === 0, 'a beam is safe at the start of its cycle'); ok(!st(1.3).on && st(1.3).tell > 0.3, 'the lamp warns before the beam fires'); ok(st(1.7).on && st(4.7).on, 'the beam is on for the last 1.4 s of the 3.0 s cycle');
  let onT = 0; for (let i = 0; i < 3000; i++) if (q.laserState(L, i / 1000).on) onT++; near(onT, 1400, 2, 'the beam is on for 1.4 s of every 3.0 s');
  ok(q.D.lasers[1].phase === 1.5, 'the two grids are half a cycle apart');
  // standing in the beam while it is off is fine; the same spot when it fires is lethal
  q.S.clock = 0.1; q.place(L.x - 21, L.y); q.setCP(q.D.checkpoints.find(c => c.name === 'LAB GANTRY')); q.P.inv = 0; const c0 = q.state().charge;
  q.tick(30, dt); ok(q.state().charge === c0, 'standing in a beam that is off is safe');
  q.S.clock = 1.75; q.place(L.x - 21, L.y); q.P.inv = 0; q.tick(6, dt); ok(q.state().charge !== c0 || q.P.falls > 0, 'the beam is lethal when on');
  // a run across a beam that is off gets through: the crossing takes well under the 1.6 s the beam is off
  const q2 = boot({ enemies: true }); q2.setDrones([]); q2.D.chutes = []; q2.S.clock = 0.05; q2.place(L.x - 95, L.y); q2.P.inv = 0; q2.K.right = 1; const ch0 = q2.state().charge;
  q2.tick(Math.round(0.9 / dt), dt); ok(q2.P.x > L.x + 20 && q2.state().charge === ch0, 'running across a beam that has just gone off is safe');
}
{
  const q = boot({ enemies: true }); q.setDrones([]); q.D.lasers = []; const C = q.D.chutes[0];
  q.place(C.x - 300, C.y); q.P.inv = 999; q.tick(Math.round(12 / dt), dt);
  ok(q.blocks().filter(b => b.landed).length <= 3, 'at most three landed blocks stay'); ok(q.blocks().length >= 1, 'the chute drops blocks');
  // a block drops on Bix if he stands under it
  const q2 = boot({ enemies: true }); q2.setDrones([]); q2.D.lasers = []; q2.setCP(q2.D.checkpoints.find(c => c.name === 'LAB GANTRY')); q2.place(C.x - 21, C.y); q2.P.inv = 0;
  const c2 = q2.state().charge; q2.tick(Math.round(4.5 / dt), dt); ok(q2.state().charge !== c2 || q2.P.falls > 0, 'standing under the chute is lethal');
  // Red deflects it: Bix stands to the left of the drop, holds Red, and the block goes right
  const q3 = boot({ enemies: true }); q3.setDrones([]); q3.D.lasers = []; q3.place(C.x - 150, C.y); q3.P.inv = 999; q3.K.red = 1; q3.G().heat = 0;
  let dx = 0; for (let i = 0; i < 400 && !dx; i++) { q3.tick(1, dt); q3.G().heat = 0; const b = q3.blocks().find(k => !k.landed); if (b && b.y > C.top + 60) dx = b.vx }
  ok(dx > 0, 'holding Red deflects a falling block away from Bix');
}
{
  const q = boot({ enemies: true }); const d0 = q.drones().find(d => d.id === 'DB0'); q.D.lasers = []; q.setDrones([d0]);
  q.place(d0.x - 200, -380); q.P.inv = 999; q.tick(2, dt);
  const dist = () => Math.hypot(d0.x - (q.P.x + 21), d0.y - (q.P.y + 48));
  const before = dist(); q.K.blue = 1; q.tick(30, dt); ok(dist() > before, 'a Blue drone flies away from a Blue field'); q.K.blue = 0; q.G().heat = 0;
  const q2 = boot({ enemies: true }); const d1 = q2.drones().find(d => d.id === 'DB0'); q2.D.lasers = []; q2.setDrones([d1]); q2.place(d1.x - 200, -380); q2.P.inv = 999; q2.tick(2, dt);
  const b2 = Math.hypot(d1.x - (q2.P.x + 21), d1.y - (q2.P.y + 48)); q2.K.red = 1; q2.tick(30, dt); ok(Math.hypot(d1.x - (q2.P.x + 21), d1.y - (q2.P.y + 48)) < b2, 'the opposite colour draws it in');
  // touching one is lethal; a shield destroys it
  const q3 = boot({ enemies: true }); const d3 = q3.drones().find(d => d.id === 'DR0'); q3.D.lasers = []; q3.setDrones([d3]); q3.setCP(q3.D.checkpoints.find(c => c.name === 'LAB GANTRY'));
  q3.place(d3.x - 21, -380); q3.P.inv = 0; const c3 = q3.state().charge; q3.tick(10, dt); ok(q3.state().charge !== c3, 'touching a drone is lethal');
  const q4 = boot({ enemies: true }); const d4 = q4.drones().find(d => d.id === 'DR0'); q4.D.lasers = []; q4.setDrones([d4]); q4.place(d4.x - 200, -380); q4.P.inv = 0; q4.K.shield = 1; q4.tick(1, dt); d4.x = q4.P.x + 21; d4.y = q4.P.y + 48; q4.tick(4, dt);       // the shield goes up first, then the drone arrives
  ok(d4.dead === 1 && q4.state().charge === 1, 'a shield touch destroys a drone and costs nothing');
  // a respawn brings the drones back
  q4.reset(0); ok(q4.drones().every(d => !d.dead), 'a respawn restores the drones');
}

// ================================================================ AREA 5: the Ore Train
const TR = boot().D.train;
function ride(opts = {}) {
  const q = boot(); q.setEnemies([]); q.setDrones([]); q.setCP(q.D.checkpoints.find(c => c.name === 'RAIL HEAD'));
  q.D.triggers.forEach(t => { t.used = 1 });        // the captions along the way have played
  q.reset(0); q.tick(3, dt); q.P.inv = 0; q.K.right = 0; q.P.falls = 0;
  if (opts.only) q.train().obs = q.train().obs.filter(o => opts.only(o));         // (a respawn rebuilds the train, so filter after it)
  return q;
}
{
  const q = ride(); ok(q.P.ground && q.P.support && q.P.support.mv === 'bed', 'the rail head respawn stands Bix on the bed'); ok(!q.train().run, 'the train waits for Bix');
  q.tick(Math.round(1.7 / dt), dt); ok(!q.train().run && /Jolt ahead/.test(q.line()), 'Pack warns him on boarding'); q.tick(Math.round(0.5 / dt), dt); ok(q.train().run === 1, 'the train departs 2 s after Bix boards');
  // stepping off the bed resets the countdown
  const q2 = ride(); q2.tick(60, dt); q2.P.x = TR.start - 300; q2.P.y = TR.y - 400; q2.tick(120, dt); ok(!q2.train().run, 'the train does not leave without Bix');
}
{
  // determinism and length of the ride: a still Bix on a train with no obstacles reaches the buffers the same way every time
  const runs = [1 / 120, 1 / 60, 1 / 30].map(d => {
    const q = ride({ only: () => false }); q.tick(Math.round(2.2 / d), d); ok(q.train().run === 1, 'departed'); let t = 0;
    while (!q.train().done && t < 30) { q.tick(1, d); t += d }
    return { t, x: q.train().x, landed: q };
  });
  runs.forEach(r => ok(r.t > 11 && r.t < 14, `the ride from departure to the buffers takes ${r.t.toFixed(1)} s (the design says about 13)`));
  near(runs[0].t, runs[1].t, 0.1, 'the ride takes the same time at 120 and 60 fps'); near(runs[1].t, runs[2].t, 0.1, 'and at 60 and 30 fps');
  near(runs[1].x + TR.len, TR.buffer, 40, 'the bed stops at the buffers');
  // the launch: Bix is thrown on a fixed arc and always lands on the vault threshold
  const q = runs[1].landed; q.tick(Math.round(TR.flight / (1 / 60)) + 30, 1 / 60);
  const th = q.D.platforms[19]; ok(!q.flight() && q.P.ground && q.P.support && Math.abs(q.P.y + q.P.h - th[1]) < 2 && q.P.x >= th[0] && q.P.x <= th[0] + th[2], 'the buffer launch lands Bix on the vault threshold');
}
{
  // wherever Bix is on the bed (rear, front, mid-jump) the launch lands him in the same place
  const lands = [[TR.start + 10, 0], [TR.start + 380, 0], [TR.start + 200, 1]].map(([off, air]) => {
    const q = ride({ only: () => false }); q.tick(Math.round(2.2 / dt), dt);
    q.P.x = q.train().x + off; if (air) { q.P.vy = -700; q.P.ground = 0 }
    let t = 0; while (!q.train().done && t < 30) { q.tick(1, dt); t += dt; if (q.P.y > TR.y + 60) break }
    q.tick(Math.round(TR.flight / dt) + 40, dt); return { x: q.P.x, y: q.P.y, ground: q.P.ground, falls: q.P.falls };
  });
  lands.forEach(l => ok(l.ground && l.falls === 0 && Math.abs(l.x - lands[0].x) < 4, `the launch always lands on the threshold, whatever the start (${l.x.toFixed(0)}, falls ${l.falls})`));
}
// ---- each hazard: standing still loses, the answer wins ---------------------------------------------------------------------------
function runFor(q, seconds, policy) { let t = 0; while (t < seconds && !q.state().done) { policy && policy(q, t); q.tick(1, dt); t += dt; if (q.P.falls > (q.__f0 ?? 0)) return false } return true }
function survives(only, policy, seconds = 6) {
  const q = ride({ only }); q.__f0 = 0; q.tick(Math.round(2.2 / dt), dt); ok(q.train().run === 1, 'departed');
  q.P.x = q.train().x + 210;                                                        // mid-bed
  const alive = runFor(q, seconds, policy); return { alive, q };
}
const J1 = o => o.k === 'J' && o.at === 12100;
{
  ok(!survives(J1, null, 3).alive, 'a jolt throws Bix off if he does not hold Blue');
  ok(survives(J1, (q) => { q.K.blue = q.train().obs.some(o => o.k === 'J' && o.st === 2) ? 1 : 0 }, 3).alive, 'holding Blue through the jolt keeps him on');
  ok(survives(J1, (q) => { q.K.blue = q.train().obs.some(o => o.k === 'J' && o.st === 2 && o.t > 0.2 && o.t < 0.75) ? 1 : 0 }, 3).alive, 'a 0.5 s hold in the middle of the window is enough');
  ok(!survives(J1, (q) => { q.K.blue = q.train().obs.some(o => o.k === 'J' && o.st === 2 && o.t > 0.6 && o.t < 0.85) ? 1 : 0 }, 3).alive, 'a hold shorter than 0.4 s is not');
  const s = survives(J1, (q) => { q.K.blue = q.train().obs.some(o => o.k === 'J' && o.st === 2) ? 1 : 0 }, 3); ok(s.q.G().heat < 40, `a jolt costs about 8-18% heat (${s.q.G().heat.toFixed(0)}%)`);
  // the amber lamps come 0.6 s ahead
  const q = ride({ only: J1 }); q.tick(Math.round(2.2 / dt), dt); let lampAt = null, jolt = null, t = 0;
  while (t < 5 && jolt === null) { q.tick(1, dt); t += dt; const o = q.train().obs[0]; if (o.st === 1 && lampAt === null) lampAt = t; if (o.st === 2) jolt = t }
  ok(lampAt !== null && jolt - lampAt > 0.45 && jolt - lampAt < 0.9, `the lamps flash ${(jolt - lampAt).toFixed(2)} s before the jolt (design: 0.6 s)`);
}
{
  const R1 = o => o.k === 'R' && o.at === 12500;
  ok(!survives(R1, null, 4).alive, 'standing still under a falling rock loses');
  // Red deflects it: hold Red while a rock is in the air or on the bed
  ok(survives(R1, (q) => { q.K.red = q.train().things.some(th => th.k === 'R') ? 1 : 0 }, 4).alive, 'holding Red throws the rock clear');
  // or jump it: the rock rolls back along the bed at 210 px/s and is 56 px tall
  ok(survives(R1, (q) => { const th = q.train().things.find(k => k.k === 'R' && k.ph === 'roll'); const rx = th ? q.train().x + th.bx : 0; q.K.jump = th && Math.abs(rx - (q.P.x + 21)) < 150 && rx > q.P.x + 21 && q.P.ground ? 1 : 0; if (q.K.jump) q.P.buffer = 0.16 }, 4).alive, 'or jump it');
  const G1 = o => o.k === 'G' && o.at === 12900;
  ok(!survives(G1, null, 5).alive, 'a swing-load at head height hits a still Bix');
  ok(survives(G1, (q) => { q.K.red = q.train().things.some(th => th.k === 'G') ? 1 : 0 }, 5).alive, 'Red pushes the swing-load up and away');
  const D1 = o => o.k === 'D' && o.at === 13300;
  ok(!survives(D1, null, 9).alive, 'a rogue drone hits a still Bix');
  ok(survives(D1, (q) => { const th = q.train().things.find(k => k.k === 'D'); q.K.shield = th && Math.abs(q.train().x + th.bx - (q.P.x + 21)) < 70 ? 1 : 0 }, 9).alive, 'a shield parry destroys it');
  ok(survives(D1, (q) => { const th = q.train().things.find(k => k.k === 'D'); const dx = th ? q.train().x + th.bx - (q.P.x + 21) : 999; q.K.jump = th && dx > -70 && dx < 110 ? 1 : 0; if (q.K.jump && q.P.ground) q.P.buffer = 0.16 }, 9).alive, 'or jump it');        // (hold the key to the apex)
  const dr = ride({ only: D1 }); dr.tick(Math.round(2.2 / dt), dt); let seenVela = false; for (let i = 0; i < 600; i++) { dr.tick(1, dt); if (/Maintenance drones dispatched/.test(dr.line())) seenVela = true } ok(seenVela, 'VELA comments on the rogue drones');
}
// ---- the whole ride, played by a script -----------------------------------------------------------------------------------------
function perfect(q) {
  const T = q.train(), pcx = q.P.x + 21;
  q.K.blue = T.obs.some(o => o.k === 'J' && o.st === 2) ? 1 : 0;
  q.K.red = T.things.some(th => (th.k === 'R' && (th.ph === 'fall' || th.ph === 'roll')) || (th.k === 'G' && th.off < 250)) ? 1 : 0;
  const d = T.things.find(k => k.k === 'D'); const dx = d ? T.x + d.bx - pcx : 999; q.K.jump = d && dx > -70 && dx < 110 ? 1 : 0; if (q.K.jump && q.P.ground) q.P.buffer = 0.16;
}
{
  const q = ride(); q.tick(Math.round(2.2 / dt), dt); q.P.x = q.train().x + 210; let t = 0;
  while (!q.train().done && t < 30) { perfect(q); q.tick(1, dt); t += dt }
  ok(q.train().done === 1 && q.P.falls === 0, `a scripted player rides the whole train with no falls (took ${t.toFixed(1)} s)`);
  q.K.blue = q.K.red = q.K.jump = 0; q.tick(Math.round(TR.flight / dt) + 40, dt);
  const th = q.D.platforms[19]; ok(q.P.ground && Math.abs(q.P.y + q.P.h - th[1]) < 2, 'and lands on the vault threshold'); ok(q.G().heat < 100, 'without overloading the glove');
  ok(q.train().obs.every(o => o.st > 0), 'every one of the ten obstacles arrived');
  ok(q.train().obs.length === 10 && ['J', 'R', 'G', 'D', 'J', 'R', 'D', 'J', 'G', 'J'].join() === q.train().obs.map(o => o.k).join(), 'the obstacle order is the design\'s');
  // a failed ride goes back to the rail head with the train reset
  const f = ride(); f.tick(Math.round(2.2 / dt), dt); f.P.x = f.train().x + 210; let tt = 0; while (f.P.falls === 0 && tt < 20) { f.tick(1, dt); tt += dt } const errLine = f.line(); f.tick(3, dt);
  ok(f.P.falls === 1 && !f.train().run && f.train().x === TR.start && f.P.ground && Math.abs(f.P.x - 11310) < 4, 'losing the ride respawns Bix at the rail head with the bed reset'); ok(/Locomotive collision/.test(errLine), 'with the design\'s error line');
  ok(f.state().charge === 1, 'and the train never spends the Pack catch (a retry is quick)');
}
{
  // the train cogs: some jump timing collects each of them (they hang over the bed between obstacles)
  for (const id of ['c8', 'c9']) {
    let best = 0;
    for (let off = 0; off <= 900 && !best; off += 25) {
      const q = ride(); q.tick(Math.round(2.2 / dt), dt); q.P.x = q.train().x + 210; let t = 0, jumped = 0;
      const cog = q.D.cogs.find(c => c.id === id);
      while (!q.train().done && t < 30 && !cog.got) {
        perfect(q);
        if (!jumped && q.train().x + TR.len > cog.x - 300 + off && q.P.ground) { q.K.jump = 1; q.P.buffer = 0.16; jumped = 1 } else if (jumped && q.P.ground) jumped = jumped
        q.tick(1, dt); t += dt; if (q.P.falls) break
      }
      if (cog.got && !q.P.falls) best = 1;
    }
    ok(best, `${id} can be collected by jumping on the train`);
  }
}

// ================================================================ AREA 6: the High Vault
{
  // gravity: the jump apex is 0.4 g
  const apexAt = (x, y) => { const q = boot(); q.setEnemies([]); q.setDrones([]); q.place(x, y); let top = y; q.K.jump = 1; q.P.buffer = .16; for (let i = 0; i < 200; i++) { q.tick(1, dt); top = Math.min(top, q.P.y + q.P.h); if (i > 10 && q.P.vy > 0) break } return y - top };
  near(apexAt(400, 600), 209, 8, 'a jump apex on the yard floor is 209 px'); near(apexAt(16750, -200), 524, 14, 'in the vault a jump rises 524 px (0.4 gravity)');
  const q = boot(); q.setEnemies([]); q.setDrones([]); q.place(16800, -200); q.P.x = 16800; q.tick(1, dt);
  // the islands orbit and carry Bix
  const v = q.isl()[0]; const p0 = { x: v.x, y: v.y }; q.S.clock = 2.1; q.tick(1, dt); ok(Math.hypot(v.x - p0.x, v.y - p0.y) > 10, 'the islands move');
  const q2 = boot(); q2.setEnemies([]); q2.setDrones([]); const vi = q2.isl()[1]; q2.P.x = vi.x + 90; q2.P.y = vi.y - q2.P.h; q2.P.ground = 1; q2.tick(3, dt); ok(q2.P.support && q2.P.support.mv === 'v1', 'Bix can stand on an island');
  const sx = q2.P.x; q2.tick(Math.round(1.5 / dt), dt); ok(Math.abs(q2.P.x - sx) > 5 || Math.abs(vi.dx) < 1e-9, 'and is carried by it'); near(q2.P.x + 21, vi.x + 111, 26, 'staying on the same spot of the island');
  // falling into the void costs a fall
  const q3 = boot(); q3.setEnemies([]); q3.setDrones([]); q3.setCP(q3.D.checkpoints.find(c => c.name === 'VAULT THRESHOLD')); q3.P.x = 17500; q3.P.y = 250; q3.P.vy = 200; q3.P.inv = 0; q3.tick(20, dt); ok(q3.P.falls > 0 || q3.state().charge === 0, 'falling into the void is a fall');
}
{
  // every hop in the vault has at least 60 px to spare at the worst point of the sway (low gravity, base jump)
  const D = boot().D, G = 1450 * 0.4, v0 = 780, RUN = 285, PW = 42;
  const spare = (a, b) => {   // a, b: {x0,x1,y} at the worst phase: widest gap, biggest height change
    const rise = a.y - b.y, disc = v0 * v0 - 2 * G * rise; if (disc <= 0) return -Infinity; const tt = (v0 + Math.sqrt(disc)) / G;
    return RUN * tt - 35 - (Math.max(0, b.x0 - a.x1, a.x0 - b.x1) + PW) };
  const nodes = [{ x0: 16700, x1: 17020, ry: 0, rx: 0, y: -200 }, ...D.islands.map(v => ({ x0: v.cx - v.w / 2, x1: v.cx + v.w / 2, ry: v.ry, rx: v.rx, y: v.cy })), { x0: 19700, x1: 20400, ry: 0, rx: 0, y: -260 }];
  let worst = Infinity;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i];
    for (const sa of [-1, 1]) for (const sb of [-1, 1]) for (const ya of [-1, 1]) for (const yb of [-1, 1]) {
      const A = { x0: a.x0 + sa * a.rx, x1: a.x1 + sa * a.rx, y: a.y + ya * a.ry }, B = { x0: b.x0 + sb * b.rx, x1: b.x1 + sb * b.rx, y: b.y + yb * b.ry };
      worst = Math.min(worst, spare(A, B), spare(B, A));
    }
  }
  ok(worst >= 60, `the worst vault hop (both islands at the far end of their sway) still has ${worst.toFixed(0)} px to spare (need 60)`);
  // and in the engine: from each island a plain run-and-jump toward the next lands, for most orbit phases
  const hopOK = (fromIdx) => {
    let good = 0, n = 0;
    for (let ph = 0; ph < 12; ph++) {
      const q = boot(); q.setEnemies([]); q.setDrones([]); q.S.clock = ph * 0.9; q.tick(1, dt);
      const from = fromIdx < 0 ? null : q.isl()[fromIdx], to = fromIdx + 1 < q.isl().length ? q.isl()[fromIdx + 1] : null;
      if (!to) continue; n++;
      if (from) { q.P.x = from.x + from.w - 70; q.P.y = from.y - q.P.h } else { q.P.x = 16950; q.P.y = -200 - q.P.h }
      q.P.ground = 1; q.P.inv = 999; q.tick(2, dt); q.K.right = 1;
      // wait for the run to reach the edge, then jump; the bot jumps when it is at the island's right edge
      let landed = false, jumped = 0, t = 0;
      while (t < 5) {
        const cur = from ? q.isl()[fromIdx] : { x: 16700, w: 320 };
        if (!jumped && q.P.ground && q.P.x + q.P.w >= cur.x + cur.w - 6) { q.K.jump = 1; q.P.buffer = .16; jumped = 1 }
        if (jumped && !q.P.ground) {       // steer in the air toward the middle of the target island (a jump covers far more than one island is wide)
          const aim = to.x + to.w / 2 - (q.P.x + 21) - q.P.vx * 0.55; q.K.right = aim > 0 ? 1 : 0; q.K.left = aim > 0 ? 0 : 1;
        }
        q.tick(1, dt); t += dt; if (jumped && q.P.ground && q.P.support && q.P.support.mv === to.id) { landed = true; break } if (q.P.y > 200) break;
      }
      if (landed) good++;
    }
    return { good, n };
  };
  for (let i = -1; i < 4; i++) { const r = hopOK(i); ok(r.good >= r.n - 3, `hop ${i < 0 ? 'threshold' : 'v' + i} -> next lands for ${r.good} of ${r.n} orbit phases`) }
}
{
  // air steering: Blue pulls toward iron, Red pushes off copper
  const mk = (islandId, col) => { const q = boot(); q.setEnemies([]); q.setDrones([]); q.D.doors.forEach(d => { d.x = 0 }); const v = q.isl().find(i => i.id === islandId);
    q.P.x = v.x + v.w / 2 - 200 - 21; q.P.y = v.y - 300; q.P.vx = q.P.vy = 0; q.P.ground = 0; q.P.inv = 999; q.K[col] = 0; q.tick(1, dt); return { q, v } };
  const dist = (q, v) => Math.hypot(v.x + v.w / 2 - (q.P.x + 21), v.y - (q.P.y + 48));
  { const { q, v } = mk('v1', 'blue'); const d0 = dist(q, v); q.K.blue = 1; q.tick(25, dt); q.K.blue = 0; const d1 = dist(q, v);
    const r = mk('v1', 'blue'); r.q.tick(25, dt); ok(d1 < dist(r.q, r.v) - 8, 'Blue in the air pulls Bix toward an iron island'); void d0 }
  { const { q, v } = mk('v2', 'red'); q.K.red = 1; q.tick(25, dt); const d1 = dist(q, v); const r = mk('v2', 'red'); r.q.tick(25, dt); ok(d1 > dist(r.q, r.v) + 8, 'Red in the air pushes Bix away from a copper island') }
  { const { q, v } = mk('v3', 'blue'); q.K.blue = 1; q.tick(25, dt); const r = mk('v3', 'blue'); r.q.tick(25, dt); near(dist(q, v), dist(r.q, r.v), 1, 'Blue does nothing near a copper island') }
  { const { q, v } = mk('v1', 'red'); q.K.red = 1; q.tick(25, dt); const r = mk('v1', 'red'); r.q.tick(25, dt); near(dist(q, v), dist(r.q, r.v), 1, 'and Red does nothing near an iron island') }
  // on the ground the field does not steer
  const q = boot(); q.setEnemies([]); q.setDrones([]); q.place(16800, -200); q.K.blue = 1; q.tick(30, dt); ok(q.P.x === 16800, 'a Blue field on the ground does not slide Bix');
}
{
  // the two vault cogs: c10 by a plain jump from a neighbouring island; c11 needs a Red kick off the copper island v3
  const tryCog = (id, fromIdx, assist) => {
    let hit = 0;
    for (let ph = 0; ph < 24 && !hit; ph++) {
      const q = boot(); q.setEnemies([]); q.setDrones([]); q.D.doors.forEach(d => { d.x = 0 }); q.S.clock = ph * 0.45; q.tick(1, dt);
      const from = q.isl()[fromIdx], cog = q.D.cogs.find(c => c.id === id);
      q.P.x = from.x + from.w / 2 - 21; q.P.y = from.y - q.P.h; q.P.ground = 1; q.P.inv = 999; q.tick(2, dt);
      for (let step = 0; step < 4 && !hit; step++) {            // try four different take-off moments and directions
        q.K.right = cog.x > from.x ? 1 : 0; q.K.left = q.K.right ? 0 : 1; q.K.jump = 1; q.P.buffer = .16; let t = 0;
        while (t < 4 && !cog.got) { q.tick(1, dt); t += dt; if (t > 0.35 && assist) q.K.red = 1; q.G().heat = 0 }
        if (cog.got) hit = 1; else break
      }
    }
    return hit;
  };
  ok(tryCog('c10', 1, false) || tryCog('c10', 2, false), 'c10 (between v1 and v2) is collected by a plain jump');
  ok(tryCog('c11', 3, true), 'c11 is collected with a Red kick off the copper island v3');
  ok(!tryCog('c11', 3, false) && !tryCog('c11', 4, false), 'c11 is out of reach of a plain jump: it is the mastery cog');
}
{
  // vault drones: a Blue field sends the Blue drone away; the shield destroys it
  const q = boot({ enemies: true }); q.D.lasers = []; const d = q.drones().find(x => x.id === 'DV0'); q.setDrones([d]); q.setCP(q.D.checkpoints.find(c => c.name === 'VAULT THRESHOLD'));
  q.P.x = d.x - 300; q.P.y = d.y - 300; q.P.ground = 0; q.P.inv = 0; q.K.shield = 1; q.tick(2, dt); q.K.shield = 0; ok(d.dead === 0, 'a shield away from the drone does nothing');
}

// ================================================================ the door, the archive, the ending
{
  const found = []; const mayhem = { getProgress: () => ({ levels: {} }), recordResult: (level, r) => { found.push({ level, r }); return Promise.resolve('Saved on this device.') } };
  const q = boot({ mayhem }); q.setEnemies([]); q.setDrones([]); const door = q.D.doors.find(d => d.id === 'transit'), deck = q.D.platforms[20];
  q.place(door.x - 60, deck[1]); q.K.blue = 1; let t = 0; while (t < 4 && !q.state().doorT) { q.tick(1, dt); t += dt }
  near(t, 2.5, 0.3, 'holding Blue on the transit door from cold blows the locks in 2.5 s'); ok(q.state().doorT > 0 && /LOCKS RELEASED/.test(q.line()), 'the door announces it');
  ok(!q.state().done, 'the level does not end until the flash is over'); q.tick(Math.round(1.6 / dt), dt); ok(q.state().done === 1, 'then the level ends');
  ok(found.length === 1 && found[0].level === 'level3' && found[0].r.cogs === 0 && found[0].r.falls === 0 && found[0].r.timeSec >= 1, 'the result is saved to progress.js as level3');
  ok(q.els.medal.textContent === 'BRONZE', 'a run with no cogs earns bronze'); ok(/Barely grounded/.test(q.els.resultLine.textContent), 'with Bix\'s line');
  // not near the door: holding Blue does nothing special; it is just heat
  const q2 = boot(); q2.setEnemies([]); q2.setDrones([]); q2.place(deck[0] + 100, deck[1]); q2.K.blue = 1; q2.tick(Math.round(3 / dt), dt); q2.K.blue = 0; q2.tick(Math.round(3 / dt), dt); ok(!q2.state().done && !q2.state().doorT, 'holding Blue far from the door never ends the level');
  // arriving hot makes it faster; the glove lock after a failed overload is the normal 2.5 s
  const q3 = boot(); q3.setEnemies([]); q3.setDrones([]); q3.place(door.x - 60, deck[1]); q3.G().heat = 60; q3.K.blue = 1; let t3 = 0; while (t3 < 4 && !q3.state().doorT) { q3.tick(1, dt); t3 += dt } ok(t3 < 1.3, 'a glove that arrives hot overloads the door sooner');
}
{
  // medals (design table 20)
  const q = boot(); const m = q.medalFor;
  ok(m(12, 0, 600).name === 'GOLD' && m(10, 8, 840).name === 'GOLD', 'gold: 10 cogs, 8 falls, 14:00'); ok(m(9, 8, 840).name === 'SILVER' && m(10, 9, 840).name === 'SILVER' && m(10, 8, 841).name === 'SILVER', 'one step short of gold is silver');
  ok(m(6, 20, 1320).name === 'SILVER', 'silver: 6 cogs, 20 falls, 22:00'); ok(m(5, 20, 1320).name === 'BRONZE' && m(6, 21, 1320).name === 'BRONZE' && m(6, 20, 1321).name === 'BRONZE', 'one step short of silver is bronze'); ok(m(0, 999, 86000).name === 'BRONZE', 'bronze: any finish');
}
{
  // the archive: locked without all 12 cogs
  const q = boot(); q.setEnemies([]); q.setDrones([]); const door = q.D.doors.find(d => d.id === 'archive'), deck = q.D.platforms[20];
  q.place(door.x - 10, deck[1]); q.K.interact = 1; q.tick(3, dt); ok(!q.state().inArchive, 'the archive door does not open without 12 cogs'); ok(/LOCKED/.test(q.els.prompt.textContent), 'and says why');
  q.setCogs(11); q.K.interact = 1; q.tick(3, dt); ok(!q.state().inArchive, '11 cogs are not enough');
  q.setCogs(12); q.K.interact = 1; q.tick(3, dt); ok(q.state().inArchive === 1, 'with 12 cogs the door opens'); const A = q.D.archive; near(q.P.x, A.enter.x, 8, 'Bix is inside the archive room'); ok(q.P.ground, 'standing on its floor');
  // three terminals; the last reading brings Pack's line
  A.terminals.forEach((tm, i) => { q.place(tm.x - 21, deck[1]); q.P.y = A.enter.y - q.P.h; q.P.x = tm.x - 21; q.inArchiveFix; q.K.interact = 1; q.tick(3, dt); ok(q.archiveRead()[i] === 1, `terminal ${i + 1} can be read`); ok(q.line().length > 20, 'with its text on screen') });
  q.tick(Math.round(8 / dt), dt); ok(/BX-7 had a very long to-do list/.test(q.line()), 'after the last terminal Pack goes quiet, then says her line');
  // walking off the edge of the room is not possible
  q.K.left = 1; q.tick(Math.round(4 / dt), dt); ok(q.P.x >= A.exit.x - 20 - 1, 'the room has walls'); q.K.left = 0;
  q.place(A.exit.x - 21, q.D.platforms[21][1]); q.P.x = A.exit.x - 21; q.K.interact = 1; q.tick(3, dt); ok(!q.state().inArchive && Math.abs(q.P.x - A.back.x) < 10, 'the exit door returns Bix to the vault deck');
}
{
  // Kinetic Recoil (8 cogs): one Red push in mid-air gives a second small jump, once per jump
  const mk = cogs => { const q = boot(); q.setEnemies([]); q.setDrones([]); q.setCogs(cogs); q.place(400, 600); q.K.jump = 1; q.P.buffer = .16; q.tick(20, dt); q.K.jump = 0; while (q.P.vy < 250) q.tick(1, dt); return q };       // up, over the top, and falling
  const q = mk(8); const vy0 = q.P.vy; q.K.red = 1; q.tick(1, dt); ok(q.P.vy < vy0 - 200 && q.state().recoil === 1, 'with 8 cogs a Red push in mid-air kicks Bix upward'); q.K.red = 0; q.tick(1, dt); const vy1 = q.P.vy; q.K.red = 1; q.tick(1, dt); ok(q.P.vy > vy1 - 40, 'but only once per jump');
  const q2 = mk(7); const v2 = q2.P.vy; q2.K.red = 1; q2.tick(1, dt); ok(q2.P.vy > v2 - 40, 'with 7 cogs there is no recoil');
  const q3 = mk(8); q3.tick(200, dt); ok(q3.P.ground && q3.state().recoil === 0, 'landing recharges the recoil');
}

console.log(JSON.stringify({ checks }));
