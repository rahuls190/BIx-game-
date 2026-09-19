# Switching on sign-in and cloud saves

The game already keeps each player's best runs on their own device. This turns on optional Google sign-in so those
results follow a player between devices. Until you finish the steps below, none of it is visible: no sign-in button,
no requests to Google, nothing changes for players.

Cost: Firebase's free (Spark) plan is far more than this needs. You need a Google account.

## What gets stored, and where

- **In the game's database (Firestore):** per level, whether it was completed, the best time, the best cog count, the
  fewest falls and the number of plays. The record is filed under the player's Google account ID. No name, email or photo
  is written there, and the page shows the player's first name from the sign-in session without saving it.
- **In Firebase Authentication (the sign-in service):** Google shares the account's email address, display name and
  photo link when someone signs in, and Firebase keeps them in the project's **Authentication → Users** list, which you
  (the project owner) can see. Nothing in the game reads or uses the email. This is inherent to using Firebase sign-in,
  so the privacy line on the landing page says so.
- **Third parties:** only when accounts are on, the page loads Google's Firebase code from `gstatic.com` and talks to
  Google. Guests trigger none of this.
- These are personal saves, not a leaderboard: a player could edit their own record with browser tools, which only
  affects their own save. Don't build a public leaderboard on this data as it stands.

## Steps (about ten minutes)

1. Go to <https://console.firebase.google.com> and choose **Add project**. Name it anything, and you can switch
   Google Analytics off.
2. **Authentication → Get started → Sign-in method → Google → Enable.** Pick a support email and save.
3. **Authentication → Settings → Authorized domains → Add domain:** `rahuls190.github.io`.
   (`localhost` is already allowed, so you can test locally.) Without this, sign-in fails with "not yet authorised".
4. **Firestore Database → Create database.** Choose **production mode** and any region near your players.
5. **Firestore Database → Rules.** Replace everything with the contents of [`firestore.rules`](../firestore.rules) and **Publish**.
6. **Project settings (the cog) → Your apps → the `</>` Web icon → Register app.** Copy the `firebaseConfig` object it shows.
7. Open `dist/firebase-config.js` and replace `null` with that object, like this, then commit and push:

   ```js
   window.MAYHEM_FIREBASE = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     appId: "1:1234567890:web:abcdef"
   };
   ```

The config is not a secret: it is meant to be public. What protects the data is the authorised-domain list (step 3) and
the rules (step 5). Never put a service-account key, password or anything from a "private key" file in this repo.

## Checking it works

1. Open the site, click **Sign in with Google**, and finish the sign-in window. Your first name appears in the top bar.
2. Finish a level. The finish screen says **Saved to your account.** and the level card on the home page shows your best run.
3. Open the site on another device or browser, sign in, and the same best run is there.
4. In the Firebase console, **Firestore Database → Data → players** shows one record per signed-in player.

## Turning it off again

Set `window.MAYHEM_FIREBASE = null;` in `dist/firebase-config.js`. Saved data stays in Firestore until you delete it.
The rules allow a player to delete their own record, but the game has no button for that yet. You can delete any record from the console.

## How the merge works

When a player signs in, the copy on the device and the copy in the cloud are combined, keeping the best of each
(completed if either completed, the lower best time, the higher cog count, the lower fall count). The result is kept
on the device and written back if the cloud copy was behind, so anything earned as a guest is never lost by signing in.
The rules live in `dist/progress.js` and are covered by `tests/progress.cjs`.

## Known limits

- `firestore.rules` and the live sign-in flow can only be exercised against a real Firebase project (or the Firebase
  emulator). `tests/progress.cjs` checks the rules file's structure and that its numeric limits match the code, but it
  cannot run the rules. Do step 1 of "Checking it works" once after setup.
- Sign-in uses a pop-up window. A browser that blocks pop-ups shows a message asking the player to allow them.
