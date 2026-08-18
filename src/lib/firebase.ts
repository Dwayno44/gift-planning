import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, writeBatch, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";
import { emptyData } from "../data/storage";

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

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured.");
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
  return { app, auth: auth!, db: db! };
}

// ---------------------------------------------------------------------------
// Invite code — 6 uppercase alphanumeric, excluding ambiguous chars (0/O, 1/I/L)
// ---------------------------------------------------------------------------
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ---------------------------------------------------------------------------
// Household lifecycle
// ---------------------------------------------------------------------------

export interface HouseholdMeta {
  householdId: string;
  name: string;
  inviteCode: string;
  adminUid: string;
}

/**
 * Create a brand-new household for this user. Writes three documents atomically:
 * households/{id}, userHouseholds/{uid}, inviteCodes/{code}.
 */
export async function createHousehold(uid: string, name: string): Promise<HouseholdMeta> {
  const { db } = getFirebase();
  const householdId = crypto.randomUUID();
  const inviteCode = generateInviteCode();
  const meta: HouseholdMeta = { householdId, name, inviteCode, adminUid: uid };
  const initial = emptyData();

  const batch = writeBatch(db);
  batch.set(doc(db, "households", householdId), {
    ...initial,
    name,
    inviteCode,
    adminUid: uid,
    createdAt: new Date().toISOString(),
  });
  batch.set(doc(db, "userHouseholds", uid), {
    householdId,
    joinedAt: new Date().toISOString(),
  });
  batch.set(doc(db, "inviteCodes", inviteCode), {
    householdId,
    createdAt: new Date().toISOString(),
  });
  await batch.commit();
  return meta;
}

/**
 * Join an existing household using a 6-char invite code.
 * Returns the householdId on success; throws a user-friendly error on failure.
 */
export async function joinHousehold(uid: string, rawCode: string): Promise<string> {
  const { db } = getFirebase();
  const code = rawCode.trim().toUpperCase();
  const codeSnap = await getDoc(doc(db, "inviteCodes", code));
  if (!codeSnap.exists()) {
    throw new Error("That code wasn't found. Double-check it and try again.");
  }
  const householdId = codeSnap.data().householdId as string;
  await setDoc(doc(db, "userHouseholds", uid), {
    householdId,
    joinedAt: new Date().toISOString(),
  });
  return householdId;
}

/**
 * Look up which household a user belongs to.
 * Returns null if they haven't completed onboarding yet.
 */
export async function getUserHouseholdId(uid: string): Promise<string | null> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "userHouseholds", uid));
  return snap.exists() ? (snap.data().householdId as string) : null;
}
