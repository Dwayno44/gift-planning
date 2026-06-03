// ---------------------------------------------------------------------------
// Firebase configuration.
//
// These values are SAFE to commit and expose publicly — a Firebase web config
// is not a secret. Access is controlled entirely by Firebase Auth + the
// Firestore security rules (see firestore.rules), NOT by hiding these values.
//
// To activate cloud sync, replace the REPLACE_ME values with your project's
// config from: Firebase console → Project settings (gear) → General →
// "Your apps" → Web app → SDK setup and configuration → "Config".
//
// Until real values are filled in, the app automatically falls back to local
// (per-device) storage, exactly as before — so this file is safe to ship.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// Only these email addresses may sign in and access the data. This is a
// convenience check for nicer UX; the REAL enforcement is in firestore.rules,
// which must list the same emails.
export const ALLOWED_EMAILS: string[] = [
  "smithdk44@gmail.com",
  // "wife@example.com",  // <- add the second person's email here
];

// The single shared household document all signed-in users read/write.
export const HOUSEHOLD_ID = "main";
