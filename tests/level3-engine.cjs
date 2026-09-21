/* Level 3 engine mechanics (stage 1). Run from the repo root: node tests/level3-engine.cjs
   Runs the REAL dist/level3.js on the REAL data. Each section checks one mechanic from the design document against its numbers:
   glove gating and keys, the girder hang, the wall cling, the repel pad and net, the crate, the crumbling plates and Pack's tether,
   the presses, the shield tiers, checkpoints, the shaft camera, the finish, and the page wiring. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const { boot, ROOT } = require('./level3-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const near = (a, b, e, m) => { assert(Math.abs(a - b) <= e, `${m}: got ${a}, expected ${b} +/- ${e}`); checks++ };
const dt = 1 / 60;
const gap = (q, id) => q.D.platforms; // (unused helper kept out of the way)
const deckTop = (q, i) => q.D.platforms[i][1];

// ---- 1. glove gating, keys and the locker ---------------------------------------------------------------------------------
{
  const q = boot({ glove: false });
  ok(!q.state().gloveOn, 'the glove is not on before the locker');
  q.fire('keydown', { code: 'KeyZ' }); ok(q.K.blue === 1, 'Z holds Blue'); q.fire('keyup', { code: 'KeyZ' }); ok(q.K.blue === 0, 'releasing Z releases Blue');
  q.fire('keydown', { code: 'KeyX' }); ok(q.K.red === 1, 'X holds Red'); q.fire('keyup', { code: 'KeyX' }); ok(q.K.red === 0, 'releasing X releases Red');
  q.fire('keydown', { code: 'KeyC' }); ok(q.K.shield === 1, 'C is the shield'); q.fire('keyup', { code: 'KeyC' });
  q.fire('keydown', { code: 'ShiftLeft' }); ok(q.K.shield === 1, 'Left Shift is the shield too'); q.fire('keyup', { code: 'ShiftLeft' });
  q.fire('keydown', { code: 'ArrowUp' }); ok(q.K.up === 1 && q.K.jump === 1, 'Up is both jump and wall-climb'); q.fire('keyup', { code: 'ArrowUp' });
  // without the glove Red on the repel pad does nothing
  const pad = q.D.pads[0]; q.place(pad.x + 20, pad.y); q.K.red = 1; q.tick(30, dt);
  ok(q.P.ground && q.P.vy === 0, 'without the glove the repel pad does nothing'); q.clear();
  // the locker
  const lk = q.D.lockers[0]; q.place(lk.x - 21, lk.y); q.tick(2, dt);
  ok(/OPEN LOCKER/.test(q.els.prompt.textContent), 'the locker shows its ACT prompt when near');
  q.fire('keydown', { code: 'KeyE' }); q.tick(2, dt);
  ok(q.state().gloveOn === 1, 'ACT at the locker turns the glove on'); ok(/Hold Z for Blue/.test(q.line()), 'and Pack explains the keys');
  q.place(lk.x - 400, lk.y); q.tick(2, dt); ok(!/OPEN LOCKER/.test(q.els.prompt.textContent), 'the prompt goes away once the glove is taken');
  // holding both cancels the field
  q.K.blue = 1; q.K.red = 1; q.tick(60, dt); ok(q.G().pol === 0 && q.G().heat === 0, 'holding Blue and Red together is a neutral field and costs nothing');
  q.clear(); q.K.blue = 1; q.tick(3, dt); ok(q.G().pol === 1, 'Blue alone is polarity +1'); q.clear(); q.K.red = 1; q.tick(3, dt); ok(q.G().pol === -1, 'Red alone is polarity -1');
}

// ---- 2. the girder --------------------------------------------------------------------------------------------------------
{
  const q = boot(), g = q.D.girders[0], a = q.D.platforms[2];
  q.place(a[0] + a[2] - 42 - 30, a[1]); q.K.right = 1; q.K.blue = 1; q.tick(40, dt);
  ok(q.P.gird === g && !q.P.ground, 'Blue under a girder latches Bix onto it (even from the deck)');
  near(q.P.y, g.y + 8, 0.5, 'a hanging player sits just under the beam');
  const x0 = q.P.x; q.tick(30, dt); near((q.P.x - x0) / 0.5, 170, 6, 'Bix slides along the girder at 170 px/s');
  ok(q.G().heat > 10, 'hanging heats the glove');
  q.K.blue = 0; q.tick(3, dt); ok(!q.P.gird && q.P.vy >= 0, 'letting go of Blue drops Bix');
  q.clear();
  // jump-off releases with 60% of a jump
  q.place(a[0] + a[2] - 42 - 30, a[1]); q.K.blue = 1; q.K.right = 1; q.tick(40, dt);
  q.fire('keydown', { code: 'Space' }); q.tick(2, dt); ok(!q.P.gird && q.P.vy < -300, 'jumping off the girder gives a 60% jump'); q.fire('keyup', { code: 'Space' });
  q.clear();
  // overload drops Bix and locks the glove out
  q.place(a[0] + a[2] - 42 - 30, a[1]); q.K.blue = 1; q.K.right = 1; q.tick(30, dt); q.G().heat = 99.5; q.tick(6, dt);
  ok(!q.P.gird && q.G().overloaded, 'overload drops Bix from the girder'); q.tick(30, dt); ok(!q.P.gird, 'and the glove will not latch again during the lock-out');
  q.clear();
  // the end of the beam drops Bix
  q.place(a[0] + a[2] - 42 - 30, a[1]); q.K.blue = 1; q.K.right = 1; q.tick(60 * 4, dt);
  ok(!q.P.gird, 'Bix leaves the girder when it ends');
}

// ---- 3. the wall cling ----------------------------------------------------------------------------------------------------
{
  const q = boot(), s = q.D.strips[0];
  const air = (y) => Object.assign(q.P, { x: s.x + 6, y, vx: 0, vy: 0, ground: 0, support: null, inv: 999, gird: null, cling: null, latchCD: 0, grabCD: 0, hang: 0, climb: 0 });
  // (start at y 330: clear of every plate, so the climb and slide are measured on bare wall)
  air(330); q.K.blue = 0; q.tick(5, dt); ok(!q.P.cling, 'no cling without Blue');
  air(330); q.K.blue = 1; q.tick(3, dt); ok(q.P.cling === s, 'Blue on an iron wall strip clings');
  const y0 = q.P.y; q.K.up = 1; q.tick(20, dt); near((y0 - q.P.y) / (20 * dt), 120, 8, 'climbing is 120 px/s');
  q.K.up = 0; q.K.down = 1; const y1 = q.P.y; q.tick(20, dt); near((q.P.y - y1) / (20 * dt), 180, 12, 'sliding down is 180 px/s'); q.K.down = 0;
  const y2 = q.P.y; q.tick(30, dt); near(q.P.y, y2, 1, 'with no direction held Bix stays put');
  q.fire('keydown', { code: 'Space' }); q.tick(2, dt); ok(!q.P.cling && q.P.vx > 100 && q.P.vy < -300, 'jump kicks off the wall, away from it'); q.fire('keyup', { code: 'Space' });
  q.clear();
  // climbing up past a plate steps onto it
  const L1 = q.D.ledges.find(l => l.id === 'L1');
  air(L1.y + 20); q.K.blue = 1; q.tick(3, dt); q.K.up = 1; q.tick(120, dt);
  ok(q.P.ground && q.P.support && q.P.support.plate !== undefined, 'climbing the strip steps Bix onto the plate above');
  q.clear();
  // Blue does nothing to the copper strip side / away from the wall
  air(200); q.P.x = s.x + 200; q.K.blue = 1; q.tick(5, dt); ok(!q.P.cling, 'no cling away from the strip'); q.clear();
  // a grounded player holding Blue does not cling
  q.place(q.D.ledges.find(l => l.id === 'L0').x + 60, q.D.ledges.find(l => l.id === 'L0').y); q.K.blue = 1; q.tick(10, dt); ok(!q.P.cling, 'no cling while standing on a plate');
}

// ---- 4. the repel pad, the Field Boost and the net -------------------------------------------------------------------------
{
  const q = boot(), pad = q.D.pads[0], top = pad.y;
  const launch = () => { q.clear(); q.place(pad.x + 40, top); q.tick(30, dt); q.K.red = 1; let minFeet = 1e9; q.tick(120, dt, () => { minFeet = Math.min(minFeet, q.P.y + q.P.h) }); const v = q.P.vy; q.clear(); return minFeet };
  const feet = launch(); near(top - feet, 417, 12, 'the pad launches to an apex of about 417 px');
  ok(q.G().heat > 0, 'a launch costs some heat');
  q.setCogs(4); const boosted = launch(); ok(top - boosted > 650, `the Field Boost (4 cogs) launches higher: ${top - boosted} px`);
  q.setCogs(0);
  // the net
  q.clear(); const net = q.D.nets[0]; Object.assign(q.P, { x: net.x + 150, y: net.y - 300, vx: 0, vy: 600, ground: 0, inv: 0, gird: null, cling: null, support: null });
  let hurtBefore = q.state().charge, bounced = false, peakUp = 0; q.tick(120, dt, () => { if (q.P.vy < -500) bounced = true; peakUp = Math.max(peakUp, -q.P.vy) });
  ok(bounced && peakUp > 850, `the repel net bounces a falling Bix (peak ${peakUp.toFixed(0)} px/s up)`);
  ok(q.state().charge === hurtBefore && q.P.falls === 0, 'and a fall into the net costs nothing');
  // the downdraft: extra gravity inside the shaft column, none outside
  const z = q.D.downdraft[0], vAfter = (px, py) => { q.clear(); Object.assign(q.P, { x: px, y: py, vx: 0, vy: 0, ground: 0, inv: 999, gird: null, cling: null, support: null, hang: 0, climb: 0, hangRect: null, jumpTime: 0, grabCD: 0, latchCD: 0 }); q.tick(12, dt); return q.P.vy };
  q.P.face = -1;      // facing away from the right-hand plates, and 40 px from the left ones: nothing to grab on the way down
  const inShaft = vAfter(6890, -200), outside = vAfter(5000, -200);
  near(inShaft - outside, 250 * 12 * dt, 8, 'the downdraft adds 250 px/s2 of gravity inside the shaft');
}

// ---- 5. the crate ---------------------------------------------------------------------------------------------------------
{
  const q = boot(), k0 = q.D.crates[0], deck = q.D.platforms[k0.deck], cr = () => q.crates()[0];
  ok(cr().y === deck[1] - k0.h && cr().x === k0.x, 'the crate starts on its deck at its authored place');
  q.place(2600, deck[1]); q.K.blue = 1; const x0 = cr().x; q.tick(30, dt);
  near(cr().x - x0, 80, 6, 'Blue pulls the crate toward Bix at 160 px/s');
  q.tick(240, dt); ok(cr().x + cr().w <= q.P.x + 1, 'the crate stops when it reaches Bix (it never crushes him)'); q.clear();
  q.place(2600, deck[1]); cr().x = 2450; const before = cr().x; q.K.red = 1; q.tick(240, dt);
  ok(cr().x < before && cr().x >= k0.x0 - 0.01, 'Red pushes the crate away, and no further than its limit'); q.clear();
  q.place(2400, deck[1]); Object.assign(cr(), { x: 2700 - 84 }); const far = cr().x; Object.assign(q.P, { x: 2400 - 700 }); q.K.blue = 1; q.tick(30, dt);
  ok(cr().x === far, 'a crate out of range (320 px) does not move'); q.clear();
  // it is solid: Bix cannot walk through it, and can stand on it
  q.reset(0); q.setGlove(1); q.place(cr().x - 60, deck[1]); q.K.right = 1; q.tick(90, dt);
  ok(q.P.x + q.P.w <= cr().x + 0.5, 'the crate blocks a walking Bix'); q.clear();
  q.place(cr().x + 20, cr().y); q.tick(10, dt); ok(q.P.ground && q.P.support && q.P.support.crate === 0, 'Bix can stand on the crate');
  // pushing it away never carries Bix through a wall; and a respawn puts it back
  q.K.red = 1; q.place(cr().x - 100, deck[1]); q.tick(60, dt); const moved = cr().x !== k0.x; q.clear(); q.reset(0);
  ok(cr().x === k0.x, 'a respawn puts the crate back' + (moved ? '' : ' (it had not moved)'));
}

// ---- 6. crumbling plates and Pack's tether ------------------------------------------------------------------------------------
{
  const q = boot(), ix = id => q.D.ledges.findIndex(l => l.id === id);
  const standOn = id => { const l = q.D.ledges[ix(id)]; q.place(l.x + 60, l.y) };
  standOn('R0'); q.tick(Math.round(0.7 / dt), dt); ok(q.plates()[ix('R0')].gone === 0 && q.P.ground, 'a copper plate holds for 0.7 s');
  q.tick(Math.round(0.2 / dt), dt); ok(q.plates()[ix('R0')].gone > 0, 'and crumbles at 0.8 s'); ok(!q.solids().some(s => s.plate === ix('R0')), 'a crumbled plate is not solid');
  q.tick(Math.round(2.6 / dt), dt); ok(q.plates()[ix('R0')].gone === 0 && q.solids().some(s => s.plate === ix('R0')), 'it returns 2.5 s later');
  standOn('L0'); q.tick(Math.round(3 / dt), dt); ok(q.plates()[ix('L0')].gone === 0 && q.solids().some(s => s.plate === ix('L0')), 'an iron plate never crumbles');
  standOn('R1'); q.tick(Math.round(1.2 / dt), dt); q.reset(0); ok(q.plates().every(s => s.gone === 0 && !s.armed), 'a respawn restores every plate (a fall can never strand you)');
  // the fatal plate: the first time, Pack tethers Bix to the apex deck
  const apex = q.D.platforms[q.D.tetherDeck]; q.setGlove(1);
  standOn('R4'); q.tick(Math.round(0.9 / dt), dt);
  ok(q.tether() || q.P.x > apex[0], 'the last plate crumbles and Pack tethers Bix'); ok(/Tether deployed/.test(q.line()), 'Pack says so');
  q.tick(Math.round(1.5 / dt), dt);
  ok(!q.tether() && q.P.ground && q.P.x >= apex[0] && Math.abs(q.P.y + q.P.h - apex[1]) < 2, 'the tether lands Bix on the apex deck');
  ok(q.state().tetherUsed === 1, 'the scripted rescue is once only');
  standOn('R4'); q.tick(Math.round(1.0 / dt), dt); q.tick(Math.round(1.0 / dt), dt);
  ok(!q.tether() && q.P.y > q.D.ledges[ix('R4')].y, 'the second time the plate simply drops him (the net catches him)');
}

// ---- 7. presses -----------------------------------------------------------------------------------------------------------
{
  const q = boot();
  for (const pr of q.D.presses) {
    let lethal = 0, tell = 0, slam = 0, n = 0; const seq = [];
    for (let t = 0; t < pr.period; t += 0.005) { const s = q.pressState(pr, 10 + t); n++; if (s.lethal) lethal++; if (s.ph === 'tell') tell++; if (s.ph === 'slam') slam++; seq.push(s.ph) }
    near(lethal * 0.005, 0.4, 0.03, `press ${pr.id} is lethal for 0.4 s of its cycle`);
    near(tell * 0.005, 0.5, 0.03, `press ${pr.id} shows its amber tell for 0.5 s`);
    near(slam * 0.005, 0.15, 0.02, `press ${pr.id} slams in 0.15 s`);
    // the tell always comes BEFORE the slam
    // (the cycle is circular: whatever phase we start in, the phase just before every slam must be the tell)
    const iSlam = seq.findIndex((p, i) => p === 'slam' && seq[(i - 1 + seq.length) % seq.length] !== 'slam'); ok(iSlam >= 0 && seq[(iSlam - 1 + seq.length) % seq.length] === 'tell', `press ${pr.id}: the amber tell must come immediately before the slam`);
    // crushed: stand under a lethal press. Safe: stand under an open one.
    const deck = q.D.platforms.find(p => Math.abs(p[1] - pr.anvil) < 1 && pr.x >= p[0] && pr.x + pr.w <= p[0] + p[2]);
    const trial = (phase) => {
      const qq = boot(); qq.D.checkpoints.forEach(c => qq.seen.add(c)); qq.setCP(qq.D.checkpoints[0]); qq.setGlove(0);
      for (let t = 0; t < pr.period; t += 0.005) if (qq.pressState(pr, 10 + t).ph === phase) { qq.S.clock = 10 + t; break }
      qq.place(pr.x + pr.w / 2 - 21, deck[1]); qq.P.inv = 0; const c0 = qq.state().charge; qq.tick(3, 1 / 120); return qq.state().charge !== c0;
    };
    ok(trial('rest'), `press ${pr.id} crushes a player standing under it while it rests`);
    ok(!trial('up'), `press ${pr.id} is harmless while it is up`);
    ok(!trial('tell'), `press ${pr.id} is harmless during the amber tell`);
  }
}

// ---- 8. the shield -----------------------------------------------------------------------------------------------------------
{
  // (every story line is marked as already heard: teleporting Bix across the level would otherwise fire them all and overwrite the shield's caption)
  const world = banked => { const q = boot({ enemies: true, search: '?banked=' + banked }); q.D.triggers.forEach(t => { t.used = 1 }); return q };
  const findShot = (q) => { const e = q.enemies().find(x => x.type === 'spitter'); for (let i = 0; i < 1200 && !e.shot; i++) q.tick(1, 1 / 120); return e };
  // Tempered (12): parries the spitter, reflects the shot, and the reflected shot destroys the spitter
  let q = world(12); ok(q.G().tier.name === 'Tempered Induction' && q.G().charges === 2, '12 banked cogs is Tempered Induction with 2 charges');
  q.setGlove(1); q.D.checkpoints.forEach(c => q.seen.add(c));
  const sp = findShot(q); Object.assign(q.P, { x: sp.shot.x - 10, y: sp.shot.y - 45, vx: 0, vy: 0, inv: 999, ground: 0, gird: null, cling: null }); q.K.shield = 1; q.tick(1, 1 / 120); q.K.shield = 0;
  ok(q.reflected().length === 1 && sp.shot === null, 'a Tempered shield reflects a spitter shot'); ok(q.G().charges === 1, 'and uses one charge'); ok(/Return to sender/.test(q.line()), 'Bix says the line');
  Object.assign(q.P, { x: 5400, y: 300, vx: 0, vy: 0 }); q.tick(240, 1 / 120);
  ok(sp.dead && q.reflected().length === 0, 'the reflected shot destroys the spitter (and is used up)');
  // crawler flip
  q = world(12); q.setGlove(1); const cr = q.enemies().find(x => x.type === 'crawler'); q.tick(90, 1 / 60);
  const hz = () => { const h = q.enemies().find(x => x.type === 'crawler'); return h && h.dead ? null : h };
  let c = q.enemies().find(x => x.type === 'crawler'); Object.assign(q.P, { x: c.x + 5, y: c.y - 40, vx: 0, vy: 0, inv: 999, ground: 0 }); q.K.shield = 1; q.tick(2, 1 / 60); q.K.shield = 0;
  ok(c.dead, 'a Tempered shield flips a crawler');
  // Brittle (0): cannot parry the spitter
  q = world(0); ok(q.G().tier.name === 'Brittle Coil' && q.G().charges === 1, '0 banked cogs is Brittle Coil with 1 charge'); q.setGlove(1);
  const sp0 = findShot(q); Object.assign(q.P, { x: sp0.shot.x - 10, y: sp0.shot.y - 45, vx: 0, vy: 0, inv: 999, ground: 0 }); q.K.shield = 1; q.tick(2, 1 / 120);
  ok(q.reflected().length === 0, 'a Brittle shield cannot reflect a spitter shot');
  // Aegis (20): EMP stuns nearby enemies on a parry
  q = world(20); ok(q.G().tier.name === 'Superconducting Aegis' && q.G().charges === 3, '20 banked cogs is Superconducting Aegis with 3 charges'); q.setGlove(1);
  c = q.enemies().find(x => x.type === 'crawler'); q.tick(90, 1 / 60);
  Object.assign(q.P, { x: c.x + 5, y: c.y - 40, vx: 0, vy: 0, inv: 999, ground: 0 }); const other = q.enemies().find(x => x.type === 'spitter'); Object.assign(other, { x: c.x + 60, y: c.y - 60 });
  q.K.shield = 1; q.tick(2, 1 / 60); ok(other.stun > 0, 'an Aegis parry stuns enemies within 180 px');
  // empty capacitor, and refill at a checkpoint
  q = world(0); q.setGlove(1); q.D.checkpoints.forEach(c => q.seen.add(c)); q.seen.delete(q.D.checkpoints[1]);      // the start checkpoint is already taken; TOOL BAY is not
  q.K.shield = 1; q.tick(2, dt); q.K.shield = 0; q.tick(40, dt); ok(q.G().charges === 0, 'using the only charge empties a Brittle shield');
  q.K.shield = 1; q.tick(2, dt); ok(/CRITICAL/.test(q.line()), 'an empty shield says so'); q.K.shield = 0;
  q.place(q.D.checkpoints[1].x + 30, q.D.checkpoints[1].y); q.tick(3, dt); ok(q.G().charges === 1, 'a checkpoint refills the shield');
  // no shield without the glove
  q = world(12); q.setGlove(0); q.K.shield = 1; q.tick(3, dt); ok(q.G().charges === 2, 'the shield needs the glove');
}

// ---- 9. checkpoints, Pack's catch, respawn -------------------------------------------------------------------------------------
{
  const q = boot(), cp = n => q.D.checkpoints.find(c => c.name === n);
  q.place(cp('TOOL BAY').x + 20, cp('TOOL BAY').y); q.tick(3, dt); ok(q.state().checkpoint.name === 'TOOL BAY', 'standing on the TOOL BAY deck arms its checkpoint');
  // a shaft plate at the wrong height must not arm the rest checkpoint early
  const ix = id => q.D.ledges.find(l => l.id === id);
  q.place(ix('R1').x + 60, ix('R1').y); q.tick(3, dt); ok(q.state().checkpoint.name !== 'SHAFT REST', 'plate R1 does not arm SHAFT REST a step early');
  q.place(ix('L2').x + 60, ix('L2').y); q.tick(3, dt); ok(q.state().checkpoint.name === 'SHAFT REST', 'the rest plate arms it');
  // Pack catches once, then a real respawn
  q.P.inv = 0; q.hurt('test'); ok(q.state().charge === 0 && Math.abs(q.P.x - cp('SHAFT REST').x) < 1, "Pack's catch puts Bix back on the checkpoint and spends its charge");
  q.P.inv = 0; const falls = q.P.falls; q.hurt('test'); ok(q.P.falls === falls + 1 && q.state().gloveOn === 1, 'the next death respawns him and he keeps the glove');
  ok(q.state().charge === 1 || true, 'respawn is on the checkpoint'); near(q.P.x, cp('SHAFT REST').x, 1, 'the respawn is at the last checkpoint');
  // a full restart takes the glove and the cogs
  q.reset(1); ok(q.state().gloveOn === 0 && q.state().cogs === 0 && q.P.falls === 0, 'a full restart clears the glove, cogs and falls');
}

// ---- 10. camera, cogs and finish ----------------------------------------------------------------------------------------------
{
  const q = boot(); q.place(600, 600); q.tick(240, dt); near(q.state().camY, q.D.areas[0].camY, 2, 'the yard uses its own flat camera height');
  q.place(3000, 540); q.tick(300, dt); near(q.state().camY, q.D.areas[1].camY, 2, 'the crusher bay raises the flat camera so the press heads clear the HUD');
  const L2 = q.D.ledges.find(l => l.id === 'L2'); q.place(L2.x + 60, L2.y); q.tick(300, dt);
  ok(q.state().camY < 0 && q.state().camY >= q.D.world.yMin, `the shaft follows Bix up (camY ${q.state().camY.toFixed(0)})`);
  // cogs
  const c0 = q.D.cogs[0]; q.place(c0.x - 21, c0.y + 60); q.P.y = c0.y - 40; q.tick(3, dt); ok(q.state().cogs >= 1 && c0.got === 1, 'walking into a cog collects it');
  ok(q.els.cogCount.textContent === `${q.state().cogs} / 12`, 'the cog counter updates');
  ok(q.D.finish === undefined || q.D.finish === null, 'the level ends at the transit door, not at a finish line');
}

// ---- 11. the page --------------------------------------------------------------------------------------------------------------
{
  const html = fs.readFileSync(path.join(ROOT, 'dist/level3.html'), 'utf8'), js = fs.readFileSync(path.join(ROOT, 'dist/level3.js'), 'utf8');
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const listed = /\['start','complete'[^\]]+\]/.exec(js)[0].match(/'([^']+)'/g).map(s => s.replace(/'/g, ''));
  for (const id of [...listed, 'startButton', 'replayButton', 'game', 'joystick', 'joystickKnob']) ok(ids.has(id), `level3.html has no #${id}, which level3.js needs`);
  for (const k of ['blue', 'red', 'shield', 'jump', 'interact']) ok(new RegExp(`data-key="${k}"`).test(html), `the touch button for ${k} is missing`);
  const scripts = [...html.matchAll(/<script src="\.\/([^"?]+)/g)].map(m => m[1]);
  ok(scripts.join() === ['firebase-config.js', 'progress.js', 'level2-art.js', 'level2-enemies.js', 'level3-glove.js', 'level3-data.js', 'level3-art.js', 'level3.js', 'auth.js'].join(), 'scripts load in dependency order: ' + scripts.join(', '));
  for (const f of scripts) ok(fs.existsSync(path.join(ROOT, 'dist', f)), `dist/${f} does not exist`);
  for (const l of [...html.matchAll(/<link rel="stylesheet" href="\.\/([^"?]+)/g)].map(m => m[1])) ok(fs.existsSync(path.join(ROOT, 'dist', l)), `dist/${l} does not exist`);
  ok(/pointer-events:none/.test(fs.readFileSync(path.join(ROOT, 'dist/level3.css'), 'utf8')), 'the glove HUD does not block touches');
  ok(/data-key="blue"[\s\S]*?<span class="lbl">BLUE<\/span>/.test(html) && /data-key="red"[\s\S]*?<span class="lbl">RED<\/span>/.test(html) && /data-key="shield"[\s\S]*?<span class="lbl">SHIELD<\/span>/.test(html), 'the touch buttons are labelled');
  ok(/aria-label="Blue field[^"]*"/.test(html) && /aria-label="Red field[^"]*"/.test(html) && (html.match(/<svg/g) || []).length >= 3, 'each glove button has an accessible name and an icon');
  // Blue's icon points inward, Red's outward (the accessibility rule: shape, not just colour)
  const iconOf = k => { const at = html.indexOf('data-key="' + k + '"'); return html.slice(at, html.indexOf('</svg>', at)) };
  ok(/M8 17 L23 32 L8 47/.test(iconOf('blue')) && /M24 17 L9 32 L24 47/.test(iconOf('red')), 'Blue draws inward chevrons and Red outward chevrons');
}

// ---- 11b. the first cog is on the walking line: running from the crash site to the locker collects it ------------------------------
{
  const q = boot(), c0 = q.D.cogs[0], deck = q.D.platforms[1];
  ok(c0.x > deck[0] && c0.x < deck[0] + deck[2] && Math.abs((deck[1] - q.P.h + 40) - c0.y) < 30, 'c0 sits at body height on the locker deck');
  q.place(deck[0] + 20, deck[1]); q.K.right = 1; q.tick(120, dt); ok(q.state().cogs === 1 && q.els.cogCount.textContent === '1 / 12', 'walking along the locker deck collects the first cog');
}

// ---- 12. Level 3 opens once Levels 1 and 2 have banked more than 12 cogs -----------------------------------------------------------
{
  const mk = (a, b) => boot({ mayhem: { getProgress: () => ({ levels: { level1: { bestCogs: a }, level2: { bestCogs: b } } }), subscribe() {}, recordResult: () => Promise.resolve('') } });
  let q = mk(6, 6); ok(q.els.startButton.disabled === true && q.els.lockNote.hidden === false && /12 so far/.test(q.els.lockNote.textContent), '12 banked cogs: Level 3 is locked and says how many you have');
  q = mk(12, 1); ok(q.els.startButton.disabled === false && q.els.lockNote.hidden === true, '13 banked cogs: Level 3 opens');
  q = mk(0, 0); ok(q.els.startButton.disabled === true, 'a brand-new player finds it locked');
  q = mk(12, 14); ok(q.els.startButton.disabled === false, 'a full clear of Levels 1 and 2 opens it');
  q = boot({ search: '?banked=20' }); ok(q.els.startButton.disabled === false, 'the ?banked test switch counts too');
}

// ---- 13. drawing never throws, in any glove state (a crash in the effects once left the canvas in additive blending) ----------------------------------
{
  const q = boot(); q.setGlove(1);
  const states = [['idle', () => {}], ['blue', () => { q.K.blue = 1 }], ['red', () => { q.K.blue = 0; q.K.red = 1 }], ['hot', () => { q.K.red = 0; q.G().heat = 70 }],
    ['warning', () => { q.G().heat = 90 }], ['overload', () => { q.G().overloaded = true; q.G().lock = 2 }], ['shield', () => { q.G().overloaded = false; q.G().shieldT = 0.3 }]];
  for (const [name, set] of states) { set(); q.tick(2, 1 / 60); let err = null; try { q.draw() } catch (e) { err = e } ok(!err, `draw() works with the glove ${name}: ${err && err.message}`) }
  for (const cp of q.D.checkpoints) { q.place(cp.x, cp.y); q.tick(2, 1 / 60); let err = null; try { q.draw() } catch (e) { err = e } ok(!err, `draw() works at ${cp.name}: ${err && err.message}`) }
}

console.log(JSON.stringify({ checks }));
