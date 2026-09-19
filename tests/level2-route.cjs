/* Level 2 REAL-ENGINE route proof.  Run from the repo root:  node tests/level2-route.cjs
   No dependencies. tests/level2-geometry.cjs proves reachability with a closed-form ballistic
   formula; THIS test proves it by actually running dist/level2.js update() with scripted key input,
   so collision, head-bumps, one-way ledges, ledge grabs, the ground/air acceleration ramp, the
   minimum jump (holding jump forces >= ~157 px), conveyors and the checkpoint radius are all live.
   Exits non-zero with a clear message on the first failure; prints a one-line JSON summary on success.

   WHAT IS PROVED
    1. HOPS       every hop of every kind:'required' chain in L2DATA.chains[] is played hop by hop with a
                  grid of strategies at dt = 1/120, 1/60 and 0.033:
                    run-up   start at the far end of the take-off deck, jump when the leading edge is within
                             K px of the deck edge (K = -12..44 px: a few px after leaving counts as coyote),
                             jump held for the full height or tapped for the minimum jump, and the direction key
                             released never / at / 25 / 60 px past the far edge.
                    standing start at the deck edge from rest, same jump/hold/release variants.
                  Thresholds (ROUTE_MIN etc. below):
                    - >= 50 % of the run-up grid lands on the intended surface, at every dt
                    - >= 25 % of the run-up grid lands there WITHOUT a ledge grab/auto-mantle (a hop that only
                      works through an accidental grab is a defect, not a route)
                    - no dt has zero successes, and the best run-up strategy exists at every mover phase
                    - the take-off deck gives >= 150 px of run-up behind the take-off point
                  The standing-start rate is REPORTED for every hop; a hop is listed under runUpOnly when a
                  standstill cannot clear it (< 50 %). runUpOnly hops are legal but every one is printed.
    2. HEADROOM   every deck a required chain stands on has >= 110 px of clear air above it (Bix is 96 tall)
                  and every checkpoint is a real standing spot with >= 110 px of headroom that is still
                  standing still one second after a respawn on it.
    3. GATE       with no valve turned the coolant gate cannot be passed: 0 successes over a jump grid
                  started from every point of the deck in front of it (hop over, mantle, walk round), and the
                  same grid passes with both valves on.
    4. FURNACE    the whole climb (a5-climb) lies inside the furnace area's x range so the camera stays unlocked
                  and the heat keeps rising; a scripted climb from the Furnace base to the lift deck with the
                  heat line live, shutters opened on the way, reaches the exit and finishes the level with the
                  heat line never touching Bix.
    5. CHECKPOINTS the engine arms a checkpoint when P.x > cp.x-40 && |feet - cp.y| < 220 (no engine change).
                  Standing on any required surface must not arm a checkpoint that sits on a HIGHER surface
                  than the one you stand on (no "armed a step early").
*/
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

/* ------------------------------------------------------------------ thresholds (documented above) */
const DTS = [1 / 120, 1 / 60, 0.033];
const RUN_MIN = 0.50;          // fraction of the run-up grid that must land on the target surface
const NOGRAB_MIN = 0.25;       // fraction that must land without a ledge grab / auto-mantle
const STAND_REPORT = 0.50;     // standing-start rate below this => reported under runUpOnly
const RUNUP_PX = 150;          // deck length behind the take-off point (deck.w - 42 >= this)
const HEADROOM_MIN = 110;      // px of air above a deck (player is 96 tall)
const KS = [-12, -4, 4, 12, 20, 28, 36, 44];          // take-off timing window, px before the deck edge
const RELEASES = [null, 0, 25, 60];
const MOVER_T0 = [10, 10.9, 11.8, 12.7, 13.6, 14.5, 15.4, 16.3];   // mold phases (period ~7 s)

