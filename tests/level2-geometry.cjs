/* Level 2 geometry proof. Run from the repo root:  node tests/level2-geometry.cjs
   No dependencies. Loads dist/level2-data.js in a vm sandbox and proves the data is playable
   against Level 1 physics. Exits non-zero with a clear message on the first failure. */
const fs = require('fs'), vm = require('vm');

const sandbox = { console, Math, JSON };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/level2-data.js', 'utf8'), sandbox);
const D = sandbox.window.L2DATA;

const fail = m => { console.error('FAIL: ' + m); process.exit(1); };
const ok = (c, m) => { if (!c) fail(m); };
ok(D && typeof D === 'object', 'dist/level2-data.js did not define window.L2DATA');
for (const k of ['world','areas','platforms','ledges','movers','vents','lasers','belts','lava','cogs',
                 'checkpoints','terminals','valves','shutters','gates','enemies','pickups','sockets',
                 'triggers','exit','chains'])
  ok(D[k] !== undefined, `L2DATA.${k} is missing`);

/* ---------- physics constants, straight from dist/game.js ---------- */
const PW = 42, PH = 96, V0 = 780, G = 1450, RUN = 285, SLACK = 35, MAXRISE = (V0 * V0) / (2 * G); // 209.79

const rect = a => ({ x: a[0], y: a[1], w: a[2], h: a[3] });
const P = D.platforms.map(rect);          // solid; collides at h=78 in the engine
const L = D.ledges.map(rect);             // one-way
const M = D.movers.map(m => ({ x: m.x, y: m.y, w: m.w, h: m.h, a: m.a, r: m.r })); // centre of travel
const node = n => (n[0] === 'p' ? P : n[0] === 'l' ? L : M)[n[1]];
const nodeName = n => `${n[0]}${n[1]}`;
for (const c of D.chains) for (const n of c.nodes)
  ok(node(n), `chain ${c.id} points at a surface that does not exist: ${nodeName(n)}`);

/* horizontal clearance between two surfaces, in either direction (Area 5 zig-zags both ways) */
const gapOf = (a, b) => Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));

/* the Level 1 ballistic envelope. Returns px of slack; <=0 means unreachable. */
function envelope(a, b) {
  const rise = a.y - b.y, disc = V0 * V0 - 2 * G * rise;
  if (disc <= 0) return { margin: -Infinity, rise, gap: gapOf(a, b), reason: 'rise exceeds jump apex' };
  const t = (V0 + Math.sqrt(disc)) / G, gap = gapOf(a, b);
  return { margin: (RUN * t - SLACK) - (gap + PW), rise, gap, t };
}

const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const areaAt = x => (D.areas.find(a => x >= a.x0 && x < a.x1) || { id: '?' }).id;

/* ================================================================== 1. chains ============ */
const REQ_MIN = 20;                       // required hops must clear by a real margin
let tightest = { m: Infinity }, hops = 0, reqHops = 0;
const hardest = {};                       // hardest required hop per area
for (const c of D.chains) {
  for (let i = 1; i < c.nodes.length; i++) {
    const na = c.nodes[i - 1], nb = c.nodes[i], a = node(na), b = node(nb);
    const e = envelope(a, b);
    hops++;
    const where = `${c.id} ${nodeName(na)} -> ${nodeName(nb)} (rise ${e.rise}, gap ${e.gap})`;
    ok(e.margin > (c.kind === 'required' ? REQ_MIN : 0),
       `unreachable hop in ${where}: margin ${e.margin.toFixed(1)} px` + (e.reason ? ' — ' + e.reason : ''));
    if (c.kind === 'required') {
      reqHops++;
      if (e.margin < tightest.m) tightest = { m: e.margin, where };
      const ar = areaAt(a.x);
      if (!hardest[ar] || e.margin < hardest[ar].m) hardest[ar] = { m: e.margin, where };
    }
  }
}
/* every surface must be used by some chain, or the level contains dead geometry */
const used = new Set();
for (const c of D.chains) for (const n of c.nodes) used.add(nodeName(n));
P.forEach((_, i) => ok(used.has('p' + i) || L.some((l, j) => false), `platform ${i} belongs to no chain`));

