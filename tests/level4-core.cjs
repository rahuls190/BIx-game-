/* The Carried Core rules (dist/level4-core.js): modes and their effects, zone lookup, Pack's tell, reach numbers, and Nib's incident reports.
   Run from the repo root: node tests/level4-core.cjs */
'use strict';
const assert = require('assert'), fs = require('fs'), vm = require('vm');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const sb = { globalThis: null }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync('dist/level4-core.js', 'utf8'), sb);
const CO = sb.L4CORE;

// ---- modes and their effects -----------------------------------------------------------------------------------------------------------
ok(JSON.stringify(CO.MODES) === '["carry","heavy","buoy","charge"]', 'four modes');
const f = m => CO.fx(m);
ok(f('carry').run === 1 && f('carry').jump === 1 && f('carry').grav === 1 && f('carry').fall === 0, 'the plain core changes nothing');
ok(f('heavy').run < 1 && f('heavy').jump < 1 && f('heavy').grav === 1, 'heavy: slower run, lower jump');
ok(f('buoy').grav < 1 && f('buoy').fall > 0 && f('buoy').run === 1 && f('buoy').jump === 1, 'buoyant: lighter gravity and a glide cap, same run and jump');
ok(f('charge').run === 1 && f('charge').jump === 1 && f('charge').grav === 1, 'charged: normal movement (its danger is the rails)');
ok(CO.fx('nonsense') === CO.fx('carry') && CO.fx() === CO.fx('carry'), 'an unknown mode is a plain core');
ok(new Set(CO.MODES.map(m => f(m).color)).size === 4 && new Set(CO.MODES.map(m => f(m).label)).size === 4, 'every mode has its own colour AND its own label (never colour alone)');
const hv = CO.reach('heavy'), nm = CO.reach('carry');
ok(Math.abs(hv.v0 * hv.v0 / (2 * hv.g) - 162) < 2 && Math.abs(nm.v0 * nm.v0 / (2 * nm.g) - 209.7) < 2, 'the heavy jump apex is about 162 px and the plain one about 209 px');
ok(CO.reach('buoy').v0 * CO.reach('buoy').v0 / (2 * CO.reach('buoy').g) > 370, 'a held buoyant jump rises over 370 px (the mastery cog needs it)');

// ---- zones and Pack's tell -------------------------------------------------------------------------------------------------------------
const Z = [{ x0: 100, x1: 200, mode: 'heavy' }, { x0: 200, x1: 300, mode: 'buoy' }];
ok(CO.modeAt(Z, 50) === 'carry' && CO.modeAt(Z, 100) === 'heavy' && CO.modeAt(Z, 199.9) === 'heavy' && CO.modeAt(Z, 200) === 'buoy' && CO.modeAt(Z, 300) === 'carry', 'zones are half-open: [x0, x1)');
ok(CO.modeAt(null, 5) === 'carry' && CO.modeAt([], 5) === 'carry', 'no zones means a plain core');
const nc = CO.nextChange(Z, 20, 240);
ok(nc && nc.to === 'heavy' && nc.from === 'carry' && nc.x >= 100 && nc.x <= 108, 'Pack sees a change to heavy within the tell distance');
ok(CO.nextChange(Z, 20, 40) === null, 'and does not look further than the tell distance');
ok(CO.nextChange(Z, 150, 240).to === 'buoy' && CO.nextChange(Z, 250, 240).to === 'carry', 'each boundary is reported once as it comes');
ok(CO.consts.TELL === 240, 'the tell reaches 240 px ahead');
assert.throws(() => { CO.consts.TELL = 1 }, undefined, 'consts are read-only'); checks++;

// ---- Nib's incident reports ------------------------------------------------------------------------------------------------------------
for (const cause of CO.INCIDENT_CAUSES) {
  const a = CO.incident(cause, 1, null), b = CO.incident(cause, 2, { cause, v: a.v });
  ok(a.text && b.text && a.text !== b.text, `${cause}: two different variants back to back`);
  ok(a.text.length <= 70 + 'INCIDENT 99: '.length, `${cause}: the report fits the HUD box`);
  ok(b.who === a.who && (a.who === 'NIB' || a.who === 'PACK'), `${cause}: spoken by Nib (or Pack for the core crush)`);
}
ok(CO.incident('crane', 7, null).text.startsWith('INCIDENT 7: ') && CO.incident('crush', 7, null).who === 'PACK' && !CO.incident('crush', 7, null).text.startsWith('INCIDENT'), 'Nib numbers his reports, Pack does not');
{ const seq = []; let last = null; for (let n = 1; n <= 12; n++) { const r = CO.incident('fall', n, last); seq.push(r.text); last = { cause: 'fall', v: r.v } }
  ok(seq.every((t, i) => i === 0 || t.replace(/^INCIDENT \d+: /, '') !== seq[i - 1].replace(/^INCIDENT \d+: /, '')), 'twelve deaths in a row never repeat a line back to back'); }
ok(CO.incident('no-such-cause', 3, null).who === 'NIB', 'an unknown cause gets the generic report');
ok(CO.tally(0).includes('Zero') && CO.tally(3).includes('few') && CO.tally(9).includes('9 incidents') && CO.tally(30).includes('assistant'), "Nib's tally has four brackets");
ok(CO.tally(5).includes('few') && CO.tally(6).includes('blank forms') && CO.tally(15).includes('blank forms') && CO.tally(16).includes('quit'), 'and the brackets end at 0, 5, 15 and 16+');
console.log(JSON.stringify({ checks }));