/* ------------------------------------------------------------------ engine loader */
function boot(dataFile) {
  const S = { clock: 0 }, noop = () => {};
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
    { get: (o, k) => o[k] || noop });
  const el = () => ({ classList: { add: noop, remove: noop, toggle: noop }, style: {}, dataset: {}, addEventListener: noop, setPointerCapture: noop,
    getBoundingClientRect: () => ({ width: 1280, height: 720, left: 0, top: 0 }), getContext: () => ctx, focus: noop, textContent: '' });
  const els = {};
  const sb = { console, Math, JSON, performance: { now: () => S.clock * 1000 },
    document: { getElementById: id => els[id] ??= el(), querySelectorAll: () => [], addEventListener: noop, hidden: false },
    Image: class { set src(v) { this.p = v; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100 } get src() { return this.p } },
    addEventListener: noop, devicePixelRatio: 1, requestAnimationFrame: noop, setTimeout: noop, ResizeObserver: null };
  sb.window = sb; vm.createContext(sb);
  for (const f of ['dist/level2-art.js', dataFile || 'dist/level2-data.js', 'dist/level2-enemies.js'])
    vm.runInContext(fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'), sb, { filename: f });
  const hook = 'resize();reset(1);requestAnimationFrame(frame);';
  let src = fs.readFileSync(path.join(ROOT, 'dist/level2.js'), 'utf8');
  if (!src.includes(hook)) throw new Error('boot hook string not found in dist/level2.js');
  src = src.replace(hook, `resize();reset(1);globalThis.qa={P,K,D,update,reset,start,solids,moving,areaAt,isVertical,seen,
    state:()=>({done,shutters,valves,heat,camY,checkpoint,charge}),
    setCP:c=>{checkpoint=c},setHeat:v=>{heat=v},setEnemies:v=>{enemies=v}};`);
  vm.runInContext(src, sb, { filename: 'dist/level2.js' });
  const q = sb.qa;
  if (!q) throw new Error('engine did not expose its test hook');
  q.S = S; q.start(); q.setEnemies([]);         // geometry test: enemies are covered by tests/level2-enemies.cjs
  q.tick = (n, dt, each) => { for (let i = 0; i < n; i++) { S.clock += dt; q.update(dt); if (each && each(i) === false) return false } return true };
  q.clear = () => Object.keys(q.K).forEach(k => q.K[k] = 0);
  return q;
}

/* ------------------------------------------------------------------ surfaces */
function surfaces(q) {
  const D = q.D;
  const rect = (n, clock) => {
    if (n[0] === 'p') { const p = D.platforms[n[1]]; return { x: p[0], y: p[1], w: p[2], h: 78 } }
    if (n[0] === 'l') { const l = D.ledges[n[1]]; return { x: l[0], y: l[1], w: l[2], h: l[3] } }
    const m = q.moving(clock)[n[1]]; return { x: m.x, y: m.y, w: m.w, h: m.h }
  };
  /* does engine support `s` (P.support) count as node n? A conveyor drawn on a deck counts as the deck. */
  const matches = (s, n, clock) => {
    if (!s) return false;
    if (n[0] === 'm') return s.id === n[1];
    const r = rect(n, clock);
    if (s.id !== undefined) return false;
    if (s.belt !== undefined) return s.y === r.y && s.x >= r.x && s.x + s.w <= r.x + r.w;
    return s.x === r.x && s.y === r.y && s.w === r.w && !!s.ledge === (n[0] === 'l');
  };
  const name = s => {
    if (!s) return 'none';
    if (s.id !== undefined) return 'm' + s.id;
    let i = D.platforms.findIndex(p => p[0] === s.x && p[1] === s.y && p[2] === s.w);
    if (i >= 0 && !s.ledge) return 'p' + i;
    i = D.ledges.findIndex(p => p[0] === s.x && p[1] === s.y && p[2] === s.w);
    if (i >= 0) return 'l' + i;
    return s.belt !== undefined ? 'belt@' + s.x : s.x === D.gates?.[0]?.x ? 'gate' : 'other@' + s.x + ',' + s.y;
  };
  /* an overshoot that lands on a ONE-WAY ledge sitting above node n (the optional rails and cog perches hang over the
     required decks): Bix is on a legal surface directly over the target and drops onto it with Down. Not a failure. */
  const above = (s, n, clock) => {
    if (!s || !s.ledge || s.belt !== undefined || s.id !== undefined || n[0] === 'l') return false;
    const r = rect(n, clock);
    return s.y < r.y - 40 && s.x < r.x + r.w && s.x + s.w > r.x;
  };
  return { rect, matches, above, name, id: n => n[0] + n[1] };
}

