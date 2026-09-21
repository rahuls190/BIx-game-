/* Project Mayhem, Level 4 "Delivery Attempt": the Carried Core.
   Pure logic. No canvas, no DOM, no clock, no Math.random. Loads as a plain browser script (defines window.L4CORE) and under Node's vm
   (tests/level4-core.cjs).

   PUBLIC CONTRACT
     L4CORE.MODES                    -> ['carry','heavy','buoy','charge']
     L4CORE.fx(mode)                 -> what carrying (or being near) the core does to Bix: {run,jump,grav,fall,label,color}
                                        run/jump multiply the run speed and jump velocity, grav multiplies gravity, fall caps the fall speed (0 = no cap)
     L4CORE.modeAt(zones,x)          -> the core's mode at world x. zones = [{x0,x1,mode}]; anything outside a zone is 'carry'
     L4CORE.nextChange(zones,x,look) -> the next mode change within `look` px ahead of x: {x,from,to} or null (Pack's amber tell)
     L4CORE.reach(mode)              -> the free-jump reach of Bix in a mode, for the geometry tests: {v0,g,run}
     L4CORE.incident(cause,n,last)   -> [speaker, text] for the n-th death (Nib's incident report), never the same variant twice in a row
     L4CORE.tally(n)                 -> Nib's closing line for n deaths
     L4CORE.consts                   -> read-only numbers for the engine, the HUD and the tests

   RULES (docs/level-4-plan.md, "The Carried Core")
     heavy   run x0.82, jump x0.88 (apex 162 px instead of 209), heavy core presses scale plates
     buoy    gravity x0.55 while falling, fall speed capped at 260 px/s (a glide), vents lift the core
     charge  normal movement; the core arcs to live rails (a hazard) and can be thrown (Red) and called back (Blue)
     carry   the plain core (the market and the deck): no effect on Bix */
(function () {
  'use strict';
  const G = typeof window !== 'undefined' ? window : globalThis;
  const BASE = { GRAV: 1450, JUMP: 780, RUN: 285 };            // the physics Levels 1 to 3 use
  const MODES = ['carry', 'heavy', 'buoy', 'charge'];
  const FX = {
    carry:  { run: 1,    jump: 1,    grav: 1,    fall: 0,   label: 'CARRY',   color: '#8fa3b5' },
    heavy:  { run: 0.82, jump: 0.88, grav: 1,    fall: 0,   label: 'HEAVY',   color: '#c9822f' },
    buoy:   { run: 1,    jump: 1,    grav: 0.55, fall: 260, label: 'BUOYANT', color: '#9fd0e6' },
    charge: { run: 1,    jump: 1,    grav: 1,    fall: 0,   label: 'CHARGED', color: '#b58cff' },
  };
  const C = { THROW_V: 760, THROW_UP: 260, CALL_RANGE: 560, CALL_V: 520, CATCH_R: 64, PICKUP_R: 92, SIZE: 40, HEAVY_GRAV: 1.2, BUOY_GRAV: 0.35, VENT_ACCEL: 4200, TELL: 240 };

  const fx = mode => FX[mode] || FX.carry;
  function modeAt(zones, x) {
    let m = 'carry';
    for (const z of zones || []) if (x >= z.x0 && x < z.x1) m = z.mode;
    return m;
  }
  function nextChange(zones, x, look) {
    const from = modeAt(zones, x), lim = typeof look === 'number' ? look : C.TELL;
    for (let d = 8; d <= lim; d += 8) { const to = modeAt(zones, x + d); if (to !== from) return { x: x + d, from, to } }
    return null;
  }
  // Free-jump reach in a mode (the same model Levels 2 and 3 were checked against): v0 = jump velocity, g = gravity, run = run speed.
  const reach = mode => { const f = fx(mode); return { v0: BASE.JUMP * f.jump, g: BASE.GRAV * f.grav, run: BASE.RUN * f.run } };

  // Nib's incident reports: two variants for each cause, so the same line never repeats back to back.
  const INCIDENTS = {
    crane:    ['NIB', 'Employee flattened by scheduled cargo. Cargo unharmed.', 'Crane won. Please note: the crane was on schedule.'],
    conveyor: ['NIB', 'Employee carried the wrong way. Belt unrepentant.', 'Conveyor reversed. Employee did not.'],
    fall:     ['NIB', 'Employee left the building through the floor.', 'Gravity was consulted. Gravity agreed.'],
    arc:      ['NIB', 'Employee touched a live rail. Rail remained live.', 'Arc detected. Employee detected. Briefly.'],
    bolt:     ['NIB', 'Employee struck by weather. Weather sorry.', 'Storm arrived on time. Employee arrived early.'],
    enemy:    ['NIB', 'Employee sorted by a crawler. Categorised as scrap.', 'Crawler wins. Nib has requested a recount.'],
    crush:    ['PACK', 'Dennis fell on you. He says sorry. He is not sorry.', 'Dennis is heavy. That was the whole feature.'],
    generic:  ['NIB', 'Incident filed. Employee returned to the last checkpoint.', 'Nib has filed it. Please stop generating paperwork.'],
  };
  function incident(cause, n, last) {
    const e = INCIDENTS[cause] || INCIDENTS.generic;
    let v = 1 + ((Math.max(1, n | 0) - 1) % 2);
    if (last && last.cause === cause && last.v === v) v = v === 1 ? 2 : 1;
    const prefix = e[0] === 'NIB' ? `INCIDENT ${Math.max(1, n | 0)}: ` : '';
    return { who: e[0], text: prefix + e[v], v };
  }
  function tally(n) {
    n = Math.max(0, n | 0);
    if (n === 0) return 'Zero incidents. Nib has requested a recount.';
    if (n <= 5) return 'A few incidents. Acceptable. Nib has stopped saying "acceptable."';
    if (n <= 15) return `${n} incidents. Nib has run out of blank forms.`;
    return `${n} incidents. Nib has hired an assistant. Assistant has quit.`;
  }

  G.L4CORE = { MODES, fx, modeAt, nextChange, reach, incident, tally, BASE, consts: Object.freeze({ ...C }), INCIDENT_CAUSES: Object.freeze(Object.keys(INCIDENTS)) };
})();
