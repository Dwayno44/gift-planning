import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig, ALLOWED_EMAILS, HOUSEHOLD_ID } from "./firebaseConfig";

// True only once the placeholder config has been replaced with real values.
// When false, the whole app stays on local storage (no auth, no cloud) so the
// deployed site keeps working until Firebase is set up.
export function isFirebaseConfigured(): boolean {
  return (
    !!firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("REPLACE") &&
    !!firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("REPLACE")
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/** Lazily initialise and return the Firebase singletons. Throws if unconfigured. */
export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured — fill in src/lib/firebaseConfig.ts.");
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // ignoreUndefinedProperties: our forms produce optional fields as undefined
    // (e.g. relationship, birthYear); Firestore would otherwise reject them.
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
  return { app, auth: auth!, db: db! };
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}

export { ALLOWED_EMAILS, HOUSEHOLD_ID };
