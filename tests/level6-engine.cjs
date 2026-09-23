/* Level 6 engine: the Lure (take, carry, set down, throw, burst, call back), Mother Cluckzilla's rules, the alarm, the three
   columns, the non-violent ending, saving, unlocking, and the level staying finite under random input.
   Run from the repo root: node tests/level6-engine.cjs

   Anything that measures danger sets P.inv = 0 first. A test that runs with invulnerability on proves nothing. */
'use strict';
const assert = require('assert'), fs = require('fs');
const { boot } = require('./level6-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;
const cp = (q, name) => q.D.checkpoints.find(c => c.name === name);

// ---- start state -----------------------------------------------------------------------------------------------------------
{
  const q = boot(); const s = q.state();
  ok(s.running && !s.done && s.cogs === 0 && s.checkpoint.name === 'DOME THRESHOLD', 'the level starts at the dome threshold');
  ok(!q.pod().held && !q.pod().burst, 'the first pod waits in its hopper');
  q.tick(60, dt); ok(q.P.ground, 'Bix lands on the start deck');
  ok(!q.boss().in && q.state().alarmOn === 0, 'she has not arrived and the alarm is unpulled');
  q.draw(); ok(true, 'the first frame draws');
}

// ---- the Lure: take, carry, set down, throw, burst, call back ------------------------------------------------------------------
{
  const q = boot(); const h = q.D.hoppers[0];
  q.place(h.x - 300, 410); q.tick(4, dt); ok(q.prompt() === '', 'away from a hopper there is no prompt');
  q.place(h.x - 60, 410); q.tick(3, dt); ok(/TAKE A FEED POD/.test(q.prompt()), 'at a hopper the prompt offers a pod');
  q.K.interact = 1; q.tick(2, dt); ok(q.pod().held, 'ACT takes a pod');
  ok(q.hoppers()[0].t > 0, 'and that hopper needs a moment to refill');
  ok(/SET THE POD DOWN/.test(q.prompt()), 'the prompt now offers to set it down');
  q.tick(20, dt); ok(Math.abs(q.pod().x + q.pod().w / 2 - (q.P.x + 21 + q.P.face * 22)) < 3, 'a held pod rides in front of Bix');
  q.K.interact = 1; q.tick(3, dt); ok(!q.pod().held, 'ACT sets it down');
  q.tick(50, dt); ok(!q.pod().burst && q.pod().ground, 'a pod set down gently rests where it is put: it does not burst');
  // throw
  const r = boot(); r.place(1200, 410); r.takePod(null, 0); r.tick(4, dt);
  const x0 = r.P.x; r.K.red = 1; r.tick(1, dt); r.K.red = 0;
  ok(!r.pod().held && r.pod().vx > 400, 'Red throws a held pod, hard');
  r.tick(30, dt); ok(r.pod().x > x0 + 200, 'it flies well ahead of Bix');
  r.tick(90, dt); ok(r.pod().burst, 'and bursts where it lands');
  // call back
  const c = boot(); c.place(1200, 410); c.takePod(null, 0); c.tick(4, dt); c.setDown(); c.tick(2, dt);
  c.pod().burst = 0; c.pod().x = c.P.x + 300; c.pod().y = c.P.y;              // a loose, unburst pod within call range
  c.K.blue = 1; c.tick(200, dt, () => !c.pod().held);
  ok(c.pod().held, 'Blue calls an unburst pod back and Bix catches it');
}

// ---- a pod is never lost ----------------------------------------------------------------------------------------------------
{
  const q = boot(); q.place(1200, 410); q.takePod(null, 0); q.setDown(); q.tick(2, dt);
  q.pod().y = 5000; q.tick(2, dt);
  ok(!q.pod().held && q.pod().y < 700 && Math.abs(q.pod().x - q.P.x) < 140 && q.state().podDrops === 1, 'a pod that leaves the world comes back beside Bix');
  const r = boot(); r.place(1200, 410); r.takePod(null, 0); r.P.inv = 0; r.hurt('fall');
  ok(r.pod().held, "Pack's catch keeps the pod in Bix's hands");
  r.P.inv = 0; r.hurt('fall'); r.tick(2, dt);
  ok(!r.pod().held && Math.abs(r.pod().x - r.P.x) < 140, 'a real death puts the pod back beside him at the checkpoint');
  // every hopper refills, so there is no state with no pod
  const s = boot(); s.hoppers().forEach(h => h.t = 3); s.tick(Math.round(3.2 / dt), dt);
  ok(s.hoppers().every(h => h.t === 0), 'every hopper refills');
}

// ---- the alarm ---------------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.place(q.D.alarm.x - 60, q.D.alarm.y); q.tick(3, dt);
  ok(/PULL THE DOME ALARM/.test(q.prompt()), 'at the alarm the prompt offers to pull it');
  q.K.interact = 1; q.tick(2, dt);
  ok(q.state().alarmOn === 1, 'pulling it turns the work lights on');
  const said = q.sayQ().map(l => l[1]).join(' ');
  ok(/never turned/.test(said) && /not chasing us/.test(said), 'and it reveals she was never chasing him');
  q.tick(3, dt); ok(!/PULL THE DOME ALARM/.test(q.prompt()), 'it cannot be pulled twice');
}