/* ------------------------------------------------------------------ one scripted hop */
/* p: {start:'far'|'edge', k, hold, release, t0, dt}. Returns {ok, why, grabbed, bumped}. */
function trial(q, U, a, b, p) {
  const P = q.P, S = q.S, w = P.w;
  q.clear(); S.clock = p.t0 ?? 10;
  Object.assign(P, { hang: 0, climb: 0, hangRect: null, dropTime: 0, jumpTime: 0, grabCD: 0, inv: 999, buffer: 0, coyote: 0, vx: 0, vy: 0, support: null, ground: 0 });
  let A = U.rect(a, S.clock), B = U.rect(b, S.clock);
  const dir = p.dir ?? ((B.x + B.w / 2) >= (A.x + A.w / 2) ? 1 : -1);
  P.face = dir;
  P.x = p.start === 'far' ? (dir > 0 ? A.x + 2 : A.x + A.w - w - 2) : (dir > 0 ? A.x + A.w - w : A.x);
  if (p.mid) P.x = dir > 0 ? A.x + A.w - w - 110 : A.x + 110;      // walk-off from ~110 px of run-up
  P.y = A.y - P.h - 1;
  for (let s = 0; s < 20 && !P.ground; s++) q.tick(1, p.dt);
  if (!P.ground || !U.matches(P.support, a, S.clock)) return { ok: false, why: 'cannot stand on ' + U.id(a) + ' (' + U.name(P.support) + ')' };
  const key = dir > 0 ? 'right' : 'left', k = p.start === 'edge' ? 0 : p.k;
  let jumped = false, left = false, grabbed = false, bumped = false, released = false, t = 0;
  q.K[key] = 1;
  while (t < 3.5) {
    A = U.rect(a, S.clock); B = U.rect(b, S.clock);
    const edge = dir > 0 ? A.x + A.w : A.x, lead = dir > 0 ? P.x + w : P.x;
    if (!p.walk && !jumped && dir * (lead - (edge - dir * k)) >= 0) { P.buffer = .16; q.K.jump = 1; jumped = true }
    else if (jumped && !p.hold && q.K.jump) q.K.jump = 0;
    if (p.release != null && !released) {
      const near = dir > 0 ? B.x : B.x + B.w, trail = dir > 0 ? P.x : P.x + w;
      if (dir * (trail - near) >= p.release) { q.K[key] = 0; released = true }
    }
    const vy0 = P.vy;
    q.tick(1, p.dt); t += p.dt;
    if (vy0 < -50 && P.vy === 0 && !P.ground && !P.hang && !P.climb) bumped = true;
    if (P.hang || P.climb) grabbed = true;
    if (!P.ground) left = true;
    if (P.ground && left) {
      if (U.matches(P.support, b, S.clock)) return { ok: true, hit: true, grabbed, bumped };
      if (U.above(P.support, b, S.clock)) return { ok: true, hit: false, kind: 'above', grabbed, bumped };
      if ((p.later || []).some(n => U.matches(P.support, n, S.clock))) return { ok: true, hit: false, kind: 'ahead', grabbed, bumped };
      return { ok: false, why: (U.matches(P.support, a, S.clock) ? 'back on ' : 'landed ') + U.name(P.support), grabbed, bumped };
    }
    if (P.y > A.y + 900) return { ok: false, why: 'fell', grabbed, bumped };
  }
  return { ok: false, why: 'timeout', grabbed, bumped };
}

/* the strategy grid for one hop at one dt */
function hopGrid(q, U, a, b, dt, later) {
  const A = U.rect(a, 10), hasM = a[0] === 'm' || b[0] === 'm';
  const r = { runN: 0, run: 0, runHit: 0, runNoGrab: 0, runBump: 0, standN: 0, stand: 0, why: {}, phases: [], bestPhase: 1 };
  const t0s = hasM ? MOVER_T0 : [10];
  for (const t0 of t0s) {
    let phaseOk = 0;
    for (const k of KS) for (const hold of [true, false]) for (const release of RELEASES) {
      const s = trial(q, U, a, b, { start: 'far', k, hold, release, t0, dt, later });
      r.runN++;
      if (s.ok) { r.run++; phaseOk++; if (s.hit) r.runHit++; if (!s.grabbed) r.runNoGrab++; if (s.bumped) r.runBump++ } else r.why[s.why] = (r.why[s.why] || 0) + 1;
    }
    r.phases.push(phaseOk);
    for (const hold of [true, false]) for (const release of RELEASES) {
      const s = trial(q, U, a, b, { start: 'edge', hold, release, t0, dt, later });
      r.standN++; if (s.ok) r.stand++;
    }
  }
  r.bestPhase = Math.min(...r.phases);
  /* drop hops (target lower than the take-off deck): a player simply runs off the edge, no jump. Run-up starts only. */
  const B = U.rect(b, 10);
  r.walkN = 0; r.walk = 0;
  if (B.y > A.y + 40) for (const t0 of t0s) for (const release of RELEASES) for (const start of ['far', 'mid']) {
    const s = trial(q, U, a, b, { start: 'far', k: 0, walk: true, hold: false, release, t0, dt, mid: start === 'mid', later });
    r.walkN++; if (s.ok) r.walk++;
  }
  return r;
}

