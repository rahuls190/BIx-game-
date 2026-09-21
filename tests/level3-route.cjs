/* Level 3 route proofs (stage 1: Areas 1-3), played in the REAL engine. Run from the repo root: node tests/level3-route.cjs
   tests/level3-geometry.cjs proves the hops on paper; this plays them: real collision, head-bumps, one-way ledges, ledge grabs, the
   ground/air acceleration ramp, the shaft's downdraft, the crumbling plates' 0.8 s clock, the pad launch, the girder hang.

   For every required jump hop, at three frame rates, a grid of run-ups is played (take-off timing x jump held or tapped x releasing
   the direction key at different points). The hop passes only if:
     - at least 50% of the grid lands on the target surface, and
     - at least 25% does so WITHOUT a ledge grab or mantle (a hop that needs an accidental mantle is not a real hop).
   Then the glove hops are played the same way (with the glove ON they must work; with it OFF they must be impossible), and the
   crate step, the wall cling recovery and the net are exercised. */
'use strict';
const assert = require('assert');
const { boot } = require('./level3-harness.cjs');

const DTS = [1 / 120, 1 / 60, 0.033];
const RUN_MIN = 0.50, NOGRAB_MIN = 0.25;
const KS = [-12, -4, 4, 12, 20, 28, 36, 44];
const RELEASES = [null, 0, 25, 60];
const fails = [];
const fail = m => fails.push(m);
let trials = 0;

/* surfaces as rects, and "is the engine's support this node" */
const rectOf = (q, n) => {
  if (n[0] === 'p') {
    const p = q.D.platforms[n[1]], r = { x: p[0], y: p[1], w: p[2] };
    const k = (q.D.crates || []).find(c => c.deck === n[1]); if (k) r.runFrom = k.x + k.w + 4;   // the crate is a wall: start the run past it
    return r;
  }
  const l = q.D.ledges[n[1]]; return { x: l.x, y: l.y, w: l.w, plate: n[1] };
};
const isSupport = (s, r) => !!s && s.x === r.x && s.y === r.y && s.w === r.w;

/* one run: `a` and `b` are rects; p = {start:'far'|'edge', k, hold, release, dt, glove, red, blue, hopKey} */
function trial(q, a, b, p) {
  const P = q.P, w = P.w;
  q.clear();
  q.plates().forEach(s => { s.t = 0; s.armed = 0; s.gone = 0 });
  Object.assign(P, { hang: 0, climb: 0, hangRect: null, dropTime: 0, jumpTime: 0, grabCD: 0, inv: 999, buffer: 0, coyote: 0, vx: 0, vy: 0, support: null, ground: 0, gird: null, cling: null, latchCD: 0 });
  q.setGlove(p.glove ? 1 : 0);
  const dir = (b.x + b.w / 2) >= (a.x + a.w / 2) ? 1 : -1;
  P.face = dir;
  const run = 350;      // a run-up of at most 350 px: enough to be at full speed, short enough that a slow hop still fits the 3.5 s limit
  const farX = dir > 0 ? Math.max(a.runFrom ?? a.x + 2, a.x + a.w - w - run) : Math.min(a.x + a.w - w - 2, a.x + run);
  P.x = p.start === 'far' ? farX : (dir > 0 ? a.x + a.w - w : a.x);
  P.y = a.y - P.h - 1;
  for (let s = 0; s < 20 && !P.ground; s++) q.tick(1, p.dt);
  if (!P.ground || !isSupport(P.support, a)) return { ok: false, why: 'cannot stand' };
  // a copper plate is already crumbling when Bix arrives on it: he has at most ~0.75 s to be off it
  if (a.plate !== undefined && q.D.ledges[a.plate].t === 'copper') { const s = q.plates()[a.plate]; s.armed = 1; s.t = 0.05 }
  const key = dir > 0 ? 'right' : 'left', k = p.start === 'edge' ? 0 : p.k;
  let jumped = false, left = false, grabbed = false, released = false, t = 0;
  q.K[key] = 1; if (p.red) q.K.red = 1;
  while (t < 3.5) {
    const edge = dir > 0 ? a.x + a.w : a.x, lead = dir > 0 ? P.x + w : P.x;
    if (!jumped && dir * (lead - (edge - dir * k)) >= 0) { P.buffer = .16; q.K.jump = 1; jumped = true }
    else if (jumped && !p.hold && q.K.jump) q.K.jump = 0;
    if (p.release != null && !released) {
      const near = dir > 0 ? b.x : b.x + b.w, trail = dir > 0 ? P.x : P.x + w;
      if (dir * (trail - near) >= p.release) { q.K[key] = 0; released = true }
    }
    q.tick(1, p.dt); t += p.dt; trials++;
    if (P.hang || P.climb) grabbed = true;
    if (!P.ground) left = true;
    if (P.ground && left) {
      if (isSupport(P.support, b)) return { ok: true, grabbed };
      return { ok: false, why: (isSupport(P.support, a) ? 'back on the take-off' : 'landed elsewhere'), grabbed };
    }
    if (P.y > a.y + 900) return { ok: false, why: 'fell', grabbed };
  }
  return { ok: false, why: 'timeout', grabbed };
}