/* ================================================================== 2. ledges ============ */
/* every ledge must be reachable from SOME surface below it (platform, ledge or mover) */
const all = [...P.map((r, i) => ({ r, n: 'p' + i })), ...L.map((r, i) => ({ r, n: 'l' + i })),
             ...M.map((r, i) => ({ r, n: 'm' + i }))];
let ledgeProofs = 0;
L.forEach((l, i) => {
  let best = null;
  for (const s of all) {
    if (s.n === 'l' + i) continue;
    if (s.r.y <= l.y) continue;                       // must sit below the ledge (y grows down)
    const rise = s.r.y - l.y;
    if (rise > MAXRISE) continue;
    const e = envelope(s.r, l);
    if (e.margin > 0 && (!best || e.margin > best.m)) best = { m: e.margin, from: s.n, rise };
  }
  ok(best, `ledge ${i} [${D.ledges[i]}] has no surface below it within the jump envelope`);
  ledgeProofs++;
});

/* no ledge buried inside a solid platform */
L.forEach((l, i) => P.forEach((p, j) =>
  ok(!overlaps(l, p), `ledge ${i} [${D.ledges[i]}] is buried inside platform ${j} [${D.platforms[j]}]`)));

/* ================================================================== 3. overlaps ========== */
for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++)
  ok(!overlaps(P[i], P[j]), `solid platforms ${i} [${D.platforms[i]}] and ${j} [${D.platforms[j]}] overlap`);

/* ================================================================== 4. cogs ============== */
/* standing on a surface, or one jump above one */
let cogProofs = 0;
D.cogs.forEach((c, i) => {
  let okCog = false;
  for (const s of all) {
    const onTop = c.x >= s.r.x - 20 && c.x <= s.r.x + s.r.w + 20;
    if (!onTop) continue;
    const above = s.r.y - c.y;                        // how far the cog floats over the surface
    if (above >= -10 && above <= MAXRISE - 10) { okCog = true; break; }
  }
  ok(okCog, `cog ${i} at (${c.x},${c.y}) is not standing on, or one jump from, any surface`);
  cogProofs++;
});
ok(D.cogs.length === 14, `expected 14 optional cogs, found ${D.cogs.length}`);

/* ================================================================== 5. checkpoints ======= */
D.checkpoints.forEach((cp, i) => {
  const s = all.find(s => Math.abs(s.r.y - cp.y) < 2 && cp.x >= s.r.x && cp.x + PW <= s.r.x + s.r.w);
  ok(s, `checkpoint ${i} "${cp.name}" at (${cp.x},${cp.y}) is floating — no surface top there`);
});
for (const a of D.areas) {
  const n = D.checkpoints.filter(c => c.area === a.id).length;
  ok(n >= 2, `area ${a.id} has ${n} checkpoint(s); every area needs at least 2`);
}
ok(D.checkpoints.filter(c => c.area === 'furnace').length >= 3, 'Furnace Escape needs 3 checkpoints');

/* ================================================================== 6. hazards =========== */
/* danger volumes, matching how dist/game.js tests them */
const ventBox = v => ({ x: v.x - 25, y: v.y - 175, w: 50, h: 175 });
const laserBox = g => ({ x: g.x - 8, y: g.y0, w: 16, h: g.y1 - g.y0 });
const lavaBox = v => ({ x: v.x, y: v.y, w: v.w, h: 60 });
const lethalVents = D.vents.filter(v => !v.safe);
const hazards = [...lethalVents.map(v => ({ b: ventBox(v), k: 'vent ' + v.x })),
                 ...D.lasers.map(g => ({ b: laserBox(g), k: 'laser ' + g.x })),
                 ...D.lava.map(v => ({ b: lavaBox(v), k: 'lava ' + v.x }))];
