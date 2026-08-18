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
  apiKey: "AIzaSyDtVZ5UP1CBKVDT_KHMEtE_1Z1Lu-t9ijk",
  authDomain: "gift-planner-a342b.firebaseapp.com",
  projectId: "gift-planner-a342b",
  storageBucket: "gift-planner-a342b.firebasestorage.app",
  messagingSenderId: "315394503116",
  appId: "1:315394503116:web:8cf6d2af9744bfa652ad69",
};

// Only these email addresses may sign in and access the data. This is a
// convenience check for nicer UX; the REAL enforcement is in firestore.rules,
// which must list the same emails.
// No longer used — household membership is managed in Firestore, not a hardcoded list.
