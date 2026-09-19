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
  }
  M.subscribe(render);
})();
