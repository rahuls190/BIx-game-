/* Project Mayhem — player progress.
 *
 * Loaded by the landing page and both level pages. It has NO network code: it keeps each player's best
 * results on the device (localStorage), and exposes window.Mayhem, which auth.js extends with Google
 * sign-in and cloud sync when a Firebase config is present (see docs/login-setup.md).
 *
 * Every value that reaches storage or the cloud goes through sanitize(), so junk or hand-edited data can
 * never produce an out-of-range record. The same limits are enforced server-side in firestore.rules;
 * tests/progress.cjs checks the two stay in step.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MayhemProgress = api; root.Mayhem = api.makeMayhem(safeStorage(root)); }
  function safeStorage(r) { try { return r.localStorage || null } catch (e) { return null } }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const KEY = 'mayhem.progress.v1';
  const LEVELS = { level1: { cogs: 12 }, level2: { cogs: 14 }, level3: { cogs: 12 }, level4: { cogs: 12 }, level5: { cogs: 15 }, level6: { cogs: 15 } };
  const ORDER = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6'];       // play order: cogs banked in every earlier level carry forward into the next
  const MAX_TIME = 86399, MAX_FALLS = 9999, MAX_PLAYS = 1000000;
  const LEVEL3_UNLOCK_COGS = 13;      // Level 3 opens once Levels 1 and 2 have banked MORE than 12 cogs between them
  const LEVEL4_UNLOCK_COGS = 19;      // Level 4 opens once Levels 1 to 3 have banked 19 of their 38 cogs (half, as Level 3 asks 13 of 26)
  const LEVEL5_UNLOCK_COGS = 25;
  const LEVEL6_UNLOCK_COGS = 33;      // Level 6 opens once Levels 1 to 5 have carried 33 of their 65 cogs      // Level 5 opens once Levels 1 to 4 have carried 25 of their 50 cogs

  const int = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= lo && v <= hi) ? v : null;

  function emptyLevel() { return { completed: false, bestTimeSec: null, bestCogs: 0, fewestFalls: null, plays: 0 }; }
  function emptyProgress() {
    const levels = {};
    for (const id of Object.keys(LEVELS)) levels[id] = emptyLevel();
    return { v: 1, levels, updatedAt: 0 };
  }

  // Force any input into a valid record. Unknown levels and fields are dropped, numbers clamped or nulled.
  function sanitize(raw) {
    const out = emptyProgress();
    if (!raw || typeof raw !== 'object') return out;
    const src = raw.levels && typeof raw.levels === 'object' ? raw.levels : {};
    for (const [id, cfg] of Object.entries(LEVELS)) {
      const l = src[id];
      if (!l || typeof l !== 'object') continue;
      out.levels[id] = {
        completed: l.completed === true,
        bestTimeSec: int(l.bestTimeSec, 1, MAX_TIME),
        bestCogs: int(l.bestCogs, 0, cfg.cogs) ?? 0,
        fewestFalls: int(l.fewestFalls, 0, MAX_FALLS),
        plays: int(l.plays, 0, MAX_PLAYS) ?? 0,
      };
    }
    out.updatedAt = int(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER) ?? 0;
    return out;
  }

  const minOf = (a, b) => a == null ? b : b == null ? a : Math.min(a, b);

  // Combine two records, keeping the best of each. Order does not matter, and merging a record with itself changes nothing.
  function merge(a, b) {
    const x = sanitize(a), y = sanitize(b), out = emptyProgress();
    for (const id of Object.keys(LEVELS)) {
      const p = x.levels[id], q = y.levels[id];
      out.levels[id] = {
        completed: p.completed || q.completed,
        bestTimeSec: minOf(p.bestTimeSec, q.bestTimeSec),
        bestCogs: Math.max(p.bestCogs, q.bestCogs),
        fewestFalls: minOf(p.fewestFalls, q.fewestFalls),
        plays: Math.max(p.plays, q.plays),
      };
    }
    out.updatedAt = Math.max(x.updatedAt, y.updatedAt);
    return out;
  }

  // Record one finished run. Unknown levels and nonsense results are ignored rather than stored.
  function applyResult(progress, levelId, result, now) {
    const base = sanitize(progress);
    const cfg = LEVELS[levelId];
    if (!cfg || !result) return base;
    const time = int(Math.floor(Number(result.timeSec)), 1, MAX_TIME);
    const cogs = int(Math.floor(Number(result.cogs)), 0, cfg.cogs);
    const falls = int(Math.floor(Number(result.falls)), 0, MAX_FALLS);
    if (time == null || cogs == null || falls == null) return base;
    const l = base.levels[levelId];
    l.completed = true;
    l.bestTimeSec = minOf(l.bestTimeSec, time);
    l.bestCogs = Math.max(l.bestCogs, cogs);
    l.fewestFalls = minOf(l.fewestFalls, falls);
    l.plays = Math.min(MAX_PLAYS, l.plays + 1);
    base.updatedAt = int(now, 0, Number.MAX_SAFE_INTEGER) ?? base.updatedAt;
    return base;
  }

  // Banked cogs = the best cog count recorded in Level 1 plus Level 2 (0..26). It sets the Level 3 shield tier and unlocks Level 3.
  function bankedCogs(progress) { const p = sanitize(progress); return p.levels.level1.bestCogs + p.levels.level2.bestCogs; }
  const level3Unlocked = progress => bankedCogs(progress) >= LEVEL3_UNLOCK_COGS;

  // Cogs carry forward: everything banked in the levels BEFORE `levelId` (the sum of each level's best, so replaying can never lower it).
  // Level 2 -> 0..12, Level 3 -> 0..26 (same as bankedCogs), Level 4 -> 0..38, Level 5 -> 0..50.
  function carriedCogs(progress, levelId) {
    const p = sanitize(progress), at = ORDER.indexOf(levelId);
    if (at < 0) return 0;
    return ORDER.slice(0, at).reduce((n, id) => n + p.levels[id].bestCogs, 0);
  }
  const carriedMax = levelId => ORDER.slice(0, Math.max(0, ORDER.indexOf(levelId))).reduce((n, id) => n + LEVELS[id].cogs, 0);
  const level4Unlocked = progress => carriedCogs(progress, 'level4') >= LEVEL4_UNLOCK_COGS;
  const level5Unlocked = progress => carriedCogs(progress, 'level5') >= LEVEL5_UNLOCK_COGS;
  const level6Unlocked = progress => carriedCogs(progress, 'level6') >= LEVEL6_UNLOCK_COGS;

  const same = (a, b) => JSON.stringify(sanitize(a)) === JSON.stringify(sanitize(b));

  // A Firebase web config is public by design, but a placeholder or empty one must never switch sign-in on.
  function isConfigured(cfg) {
    return !!cfg && typeof cfg === 'object' && ['apiKey', 'authDomain', 'projectId', 'appId'].every(k =>
      typeof cfg[k] === 'string' && cfg[k].length > 3 && !/^(YOUR|PASTE|REPLACE)/i.test(cfg[k]));
  }

  function fmtTime(sec) {
    if (sec == null) return '';
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }

  // The app object. `storage` is anything with getItem/setItem (localStorage, or a fake in tests).
  function makeMayhem(storage, cfg) {
    const listeners = new Set();
    let progress = load();
    const M = {
      configured: isConfigured(cfg !== undefined ? cfg : (typeof window !== 'undefined' ? window.MAYHEM_FIREBASE : null)),
      user: null,          // { uid, name } once signed in
      cloud: null,         // { save(progress) -> Promise }, set by auth.js while signed in
      busy: false,
      message: '',         // last sign-in problem, for the UI
      getProgress() { return sanitize(progress) },
      subscribe(fn) { listeners.add(fn); try { fn(snapshot()) } catch (e) { /* a faulty listener must not break the caller */ } return () => listeners.delete(fn) },
      setUser(u) { M.user = u; notify() },
      setCloud(c) { M.cloud = c },
      setBusy(b, msg) { M.busy = !!b; M.message = msg || ''; notify() },
      // Fold the cloud copy into the device copy. Returns the merged record (the caller writes it back if it differs).
      mergeIn(remote) { progress = merge(progress, remote); persist(); notify(); return sanitize(progress) },
      // Always resolves with a short line for the finish screen ('' means: say nothing).
      recordResult(levelId, result) {
        progress = applyResult(progress, levelId, result, Date.now());
        persist(); notify();
        if (M.cloud) {
          return M.cloud.save(sanitize(progress)).then(() => 'Saved to your account.',
            () => 'Saved on this device. Could not reach your account just now.');
        }
        return Promise.resolve(M.configured ? 'Saved on this device. Sign in from the home page to keep your progress on every device.' : '');
      },
    };
    function snapshot() { return { user: M.user, progress: sanitize(progress), configured: M.configured, busy: M.busy, message: M.message } }
    function notify() { const s = snapshot(); listeners.forEach(fn => { try { fn(s) } catch (e) { /* one bad listener must not stop the rest */ } }) }
    function load() {
      try { return sanitize(JSON.parse(storage && storage.getItem(KEY))) } catch (e) { return emptyProgress() }
    }
    function persist() { try { storage && storage.setItem(KEY, JSON.stringify(sanitize(progress))) } catch (e) { /* private mode / full: keep playing */ } }
    return M;
  }

  return { KEY, LEVELS, ORDER, LEVEL3_UNLOCK_COGS, LEVEL4_UNLOCK_COGS, LEVEL5_UNLOCK_COGS, LEVEL6_UNLOCK_COGS, bankedCogs, level3Unlocked, carriedCogs, carriedMax, level4Unlocked, level5Unlocked, level6Unlocked, emptyProgress, sanitize, merge, applyResult, same, isConfigured, fmtTime, makeMayhem };
});