// ---- she walks to the newest burst, never to Bix ----------------------------------------------------------------------------
{
  const q = boot(); q.setAlarm(1); q.place(8000, 340); q.tick(4, dt);
  ok(q.boss().in, 'she is in the level once Bix passes the orchard');
  // a burst pod behind Bix pulls her backwards, away from him
  q.pod().held = 0; q.pod().burst = 1; q.pod().burstAt = q.S.clock; q.pod().x = 7000; q.pod().y = 340;
  const before = q.boss().x; q.tick(Math.round(4 / dt), dt, () => { q.pod().burstAt = q.S.clock; return true });
  ok(Math.abs(q.boss().x - 7000) < Math.abs(before - 7000), 'she moves toward the burst pod');
  ok(q.boss().x < q.P.x, 'which is away from Bix, not toward him');
  // with no burst she follows the feed line, which trails Bix
  const r = boot(); r.setAlarm(1); r.place(9000, 340);
  r.tick(Math.round(16 / dt), dt, () => { r.place(9000, 340); return true });          // she enters well back and walks up at 250 px/s
  ok(Math.abs(r.boss().x - (r.P.x - r.D.boss.leash)) < 260, 'with no burst she settles on the feed line behind him');
  // before the alarm a pod does nothing to her
  const s = boot(); s.place(8000, 340); s.tick(4, dt);
  s.pod().held = 0; s.pod().burst = 1; s.pod().burstAt = s.S.clock; s.pod().x = 7000; s.pod().y = 340;
  const b0 = s.boss().x; s.tick(Math.round(4 / dt), dt, () => { s.pod().burstAt = s.S.clock; return true });
  ok(s.boss().x > b0, 'before the alarm the pods do nothing: she keeps following the feed line');
}

// ---- her footfall is dangerous, and only her footfall -------------------------------------------------------------------------
{
  const q = boot({ }); q.setAlarm(1); q.setCP(cp(q, 'ORCHARD ROWS')); q.place(9000, 340); q.tick(30, dt);
  q.boss().x = q.P.x + 21 - q.D.boss.footfall.spread;                 // stand exactly under a foot
  q.P.inv = 0; let hit = false;
  q.tick(Math.round(2.2 / dt), dt, () => { if (q.state().charge === 0 || q.P.falls > 0) hit = true; q.boss().x = q.P.x + 21 - q.D.boss.footfall.spread; return !hit });
  ok(hit, 'standing under a footfall is dangerous');
  const r = boot(); r.setAlarm(1); r.setCP(cp(r, 'ORCHARD ROWS')); r.place(9000, 340); r.tick(30, dt);
  r.boss().x = r.P.x + 2000; r.P.inv = 0; let safe = true;
  r.tick(Math.round(3 / dt), dt, () => { if (r.state().charge === 0 || r.P.falls > 0) safe = false; r.boss().x = r.P.x + 2000; return safe });
  ok(safe, 'well away from her, nothing happens');
  ok(typeof r.state().staggered === 'number', 'the shockwave is tracked as a stagger, which costs time and not health');
}