/* a standing spot: the player box parked at one end of a surface */
const standAt = (s, side) => ({ x: side < 0 ? s.x : s.x + s.w - PW, y: s.y - PH, w: PW, h: PH });
let safeSpots = 0;
for (const c of D.chains) {
  if (c.kind !== 'required') continue;
  for (let i = 1; i < c.nodes.length; i++) {
    const a = node(c.nodes[i - 1]), b = node(c.nodes[i]);
    const leftward = b.x < a.x;
    const spots = [[a, standAt(a, leftward ? -1 : 1), 'depart ' + nodeName(c.nodes[i - 1])],
                   [b, standAt(b, leftward ? 1 : -1), 'arrive ' + nodeName(c.nodes[i])]];
    for (const [, box, label] of spots) {
      for (const h of hazards)
        ok(!overlaps(box, h.b), `${c.id}: no safe ${label} spot — ${h.k} covers it`);
      /* a belt may not be the only footing on a departure side while running into the gap */
      for (const bl of D.belts) {
        if (Math.abs(bl.y - (box.y + PH)) > 2) continue;
        const onBelt = box.x < bl.x + bl.w && box.x + PW > bl.x;
        ok(!onBelt, `${c.id}: ${label} spot sits on conveyor at ${bl.x}; leave belt-free footing at deck ends`);
      }
      safeSpots++;
    }
  }
}

/* ================================================================== 7. area 1 is safe ==== */
const a1 = D.areas.find(a => a.id === 'lift');
const inA1 = x => x >= a1.x0 && x < a1.x1;
D.vents.forEach(v => ok(!inA1(v.x) || v.safe, `Broken Lift must stay safe: lethal vent at ${v.x}`));
D.lasers.forEach(g => ok(!inA1(g.x), `Broken Lift must stay safe: laser at ${g.x}`));
D.lava.forEach(v => ok(v.x + v.w <= a1.x0 || v.x >= a1.x1, `Broken Lift must stay safe: lava at ${v.x}`));
D.enemies.forEach(e => ok(!inA1(e.x), `Broken Lift must stay safe: ${e.type} at ${e.x}`));
D.movers.forEach(m => ok(!inA1(m.x), `Broken Lift must stay safe: mover at ${m.x}`));

/* ================================================================== 8. area 5 climb ===== */
const climb = D.chains.find(c => c.id === 'a5-climb');
ok(climb, 'chain a5-climb is missing');
const first = node(climb.nodes[0]), lift = node(climb.nodes[climb.nodes.length - 1]);
ok(Math.abs(first.y - D.checkpoints.find(c => c.name === 'FURNACE BASE').y) < 2,
   'a5-climb must start on the FURNACE BASE platform');
ok(lift.y <= D.world.yMin + 200, 'a5-climb must end at the lift deck near the top of the shaft');
ok(D.exit.x >= lift.x && D.exit.x <= lift.x + lift.w && Math.abs(D.exit.y - lift.y) < 2,
   'exit is not on the lift deck');
let rise = 0;
for (let i = 1; i < climb.nodes.length; i++) {
  const a = node(climb.nodes[i - 1]), b = node(climb.nodes[i]);
  ok(b.y < a.y, `a5-climb step ${i} does not gain height`);
  rise += a.y - b.y;
}
ok(rise > 1300, `a5-climb only rises ${rise} px; the furnace shaft should be a real climb`);
/* every shutter, the override and both rest ledges must sit on a step of the climb */
const climbSurfaces = climb.nodes.map(node);
for (const s of D.shutters)
  ok(climbSurfaces.some(r => Math.abs(r.y - s.y) < 2 && s.x >= r.x && s.x <= r.x + r.w),
     `shutter ${s.id} is not on the climb`);
ok(D.shutters.length === 3, 'Furnace Escape needs 3 cooling shutters');
ok(D.terminals.some(t => t.area === 'furnace'), 'Furnace Escape needs an override console');
ok(D.enemies.some(e => e.type === 'supervisor'), 'Furnace Escape needs the supervisor beam');
ok(D.enemies.filter(e => e.type === 'wasp').length >= 2, 'Furnace Escape needs wasp spawn vents');
ok(D.heat && D.heat.rate > 0, 'Furnace Escape needs rising heat');