/* ------------------------------------------------------------------ headroom */
/* px of clear air above a deck: distance from its top up to the underside of the nearest SOLID above it
   (platforms collide down to y+78, the closed gate over its whole rect; one-way ledges never block a head). */
function headroom(q, x0, x1, top, extra) {
  const D = q.D;
  let best = Infinity;
  const consider = (r) => { if (r.x < x1 && r.x + r.w > x0 && r.y + r.h <= top + 0.5) best = Math.min(best, top - (r.y + r.h)) };
  D.platforms.forEach(p => { if (p[1] !== top || p[0] >= x1 || p[0] + p[2] <= x0) consider({ x: p[0], y: p[1], w: p[2], h: 78 }) });
  (D.gates || []).forEach(g => consider({ x: g.x, y: g.y, w: g.w, h: g.h }));
  (extra || []).forEach(consider);
  return best;
}

/* ================================================================== main */
function main() {
  const t00 = Date.now();
  const fails = [];
  const fail = m => fails.push(m);
  const q = boot();
  const D = q.D, U = surfaces(q);
  q.D.valves.forEach(v => v.on = 1);              // hop proofs run with the gate open; the gate has its own proof below
  const NODE = n => U.rect(n, 10);
  const summary = {};

  /* ---------------- 1. required hops -------------------------------------------------------------- */
  const hopRows = [], runUpOnly = [], walkOnly = new Set(), tightest = { frac: 2 };
  let requiredHops = 0, trials = 0, minRun = 2, minNoGrab = 2, minPhase = 1e9, worstBump = 0;
  const seenHop = new Set();
  for (const c of D.chains) {
    if (c.kind !== 'required') continue;
    for (let i = 1; i < c.nodes.length; i++) {
      const a = c.nodes[i - 1], b = c.nodes[i], id = U.id(a) + '->' + U.id(b);
      if (seenHop.has(id)) continue;
      seenHop.add(id); requiredHops++;
      const A = NODE(a);
      const per = DTS.map(dt => hopGrid(q, U, a, b, dt, c.nodes.slice(i + 1)));
      const standRate = Math.min(...per.map(r => r.stand / r.standN));
      if (A.w - 42 < RUNUP_PX && a[0] !== 'm' && standRate < STAND_REPORT && !per.some(r => r.walkN && r.walk / r.walkN >= RUN_MIN))
        fail(`${c.id} ${id}: take-off deck is only ${A.w}px wide (${A.w - 42}px of run-up, need >= ${RUNUP_PX}) and the hop does not clear from a standstill (${(standRate * 100).toFixed(0)}%)`);
      per.forEach((r, di) => {
        trials += r.runN + r.standN + r.walkN;
        const dtl = '1/' + Math.round(1 / DTS[di]), frac = r.run / r.runN, ng = r.runNoGrab / r.runN;
        /* a drop hop (target well below the deck) may be cleared by simply running off the edge; the jump grid then only has
           to exist, and the walk-off grid carries the proof */
        if (r.walkN && r.walk / r.walkN >= RUN_MIN && r.runHit === 0) { walkOnly.add(id); minRun = Math.min(minRun, r.walk / r.walkN); return }
        if (r.runHit === 0) fail(`${c.id} ${id} @dt ${dtl}: NO run-up strategy lands on the target (${JSON.stringify(r.why)})`);
        else if (frac < RUN_MIN) fail(`${c.id} ${id} @dt ${dtl}: only ${(frac * 100).toFixed(0)}% of run-up strategies succeed (need ${RUN_MIN * 100}%) ${JSON.stringify(r.why)}`);
        if (r.runHit > 0 && ng < NOGRAB_MIN) fail(`${c.id} ${id} @dt ${dtl}: only ${(ng * 100).toFixed(0)}% succeed without a ledge grab (need ${NOGRAB_MIN * 100}%) - the hop depends on an accidental mantle`);
        if (r.bestPhase === 0) fail(`${c.id} ${id} @dt ${dtl}: at some mold phase no strategy works`);
        minRun = Math.min(minRun, frac); minNoGrab = Math.min(minNoGrab, ng); minPhase = Math.min(minPhase, r.bestPhase);
        if (frac < tightest.frac) { tightest.frac = frac; tightest.hop = id + ' @' + dtl }
        worstBump = Math.max(worstBump, r.runBump / Math.max(1, r.run));
      });
      const stand = Math.min(...per.map(r => r.stand / r.standN));
      hopRows.push({ id, chain: c.id, run: +Math.min(...per.map(r => r.run / r.runN)).toFixed(2), noGrab: +Math.min(...per.map(r => r.runNoGrab / r.runN)).toFixed(2), stand: +stand.toFixed(2) });
      if (walkOnly.has(id)) hopRows[hopRows.length - 1].walkOff = true;
      else if (stand < STAND_REPORT) runUpOnly.push(id + ` (${(stand * 100).toFixed(0)}%)`);
    }
  }
  const worstStand = hopRows.reduce((m, r) => Math.min(m, r.stand), 1);

  /* ---------------- 2. headroom over required decks + checkpoints ------------------------------- */
  const decks = new Map();
  for (const c of D.chains) if (c.kind === 'required') for (const n of c.nodes) if (n[0] !== 'm') decks.set(U.id(n), n);
  let minHead = Infinity, minHeadAt = '';
  for (const [nm, n] of decks) {
    const r = NODE(n);
    const h = headroom(q, r.x, r.x + r.w, r.y);
    if (h < HEADROOM_MIN) fail(`deck ${nm} [${r.x},${r.y},${r.w}] has only ${h.toFixed(0)}px of headroom (need >= ${HEADROOM_MIN}; Bix is 96 tall)`);
    if (h < minHead) { minHead = h; minHeadAt = nm }
  }
  let minCpHead = Infinity;
  const surf = [...D.platforms.map((p, i) => ({ n: 'p' + i, x: p[0], y: p[1], w: p[2], solid: 1 })), ...D.ledges.map((l, i) => ({ n: 'l' + i, x: l[0], y: l[1], w: l[2] }))];
  D.checkpoints.forEach((cp, ci) => {
    const s = surf.find(s => Math.abs(s.y - cp.y) < 2 && cp.x >= s.x && cp.x + 42 <= s.x + s.w);
    if (!s) { fail(`checkpoint "${cp.name}" (${cp.x},${cp.y}) is not on a surface`); return }
    const h = headroom(q, cp.x, cp.x + 42, cp.y);
    if (h < HEADROOM_MIN) fail(`checkpoint "${cp.name}" has only ${h.toFixed(0)}px of headroom`);
    minCpHead = Math.min(minCpHead, h);
    /* respawn on it through the engine's own reset(0) and stand there for 5 s with every hazard live (enemies are
       removed here; vents, lasers, lava and the heat line are not): it must not move and must never hurt Bix */
    const e = boot(); e.D.valves.forEach(v => v.on = 1);
    e.S.clock = 100; e.setCP(e.D.checkpoints[ci]); e.reset(0); e.setEnemies([]);
    const falls0 = e.P.falls, charge0 = e.state().charge;
    e.tick(60, 1 / 120);                                   // let the spawn invulnerability run out (0.75 s)
    e.P.inv = 0; e.tick(1, 1 / 120);
    e.tick(5 * 120, 1 / 120, () => { if (e.P.falls !== falls0 || e.state().charge !== charge0) return false });
    const feet = e.P.y + e.P.h;
    if (e.P.falls !== falls0 || e.state().charge !== charge0) fail(`checkpoint "${cp.name}" is not a safe place to stand: Bix is hurt within 5 s of respawning there (falls ${e.P.falls - falls0})`);
    else if (!e.P.ground || Math.abs(feet - cp.y) > 1 || Math.abs(e.P.x - cp.x) > 30)
      fail(`checkpoint "${cp.name}" is not a stable standing spot (ground=${e.P.ground}, feet ${feet.toFixed(1)} vs ${cp.y}, x drift ${(e.P.x - cp.x).toFixed(1)})`);
  });

  /* ---------------- 3. coolant gate ------------------------------------------------------------- */
  const gate = D.gates[0];
  const gateProof = valvesOn => {
    const e = boot(); e.D.valves.forEach(v => v.on = valvesOn ? 1 : 0);
    const G = surfaces(e);
    const deck = D.platforms.findIndex(p => p[0] + p[2] <= gate.x && gate.x - (p[0] + p[2]) < 200 && p[1] + 78 > gate.y && p[1] < gate.y + gate.h);
    const far = D.platforms.findIndex(p => p[0] >= gate.x + gate.w && p[0] - (gate.x + gate.w) < 200 && p[1] + 78 > gate.y && p[1] < gate.y + gate.h);
    let n = 0, over = 0, first = null;
    const A = G.rect(['p', deck], 10);
    for (const dt of DTS) for (let k = -20; k <= A.w - 44; k += 4) for (const hold of [true, false]) for (const release of RELEASES) {
      // any trial whose body ever crosses to the far side of the gate counts, whether or not it lands on a deck
      const P = e.P, S = e.S;
      e.clear(); S.clock = 10;
      Object.assign(P, { hang: 0, climb: 0, hangRect: null, dropTime: 0, jumpTime: 0, grabCD: 0, inv: 999, buffer: 0, coyote: 0, vx: 0, vy: 0, support: null, ground: 0, face: 1 });
      P.x = A.x + 2; P.y = A.y - 97; for (let s = 0; s < 20 && !P.ground; s++) e.tick(1, dt);
      let jumped = false, left = false, t = 0, passed = false, released = false;
      e.K.right = 1;
      while (t < 3) {
        if (!jumped && P.x + P.w >= A.x + A.w - k) { P.buffer = .16; e.K.jump = 1; jumped = true } else if (jumped && !hold) e.K.jump = 0;
        if (release != null && !released && P.x >= gate.x - 60 + release) { e.K.right = 0; released = true }
        e.tick(1, dt); t += dt;
        if (P.x > gate.x + gate.w - 1) passed = true;
        if (P.hangRect && P.hangRect.x === gate.x && P.hangRect.w === gate.w) passed = true;                 // grabbed the gate's lip
        if (P.ground && P.support && P.support.x === gate.x && P.support.w === gate.w) passed = true;        // standing on top of it
        if (!P.ground) left = true;
        if (P.ground && left && G.matches(P.support, ['p', far], S.clock)) passed = true;
        if (P.y > 1200 || (P.ground && left && t > 1.4)) break;
      }
      n++;
      if (passed) { over++; if (!first) first = { dt, k, hold, release } }
    }
    return { n, over, first, deck, far };
  };
  const gateOff = gateProof(false), gateOn = gateProof(true);
  if (gateOff.over > 0) fail(`closed coolant gate can be passed with no valves turned: ${gateOff.over}/${gateOff.n} strategies get by (${JSON.stringify(gateOff.first)})`);
  if (gateOn.over === 0) fail('coolant gate does not open with both valves on: 0 strategies get through');

  /* ---------------- 4. Furnace Escape: area x-range, camera/heat, and the full climb ------------- */
  const furn = D.areas.find(a => a.id === 'furnace'), sort = D.areas.find(a => a.id === 'sorter');
  if (sort.x1 !== furn.x0) fail(`sorter.x1 (${sort.x1}) must equal furnace.x0 (${furn.x0})`);
  const climb = D.chains.find(c => c.id === 'a5-climb');
  const ce = boot(); const isV = (x, y) => ce.isVertical(ce.areaAt(x, y));
  for (const n of climb.nodes) {
    const r = NODE(n);
    if (!(r.x >= furn.x0 && r.x + r.w <= furn.x1) || !isV(r.x, r.y) || !isV(r.x + r.w - 1, r.y))
      fail(`climb surface ${U.id(n)} [${r.x},${r.y},${r.w}] is not inside the furnace area [${furn.x0},${furn.x1})`);
  }
  D.cogs.filter(c => c.y < 300 && c.x > 14000).forEach(c => { if (!isV(c.x, c.y)) fail(`furnace cog at (${c.x},${c.y}) is outside the furnace area`) });
  D.ledges.forEach((l, i) => { if (l[0] > 14000 && (l[0] < furn.x0 || !isV(l[0], l[1]))) fail(`ledge ${i} [${l}] of the furnace climb lies outside the furnace area`) });
  D.enemies.filter(e => e.area === 'furnace').forEach(e => { if (e.x < furn.x0 || e.x > furn.x1) fail(`${e.type} at x=${e.x} is tagged furnace but lies outside its x range`) });
  D.checkpoints.filter(c => c.area === 'furnace').forEach(c => { if (c.x < furn.x0) fail(`checkpoint ${c.name} is tagged furnace but lies left of the furnace area`) });
  const climbResult = fullClimb(D);
  climbResult.problems.forEach(fail);

  /* ---------------- 5. checkpoint arming: never armed by standing on a LOWER surface ------------- */
  const armEarly = [];
  {
    const ae = boot();
    const stand = D.chains.filter(c => c.kind === 'required').flatMap(c => c.nodes).filter(n => n[0] !== 'm');
    const uniq = new Map(stand.map(n => [U.id(n), n]));
    for (const [nm, n] of uniq) {
      const r = NODE(n);
      for (const px of [r.x, r.x + Math.max(0, (r.w - 42) / 2), r.x + r.w - 42]) {
        ae.seen.clear(); ae.reset(1); ae.setEnemies([]);
        Object.assign(ae.P, { x: px, y: r.y - 96, vx: 0, vy: 0, ground: 1, inv: 999 });
        ae.D.valves.forEach(v => v.on = 1);
        ae.tick(3, 1 / 60);
        for (const cp of D.checkpoints) if (ae.seen.has(cp) && cp.y < r.y - 20) armEarly.push(`${nm}@${Math.round(px)} arms "${cp.name}" (${r.y - cp.y}px above)`);
      }
    }
  }
  [...new Set(armEarly)].forEach(m => fail('checkpoint armed early: ' + m));

  /* ---------------- report ---------------------------------------------------------------------- */
  const out = {
    ok: fails.length === 0, ms: Date.now() - t00, trials, requiredHops, dts: DTS.map(d => +(1 / d).toFixed(0)),
    minRunUpSuccess: +minRun.toFixed(2), minNoGrabSuccess: +minNoGrab.toFixed(2), tightestHop: tightest.hop, worstStandingRate: +worstStand.toFixed(2),
    bumpedShare: +worstBump.toFixed(2), minMoverPhaseSuccesses: minPhase,
    runUpOnly, dropOffHops: [...walkOnly], minDeckHeadroom: +minHead.toFixed(0), minDeckHeadroomAt: minHeadAt, minCheckpointHeadroom: +minCpHead.toFixed(0),
    gate: { valvesOff: `${gateOff.over}/${gateOff.n} pass`, valvesOn: `${gateOn.over}/${gateOn.n} pass`, top: gate.y, deckTop: D.platforms[gateOff.deck][1] },
    climb: climbResult.info,
  };
  if (process.argv.includes('--hops')) for (const r of hopRows) console.log(JSON.stringify(r));
  if (fails.length) {
    console.error('FAIL: ' + fails.length + ' problem(s)');
    fails.slice(0, 60).forEach(f => console.error('  - ' + f));
    if (fails.length > 60) console.error('  ... and ' + (fails.length - 60) + ' more');
    console.error(JSON.stringify(out));
    process.exit(1);
  }
  console.log(JSON.stringify(out));
}

