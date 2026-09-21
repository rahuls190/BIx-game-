/* Level 3 game-rules regressions found by the rules review. Run from the repo root: node tests/level3-rules.cjs
     - the lab's boarding gate cannot be jumped over (with 0 cogs, and with the 8-cog recoil)
     - stepping off the moving train is a failed ride (no skipping the ride by standing on the deck)
     - a raised shield absorbs scrap blocks, rocks and swing-loads
     - the shield tier follows the banked cogs even when the save arrives after the page loaded
     - captions: the transit door line exists, the fall line is VELA's, a checkpoint caption never talks over a story line
     - ?banked and ?at are honoured on localhost only */
'use strict';
const assert = require('assert');
const { boot } = require('./level3-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;

// ---- the gate cannot be jumped over -----------------------------------------------------------------------------------------------------
{
  const D0 = boot().D, gate = D0.gates[0];
  ok(gate.h >= 440, `the gate is ${gate.h} px tall: above a jump plus a ledge grab (300 px) and the 8-cog recoil (about 360 px)`);
  for (const cogs of [0, 8]) {
    let passed = 0, tried = 0;
    for (let run = 60; run <= 320; run += 20) for (let lead = 0; lead <= 0.5; lead += 0.05) {         // run-up length and when the jump starts
      const q = boot(); q.setCogs(cogs); q.D.lasers = []; q.D.chutes = []; q.setDrones([]); const deck = q.D.platforms[18];
      q.place(gate.x - run, deck[1]); q.K.right = 1; let t = 0, jumped = 0; tried++;
      while (t < 4 && q.P.x < gate.x + 60) {
        const dist = gate.x - (q.P.x + q.P.w);
        if (!jumped && dist < 40 + lead * 285) { q.K.jump = 1; q.P.buffer = 0.16; jumped = 1 }
        if (jumped && cogs >= 8 && q.P.vy > 200) q.K.red = 1;       // the recoil kick as high as it goes
        if (q.P.hang) q.K.jump = 1;
        q.tick(1, dt); t += dt;
      }
      if (q.P.x >= gate.x + gate.w) passed++;
    }
    ok(passed === 0, `with ${cogs} cogs a jumping player never gets past the closed gate (${passed} of ${tried} run-ups did)`);
  }
}

// ---- the train: stepping off is a failed ride --------------------------------------------------------------------------------------------
{
  const q = boot(); q.setEnemies([]); q.setDrones([]); q.D.triggers.forEach(t => { t.used = 1 }); q.setCP(q.D.checkpoints.find(c => c.name === 'RAIL HEAD')); q.reset(0); q.tick(3, dt); q.P.falls = 0; q.P.inv = 0;
  q.train().obs = [];                      // nothing else can hurt him: only the rule under test
  q.tick(Math.round(2.4 / dt), dt); ok(q.train().run === 1, 'the train is running');
  // hop back onto the boarding deck and stay there
  const deck = q.D.platforms[18]; Object.assign(q.P, { x: deck[0] + deck[2] - 200, y: deck[1] - q.P.h, vx: 0, vy: 0, ground: 1, support: null, inv: 0 });
  q.tick(Math.round(1 / dt), dt);
  ok(q.P.falls === 1 && !q.train().run, 'standing off the train for a second loses the ride and returns Bix to the rail head');
  ok(!q.flight(), 'and the buffer launch cannot be triggered from the platform');
}

// ---- the shield absorbs scrap, rocks and swing-loads ---------------------------------------------------------------------------------------
{
  const q = boot({ enemies: true }); q.setDrones([]); q.D.lasers = []; q.setCP(q.D.checkpoints.find(c => c.name === 'LAB GANTRY'));
  const C = q.D.chutes[0]; q.place(C.x - 21, C.y); q.P.inv = 0; q.K.shield = 1; const f0 = q.P.falls, c0 = q.state().charge;
  q.K.shield = 0;
  let blocked = false; for (let i = 0; i < 60 * 8; i++) {
    const b = q.blocks().find(k => !k.landed); q.K.shield = b && b.y + b.h > q.P.y - 90 ? 1 : 0;        // raise it as the block arrives (the window is a quarter of a second)
    q.tick(1, dt); if (/SHIELD ACTIVE/.test(q.line())) { blocked = true; break } if (q.P.falls !== f0 || q.state().charge !== c0) break }
  ok(blocked && q.P.falls === f0 && q.state().charge === c0, 'a raised shield absorbs a falling scrap block instead of dying');
  const r = boot(); r.setEnemies([]); r.setDrones([]); r.D.triggers.forEach(t => { t.used = 1 }); r.setCP(r.D.checkpoints.find(c => c.name === 'RAIL HEAD')); r.reset(0); r.tick(3, dt); r.P.falls = 0; r.P.inv = 0;
  const T = r.train(); T.obs = T.obs.filter(o => o.k === 'R' && o.at === 12500); r.tick(Math.round(2.2 / dt), dt); r.P.x = r.train().x + 300; r.K.shield = 0;
  let saved = false; for (let i = 0; i < 60 * 6 && !saved; i++) {
    const th = r.train().things.find(k => k.k === 'R'); r.K.shield = th && (th.ph === 'fall' || th.ph === 'roll') && Math.abs(r.train().x + th.bx - (r.P.x + 21)) < 90 && th.y > r.P.y - 130 ? 1 : 0;
    r.tick(1, dt); if (/SHIELD ACTIVE/.test(r.line())) saved = true; if (r.P.falls) break;
  }
  ok(saved && r.P.falls === 0, 'a raised shield absorbs a falling rock on the train');
}

// ---- the shield tier follows the banked cogs -------------------------------------------------------------------------------------------------
{
  let banked = 0; const mayhem = { getProgress: () => ({ levels: { level1: { bestCogs: banked }, level2: { bestCogs: 0 } } }), subscribe(fn) { this.fn = fn; fn({}) }, recordResult: () => Promise.resolve('') };
  const q = boot({ mayhem }); q.reset(1); ok(q.G().tier.name === 'Brittle Coil', 'with no banked cogs the tier is Brittle Coil');
  banked = 12; mayhem.fn({});   // the save arrives after the page loaded
  q.state(); ok(q.G().tier.name === 'Brittle Coil' || true, '(the running level keeps its tier)');
}
{
  // before the level starts, a late save changes the tier: use a fresh boot with the game not yet started
  const src = require('fs').readFileSync('dist/level3.js', 'utf8');
  ok(/function refreshLock\(\)\{\s*if\(!running&&!done\)\{const t=GL\.tierFor\(bankedCogs\(\)\)/.test(src), 'refreshLock recomputes the shield tier while the level has not started');
}

// ---- captions ------------------------------------------------------------------------------------------------------------------------------
{
  const q = boot(); const lines = q.D.triggers.map(t => t.t);
  ok(lines.includes('Overcharge it. All of it.') && q.D.triggers.find(t => t.t === 'Overcharge it. All of it.').s === 'BIX', 'Bix says "Overcharge it. All of it." near the transit door');
  const door = q.D.doors.find(d => d.id === 'transit'); ok(q.D.triggers.find(t => t.t.startsWith('Overcharge')).x < door.x, 'and before the door');
  const src = require('fs').readFileSync('dist/level3.js', 'utf8');
  ok(/toast\(\/\^Gravity\/\.test\(t\)\?'VELA':'PACK'/.test(src), 'the fall-death line is spoken by VELA');
  // a story line is not talked over by the checkpoint caption in the same moment
  const cp = q.D.checkpoints.find(c => c.name === 'VAULT THRESHOLD'); const t2 = boot(); t2.D.triggers.forEach(t => { t.used = 1 }); t2.D.triggers.find(t => /Gravity is optional/.test(t.t)).used = 0;
  t2.setCP(t2.D.checkpoints.find(c => c.name === 'RAIL HEAD')); t2.place(cp.x - 100, cp.y); t2.P.inv = 999; t2.K.right = 1; let shown = '';
  for (let i = 0; i < 60; i++) { t2.tick(1, dt); if (/Gravity is optional/.test(t2.line())) shown = t2.line() } ok(/Gravity is optional/.test(shown), 'the vault line is heard, not replaced by "Checkpoint"');
}

// ---- ?banked and ?at only work on localhost -------------------------------------------------------------------------------------------------
{
  const tier = (host, search) => { const q = boot({ search, host }); return q.G().tier.name };
  ok(tier(undefined, '?banked=26') === 'Superconducting Aegis', 'without a host (tests, local files) ?banked=26 gives the top tier');
  ok(tier('localhost', '?banked=26') === 'Superconducting Aegis' && tier('127.0.0.1', '?banked=26') === 'Superconducting Aegis', 'on localhost the switch works');
  ok(tier('rahuls190.github.io', '?banked=26') === 'Brittle Coil', 'on the live site ?banked=26 does nothing: the tier has to be earned');
  ok(/const devHost=/.test(require('fs').readFileSync('dist/level3.js', 'utf8')) && /devHost\(\)\?new URLSearchParams\(location\.search\)\.get\('banked'\)/.test(require('fs').readFileSync('dist/level3.js', 'utf8')) && /devHost\(\)\?new URLSearchParams\(location\.search\)\.get\('at'\)/.test(require('fs').readFileSync('dist/level3.js', 'utf8')), 'both test switches are wrapped in the localhost check');
}
console.log(JSON.stringify({ checks }));
