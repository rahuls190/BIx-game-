/* Level 3 geometry proofs (stage 1: Areas 1-3). Run from the repo root: node tests/level3-geometry.cjs
   Pure maths on dist/level3-data.js, using the same ballistic formula as tests/level2-geometry.cjs, plus the glove-specific rules:
     - every required hop has spare reach (40 px on the flat, 30 px in the shaft's downdraft)
     - the two places that TEACH the glove (repel pad, girder) cannot be done without it, even allowing for the engine's ledge grab
     - the crate ledge cannot be reached without the crate
     - the yard girder never overheats the glove; every checkpoint stands on a real surface and cannot arm a step early
     - the data still matches the design document's layout draft
   tests/level3-route.cjs plays the same hops in the real engine. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const sb = { console }; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dist/level3-data.js'), 'utf8'), sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dist/level3-glove.js'), 'utf8'), sb);
const D = sb.window.L3DATA, GL = sb.window.L3GLOVE;
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };

const G0 = 1450, JUMP = 780, RUN = 285, PW = 42, PH = 96;
// MANTLE: the highest rise the base jump plus the engine's ledge grab can climb. MEASURED in the real engine (tests/level3-route.cjs re-proves it):
// a rise of 300 px was climbed by half the run-ups, 320 px by none. Anything meant to need the glove must rise well past it.
const MANTLE = 310, PAD_V = 1100, HANG = 170, PIT_SAFE = 460;
const apex = (g, v0 = JUMP) => v0 * v0 / (2 * g);
ok(Math.round(apex(G0)) === 210 || Math.round(apex(G0)) === 209, 'the base jump apex is 209 px');

const surf = n => {
  if (n[0] === 'p') { const p = D.platforms[n[1]]; return { x: p[0], y: p[1], w: p[2] } }
  const l = D.ledges[n[1]]; return { x: l.x, y: l.y, w: l.w };
};
const gapOf = (a, b) => Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
function margin(a, b, g = G0, v0 = JUMP) {
  const rise = a.y - b.y, disc = v0 * v0 - 2 * g * rise; if (disc <= 0) return -Infinity;
  const t = (v0 + Math.sqrt(disc)) / g;
  return RUN * t - 35 - (gapOf(a, b) + PW);
}
const inDowndraft = s => (D.downdraft || []).some(z => s.x >= z.x0 - 1 && s.x + s.w <= z.x1 + 1 && s.y >= z.y0 && s.y <= z.y1);
const gravityFor = (a, b) => G0 + ((D.downdraft || []).find(z => inDowndraft(a) || inDowndraft(b))?.extra || 0);

// ---- 1. the data is well formed --------------------------------------------------------------------------------------------
{
  const ps = D.platforms.map(p => ({ x: p[0], y: p[1], w: p[2] }));
  ps.forEach((p, i) => { ok(p.w >= 200, `platform ${i} is ${p.w} px wide: too narrow to stand a run-up on`); ok(p.x + p.w <= D.world.w, `platform ${i} runs past the world edge`) });
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++)
    ok(ps[i].x + ps[i].w <= ps[j].x || ps[j].x + ps[j].w <= ps[i].x, `platforms ${i} and ${j} overlap`);
  ok(D.ledges.every(l => l.h === 16 && ['steel', 'iron', 'copper'].includes(l.t)), 'every ledge is 16 px thick and steel, iron or copper');
  ok(D.ledges.filter(l => l.fatal).length === 1 && D.ledges.find(l => l.id === 'R4').fatal, 'exactly one plate is the fatal (tether) plate, and it is the last shaft plate');
  ok(D.ledges.filter(l => l.t === 'copper').length === 5, 'the shaft has five crumbling copper plates');
  ok(D.areas.slice(0, -1).every((a, i) => i === 0 || a.x0 === D.areas[i - 1].x1) && D.areas[0].x0 === 0 && D.areas.slice(0, -1).at(-1).x1 === 20600, 'the six areas tile the level with no gaps (the archive room is apart)');
  ok(D.areas.filter(a => a.vertical).map(a => a.id).join() === 'shaft,vault', 'only the shaft and the vault have the vertical camera');
  ok(D.cogs.length === 12 && new Set(D.cogs.map(c => c.id)).size === 12, 'the level has twelve cogs (c0-c11), each with its own id');
  D.triggers.forEach((t, i) => ok(t.t.length <= 90 && t.s, `trigger ${i} is too long for a HUD caption`));
}

// ---- 2. every required hop has spare reach --------------------------------------------------------------------------------
const hopRows = [];
for (const c of D.chains) {
  if (c.kind !== 'required') continue;
  for (let i = 1; i < c.nodes.length; i++) {
    const a = surf(c.nodes[i - 1]), b = surf(c.nodes[i]), id = c.nodes[i - 1].join('') + '->' + c.nodes[i].join('');
    if (c.mode === 'pad' || c.mode === 'girder') continue;         // proven separately below
    const g = gravityFor(a, b), need = g > G0 ? 30 : 40, m = margin(a, b, g);
    hopRows.push({ id, chain: c.id, rise: a.y - b.y, gap: gapOf(a, b), g, m });
    ok(m >= need, `${c.id} ${id}: only ${m.toFixed(0)} px of spare reach (need ${need}) at gravity ${g}`);
  }
}
ok(hopRows.length === 26, 'expected 26 jump hops (1 + 7 + 1 flat, 11 in the shaft, 6 in the lab), got ' + hopRows.length + ' hops');
ok(hopRows.filter(h => h.g > G0).length === 11, 'the shaft climb has 11 hops, all under the downdraft');

// ---- 3. the pad hop needs the pad --------------------------------------------------------------------------------------
{
  const c = D.chains.find(q => q.id === 'a1-pad'), a = surf(c.nodes[0]), b = surf(c.nodes[1]), pad = D.pads.find(p => p.id === c.via);
  const rise = a.y - b.y;
  ok(rise > MANTLE + 25, `the pad hop rises ${rise} px: the base jump plus a ledge grab tops out near ${MANTLE}, so it must clear that by 25 px`);
  ok(margin(a, b) === -Infinity, 'the base jump cannot reach the raised deck at all');
  const withPad = margin(a, b, G0, PAD_V); ok(withPad >= 40, `with the pad the hop has only ${withPad.toFixed(0)} px to spare`);
  ok(margin(a, b, G0, PAD_V * 1.3) >= 40, 'the +30% Field Boost keeps the pad hop valid too');
  ok(pad.y === a.y && pad.x >= a.x && pad.x + pad.w <= a.x + a.w, 'the pad lies on top of the take-off deck');
  ok(a.x + a.w - (pad.x + pad.w) <= 10, 'the pad is at the deck edge, so the launch heads toward the target');
}

// ---- 4. the girder crossing needs the girder ---------------------------------------------------------------------------
{
  const c = D.chains.find(q => q.id === 'a1-girder'), a = surf(c.nodes[0]), b = surf(c.nodes[1]), g = D.girders.find(q => q.id === c.via);
  const drop = b.y - a.y, disc = JUMP * JUMP + 2 * G0 * drop, t = (JUMP + Math.sqrt(disc)) / G0, freeReach = RUN * t - 35 - PW;
  const gap = gapOf(a, b);
  ok(gap > freeReach + 100 && gap >= PIT_SAFE, `the pit is ${gap} px; a free run-and-jump was measured to cross up to about 400 px (paper estimate ${freeReach.toFixed(0)}), so it must be at least ${PIT_SAFE}`);
  const span = g.x1 - g.x0, secs = span / HANG, heat = secs * GL.consts.HEAT_ENGAGED;
  ok(heat <= 60, `the girder takes ${secs.toFixed(1)} s to slide along and heats the glove ${heat.toFixed(0)}% (limit 60)`);
  const headStanding = a.y - PH;
  ok(headStanding >= g.y - 10 && headStanding <= g.y + 60, 'a player standing on the take-off deck is inside the latch window under the girder');
  ok(g.x0 <= a.x + a.w + 20, 'the girder starts over the take-off deck, so it can be latched from the edge');
  ok(b.x - g.x1 <= 100 && b.x - g.x1 >= -50, `dropping off the end of the girder must land near the far deck (${b.x - g.x1} px away)`);
  ok(g.y > D.platforms[2][1] - 300, 'the girder is within reach of a standing jump');
}

// ---- 5. the crate ledge needs the crate --------------------------------------------------------------------------------
{
  const k = D.crates[0], deck = surf(['p', k.deck]), ledge = surf(['l', 0]);
  const rise = deck.y - ledge.y; ok(rise > MANTLE + 25, `the crate ledge is ${rise} px up: it must clear the ${MANTLE} px mantle limit to need the crate`);
  const crateTop = { x: k.x0, y: deck.y - k.h, w: k.x1 - k.x0 };
  const rise2 = crateTop.y - ledge.y;
  ok(rise2 <= apex(G0) - 10, `from the top of the crate the ledge is ${rise2} px up, more than a plain jump can do`);
  ok(margin(crateTop, ledge) >= 40, 'the crate step has spare reach');
  ok(k.x0 <= ledge.x + ledge.w && k.x1 >= ledge.x, 'the crate can be moved under the ledge');
  ok(k.x0 >= deck.x && k.x1 <= deck.x + deck.w, 'the crate stays on its deck');
  ok(k.x < deck.x + deck.w && k.x >= deck.x, 'the crate starts on its deck');
}

// ---- 6. the shaft ---------------------------------------------------------------------------------------------------
{
  const z = D.downdraft[0], grav = G0 + z.extra;
  ok(apex(grav) > 170 && apex(grav) < 185, `under the downdraft the jump apex is ${apex(grav).toFixed(0)} px (the design says 179)`);
  const plates = D.ledges.filter(l => /^[LR][0-9]$/.test(l.id));
  plates.forEach((p, i) => {
    if (i === 0) return; const q = plates[i - 1];
    ok(q.y - p.y === 90, `plate ${p.id} is ${q.y - p.y} px above ${q.id} (the design rises 90 each time)`);
    ok((p.x < q.x) !== (p.x > q.x), 'plates alternate sides');
  });
  ok(plates.every(p => p.x >= z.x0 && p.x + p.w <= z.x1), 'every plate lies inside the downdraft column');
  const s = D.strips[0]; ok(s.x === z.x0 && s.y0 <= plates[plates.length - 1].y && s.y1 >= plates[0].y, 'the iron wall strip runs the height of the left plates');
  const net = D.nets[0]; ok(net.x === z.x0 && net.x + net.w === z.x1, 'the net spans the whole shaft floor');
  const base = surf(['p', 11]), first = surf(['l', 1]);
  ok(net.y - base.y >= 100, 'the net is well below the shaft base, so a fall is not a wall of platform');
  // a bounce off the net (900 px/s) must clear the shaft base so a player can walk back out
  ok(net.y - apex(G0, 900) < base.y - 60, `a net bounce peaks at y ${net.y - apex(G0, 900)}, it must clear the base (${base.y}) by 60 px`);
  ok(gapOf(base, first) <= 40, 'the first plate is next to the shaft base');
  const last = D.ledges.find(l => l.id === 'R4'), apexDeck = surf(['p', 12]);
  ok(last.y - apexDeck.y === 20 || Math.abs(last.y - apexDeck.y) <= 40, 'the last plate is close in height to the apex deck');
}

// ---- 7. presses, enemies -----------------------------------------------------------------------------------------------
{
  for (const pr of D.presses) {
    const deck = D.platforms.find(p => Math.abs(p[1] - pr.anvil) < 1 && pr.x >= p[0] && pr.x + pr.w <= p[0] + p[2]);
    ok(deck, `press ${pr.id} does not stand over a deck at y ${pr.anvil}`);
    ok(pr.x - deck[0] >= 30 && deck[0] + deck[2] - (pr.x + pr.w) >= 30, `press ${pr.id} is not centred over its anvil deck: the edges must be safe`);
    const lethal = .4 / pr.period; ok(lethal <= .25, `press ${pr.id} is lethal for ${(lethal * 100).toFixed(0)}% of its cycle (limit 25%)`);
    ok(pr.period - .9 >= .9, `press ${pr.id} has less than 0.9 s of open time`);
    // the deck crossing takes deck.w / 285 s; the non-lethal window must exceed it plus a reaction margin
    ok(pr.period - .4 >= deck[2] / RUN + .3, `press ${pr.id}: the safe window is too short to cross its ${deck[2]} px deck`);
  }
  const crawler = D.enemies.find(e => e.type === 'crawler'), top = D.platforms.find(p => crawler.x >= p[0] && crawler.x <= p[0] + p[2] && p[1] === crawler.y);
  ok(top, 'the crawler stands on a deck'); ok(crawler.x - crawler.range >= top[0] && crawler.x + crawler.range + 64 <= top[0] + top[2], 'the crawler patrol stays on its deck');
  const sp = D.enemies.find(e => e.type === 'spitter'), deck = D.platforms.find(p => sp.landY === p[1] && sp.x > p[0] && sp.x < p[0] + p[2]);
  ok(deck, 'the spitter fires down onto the exit deck (landY = the deck top)');
  const perch = D.perches[0]; ok(sp.x >= perch.x && sp.x + 44 <= perch.x + perch.w && Math.abs(sp.y + 52 - perch.y) <= 4, 'the spitter sits on its perch');
  ok(sp.y + 52 < deck[1] - PH, "the spitter sits above a standing player's head (its body is not lethal; only its shot is)");
}

// ---- 8. checkpoints, cogs, finish ------------------------------------------------------------------------------------------
{
  const all = [...D.platforms.map((p, i) => ({ id: 'p' + i, x: p[0], y: p[1], w: p[2] })), ...D.ledges.map((l, i) => ({ id: 'l' + i, x: l.x, y: l.y, w: l.w }))];
  const own = cp => all.find(s => Math.abs(s.y - cp.y) < 1 && cp.x >= s.x && cp.x <= s.x + s.w);
  const TRN = D.train;
  for (const cp of D.checkpoints) {
    if (cp.area === 'train') {   // the rail head stands on the ore-train bed at rest
      ok(cp.y === TRN.y && cp.x >= TRN.start + 20 && cp.x <= TRN.start + TRN.len - 30, 'the rail head checkpoint stands on the bed at rest'); continue;
    }
    const s = own(cp); ok(s, `checkpoint ${cp.name} does not stand on a surface`);
    ok(cp.x - s.x >= 20 && s.x + s.w - cp.x >= 30, `checkpoint ${cp.name} is at the very edge of its surface`);
    // the engine arms a checkpoint when P.x > cp.x-40 and feet are within 80 px of cp.y: standing on any OTHER surface must not do that
    for (const t of all) if (t !== s && Math.abs(t.y - cp.y) < 80 && t.x + t.w > cp.x - 40 && t.x < cp.x + 200 && (t.x <= cp.x))
      ok(false, `standing on ${t.id} arms checkpoint ${cp.name} early (it is on ${s.id})`);
  }
  ok(D.checkpoints.every((c, i) => i === 0 || c.x > D.checkpoints[i - 1].x), 'checkpoints run left to right');
  ok(new Set(D.checkpoints.map(c => c.name)).size === D.checkpoints.length, 'checkpoint names are unique');
  const first = D.checkpoints[0]; ok(all.some(s => Math.abs(s.y - first.y) < 1 && first.x >= s.x && first.x <= s.x + s.w), 'the level starts on a surface');
  // no more than 3,100 px between checkpoints (the vault is the longest stretch), except where one area is a single climb
  D.checkpoints.forEach((c, i) => { if (i && D.checkpoints[i - 1].area !== 'train') ok(c.x - D.checkpoints[i - 1].x <= 3100, `${c.name} is ${c.x - D.checkpoints[i - 1].x} px after the last checkpoint`) });

  // every cog can be reached: from a surface's top (a standing jump), from the crate top, or hanging under a girder
  const stand = [...all, { id: 'crate', x: D.crates[0].x0, y: D.platforms[D.crates[0].deck][1] - D.crates[0].h, w: D.crates[0].x1 - D.crates[0].x0 }];
  for (const c of D.cogs.filter(q => !q.train && !/^c1[01]$/.test(q.id))) {      // the train cogs and the vault cogs have their own tests (tests/level3-areas.cjs)
    const onFoot = stand.some(s => c.x >= s.x - 30 && c.x <= s.x + s.w + 30 && s.y - c.y >= -20 && s.y - c.y <= 209 + 48 + 40);
    const hang = D.girders.some(g => c.x >= g.x0 && c.x <= g.x1 && Math.abs(c.y - (g.y + 8 + PH / 2)) <= 40);
    // or collected mid-jump in the gap of a required jump hop (the arc passes within pickup range)
    const inGap = D.chains.some(q => q.kind === 'required' && !q.mode && q.nodes.slice(1).some((n, i) => {
      const s1 = surf(q.nodes[i]), s2 = surf(n), lo = Math.min(s1.y, s2.y);
      return c.x >= Math.min(s1.x + s1.w, s2.x + s2.w) - 30 && c.x <= Math.max(s1.x, s2.x) + 30 && c.y <= lo - 20 && c.y >= lo - 150;
    }));
    ok(onFoot || hang || inGap, `cog ${c.id} at (${c.x}, ${c.y}) cannot be reached from any surface, the crate, a girder or a jump gap`);
  }
  const hard = D.cogs.filter(c => c.route === 'hard').map(c => c.id).join(); ok(hard === 'c1,c2,c3,c7', 'four cogs are on the optional hard routes (c1, c2, c3, c7)');
  const gd = surf(['p', 20]), tdoor = D.doors.find(d => d.id === 'transit'), adoor = D.doors.find(d => d.id === 'archive');
  ok(tdoor.y === gd.y && tdoor.x > gd.x && tdoor.x + tdoor.w < gd.x + gd.w && adoor.y === gd.y && adoor.x < tdoor.x - 100 && adoor.x > gd.x, 'the transit door and the archive door stand on the surface gate deck, the archive door beside it');
}

// ---- 9. the data matches the design document's layout draft -----------------------------------------------------------
{
  const p = path.join(ROOT, 'design/level3-layout-draft.json');
  if (fs.existsSync(p)) {
    const draft = JSON.parse(fs.readFileSync(p, 'utf8')).surfaces;
    const map = { p0: ['p', 0], p1: ['p', 1], p2: ['p', 2], p3: ['p', 3], lc: ['l', 0], p4: ['p', 4], p5: ['p', 5], p6: ['p', 6], p7: ['p', 7], p8: ['p', 8], p9: ['p', 9], p10: ['p', 10], p11: ['p', 11], p12: ['p', 12] };
    ['L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L4', 'R4'].forEach((n, i) => { map[n] = ['l', i + 1] });
    for (const [n, node] of Object.entries(map)) {
      const s = surf(node), d = draft[n]; ok(d, `the design draft has no surface ${n}`);
      ok(s.x === d.x && s.y === d.y && s.w === d.w, `${n} in the data (${s.x},${s.y},${s.w}) drifted from the design draft (${d.x},${d.y},${d.w})`);
    }
  }
}

console.log(JSON.stringify({ checks, requiredHops: hopRows.length, weakest: Math.min(...hopRows.map(h => Math.round(h.m))), platforms: D.platforms.length, ledges: D.ledges.length, checkpoints: D.checkpoints.length, cogs: D.cogs.length }));
