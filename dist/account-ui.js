/* Landing-page account widget and "best run" badges. Text is always set with textContent, never innerHTML. */
(function () {
  'use strict';
  const M = window.Mayhem, P = window.MayhemProgress;
  if (!M || !P) return;
  const $ = id => document.getElementById(id);
  const box = $('account'), signIn = $('signIn'), signOut = $('signOut'), user = $('acctUser'), name = $('acctName'),
    msg = $('acctMsg'), privacy = $('privacy'), nav = document.querySelector('.nav');

  if (signIn) signIn.addEventListener('click', () => { if (M.signIn) M.signIn() });
  if (signOut) signOut.addEventListener('click', () => { if (M.signOut) M.signOut() });

  function render(s) {
    // Accounts are off until a Firebase config is present; then this whole block stays hidden.
    const on = !!s.configured;
    if (box) box.hidden = !on;
    if (privacy) privacy.hidden = !on;
    if (nav) nav.classList.toggle('has-account', on);
    if (on) {
      if (user) user.hidden = !s.user;
      if (signIn) { signIn.hidden = !!s.user; signIn.disabled = !!s.busy }
      if (name && s.user) name.textContent = s.user.name;
    }
    if (msg) { msg.textContent = on ? s.message || '' : ''; msg.hidden = !(on && s.message) }

    // Best-run badges work for guests too: they read the device copy.
    for (const el of document.querySelectorAll('[data-level]')) {
      const id = el.getAttribute('data-level'), l = s.progress.levels[id], total = P.LEVELS[id] && P.LEVELS[id].cogs;
      if (l && l.completed) {
        el.textContent = 'Completed · best ' + P.fmtTime(l.bestTimeSec) + ' · ' + l.bestCogs + '/' + total + ' cogs';
        el.hidden = false;
      } else el.hidden = true;
    }
    // Level 3 opens once Levels 1 and 2 have banked more than 12 cogs. A locked button has no link to follow.
    const banked = P.bankedCogs(s.progress), open = P.level3Unlocked(s.progress);
    for (const a of document.querySelectorAll('[data-lock="level3"]')) {
      if (!a.hasAttribute('data-href')) a.setAttribute('data-href', a.getAttribute('href') || '');
      if (open) { a.setAttribute('href', a.getAttribute('data-href')); a.removeAttribute('aria-disabled') }
      else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true') }
      a.classList.toggle('locked', !open);
    }
    for (const n of document.querySelectorAll('[data-lock-note="level3"]')) {
      n.textContent = open ? '' : 'Locked. Bank more than 12 cogs in Levels 1 and 2 to open it (' + banked + ' so far).';
      n.hidden = open;
    }
  }
  M.subscribe(render);
})();