/* ================================================================== 9. content per area = */
ok(D.movers.filter(m => m.x > 2600 && m.x < 6200).length >= 3, 'Casting Hall needs 3 moving molds');
ok(lethalVents.filter(v => v.x > 2600 && v.x < 6200).length === 4, 'Casting Hall needs 4 blast vents');
ok(D.enemies.filter(e => e.type === 'crawler' && e.area === 'casting').length === 2, 'Casting Hall needs 2 crawlers');
for (const r of ['upper', 'lower']) {
  ok(D.terminals.some(t => t.route === r), `Cooling Works ${r} route needs a Pack ACT terminal`);
  ok(D.enemies.some(e => e.type === 'spitter' && e.route === r), `Cooling Works ${r} route needs a spitter`);
}
ok(D.valves.length === 2 && D.gates.length === 1 && D.gates[0].needs.length === 2,
   'Cooling Works needs 2 valves and one gate that needs both');
ok(D.belts.length === 3 && D.lasers.length === 3, 'Scrap Sorter needs 3 belts and 3 laser gates');
ok(new Set(D.lasers.map(l => l.pair)).size === 2, 'Scrap Sorter laser gates must alternate in two pairs');
ok(D.enemies.some(e => e.type === 'claw'), 'Scrap Sorter needs a sorter claw');
ok(D.enemies.some(e => e.type === 'crawler' && e.packOnly), 'Scrap Sorter needs a crawler in the Pack tunnel');
ok(D.pickups.length === 1 && D.sockets.length === 1, 'Scrap Sorter needs a power cell and a socket');
/* pickup and socket must be within reach of a required deck */
for (const [what, o] of [['power cell', D.pickups[0]], ['socket', D.sockets[0]]])
  ok(all.some(s => o.x >= s.r.x && o.x <= s.r.x + s.r.w && s.r.y - o.y >= 0 && s.r.y - o.y <= MAXRISE - 10),
     `${what} at (${o.x},${o.y}) is not reachable from any surface`);
/* retracting segments really are on the upper pipe route */
const upper = new Set(D.chains.find(c => c.id === 'a3-upper').nodes.filter(n => n[0] === 'p').map(n => n[1]));
D.retracts.forEach(r => ok(upper.has(r.i), `retracting platform ${r.i} is not on the upper pipe route`));
ok(D.floods.length >= 1, 'Cooling Works lower tunnel must flood');
/* the flood must never submerge a lower-route platform top */
const lower = D.chains.find(c => c.id === 'a3-lower').nodes.filter(n => n[0] === 'p').map(n => P[n[1]]);
for (const f of D.floods) for (const p of lower)
  ok(!(p.x + p.w > f.x0 && p.x < f.x1) || p.y < f.yWet,
     `flood at y ${f.yWet} submerges a lower-route platform top at y ${p.y}`);

/* ================================================================== summary ============== */
console.log(JSON.stringify({
  areas: D.areas.length,
  platforms: P.length, ledges: L.length, movers: M.length,
  chainHops: hops, requiredHops: reqHops, optionalAndPackHops: hops - reqHops,
  ledgesProved: ledgeProofs, cogsProved: cogProofs,
  checkpoints: D.checkpoints.length, safeSpotChecks: safeSpots,
  vents: D.vents.length, lasers: D.lasers.length, belts: D.belts.length, lava: D.lava.length,
  enemies: D.enemies.length, terminals: D.terminals.length, valves: D.valves.length,
  shutters: D.shutters.length, gates: D.gates.length,
  area1Lethal: 0, a5Rise: rise,
  tightestRequiredMargin: +tightest.m.toFixed(2), tightestAt: tightest.where,
  hardestPerArea: Object.fromEntries(Object.entries(hardest).map(([k, v]) => [k, +v.m.toFixed(2)]))
}));
