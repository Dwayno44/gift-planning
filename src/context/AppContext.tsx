import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import type { AppData, GiftIdea, Occasion, Person } from "../types";
import * as storage from "../data/storage";
import { sampleData } from "../data/sampleData";
import { makeId } from "../utils/id";
import { getFirebase, isFirebaseConfigured, getUserHouseholdId } from "../lib/firebase";
import type { HouseholdMeta } from "../lib/firebase";
import Login from "../components/Login";
import Onboarding from "../components/Onboarding";

// ---------------------------------------------------------------------------
// AppContext — single data-layer seam; two persistence modes:
//   local — no Firebase → per-device LocalStorage
//   cloud — Firebase → email+password auth + per-household Firestore doc
// ---------------------------------------------------------------------------

interface Session {
  mode: "local" | "cloud";
  email: string | null;
  signOut: () => void;
  householdName: string | null;
  inviteCode: string | null;
}

interface AppContextValue {
  people: Person[];
  archived: Person[];
  occasions: Occasion[];
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

  addOccasion: (data: Omit<Occasion, "id" | "giftIdeas">) => Occasion;
  updateOccasion: (id: string, patch: Partial<Occasion>) => void;
  archiveOccasion: (id: string) => void;
  deleteOccasion: (id: string) => void;
  addOccasionGiftIdea: (occasionId: string, idea: Omit<GiftIdea, "id" | "dateAdded">) => void;
  updateOccasionGiftIdea: (occasionId: string, ideaId: string, patch: Partial<GiftIdea>) => void;
  deleteOccasionGiftIdea: (occasionId: string, ideaId: string) => void;

  addTheme: (theme: string) => void;
  removeTheme: (theme: string) => void;