// ---- the three columns --------------------------------------------------------------------------------------------------------
{
  const q = boot(); q.setAlarm(1); const k = q.D.columns[0], t = q.D.troughs[0];
  ok(!q.fallen().has(k.id), 'the column starts up');
  ok(q.solids().every(s => s.col !== k.id), 'and is not a walkway yet');
  // bait the trough by bursting a pod in it
  q.place(t.x - 100, t.y); q.pod().held = 0; q.pod().x = t.x + 40; q.pod().y = t.y - 40; q.pod().burst = 0;
  q.burstPod(q.S.clock);
  ok(q.baited()[t.id] === true, 'a pod burst in the trough baits it');
  // she comes, leans in, and her weight takes the column
  q.boss().in = 1; q.boss().x = t.x;
  q.tick(Math.round(3 / dt), dt, () => { q.boss().x = t.x; return !q.fallen().has(k.id) });
  ok(q.fallen().has(k.id), 'she leans in and the column goes over');
  ok(q.solids().some(s => s.col === k.id), 'and it becomes a walkway');
  ok(!q.baited()[t.id], 'the trough is emptied');
  // permanent through a respawn, cleared by a full restart
  q.reset(0); ok(q.fallen().has(k.id), 'a fallen column stays fallen through a respawn');
  q.reset(1); ok(q.fallen().size === 0, 'a full restart puts every column back');
  // she does not drop a column that was never baited
  const r = boot(); r.setAlarm(1); r.boss().in = 1; r.boss().x = r.D.troughs[1].x; r.place(17000, -210);
  r.tick(Math.round(3 / dt), dt, () => { r.boss().x = r.D.troughs[1].x; return true });
  ok(r.fallen().size === 0, 'an unbaited trough drops nothing');
}

// ---- the ending is non-violent and ends the level -------------------------------------------------------------------------------
{
  const saved = []; const mayhem = { getProgress: () => ({}), subscribe() {}, recordResult: (id, r) => { saved.push([id, r]); return Promise.resolve('Saved.') } };
  const q = boot({ mayhem }); q.setAlarm(1); q.setCogs(12); const ct = q.D.cart;
  q.place(ct.x - 200, ct.y); q.tick(4, dt);
  q.pod().held = 0; q.pod().x = ct.x + 60; q.pod().y = ct.y - 40; q.pod().burst = 0; q.burstPod(q.S.clock);
  ok(q.state().cartBaited, 'a pod burst on the cart baits it');
  q.boss().in = 1; q.boss().x = ct.x + ct.w / 2; q.tick(4, dt);
  ok(q.state().ending > 0 && !q.state().done, 'she steps on, the cart tips and the ending starts');
  const said = q.sayQ().map(l => l[1]).join(' ');
  ok(/settles/.test(said) && /quiet/.test(said) && /only ever hungry/.test(said), 'she is fed and put to bed, not beaten');
  q.P.inv = 0; q.hurt('footfall'); ok(q.P.falls === 0, 'nothing can hurt Bix during the ending');
  q.tick(Math.round(12 / dt), dt);
  ok(q.state().done && !q.state().running, 'the level completes');
  ok(saved.length === 1 && saved[0][0] === 'level6' && saved[0][1].cogs === 12, 'and saves as level6 through progress.js');
  ok(q.medalFor(12, 10, 1100).name === 'GOLD' && q.medalFor(7, 25, 1600).name === 'SILVER' && q.medalFor(0, 99, 9999).name === 'BRONZE', 'gold, silver and bronze');
}
// Bix has no way to damage her: the engine exposes no such path
{
  const src = fs.readFileSync('dist/level6.js', 'utf8');
  ok(!/boss\.(hp|health|damage|hits)/.test(src), 'she has no health: there is nothing for Bix to take off her');
  ok(/she is only ever in the way/i.test(src) || /never targets Bix/i.test(src), 'the engine states her rule in the code');
}

