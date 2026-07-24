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
  return { version: CURRENT_VERSION, people: [], occasions: [], themes: [], updatedAt: new Date().toISOString() };
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
    christmasGiftIdeas: Array.isArray(p.christmasGiftIdeas) ? p.christmasGiftIdeas : [],
  }));
  const occasions = Array.isArray(data.occasions)
    ? data.occasions.map((o) => ({ ...o, giftIdeas: Array.isArray(o.giftIdeas) ? o.giftIdeas : [] }))
    : [];

  return {
    version: CURRENT_VERSION,
    people,
    occasions,
    themes: Array.isArray(data.themes) ? data.themes : [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    appliedSeedIds: Array.isArray(data.appliedSeedIds) ? data.appliedSeedIds : undefined,
  };
}

/**
 * Additively merge brand-new seed entries into already-saved data. Existing
 * people are never touched (edits and gift ideas are preserved); a seed person
 * is only added if it has never been applied to this device AND isn't already
 * present. Seed ids the user later deletes stay deleted, because their id
 * remains recorded in appliedSeedIds.
 */
export function mergeSeedAdditions(data: AppData): AppData {
  const seed = sampleData();
  const applied = new Set(data.appliedSeedIds ?? []);
  const presentIds = new Set(data.people.map((p) => p.id));

  const newPeople = seed.people.filter((sp) => !presentIds.has(sp.id) && !applied.has(sp.id));
  const newThemes = seed.themes.filter((t) => !data.themes.includes(t));

  // Record every current seed id as applied so future loads don't re-add them.
  const appliedSeedIds = Array.from(new Set([...applied, ...seed.people.map((p) => p.id)]));

  return {
    ...data,
    people: newPeople.length ? [...data.people, ...newPeople] : data.people,
    themes: newThemes.length ? [...data.themes, ...newThemes] : data.themes,
    appliedSeedIds,
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
    // Existing device: keep everything the user has, but pull in any people
    // newly added to the seed since they last opened the app.
    const merged = mergeSeedAdditions(normalizeData(JSON.parse(raw)));
    save(merged);
    return merged;
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