  exportData: () => string;
  importData: (json: string) => void;
  resetToSample: () => void;
  replaceAll: (data: AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MODE: "local" | "cloud" = isFirebaseConfigured() ? "cloud" : "local";

function fingerprint(d: AppData): string {
  return JSON.stringify({ people: d.people, themes: d.themes, occasions: d.occasions ?? [], appliedSeedIds: d.appliedSeedIds ?? [] });
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

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(MODE === "local");
  const [householdMeta, setHouseholdMeta] = useState<HouseholdMeta | null>(null);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(MODE === "local");
  const lastSyncedRef = useRef<string | null>(null);

  // --- Local persistence -----------------------------------------------------
  useEffect(() => {
    if (MODE !== "local") return;
    storage.save(data);
  }, [data]);

  // --- Cloud: authentication -------------------------------------------------
  useEffect(() => {
    if (MODE !== "cloud") return;
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        // Reset household state on sign-out
        setHouseholdMeta(null);
        setOnboardingNeeded(false);
        setCloudLoaded(false);
      }
    });
  }, []);

  // --- Cloud: resolve household for this user (runs when user changes) -------
  useEffect(() => {
    if (MODE !== "cloud" || !user) return;

    setHouseholdMeta(null);
    setOnboardingNeeded(false);
    setCloudLoaded(false);

    const resolveHousehold = async () => {
      const { db } = getFirebase();

      // Check for an existing userHousehold membership doc
      const hId = await getUserHouseholdId(user.uid);
      if (hId) {
        // Load the household metadata (name + invite code)
        const hSnap = await getDoc(doc(db, "households", hId));
        const hData = hSnap.data() ?? {};
        setHouseholdMeta({
          householdId: hId,
          name: hData.name ?? "Household",
          inviteCode: hData.inviteCode ?? "",
          adminUid: hData.adminUid ?? "",
        });
        return;
      }

      // No membership — check for a legacy "main" household this user can access.
      // The legacy Firestore rule still allows the original emails to read "main"
      // during the migration window, so a successful getDoc means they're legacy.
      try {
        const mainSnap = await getDoc(doc(db, "households", "main"));
        if (mainSnap.exists()) {
          const mainData = mainSnap.data();
          // Ensure the legacy doc has metadata
          let inviteCode: string = mainData.inviteCode ?? "";
          if (!inviteCode) {
            const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
            inviteCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            await updateDoc(doc(db, "households", "main"), {
              name: mainData.name ?? "Our Household",
              inviteCode,
              adminUid: user.uid,
            });
            await setDoc(doc(db, "inviteCodes", inviteCode), {
              householdId: "main",
              createdAt: new Date().toISOString(),
            });
          }
          // Create membership for this legacy user
          await setDoc(doc(db, "userHouseholds", user.uid), {
            householdId: "main",
            joinedAt: new Date().toISOString(),
          });
          setHouseholdMeta({
            householdId: "main",
            name: mainData.name ?? "Our Household",
            inviteCode,
            adminUid: mainData.adminUid ?? user.uid,
          });
          return;
        }
      } catch {
        // getDoc threw (permission denied) — not a legacy user
      }

      setOnboardingNeeded(true);
    };

    resolveHousehold();
  }, [user]);

  // --- Cloud: live subscription to household doc (runs when householdMeta changes) ---
  useEffect(() => {
    if (MODE !== "cloud" || !user || !householdMeta) return;
    const { db } = getFirebase();
    const ref = doc(db, "households", householdMeta.householdId);

    return onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          // Household was created empty (via createHousehold); seed with sample for legacy "main".
          if (householdMeta.householdId === "main") {
            const seeded = sampleData();
            lastSyncedRef.current = fingerprint(seeded);
            await setDoc(ref, { ...seeded, ...householdMeta }, { merge: true });
            setData(seeded);
          }
          setCloudLoaded(true);
          return;
        }
        const remote = storage.normalizeData(snap.data());
        // Only merge seed additions for the original household
        const merged = householdMeta.householdId === "main"
          ? storage.mergeSeedAdditions(remote)
          : remote;
        if (fingerprint(merged) !== fingerprint(remote)) {
          lastSyncedRef.current = fingerprint(merged);
          await setDoc(ref, merged, { merge: true });
        } else {
          lastSyncedRef.current = fingerprint(remote);
        }
        // Keep householdMeta in sync if name/inviteCode changed
        const d = snap.data();
        if (d.name || d.inviteCode) {
          setHouseholdMeta((prev) => prev ? {
            ...prev,
            name: d.name ?? prev.name,
            inviteCode: d.inviteCode ?? prev.inviteCode,
          } : prev);
        }
        setData(merged);
        setCloudLoaded(true);
      },
      (err) => console.error("Firestore subscription error", err)
    );
  }, [user, householdMeta?.householdId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Cloud: debounced write on local changes (skips remote echoes) ---------
  useEffect(() => {
    if (MODE !== "cloud" || !user || !cloudLoaded || !householdMeta) return;
    const fp = fingerprint(data);
    if (fp === lastSyncedRef.current) return;
    const { db } = getFirebase();
    const ref = doc(db, "households", householdMeta.householdId);
    const t = setTimeout(() => {
      lastSyncedRef.current = fp;
      // merge: true preserves household metadata fields (name, inviteCode, adminUid)
      setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true }).catch((e) =>
        console.error("Cloud save failed", e)
      );
    }, 600);
    return () => clearTimeout(t);
  }, [data, user, cloudLoaded, householdMeta]);

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

  const addOccasion = useCallback<AppContextValue["addOccasion"]>(
    (input) => {
      const occasion: Occasion = { ...input, id: makeId(), giftIdeas: [] };
      update((d) => ({ ...d, occasions: [...(d.occasions ?? []), occasion] }));
      return occasion;
    },
    [update]
  );

  const updateOccasion = useCallback<AppContextValue["updateOccasion"]>(
    (id, patch) => {
      update((d) => ({ ...d, occasions: (d.occasions ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
    },
    [update]
  );

  const archiveOccasion = useCallback((id: string) => updateOccasion(id, { archived: true }), [updateOccasion]);
  const deleteOccasion = useCallback<AppContextValue["deleteOccasion"]>(
    (id) => update((d) => ({ ...d, occasions: (d.occasions ?? []).filter((o) => o.id !== id) })),
    [update]
  );

  const addOccasionGiftIdea = useCallback<AppContextValue["addOccasionGiftIdea"]>(
    (occasionId, idea) => {
      const newIdea: GiftIdea = { ...idea, id: makeId(), dateAdded: new Date().toISOString().slice(0, 10) };
      update((d) => ({
        ...d,
        occasions: (d.occasions ?? []).map((o) =>
          o.id === occasionId ? { ...o, giftIdeas: [...o.giftIdeas, newIdea] } : o
        ),
      }));
    },
    [update]
  );

  const updateOccasionGiftIdea = useCallback<AppContextValue["updateOccasionGiftIdea"]>(
    (occasionId, ideaId, patch) => {
      update((d) => ({
        ...d,
        occasions: (d.occasions ?? []).map((o) =>
          o.id === occasionId
            ? { ...o, giftIdeas: o.giftIdeas.map((g) => (g.id === ideaId ? { ...g, ...patch } : g)) }
            : o
        ),
      }));
    },
    [update]
  );

  const deleteOccasionGiftIdea = useCallback<AppContextValue["deleteOccasionGiftIdea"]>(
    (occasionId, ideaId) => {
      update((d) => ({
        ...d,
        occasions: (d.occasions ?? []).map((o) =>
          o.id === occasionId ? { ...o, giftIdeas: o.giftIdeas.filter((g) => g.id !== ideaId) } : o
        ),
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
      occasions: (data.occasions ?? []).filter((o) => !o.archived),
      themes: data.themes,
      updatedAt: data.updatedAt,
      session: {
        mode: MODE,
        email: user?.email ?? null,
        signOut,
        householdName: householdMeta?.name ?? null,
        inviteCode: householdMeta?.inviteCode ?? null,
      },
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
      addOccasion,
      updateOccasion,
      archiveOccasion,
      deleteOccasion,
      addOccasionGiftIdea,
      updateOccasionGiftIdea,
      deleteOccasionGiftIdea,
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
      householdMeta,
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
      addOccasion,
      updateOccasion,
      archiveOccasion,
      deleteOccasion,
      addOccasionGiftIdea,
      updateOccasionGiftIdea,
      deleteOccasionGiftIdea,
      addTheme,
      removeTheme,
      exportData,
      importData,
      resetToSample,
      replaceAll,
    ]
  );

  // Cloud gating: auth → onboarding (if needed) → data load
  if (MODE === "cloud") {
    if (!authReady) return <Splash />;
    if (!user) return <Login />;
    if (onboardingNeeded) {
      return (
        <Onboarding
          user={user}
          onComplete={(meta) => {
            setHouseholdMeta(meta);
            setOnboardingNeeded(false);
          }}
        />
      );
    }
    if (!householdMeta || !cloudLoaded) return <Splash />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
