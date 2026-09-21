/* Level 3 glove rules: heat, overload, polarity, shield tiers. Run from the repo root: node tests/level3-glove.cjs
   Loads dist/level3-glove.js in a vm sandbox. Every number checked here is in the design document, sections 3.3 and 3.6. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const sb = { console }; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'dist', 'level3-glove.js'), 'utf8'), sb);
const GL = sb.window.L3GLOVE;
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const near = (a, b, e, m) => { assert(Math.abs(a - b) <= e, `${m}: got ${a}, expected ${b} +/- ${e}`); checks++ };
const run = (g, secs, inp, dt = 1 / 120) => { let last; for (let t = 0; t < secs - 1e-9; t += dt) last = GL.update(g, dt, inp); return last };

// polarity: held, never toggled; both held cancels
ok(GL.polarity(true, false) === 1 && GL.polarity(false, true) === -1, 'Blue is +1 and Red is -1');
ok(GL.polarity(true, true) === 0 && GL.polarity(false, false) === 0, 'holding both, or neither, is neutral');

// shield tiers: the design table, edges included
const T = n => GL.tierFor(n);
for (const [n, name, ch, win, parry, emp] of [[0, 'Brittle Coil', 1, .25, false, false], [11, 'Brittle Coil', 1, .25, false, false],
  [12, 'Tempered Induction', 2, .35, true, false], [19, 'Tempered Induction', 2, .35, true, false], [20, 'Superconducting Aegis', 3, .45, true, true], [26, 'Superconducting Aegis', 3, .45, true, true]]) {
  const t = T(n); ok(t.name === name && t.charges === ch && t.window === win && t.parry === parry && t.emp === emp, `${n} banked cogs must give ${name}`);
}
ok(T(-5).name === 'Brittle Coil' && T(99).name === 'Superconducting Aegis' && T(NaN).name === 'Brittle Coil' && T('x').name === 'Brittle Coil', 'out-of-range banked cogs clamp');
ok(GL.make(30).banked === 26, 'banked cogs are capped at 26 (12 + 14)');

// heat gain: engaged 20 %/s, idle 10 %/s, cooling 35 %/s
let g = GL.make(0);
run(g, 2, { blue: true, engaged: true }); near(g.heat, 40, .5, 'two seconds engaged is 40%');
run(g, 1, { blue: true, engaged: false }); near(g.heat, 50, .5, 'one second held with nothing in range adds 10%');
run(g, 1, {}); near(g.heat, 15, .5, 'one second neutral cools 35%');
run(g, 5, {}); ok(g.heat === 0, 'heat never goes below zero');

// the longest required hang: the yard girder, about 2.4 s engaged. It must stay well under overload.
g = GL.make(0); run(g, 2.4, { blue: true, engaged: true }); ok(g.heat < 60 && !g.overloaded, 'the yard girder costs under 60% heat and never overloads');

// warn and overload
g = GL.make(0); let r = run(g, 4.3, { red: true, engaged: true }); ok(r.warn && !r.overloaded, 'the warning shows from 85%, before the lock');
for (let i = 0; i < 200 && !g.overloaded; i++) r = GL.update(g, 1 / 120, { red: true, engaged: true });
ok(r.overloaded && g.overloaded && g.heat === 100 && r.pol === 0, 'at 100% the glove overloads and drops the field');
// locked for 2.5 s: no field, whatever is held
let locked = 0; const dt = 1 / 120;
while (g.overloaded && locked < 4) { const s = GL.update(g, dt, { blue: true, engaged: true }); ok(s.pol === 0 || !g.overloaded, 'no field while locked'); locked += dt }
near(locked, 2.5, .05, 'the lock lasts 2.5 s');
ok(!g.overloaded, 'the glove comes back after the lock');
// heat drains while locked, so it is usable again
ok(g.heat < 100, 'heat falls during the lock');

// deliberate overload (the transit door): heat from a non-field source locks the glove the same way
g = GL.make(0); let blew = false; for (let i = 0; i < 400 && !blew; i++) blew = GL.drain(g, 40, 1 / 120);
ok(blew && g.overloaded, 'the door overloads the glove at 40%/s');
near(g.lock, 2.5, .001, 'and locks it for 2.5 s');
ok(GL.drain(g, 40, 1) === false, 'no second overload while already locked');

// shield: charges, windows, refill, empty
for (const banked of [0, 12, 20]) {
  g = GL.make(banked); const t = g.tier; ok(g.charges === t.charges, `${t.name} starts full`);
  let used = 0; for (let i = 0; i < 6; i++) { const s = GL.update(g, 1 / 60, { shield: true }); if (s.shieldStarted) used++; GL.update(g, t.window + .05, {}) }
  ok(used === t.charges, `${t.name}: exactly ${t.charges} shield uses, got ${used}`);
  const e = GL.update(g, 1 / 60, { shield: true }); ok(e.shieldEmpty && !e.shieldStarted, `${t.name}: an empty capacitor says so instead of firing`);
  GL.refill(g); ok(g.charges === t.charges, `${t.name}: a checkpoint refills it`);
}
g = GL.make(12); GL.update(g, 1 / 120, { shield: true }); ok(GL.shieldActive(g), 'the shield is active right after use');
run(g, .3, {}); ok(GL.shieldActive(g), '0.35 s window is still open at 0.3 s');
run(g, .1, {}); ok(!GL.shieldActive(g), 'and closed by 0.4 s');
g = GL.make(12); GL.update(g, 1 / 120, { shield: true }); const before = g.charges; GL.update(g, 1 / 120, { shield: true }); ok(g.charges === before, 'holding the button does not burn a second charge while the shield is up');
// the shield is a separate capacitor: it works while the field is locked out
g = GL.make(12); g.overloaded = true; g.lock = 2; ok(GL.update(g, 1 / 60, { shield: true }).shieldStarted, 'the shield still works during a field lock-out');
// Level 4 carries up to 38 cogs: the cut-offs scale with the total (12 and 20 of 26 become 18 and 29 of 38); the default is unchanged
for (const [n, name] of [[0, 'Brittle Coil'], [17, 'Brittle Coil'], [18, 'Tempered Induction'], [28, 'Tempered Induction'], [29, 'Superconducting Aegis'], [38, 'Superconducting Aegis'], [99, 'Superconducting Aegis']])
  ok(GL.tierFor(n, 38).name === name, `${n} of 38 carried cogs -> ${name}`);
ok(GL.make(30, 38).banked === 30 && GL.make(99, 38).banked === 38 && GL.make(30, 38).tier.charges === 3 && GL.tierFor(12).name === 'Tempered Induction' && GL.tierFor(11).name === 'Brittle Coil', 'make() takes the scale; the Level 3 cut-offs are unchanged');
ok(GL.consts.EMP_RANGE === 180, 'the EMP reaches 180 px');
assert.throws(() => { GL.consts.WARN = 1 }, undefined, 'consts are read-only'); checks++;
console.log(JSON.stringify({ checks }));
