import type { AppData, Person } from "../types";
import { sampleData } from "./sampleData";

// ---------------------------------------------------------------------------
// Data access layer.
//
// This is the ONLY module that talks to the persistence backend. The rest of
// the app goes through the AppContext, which goes through here. Swapping
// LocalStorage for IndexedDB, Supabase, Firebase, etc. means changing only
// `load` / `save` below — the async-friendly signatures are intentional.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "gift-planner:data";
export const CURRENT_VERSION = 1;

export function emptyData(): AppData {
  return { version: CURRENT_VERSION, people: [], themes: [], updatedAt: new Date().toISOString() };
}

/** Basic shape validation + light migration hook for imported/old data. */
export function normalizeData(input: unknown): AppData {
  const data = input as Partial<AppData> | null;
  if (!data || !Array.isArray(data.people)) {
    throw new Error("This file doesn't look like Gift Planner data.");
  }
  const people: Person[] = data.people.map((p) => ({
    ...p,
    giftIdeas: Array.isArray(p.giftIdeas) ? p.giftIdeas : [],
    themes: Array.isArray(p.themes) ? p.themes : [],
  }));
  return {
    version: CURRENT_VERSION,
    people,
    themes: Array.isArray(data.themes) ? data.themes : [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

/** Load saved data, falling back to seeded sample data on first run. */
export function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = sampleData();
      save(seeded);
      return seeded;
    }
    return normalizeData(JSON.parse(raw));
  } catch (err) {
    console.warn("Failed to load saved data, starting fresh.", err);
    return sampleData();
  }
}

export function save(data: AppData): void {
  const toStore: AppData = { ...data, version: CURRENT_VERSION, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

/** Pretty-printed JSON for the export feature. */
export function exportJSON(data: AppData): string {
  return JSON.stringify({ ...data, version: CURRENT_VERSION }, null, 2);
}

/** Parse + validate an imported JSON string. Throws on malformed input. */
export function importJSON(text: string): AppData {
  return normalizeData(JSON.parse(text));
}

export function resetToSample(): AppData {
  const seeded = sampleData();
  save(seeded);
  return seeded;
}
