import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppData, GiftIdea, Person } from "../types";
import * as storage from "../data/storage";
import { makeId } from "../utils/id";

// ---------------------------------------------------------------------------
// AppContext is the app's data layer seam. Components never import storage
// directly — they call these methods. This keeps people OUT of the UI
// components (no hardcoded data) and makes a future cloud backend a localised
// change inside this provider + storage.ts.
// ---------------------------------------------------------------------------

interface AppContextValue {
  people: Person[]; // active (non-archived) people
  archived: Person[];
  themes: string[];
  updatedAt: string;

  // People
  addPerson: (data: Omit<Person, "id" | "giftIdeas">) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  archivePerson: (id: string) => void;
  restorePerson: (id: string) => void;
  deletePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;

  // Gift ideas
  addGiftIdea: (personId: string, idea: Omit<GiftIdea, "id" | "dateAdded">) => void;
  updateGiftIdea: (personId: string, ideaId: string, patch: Partial<GiftIdea>) => void;
  deleteGiftIdea: (personId: string, ideaId: string) => void;

  // Themes
  addTheme: (theme: string) => void;
  removeTheme: (theme: string) => void;

  // Data management
  exportData: () => string;
  importData: (json: string) => void;
  resetToSample: () => void;
  replaceAll: (data: AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storage.load());

  // Persist on every change. (A debounce could be added for a cloud backend.)
  useEffect(() => {
    storage.save(data);
  }, [data]);

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
      update((d) => ({
        ...d,
        people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [update]
  );

  const archivePerson = useCallback(
    (id: string) => updatePerson(id, { archived: true }),
    [updatePerson]
  );
  const restorePerson = useCallback(
    (id: string) => updatePerson(id, { archived: false }),
    [updatePerson]
  );

  const deletePerson = useCallback<AppContextValue["deletePerson"]>(
    (id) => {
      update((d) => ({ ...d, people: d.people.filter((p) => p.id !== id) }));
    },
    [update]
  );

  const addGiftIdea = useCallback<AppContextValue["addGiftIdea"]>(
    (personId, idea) => {
      const newIdea: GiftIdea = {
        ...idea,
        id: makeId(),
        dateAdded: new Date().toISOString().slice(0, 10),
      };
      update((d) => ({
        ...d,
        people: d.people.map((p) =>
          p.id === personId ? { ...p, giftIdeas: [...p.giftIdeas, newIdea] } : p
        ),
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
            ? {
                ...p,
                giftIdeas: p.giftIdeas.map((g) => (g.id === ideaId ? { ...g, ...patch } : g)),
              }
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
          p.id === personId
            ? { ...p, giftIdeas: p.giftIdeas.filter((g) => g.id !== ideaId) }
            : p
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

  const replaceAll = useCallback<AppContextValue["replaceAll"]>(
    (next) => setData(storage.normalizeData(next)),
    []
  );

  const importData = useCallback<AppContextValue["importData"]>(
    (json) => setData(storage.importJSON(json)),
    []
  );

  const resetToSample = useCallback(() => setData(storage.resetToSample()), []);

  const getPerson = useCallback((id: string) => data.people.find((p) => p.id === id), [data.people]);

  const value = useMemo<AppContextValue>(
    () => ({
      people: data.people.filter((p) => !p.archived),
      archived: data.people.filter((p) => p.archived),
      themes: data.themes,
      updatedAt: data.updatedAt,
      addPerson,
      updatePerson,
      archivePerson,
      restorePerson,
      deletePerson,
      getPerson,
      addGiftIdea,
      updateGiftIdea,
      deleteGiftIdea,
      addTheme,
      removeTheme,
      exportData,
      importData,
      resetToSample,
      replaceAll,
    }),
    [
      data,
      addPerson,
      updatePerson,
      archivePerson,
      restorePerson,
      deletePerson,
      getPerson,
      addGiftIdea,
      updateGiftIdea,
      deleteGiftIdea,
      addTheme,
      removeTheme,
      exportData,
      importData,
      resetToSample,
      replaceAll,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
