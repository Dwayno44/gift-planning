import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import type { AppData, GiftIdea, Person } from "../types";
import * as storage from "../data/storage";
import { sampleData } from "../data/sampleData";
import { makeId } from "../utils/id";
import { getFirebase, isEmailAllowed, isFirebaseConfigured, HOUSEHOLD_ID } from "../lib/firebase";
import Login from "../components/Login";

// ---------------------------------------------------------------------------
// AppContext is the app's single data-layer seam. Components never touch
// storage directly — they go through here.
//
// Two persistence modes, chosen once at startup:
//   • local — Firebase not configured → per-device LocalStorage (original behaviour).
//   • cloud — Firebase configured → email-link auth + a shared Firestore document
//             that syncs live across every signed-in device.
// The component-facing API is identical in both modes.
// ---------------------------------------------------------------------------

interface Session {
  mode: "local" | "cloud";
  email: string | null;
  signOut: () => void;
}

interface AppContextValue {
  people: Person[];
  archived: Person[];
  themes: string[];
  updatedAt: string;
  session: Session;

  addPerson: (data: Omit<Person, "id" | "giftIdeas">) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  archivePerson: (id: string) => void;
  restorePerson: (id: string) => void;
  deletePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;

  addGiftIdea: (personId: string, idea: Omit<GiftIdea, "id" | "dateAdded">) => void;
  updateGiftIdea: (personId: string, ideaId: string, patch: Partial<GiftIdea>) => void;
  deleteGiftIdea: (personId: string, ideaId: string) => void;

  addChristmasGiftIdea: (personId: string, idea: Omit<GiftIdea, "id" | "dateAdded">) => void;
  updateChristmasGiftIdea: (personId: string, ideaId: string, patch: Partial<GiftIdea>) => void;
  deleteChristmasGiftIdea: (personId: string, ideaId: string) => void;
  carryOverBirthdayIdeas: (personId: string) => void;

  addTheme: (theme: string) => void;
  removeTheme: (theme: string) => void;

  exportData: () => string;
  importData: (json: string) => void;
  resetToSample: () => void;
  replaceAll: (data: AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MODE: "local" | "cloud" = isFirebaseConfigured() ? "cloud" : "local";
const HOUSEHOLD_PATH = ["households", HOUSEHOLD_ID] as const;

/** Content fingerprint that ignores volatile fields (updatedAt/version), used
 *  to skip echo-writes when a change actually came from a remote snapshot. */
function fingerprint(d: AppData): string {
  return JSON.stringify({ people: d.people, themes: d.themes, appliedSeedIds: d.appliedSeedIds ?? [] });
}

function Splash() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center text-muted">
        <p className="text-3xl">🎁</p>
        <p className="mt-2 text-sm">Loading…</p>
      </div>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() =>
    MODE === "local" ? storage.load() : storage.emptyData()
  );

  // Cloud-only auth/loading state. In local mode these start "ready".
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(MODE === "local");
  const [cloudLoaded, setCloudLoaded] = useState(MODE === "local");
  const lastSyncedRef = useRef<string | null>(null);

  // --- Local persistence -----------------------------------------------------
  useEffect(() => {
    if (MODE !== "local") return;
    storage.save(data);
  }, [data]);

