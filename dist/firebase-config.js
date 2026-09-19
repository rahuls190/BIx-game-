/* Firebase web config for sign-in and cloud saves.
 *
 * Leave this as `null` and Project Mayhem runs exactly as before: no sign-in button, no network calls to
 * Google, progress kept on the device only.
 *
 * To switch sign-in on, follow docs/login-setup.md, then replace `null` below with the object Firebase shows you
 * under Project settings -> Your apps -> Web app -> "SDK setup and configuration". It looks like this:
 *
 *   window.MAYHEM_FIREBASE = {
 *     apiKey: "AIza...",
 *     authDomain: "your-project.firebaseapp.com",
 *     projectId: "your-project",
 *     appId: "1:1234567890:web:abcdef"
 *   };
 *
 * These values are NOT secrets. A Firebase web config is meant to be public; what protects the data is the
 * list of authorised domains in the Firebase console and firestore.rules, which lets each player read and write
 * only their own record. Never put a service-account key or any password in this file.
 */
window.MAYHEM_FIREBASE = null;
