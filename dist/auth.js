/* Project Mayhem — Google sign-in and cloud saves (Firebase).
 *
 * Does nothing unless firebase-config.js holds a real config. When it does, it loads the Firebase SDK
 * (pinned version) on demand, keeps window.Mayhem in step with the signed-in player, and syncs progress to
 * players/{uid} in Firestore. The database holds only the progress record (no name, email or photo); the player's
 * first name is shown from the sign-in session and never written to it. Firebase Authentication itself keeps the
 * profile Google shares (name, email), visible to the project owner; see docs/login-setup.md.
 *
 * Sync rule: on sign-in, merge the cloud copy with what is on this device (best of each), keep the result on the
 * device, and write it back if the cloud copy was behind. So nothing earned as a guest is lost by signing in.
 */
(function () {
  'use strict';
  const M = window.Mayhem, P = window.MayhemProgress;
  if (!M || !P || !M.configured) return;

  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const cfg = window.MAYHEM_FIREBASE;
  let auth, db, fb, signedInUid = null;

  const ready = Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]).then(([app, a, f]) => {
    fb = { ...a, ...f };
    const inst = app.initializeApp(cfg);
    auth = a.getAuth(inst);
    db = f.getFirestore(inst);
    a.onAuthStateChanged(auth, onUser);
  }).catch(() => M.setBusy(false, 'Sign-in is unavailable right now. You can keep playing; progress is saved on this device.'));

  const docRef = uid => fb.doc(db, 'players', uid);

  async function onUser(user) {
    if (!user) { signedInUid = null; M.setCloud(null); M.setUser(null); return }
    signedInUid = user.uid;
    M.setCloud({ save: p => fb.setDoc(docRef(user.uid), { progress: p }) });
    M.setUser({ uid: user.uid, name: (user.displayName || 'Player').split(' ')[0] });
    try {
      const snap = await fb.getDoc(docRef(user.uid));
      const remote = snap.exists() ? snap.data().progress : null;
      const merged = M.mergeIn(remote);
      if (!P.same(merged, remote)) await fb.setDoc(docRef(user.uid), { progress: merged });
    } catch (e) {
      M.setBusy(false, 'Signed in, but your saved progress could not be reached. It is still kept on this device.');
    }
  }

  M.signIn = async function () {
    M.setBusy(true, '');
    try {
      await ready;
      if (!auth) return M.setBusy(false, 'Sign-in is unavailable right now.');
      await fb.signInWithPopup(auth, new fb.GoogleAuthProvider());
      M.setBusy(false, '');
    } catch (e) {
      const c = e && e.code;
      M.setBusy(false, c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' ? ''
        : c === 'auth/popup-blocked' ? 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.'
        : c === 'auth/unauthorized-domain' ? 'This site is not yet authorised for sign-in.'
        : 'Sign-in did not complete. Please try again.');
    }
  };

  M.signOut = async function () {
    try { await ready; if (auth) await fb.signOut(auth); } catch (e) { /* the state listener reports the result */ }
  };
})();
