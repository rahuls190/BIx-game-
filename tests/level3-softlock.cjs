/* Level 3 has no soft-locks (stage 1). Run from the repo root: node tests/level3-softlock.cjs
   Level 2 had a gate that could strand a player; this test exists so Level 3 never does. Three kinds of proof:
     1. on paper: a graph of every surface, with the glove's one-way edges (repel pad up, girder across); from EVERY checkpoint the
        apex deck must still be reachable
     2. in the engine: whatever you do to the crate, a bot can still get from the yard exit deck to the crusher bay; every fall in the
        shaft ends safely, costs no life and never leaves you stranded; every respawn is a safe standing spot
     3. state: a respawn or restart restores plates, crate, glove-heat and shield; the glove is kept across a respawn. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { boot, ROOT } = require('./level3-harness.cjs');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dt = 1 / 60;

// ---------------------------------------------------------------- 1. the graph
{
  const sb = { console }; sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'dist/level3-data.js'), 'utf8'), sb);
  const D = sb.window.L3DATA;
  const S = {};
  D.platforms.forEach((p, i) => S['p' + i] = { x: p[0], y: p[1], w: p[2] });
  D.ledges.forEach((l, i) => S['l' + i] = { x: l.x, y: l.y, w: l.w });
  const RUN = 285, PW = 42, MARGIN = 30;
  const margin = (a, b, g = 1450, v0 = 780) => {
    const rise = a.y - b.y, disc = v0 * v0 - 2 * g * rise; if (disc <= 0) return -Infinity;
    const t = (v0 + Math.sqrt(disc)) / g, gp = Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
    return RUN * t - 35 - (gp + PW);
  };
  const inShaft = s => (D.downdraft || []).some(z => s.x >= z.x0 - 1 && s.x + s.w <= z.x1 + 1);
  const gFor = (a, b) => 1450 + ((inShaft(a) || inShaft(b)) ? D.downdraft[0].extra : 0);
  const id = n => n[0] + n[1];
  const edges = {}, add = (a, b) => (edges[a] ??= new Set()).add(b);
  for (const c of D.chains) {
    if (c.kind !== 'required') continue;
    for (let i = 1; i < c.nodes.length; i++) {
      const a = id(c.nodes[i - 1]), b = id(c.nodes[i]);
      if (c.mode === 'pad') { add(a, b); continue }                  // the pad only goes UP: the way back down is a drop
      if (c.mode === 'girder') { add(a, b); continue }               // the girder only goes ACROSS toward p3
      if (margin(S[a], S[b], gFor(S[a], S[b])) >= MARGIN) add(a, b);
      if (margin(S[b], S[a], gFor(S[a], S[b])) >= MARGIN) add(b, a);
    }
  }
  // dropping straight off a surface onto one lower and near it is always possible: the same test, either way round
  const reach = from => { const seen = new Set([from]), q = [from]; while (q.length) { const n = q.pop(); for (const m of edges[n] || []) if (!seen.has(m)) { seen.add(m); q.push(m) } } return seen };
  const deckAt = (x, y) => Object.entries(S).filter(([, s]) => Math.abs(s.y - y) <= 1 && x >= s.x && x <= s.x + s.w).map(([k]) => k);
  const apex = 'p18';      // the end of the lab: the train and the vault have their own engine tests
  D.checkpoints.filter(cp => cp.x < 11200).forEach(cp => {
    const own = deckAt(cp.x, cp.y); ok(own.length === 1, `checkpoint ${cp.name} stands on exactly one surface`);
    ok(reach(own[0]).has(apex), `from checkpoint ${cp.name} (${own[0]}) the apex deck can no longer be reached: soft-lock`);
  });
  const start = deckAt(D.checkpoints[0].x, D.checkpoints[0].y)[0], r0 = reach(start);
  ok(r0.has(apex), 'from the start the apex deck is reachable');
  for (const n of Object.keys(S)) if (n !== 'l0') ok(r0.has(n) || !D.chains.some(c => c.kind === 'required' && c.nodes.some(x => id(x) === n)), `required surface ${n} is not reachable from the start`);
  ok(true, 'graph done');
}

// ---------------------------------------------------------------- 2a. the crate cannot block the route
{
  const q0 = boot(), k0 = q0.D.crates[0], deck = q0.D.platforms[k0.deck], next = q0.D.platforms[k0.deck + 1];
  for (const cx of [k0.x0, 2400, 2450, 2500, 2560, k0.x1 - k0.w]) {
    const q = boot(); q.crates()[0].x = cx; q.setGlove(0);
    q.place(deck[0] + 4, deck[1]); q.P.inv = 999; q.K.right = 1;
    // a simple bot: hold right; jump when something tall blocks the way, or at the end of whatever it stands on
    let reached = false, t = 0, stuckFor = 0, lastX = q.P.x;
    while (t < 20) {
      const P = q.P, ahead = q.solids().find(s => s.crate !== undefined && s.x >= P.x + P.w - 2 && s.x <= P.x + P.w + 16 && P.y + P.h > s.y + 4);
      const sup = P.support, atEdge = P.ground && sup && P.x + P.w >= sup.x + sup.w - 14;
      if (P.ground && (ahead || atEdge)) { P.buffer = 0.16; q.K.jump = 1 } else if (!ahead) q.K.jump = 0;
      q.tick(1, dt); t += dt;
      if (P.ground && P.support && P.support.x === next[0] && P.support.y === next[1]) { reached = true; break }
      if (Math.abs(P.x - lastX) < 0.01) stuckFor += dt; else stuckFor = 0; lastX = P.x;
      if (stuckFor > 3) break;
    }
    ok(reached, `with the crate left at x ${cx} the yard exit deck can still be crossed (the bot ended at x ${q.P.x.toFixed(0)}, y ${q.P.y.toFixed(0)})`);
  }
}

// ---------------------------------------------------------------- 2b. every fall in the shaft is safe
{
  const q = boot(); q.setGlove(1);
  q.D.checkpoints.forEach(c => q.seen.add(c));
  const net = q.D.nets[0], base = q.D.platforms[11];
  // drop Bix from every plate, straight down the middle gap and near each wall, with a real (uninvulnerable) player
  const spots = [];
  q.D.ledges.slice(1).forEach(l => { for (const dx of [-30, 20, 60, 110, 170]) spots.push({ x: l.x + dx, y: l.y - q.P.h }) });
  let unsafe = 0, worst = '';
  for (const s of spots) {
    q.reset(1); q.setGlove(1); q.D.checkpoints.forEach(c => q.seen.add(c)); q.setCP(q.D.checkpoints.find(c => c.name === 'SHAFT BASE'));
    Object.assign(q.P, { x: Math.max(6690, Math.min(7050, s.x)), y: s.y, vx: 0, vy: 0, ground: 0, inv: 0, support: null, gird: null, cling: null, hang: 0, climb: 0, grabCD: 0, latchCD: 0 });
    let landed = false, dead = false, t = 0;
    q.clear();
    while (t < 8) {
      q.K.left = t > 0.3 ? 1 : 0;      // a player steers toward the way out once they are falling; standing still would just bounce on the net for ever
      q.tick(1, dt); t += dt;
      if (q.state().charge === 0 || q.P.falls) { dead = true; break }
      if (q.P.ground && t > 0.6 && q.P.support) { landed = true; if (q.P.support.x === base[0] || q.P.support.plate !== undefined) break }
    }
    if (dead || !landed) { unsafe++; worst = `from x ${s.x}, y ${s.y}: ${dead ? 'died' : 'never landed'}` }
  }
  ok(unsafe === 0, `${unsafe} of ${spots.length} shaft falls were unsafe (last: ${worst})`);
  ok(net.y - base[1] >= 100, 'the net sits well below the base');
}

// ---------------------------------------------------------------- 2c. every respawn is a safe standing spot
{
  for (const cp of boot().D.checkpoints.filter(c => c.area !== 'train')) {        // the train has its own test (tests/level3-areas.cjs)
    const q = boot({ enemies: true }); q.setGlove(1); q.setCP(q.D.checkpoints.find(c => c.name === cp.name));
    q.reset(0); q.P.inv = 0;
    // the respawn grace is 0.75 s; after that Bix must have survived 4 s standing still, with the level's real enemies and presses
    let hurt = false; const c0 = q.state().charge, f0 = q.P.falls;
    q.tick(Math.round(4 / dt), dt, () => { if (q.state().charge !== c0 || q.P.falls !== f0) { hurt = true; return false } });
    ok(!hurt, `respawning at ${cp.name} and standing still for 4 s must be safe`);
    ok(q.P.ground && Math.abs(q.P.y + q.P.h - cp.y) < 2, `${cp.name}: Bix is standing on the checkpoint after the respawn`);
    ok(!q.D.presses.some(p => cp.x + 21 > p.x - 20 && cp.x + 21 < p.x + p.w + 20 && Math.abs(cp.y - p.anvil) < 2), `${cp.name} is not under a press`);
  }
}

// ---------------------------------------------------------------- 3. state is restored
{
  const q = boot(); q.setGlove(1);
  const ix = id => q.D.ledges.findIndex(l => l.id === id);
  q.crates()[0].x = 2600; q.plates()[ix('R0')].gone = 2; q.G().heat = 70; q.G().charges = 0; q.D.cogs[0].got = 1;
  q.P.inv = 0; q.setCP(q.D.checkpoints[1]); q.reset(0);
  ok(q.crates()[0].x === q.D.crates[0].x, 'a respawn puts the crate back');
  ok(q.plates().every(s => s.gone === 0 && s.armed === 0 && s.t === 0), 'a respawn restores every crumbled plate');
  ok(q.G().heat === 0 && !q.G().overloaded && q.G().charges === q.G().tier.charges, 'a respawn cools the glove and refills the shield');
  ok(q.state().gloveOn === 1, 'a respawn keeps the glove');
  ok(q.D.cogs[0].got === 1, 'a respawn keeps the cogs already collected');
  q.reset(1);
  ok(q.state().gloveOn === 0 && q.D.cogs.every(c => !c.got) && q.state().tetherUsed === 0, 'a full restart clears the glove, the cogs and the tether');
  // overload never strands anyone: the lock ends by itself
  q.setGlove(1); q.G().overloaded = true; q.G().lock = 2.5; q.tick(Math.round(3 / dt), dt); ok(!q.G().overloaded, 'an overloaded glove recovers by itself');
}

console.log(JSON.stringify({ checks }));
