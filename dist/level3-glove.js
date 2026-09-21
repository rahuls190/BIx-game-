/* Project Mayhem, Level 3: the Magnet Glove.
   Pure logic. No canvas, no DOM, no clock, no Math.random. Loads as a plain browser script (defines window.L3GLOVE)
   and under Node's vm (tests/level3-glove.cjs).

   PUBLIC CONTRACT
     L3GLOVE.polarity(blue,red)      -> 1 (Blue, attract) | -1 (Red, repel) | 0. Holding both cancels the field.
     L3GLOVE.tierFor(banked,max)     -> {name,charges,window,parry,emp}, banked = cogs carried into the level (0..max), max defaults to 26 (Levels 1+2);
                                        Level 4 passes 38 (Levels 1 to 3) and the tier cut-offs scale with it (12 and 20 of 26 become 18 and 29 of 38)
     L3GLOVE.make(banked,max)        -> a glove {heat,overloaded,lock,tier,charges,shieldT,...}
     L3GLOVE.update(g,dt,inp)        -> advances heat and the shield; inp = {blue,red,engaged,shield}
                                        returns {pol,overloaded,warn,shieldStarted,shieldEmpty}
     L3GLOVE.shieldActive(g)         -> true while the shield window is open
     L3GLOVE.refill(g)               -> charges back to the tier maximum (every checkpoint does this)
     L3GLOVE.drain(g,rate,dt)        -> extra heat from something other than a field (the transit door)
     L3GLOVE.consts                  -> read-only numbers for the engine, the HUD and the tests

   RULES (docs: Level 3 design, sections 3.3 and 3.6)
     heat  +20 %/s while a field is engaged with a target (hanging, clinging, pushing, pulling, launching)
           +10 %/s while a field is held with nothing in range
           -35 %/s while neither field is held
     overload at 100 %: the glove locks for 2.5 s and no field works. warn from 85 %.
     shield tiers  Brittle Coil 0-11 banked cogs: 1 charge, 0.25 s window, absorbs minor impacts only
                   Tempered Induction 12-19: 2 charges, 0.35 s, parries spitter shots and flips crawlers
                   Superconducting Aegis 20-26: 3 charges, 0.45 s, plus a 180 px EMP stun on every parry */
(function () {
  'use strict';
  const G = typeof window !== 'undefined' ? window : globalThis;
  const C = { HEAT_ENGAGED: 20, HEAT_IDLE: 10, COOL: 35, WARN: 85, MAX: 100, LOCK: 2.5, EMP_RANGE: 180, MAX_BANKED: 26 };
  const TIERS = [
    { name: 'Brittle Coil', min: 0, charges: 1, window: 0.25, parry: false, emp: false },
    { name: 'Tempered Induction', min: 12, charges: 2, window: 0.35, parry: true, emp: false },
    { name: 'Superconducting Aegis', min: 20, charges: 3, window: 0.45, parry: true, emp: true },
  ];
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

  function polarity(blue, red) { return blue && !red ? 1 : red && !blue ? -1 : 0; }

  function tierFor(banked, max) {
    const m = Math.max(1, Math.floor(num(max, C.MAX_BANKED))), b = Math.max(0, Math.min(m, Math.floor(num(banked, 0))));
    let t = TIERS[0];
    for (const q of TIERS) if (b >= Math.round(q.min * m / C.MAX_BANKED)) t = q;
    return t;
  }

  function make(banked, max) {
    const tier = tierFor(banked, max), m = Math.max(1, Math.floor(num(max, C.MAX_BANKED)));
    return { tier, banked: Math.max(0, Math.min(m, Math.floor(num(banked, 0)))), heat: 0, overloaded: false, lock: 0,
      charges: tier.charges, shieldT: 0, pol: 0 };
  }

  function update(g, dt, inp) {
    dt = Math.max(0, num(dt, 0)); inp = inp || {};
    let shieldStarted = false, shieldEmpty = false;
    if (g.overloaded) {
      g.lock = Math.max(0, g.lock - dt);
      g.heat = Math.max(0, g.heat - C.COOL * dt);
      if (g.lock === 0) g.overloaded = false;
      g.pol = 0;
    } else {
      const pol = polarity(!!inp.blue, !!inp.red);
      g.pol = pol;
      if (pol) {
        g.heat += (inp.engaged ? C.HEAT_ENGAGED : C.HEAT_IDLE) * dt;
        if (g.heat >= C.MAX) { g.heat = C.MAX; g.overloaded = true; g.lock = C.LOCK; g.pol = 0 }
      } else g.heat = Math.max(0, g.heat - C.COOL * dt);
    }
    // the shield still works while the field is locked out: it is a separate capacitor
    if (inp.shield && g.shieldT <= 0) {
      if (g.charges > 0) { g.charges--; g.shieldT = g.tier.window; shieldStarted = true } else shieldEmpty = true;
    }
    if (g.shieldT > 0) g.shieldT = Math.max(0, g.shieldT - dt);
    return { pol: g.pol, overloaded: g.overloaded, warn: g.heat >= C.WARN, shieldStarted, shieldEmpty };
  }

  // Heat from a source that is not a field: at 100 % the glove locks exactly as it does from a field.
  function drain(g, rate, dt) {
    if (g.overloaded) return false;
    g.heat += num(rate, 0) * Math.max(0, num(dt, 0));
    if (g.heat >= C.MAX) { g.heat = C.MAX; g.overloaded = true; g.lock = C.LOCK; g.pol = 0; return true }
    return false;
  }

  const shieldActive = g => g.shieldT > 0;
  const refill = g => { g.charges = g.tier.charges };

  G.L3GLOVE = { polarity, tierFor, make, update, drain, shieldActive, refill, consts: Object.freeze({ ...C, TIERS: Object.freeze(TIERS.map(t => Object.freeze({ ...t }))) }) };
})();