// ---- cogs, slips, checkpoints, triggers -------------------------------------------------------------------------------------------
{
  const q = boot(); const c0 = q.D.cogs[0];
  q.place(c0.x - 21, 410); q.tick(1, dt); ok(q.state().cogs === 1 && /Cog 1 secured/.test(q.line()), 'a cog is collected with a line from Pack');
  const s = boot(); const s0 = s.D.slips[0];
  s.place(s0.x - 21, 390); s.tick(1, dt); ok(s.state().slips === 1 && /Slip 1\//.test(s.line()), 'a story slip is collected and read');
  s.tick(3, dt); ok(s.state().slips === 1, 'and only once');
  const k = boot(); k.place(3360, 390); k.tick(5, dt); ok(k.state().checkpoint.name === 'FEED LINE', 'a checkpoint is set when Bix reaches it');
  k.place(170, 410); k.tick(5, dt); ok(k.state().checkpoint.name === 'FEED LINE', 'and a checkpoint never moves you back');
  const t = boot(); t.tick(3, dt); ok(t.sayQ().length + (t.line() ? 1 : 0) >= 1, 'the opening line plays');
  const a = boot({ search: '?at=5' });
  ok(a.state().checkpoint.name === 'THE GRID' && a.pod().held && a.state().alarmOn === 1, '?at=N starts at that checkpoint, holding a pod, past the alarm');
  ok(boot({ search: '?at=5', host: 'rahuls190.github.io' }).state().checkpoint.name === 'DOME THRESHOLD', 'but only on localhost');
}

// ---- unlocking -------------------------------------------------------------------------------------------------------------------
{
  const MP = require('../dist/progress.js');
  const rec = (a, b, c, d, e) => ({ levels: { level1: { bestCogs: a }, level2: { bestCogs: b }, level3: { bestCogs: c }, level4: { bestCogs: d }, level5: { bestCogs: e } } });
  const withProgress = p => boot({ progress: MP, mayhem: { getProgress: () => p, subscribe() {}, recordResult: () => Promise.resolve('') } });
  ok(withProgress(rec(12, 14, 6, 0, 0)).locked(), '32 carried cogs leave it locked');
  ok(!withProgress(rec(12, 14, 7, 0, 0)).locked(), '33 open it');
  ok(!withProgress(rec(12, 14, 12, 12, 15)).locked() && withProgress(rec(12, 14, 12, 12, 15)).carried() === 65, 'a full save carries all 65');
  ok(boot().locked(), 'with no progress at all it is locked');
  const html = fs.readFileSync('dist/level6.html', 'utf8');
  ok(/level6\.js/.test(html) && /level6-data\.js/.test(html) && /id="podChip"/.test(html) && /id="phaseChip"/.test(html), 'the page loads the level and has the pod and phase chips');
}

// ---- drawing in every state, and random input at four frame rates -------------------------------------------------------------------
{
  const q = boot({ enemies: true }); let frames = 0;
  for (const name of ['DOME THRESHOLD', 'FEED LINE', 'ORCHARD ROWS', 'SPINE FOOT', 'THE ALARM', 'THE GRID', 'NESTING BAY']) {
    const c = cp(q, name); q.setCP(c); q.place(c.x, c.y); q.takePod(null, q.S.clock); q.tick(5, dt); q.draw(); frames++;
  }
  q.setAlarm(1); q.boss().in = 1; q.boss().x = q.P.x - 300; q.tick(30, dt); q.draw(); frames++;
  q.boss().sweeping = 1; q.boss().lean = 1; q.boss().leanCol = 'k1'; q.tick(5, dt); q.draw(); frames++;
  q.D.columns.forEach(k => q.fallen().add(k.id)); q.tick(5, dt); q.draw(); frames++;
  q.startEnding(q.S.clock); q.tick(30, dt); q.draw(); frames++; q.tick(700, dt); q.draw(); frames++;
  ok(frames >= 12, `drew ${frames} frames across every state without an exception`);
}
{
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 };
  let runs = 0;
  for (const fps of [30, 60, 120, 240]) for (let seed = 1; seed <= 4; seed++) {
    const r = rng(seed * 7919 + fps), q = boot({ enemies: true });
    const cps = q.D.checkpoints, c = cps[Math.floor(r() * cps.length)]; q.setCP(c); q.reset(0); q.P.inv = 0;
    if (r() < .5) q.takePod(null, 0); if (r() < .5) q.setAlarm(1);
    const d = 1 / fps;
    for (let i = 0; i < Math.round(40 * fps); i++) {
      if (i % Math.round(fps / 4) === 0) Object.keys(q.K).forEach(k => { q.K[k] = r() < (k === 'right' ? 0.6 : 0.25) ? 1 : 0 });
      q.tick(1, d);
      const P = q.P, p = q.pod(), b = q.boss();
      if (![P.x, P.y, P.vx, P.vy, p.x, p.y, p.vx, p.vy, b.x].every(Number.isFinite)) assert.fail(`non-finite state at fps ${fps} seed ${seed} frame ${i}`);
    }
    runs++;
  }
  ok(runs === 16, '16 random 40-second runs at 30, 60, 120 and 240 fps stayed finite and threw nothing');
}
console.log(JSON.stringify({ checks }));