/* ------------------------------------------------------------------ the climb, hop by hop, heat live */
/* A competent-player script: on each hop try the standard strategies in order of naturalness and take the first that
   lands on the next ledge (the same first-success search a player does by feel). Wasps/supervisor are removed and Bix is
   invulnerable so a hazard cannot end the run; what is measured is the heat line, which is checked by hand every tick.
   Shutters are opened with the real ACT key when Bix stands at each shutter ledge. The run ends on the lift deck. */
function fullClimb(D0) {
  const problems = [], q = boot(), U = surfaces(q), D = q.D, P = q.P, S = q.S;
  const chain = D.chains.find(c => c.id === 'a5-climb');
  const dt = 1 / 60;
  const base = D.checkpoints.find(c => c.name === 'FURNACE BASE');
  q.reset(1); q.setEnemies([]);
  q.D.valves.forEach(v => v.on = 1);
  S.clock = 50;
  const A0 = U.rect(chain.nodes[0], S.clock);
  Object.assign(P, { x: base.x, y: A0.y - P.h - 1, vx: 0, vy: 0, ground: 0, inv: 999, hang: 0, climb: 0, hangRect: null });
  for (let i = 0; i < 20 && !P.ground; i++) q.tick(1, dt);
  let minMargin = Infinity, elapsed = 0, opened = 0;
  const track = () => { if (q.isVertical(q.areaAt(P.x, P.y))) minMargin = Math.min(minMargin, q.state().heat - (P.y + P.h)) };
  const wasVertical = q.isVertical(q.areaAt(P.x, P.y));
  if (!wasVertical) problems.push('the Furnace base deck is not inside the vertical (furnace) area, so heat never starts there');
  const shutterAt = new Map(D.shutters.map((s, i) => [s.y, i]));
  const snap = () => ({ P: { ...P }, clock: S.clock, K: { ...q.K }, heat: q.state().heat });
  const rest = s => { Object.assign(P, s.P); S.clock = s.clock; Object.assign(q.K, s.K); q.setHeat(s.heat) };
  for (let i = 1; i < chain.nodes.length; i++) {
    const a = chain.nodes[i - 1], b = chain.nodes[i], A = U.rect(a, S.clock), B = U.rect(b, S.clock);
    const dir = (B.x + B.w / 2) >= (A.x + A.w / 2) ? 1 : -1, key = dir > 0 ? 'right' : 'left';
    const start = snap();
    let done = null; const tried = [];
    /* natural order: run up and jump near the edge with full hold, then tap, then earlier/later take-offs */
    const order = [];
    for (const hold of [true, false]) for (const k of [0, 8, 16, 24, 32, 40, -8, 48, 56]) order.push({ k, hold });
    for (const s of order) {
      rest(start); q.clear();
      const t0 = elapsed;
      let t = 0, jumped = false, left = false, ok = false;
      q.K[key] = 1;
      while (t < 3) {
        const A2 = U.rect(a, S.clock), edge = dir > 0 ? A2.x + A2.w : A2.x, lead = dir > 0 ? P.x + P.w : P.x;
        if (!jumped && dir * (lead - (edge - dir * s.k)) >= 0) { P.buffer = .16; q.K.jump = 1; jumped = true } else if (jumped && !s.hold) q.K.jump = 0;
        q.tick(1, dt); t += dt; P.inv = 999; track();
        if (q.state().done) { ok = true; break }                 // the engine finishes the level as soon as Bix is at the exit
        if (!P.ground) left = true;
        if (P.ground && left) { ok = U.matches(P.support, b, S.clock); if (!ok) tried.push(`${s.k}${s.hold ? 'H' : 't'}:${U.name(P.support)}@${P.x.toFixed(0)}`); break }
        if (P.y > 1300) { tried.push(`${s.k}${s.hold ? 'H' : 't'}:fell`); break }
      }
      if (!ok && !tried.length) tried.push(`${s.k}${s.hold ? 'H' : 't'}:timeout hang=${P.hang} climb=${P.climb} ground=${P.ground} x=${P.x.toFixed(0)} y=${P.y.toFixed(0)}`);
      if (ok) { done = { ...s, t }; break }
    }
    if (!done) { problems.push(`climb: no strategy lands ${U.id(a)} -> ${U.id(b)} with the heat line live (from x=${start.P.x.toFixed(0)}, feet ${(start.P.y + start.P.h).toFixed(0)}; tried ${tried.slice(0, 6).join(' ')})`); break }
    elapsed += done.t;
    q.clear();
    /* ACT at a shutter ledge: walk to the console and press the real interact key */
    const sh = b[0] === 'l' ? D.shutters.find(s => Math.abs(s.y - D.ledges[b[1]][1]) < 2) : null;
    if (sh && !D.shutters[D.shutters.indexOf(sh)].on) {
      for (let s = 0; s < 150; s++) {
        const d = sh.x - (P.x + 21);
        q.K.right = d > 6 ? 1 : 0; q.K.left = d < -6 ? 1 : 0;
        if (Math.abs(d) <= 6) q.K.interact = 1;
        q.tick(1, dt); P.inv = 999; track(); elapsed += dt;
        if (sh.on) { opened++; break }
      }
      q.clear();
      if (!sh.on) problems.push(`climb: could not open shutter ${sh.id} from its ledge`);
    }
  }
  /* board the lift: stand on the deck under the exit */
  const exit = D.exit;
  if (!problems.length && !q.state().done) {
    q.clear();
    for (let s = 0; s < 240 && !q.state().done; s++) {
      const d = exit.x - (P.x + 21);
      q.K.right = d > 6 ? 1 : 0; q.K.left = d < -6 ? 1 : 0;
      q.tick(1, dt); P.inv = 999; track(); elapsed += dt;
    }
    if (!q.state().done) problems.push(`climb: reached the lift deck but the level did not finish (shutters ${q.state().shutters}/3, feet ${(P.y + P.h).toFixed(0)}, exit ${exit.y})`);
  }
  if (minMargin < 40) problems.push(`climb: heat line came within ${minMargin.toFixed(0)}px of Bix's feet (need >= 40)`);
  return { problems, info: { seconds: +elapsed.toFixed(1), shuttersOpened: opened, finished: !!q.state().done, minHeatMargin: Math.round(minMargin) } };
}

if (require.main === module) main();
module.exports = { boot, surfaces, trial, hopGrid, headroom, DTS, KS };