  // --- Cloud: authentication -------------------------------------------------
  // Firebase persists the session (local persistence) so this restores the
  // signed-in user automatically on reload — no re-login per visit.
  useEffect(() => {
    if (MODE !== "cloud") return;
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, (u) => {
      if (u && !isEmailAllowed(u.email)) {
        // Authenticated but not on the household allow-list — reject.
        fbSignOut(auth);
        setUser(null);
      } else {
        setUser(u);
      }
      setAuthReady(true);
    });
  }, []);

  // --- Cloud: live subscription to the shared household document -------------
  useEffect(() => {
    if (MODE !== "cloud" || !user) return;
    const { db } = getFirebase();
    const ref = doc(db, ...HOUSEHOLD_PATH);

    return onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          // First ever sign-in: seed the shared document.
          const seeded = sampleData();
          lastSyncedRef.current = fingerprint(seeded);
          await setDoc(ref, seeded);
          setData(seeded);
          setCloudLoaded(true);
          return;
        }
        const remote = storage.normalizeData(snap.data());
        const merged = storage.mergeSeedAdditions(remote);
        if (fingerprint(merged) !== fingerprint(remote)) {
          // New seed people were added since last time — persist the merge.
          lastSyncedRef.current = fingerprint(merged);
          await setDoc(ref, merged);
        } else {
          lastSyncedRef.current = fingerprint(remote);
        }
        setData(merged);
        setCloudLoaded(true);
      },
      (err) => console.error("Firestore subscription error", err)
    );
  }, [user]);

  // --- Cloud: debounced write on local changes (skips remote echoes) ---------
  useEffect(() => {
    if (MODE !== "cloud" || !user || !cloudLoaded) return;
    const fp = fingerprint(data);
    if (fp === lastSyncedRef.current) return;
    const { db } = getFirebase();
    const ref = doc(db, ...HOUSEHOLD_PATH);
    const t = setTimeout(() => {
      lastSyncedRef.current = fp;
      setDoc(ref, { ...data, updatedAt: new Date().toISOString() }).catch((e) =>
        console.error("Cloud save failed", e)
      );
    }, 600);
    return () => clearTimeout(t);
  }, [data, user, cloudLoaded]);

  // --- Mutations (identical in both modes) -----------------------------------
  const update = useCallback((mutate: (draft: AppData) => AppData) => {
    setData((prev) => mutate(prev));
  }, []);

  const addPerson = useCallback<AppContextValue["addPerson"]>(
    (input) => {
      const person: Person = { ...input, id: makeId(), giftIdeas: [] };
      update((d) => ({ ...d, people: [...d.people, person] }));
      return person;
    },
    [update]
  );

  const updatePerson = useCallback<AppContextValue["updatePerson"]>(
    (id, patch) => {
      update((d) => ({ ...d, people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    },
    [update]
  );

  const archivePerson = useCallback((id: string) => updatePerson(id, { archived: true }), [updatePerson]);
  const restorePerson = useCallback((id: string) => updatePerson(id, { archived: false }), [updatePerson]);

  const deletePerson = useCallback<AppContextValue["deletePerson"]>(
    (id) => update((d) => ({ ...d, people: d.people.filter((p) => p.id !== id) })),
    [update]
  );

  const addGiftIdea = useCallback<AppContextValue["addGiftIdea"]>(
    (personId, idea) => {
      const newIdea: GiftIdea = { ...idea, id: makeId(), dateAdded: new Date().toISOString().slice(0, 10) };
      update((d) => ({
        ...d,
        people: d.people.map((p) => (p.id === personId ? { ...p, giftIdeas: [...p.giftIdeas, newIdea] } : p)),
      }));
    },
    [update]
  );

  const updateGiftIdea = useCallback<AppContextValue["updateGiftIdea"]>(
    (personId, ideaId, patch) => {
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId
            ? { ...p, giftIdeas: p.giftIdeas.map((g) => (g.id === ideaId ? { ...g, ...patch } : g)) }
            : p
        ),
      }));
    },
    [update]
  );

  const deleteGiftIdea = useCallback<AppContextValue["deleteGiftIdea"]>(
    (personId, ideaId) => {
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId ? { ...p, giftIdeas: p.giftIdeas.filter((g) => g.id !== ideaId) } : p
        ),
      }));
    },
    [update]
  );

  const addChristmasGiftIdea = useCallback<AppContextValue["addChristmasGiftIdea"]>(
    (personId, idea) => {
      const newIdea: GiftIdea = { ...idea, id: makeId(), dateAdded: new Date().toISOString().slice(0, 10) };
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId ? { ...p, christmasGiftIdeas: [...(p.christmasGiftIdeas ?? []), newIdea] } : p
        ),
      }));
    },
    [update]
  );

  const updateChristmasGiftIdea = useCallback<AppContextValue["updateChristmasGiftIdea"]>(
    (personId, ideaId, patch) => {
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId
            ? { ...p, christmasGiftIdeas: (p.christmasGiftIdeas ?? []).map((g) => (g.id === ideaId ? { ...g, ...patch } : g)) }
            : p
        ),
      }));
    },
    [update]
  );

  const deleteChristmasGiftIdea = useCallback<AppContextValue["deleteChristmasGiftIdea"]>(
    (personId, ideaId) => {
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId
            ? { ...p, christmasGiftIdeas: (p.christmasGiftIdeas ?? []).filter((g) => g.id !== ideaId) }
            : p
        ),
      }));
    },
    [update]
  );

  const carryOverBirthdayIdeas = useCallback<AppContextValue["carryOverBirthdayIdeas"]>(
    (personId) => {
      update((d) => ({
        ...d,
        people: d.people.map((p) => {
          if (p.id !== personId) return p;
          const existingTitles = new Set((p.christmasGiftIdeas ?? []).map((i) => i.title.toLowerCase()));
          const toCarry = (p.giftIdeas ?? [])
            .filter((i) => i.status !== "rejected" && !existingTitles.has(i.title.toLowerCase()))
            .map((i) => ({ ...i, id: makeId(), status: "idea" as const, dateAdded: new Date().toISOString().slice(0, 10) }));
          return { ...p, christmasGiftIdeas: [...(p.christmasGiftIdeas ?? []), ...toCarry] };
        }),
      }));
    },
    [update]
  );

  const addTheme = useCallback<AppContextValue["addTheme"]>(
    (theme) => {
      const t = theme.trim();
      if (!t) return;
      update((d) => (d.themes.includes(t) ? d : { ...d, themes: [...d.themes, t] }));
    },
    [update]
  );

  const removeTheme = useCallback<AppContextValue["removeTheme"]>(
    (theme) => update((d) => ({ ...d, themes: d.themes.filter((t) => t !== theme) })),
    [update]
  );

  const exportData = useCallback(() => storage.exportJSON(data), [data]);
  const replaceAll = useCallback<AppContextValue["replaceAll"]>((next) => setData(storage.normalizeData(next)), []);
  const importData = useCallback<AppContextValue["importData"]>((json) => setData(storage.importJSON(json)), []);
  const resetToSample = useCallback(() => {
    const seeded = sampleData();
    setData(seeded);
    if (MODE === "local") storage.save(seeded);
  }, []);
  const getPerson = useCallback((id: string) => data.people.find((p) => p.id === id), [data.people]);

  const signOut = useCallback(() => {
    if (MODE === "cloud") fbSignOut(getFirebase().auth);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      people: data.people.filter((p) => !p.archived),
      archived: data.people.filter((p) => p.archived),
      themes: data.themes,
      updatedAt: data.updatedAt,
      session: { mode: MODE, email: user?.email ?? null, signOut },
      addPerson,
      updatePerson,
      archivePerson,
      restorePerson,
      deletePerson,
      getPerson,
      addGiftIdea,
      updateGiftIdea,
      deleteGiftIdea,
      addChristmasGiftIdea,
      updateChristmasGiftIdea,
      deleteChristmasGiftIdea,
      carryOverBirthdayIdeas,
      addTheme,
      removeTheme,
      exportData,
      importData,
      resetToSample,
      replaceAll,
    }),
    [
      data,
      user,
      signOut,
      addPerson,
      updatePerson,
      archivePerson,
      restorePerson,
      deletePerson,
      getPerson,
      addGiftIdea,
      updateGiftIdea,
      deleteGiftIdea,
      addChristmasGiftIdea,
      updateChristmasGiftIdea,
      deleteChristmasGiftIdea,
      carryOverBirthdayIdeas,
      addTheme,
      removeTheme,
      exportData,
      importData,
      resetToSample,
      replaceAll,
    ]
  );

  // Cloud gating: wait for auth, require sign-in, then wait for first data load.
  if (MODE === "cloud") {
    if (!authReady) return <Splash />;
    if (!user) return <Login />;
    if (!cloudLoaded) return <Splash />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