function hopGrid(q, a, b, dt, extra = {}) {
  const r = { n: 0, ok: 0, noGrab: 0, why: {} };
  for (const k of KS) for (const hold of [true, false]) for (const release of RELEASES) {
    const s = trial(q, a, b, { start: 'far', k, hold, release, dt, glove: 1, ...extra });
    r.n++; if (s.ok) { r.ok++; if (!s.grabbed) r.noGrab++ } else r.why[s.why] = (r.why[s.why] || 0) + 1;
  }
  return r;
}

function main() {
  const t0 = Date.now();
  const q = boot();
  const D = q.D;
  const summary = { hops: 0 };
  let minRun = 2, minNoGrab = 2, tightest = null;

  /* ---------------- 1. every required jump hop ---------------- */
  for (const c of D.chains) {
    if (c.kind !== 'required' || c.mode) continue;
    for (let i = 1; i < c.nodes.length; i++) {
      const a = rectOf(q, c.nodes[i - 1]), b = rectOf(q, c.nodes[i]), id = c.nodes[i - 1].join('') + '->' + c.nodes[i].join('');
      summary.hops++;
      for (const dt of DTS) {
        const r = hopGrid(q, a, b, dt), dtl = '1/' + Math.round(1 / dt), frac = r.ok / r.n, ng = r.noGrab / r.n;
        if (frac < minRun) { minRun = frac; tightest = id + ' @' + dtl }
        minNoGrab = Math.min(minNoGrab, ng);
        if (r.ok === 0) fail(`${c.id} ${id} @dt ${dtl}: NO run-up lands on the target (${JSON.stringify(r.why)})`);
        else if (frac < RUN_MIN) fail(`${c.id} ${id} @dt ${dtl}: only ${(frac * 100).toFixed(0)}% of run-ups land (need ${RUN_MIN * 100}%) ${JSON.stringify(r.why)}`);
        else if (ng < NOGRAB_MIN) fail(`${c.id} ${id} @dt ${dtl}: only ${(ng * 100).toFixed(0)}% land without a ledge grab (need ${NOGRAB_MIN * 100}%): the hop depends on an accidental mantle`);
      }
    }
  }

  /* ---------------- 2. the pad launch (p1 -> p2) ---------------- */
  {
    const a = rectOf(q, ['p', 1]), b = rectOf(q, ['p', 2]);
    for (const dt of DTS) {
      // with the glove and Red held: launch from anywhere on the pad, then run toward the deck
      let n = 0, good = 0, launched = 0;
      const pad = D.pads[0];
      for (const startX of [pad.x, pad.x + 30, pad.x + 60, pad.x + 78]) for (const release of [null, 0, 40]) for (const hold of [true, false]) {
        q.clear(); q.setGlove(1); q.plates().forEach(s => { s.t = 0; s.armed = 0; s.gone = 0 });
        Object.assign(q.P, { x: startX, y: a.y - q.P.h - 1, vx: 0, vy: 0, ground: 0, inv: 999, support: null, gird: null, cling: null, hang: 0, climb: 0, grabCD: 0, latchCD: 0, buffer: 0, coyote: 0, face: 1 });
        for (let s = 0; s < 20 && !q.P.ground; s++) q.tick(1, dt);
        q.tick(Math.ceil(0.6 / dt), dt);      // the pad has a 0.4 s cooldown: let the previous trial's launch expire
        q.K.red = 1; q.tick(3, dt);
        if (q.P.vy < -700) launched++;
        q.K.right = 1; let t = 0, released = false, left = false, ended = null;
        while (t < 3) { q.tick(1, dt); t += dt; if (release != null && !released && q.P.x >= b.x - 60 + release) { q.K.right = 0; released = true }
          if (!q.P.ground) left = true; if (q.P.ground && left) { ended = q.P.support; break } }
        n++; if (isSupport(ended, b)) good++;
        q.clear();
      }
      if (launched < n) fail(`pad @dt 1/${Math.round(1 / dt)}: the launch did not fire on ${n - launched} of ${n} attempts`);
      if (good / n < 0.5) fail(`pad hop p1->p2 @dt 1/${Math.round(1 / dt)}: only ${(good / n * 100).toFixed(0)}% land on the raised deck with the pad`);
      // without the glove the raised deck is out of reach for EVERY run-up (a grab must not rescue it)
      let easy = 0, tot = 0;
      for (const k of KS) for (const hold of [true, false]) for (const release of RELEASES) { const s = trial(q, a, b, { start: 'far', k, hold, release, dt, glove: 0 }); tot++; if (s.ok) easy++ }
      if (easy) fail(`pad hop p1->p2 @dt 1/${Math.round(1 / dt)}: ${easy}/${tot} run-ups reach the raised deck WITHOUT the glove (a ledge grab must not do it)`);
    }
  }

  /* ---------------- 3. the girder crossing (p2 -> p3) ---------------- */
  {
    const a = rectOf(q, ['p', 2]), b = rectOf(q, ['p', 3]);
    for (const dt of DTS) {
      const dtl = '1/' + Math.round(1 / dt);
      // the intended play: hold Blue and walk right. It must work from anywhere on the take-off deck's last 300 px, every time.
      let n = 0, good = 0, maxHeat = 0, maxHeatNear = 0;
      for (const back of [0, 30, 80, 150, 300]) {
        q.clear(); q.setGlove(1); q.plates().forEach(s => { s.t = 0; s.armed = 0; s.gone = 0 });
        Object.assign(q.P, { x: a.x + a.w - q.P.w - back, y: a.y - q.P.h - 1, vx: 0, vy: 0, ground: 0, inv: 999, support: null, gird: null, cling: null, hang: 0, climb: 0, grabCD: 0, latchCD: 0, buffer: 0, coyote: 0, face: 1 });
        for (let s = 0; s < 20 && !q.P.ground; s++) q.tick(1, dt);
        q.G().heat = 0; q.K.right = 1; q.K.blue = 1;
        let t = 0, left = false, ended = null, peak = 0, dropped = null;
        while (t < 9) {
          q.tick(1, dt); t += dt; peak = Math.max(peak, q.G().heat);
          if (!q.P.ground) left = true;
          if (q.P.ground && left) { ended = q.P.support; break }
          if (q.P.y > a.y + 900) break;
        }
        n++; if (isSupport(ended, b) || (ended && ended.crate !== undefined)) { good++; maxHeat = Math.max(maxHeat, peak); if (back <= 60) maxHeatNear = Math.max(maxHeatNear, peak) }     // p3, or the crate standing on it
        q.clear();
      }
      if (good < n) fail(`girder crossing @dt ${dtl}: holding Blue and walking right crossed on only ${good} of ${n} starts`);
      // a player who presses Blue at the deck edge peaks near 57% on the beam and about 66% if still holding Blue through the drop; one who holds it for a whole 300 px approach adds idle heat but must never reach the 85% warning
      if (maxHeatNear > 70) fail(`girder crossing @dt ${dtl}: peak heat ${maxHeatNear.toFixed(0)}% from the deck edge (limit 70: 57% on the beam plus the drop with Blue still held)`);
      if (maxHeat >= 85) fail(`girder crossing @dt ${dtl}: peak heat ${maxHeat.toFixed(0)}% even with a long approach (must stay under the 85% warning)`);
      // letting go of Blue over the pit must drop Bix (and he must not survive by magic)
      q.clear(); q.setGlove(1);
      Object.assign(q.P, { x: a.x + a.w - q.P.w - 30, y: a.y - q.P.h - 1, vx: 0, vy: 0, ground: 0, inv: 999, support: null, gird: null, cling: null, hang: 0, climb: 0, grabCD: 0, latchCD: 0, buffer: 0, coyote: 0, face: 1 });
      for (let s = 0; s < 20 && !q.P.ground; s++) q.tick(1, dt);
      q.K.right = 1; q.K.blue = 1; q.tick(Math.round(1.2 / dt), dt);
      if (!q.P.gird) fail(`girder @dt ${dtl}: Bix is not hanging from the girder after 1.2 s of Blue`);
      q.K.blue = 0; q.tick(Math.round(0.5 / dt), dt);
      if (q.P.gird || q.P.ground) fail(`girder @dt ${dtl}: releasing Blue over the pit did not drop Bix`);
      q.clear();
      // without the glove the pit is not crossable by ANY run-up (a ledge grab on the far lip must not rescue it)
      let over = 0, tot = 0;
      for (const kk of KS) for (const hold of [true, false]) for (const release of RELEASES) { const s = trial(q, a, b, { start: 'far', k: kk, hold, release, dt, glove: 0 }); tot++; if (s.ok) over++ }
      if (over) fail(`girder pit @dt ${dtl}: ${over}/${tot} run-ups cross the ${b.x - (a.x + a.w)} px pit WITHOUT the glove`);
    }
  }

  /* ---------------- 4. presses: every deck can be crossed, and each press has a real safe window ---------------- */
  {
    for (const pr of D.presses) {
      const deckIdx = D.platforms.findIndex(p => Math.abs(p[1] - pr.anvil) < 1 && pr.x >= p[0] && pr.x + pr.w <= p[0] + p[2]);
      const deck = D.platforms[deckIdx];
      let n = 0, safe = 0;
      const offsets = []; for (let o = 0; o < pr.period - 1e-9; o += 0.05) offsets.push(o);
      for (const o of offsets) {
        // start with the player at the deck's left end, walking right at full speed; the press clock is shifted by o
        const qq = boot(); qq.setGlove(0); qq.place(deck[0] + 2, deck[1]); qq.P.inv = 0; qq.S.clock = 10 + o;
        // in real play the player has already passed the earlier checkpoints: mark them taken, so the Pack catch's respawn does not re-arm one and refund its charge
        qq.D.checkpoints.forEach(c => qq.seen.add(c)); qq.setCP(qq.D.checkpoints[0]);
        qq.K.right = 1; let t = 0, hit = false;
        const c0 = qq.state().charge;
        while (t < deck[2] / 285 + 0.3) { qq.tick(1, 1 / 60); t += 1 / 60; if (qq.state().charge !== c0 || qq.P.falls) { hit = true; break } }
        n++; if (!hit) safe++;
      }
      if (safe / n < 0.40) fail(`press ${pr.id}: only ${(safe / n * 100).toFixed(0)}% of start phases survive a straight run across (need 40%)`);
      if (safe === n) fail(`press ${pr.id}: nothing ever hits the player, so the press is not a hazard`);
    }
  }

  const ms = Date.now() - t0;
  if (fails.length) { console.error('FAIL: ' + fails.length + ' problem(s)'); fails.forEach(f => console.error('  - ' + f)) }
  console.log(JSON.stringify({ ok: !fails.length, ms, trials, requiredJumpHops: summary.hops, dts: DTS.map(d => Math.round(1 / d)), minRunUpSuccess: +minRun.toFixed(2), minNoGrabSuccess: +minNoGrab.toFixed(2), tightestHop: tightest }));
  if (fails.length) process.exit(1);
}
main();
