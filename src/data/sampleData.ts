import type { AppData, Person } from "../types";
import { CURRENT_VERSION } from "./storage";

// Seed data used on first run (and by "Reset to sample data" in Settings).
// These are the household's real people; everyone starts with no gift ideas
// (status = red "No ideas yet") ready to be filled in throughout the year.

export const DEFAULT_THEMES = [
  "Books",
  "Experience",
  "Clothes",
  "Lego",
  "Gardening",
  "Food",
  "Tech",
  "Homeware",
  "Beauty",
  "Music",
];

const people: Person[] = [
  { id: "p-oscar", name: "Oscar", relationship: "child", birthday: "2019-05-27", birthYear: 2019, giftIdeas: [] },
  { id: "p-tilly", name: "Tilly", relationship: "child", birthday: "2020-12-07", birthYear: 2020, giftIdeas: [] },
  { id: "p-daisy", name: "Daisy", relationship: "child", birthday: "2025-10-23", birthYear: 2025, giftIdeas: [] },
  { id: "p-megan", name: "Megan", birthday: "1993-03-11", birthYear: 1993, giftIdeas: [] },
  // Dwayne's birth year intentionally omitted — "2026" was read as the upcoming
  // birthday, not a birth year (which would show "turning 0"). Add birthYear to track age.
  { id: "p-dwayne", name: "Dwayne", birthday: "2026-06-07", giftIdeas: [] },
  { id: "p-stretch", name: "Stretch", birthday: "1958-05-03", birthYear: 1958, giftIdeas: [] },
  { id: "p-yvonne", name: "Yvonne", birthday: "1957-06-15", birthYear: 1957, giftIdeas: [] },
  { id: "p-renae", name: "Renae", birthday: "1986-01-17", birthYear: 1986, giftIdeas: [] },
  { id: "p-jake", name: "Jake", birthday: "1991-06-04", birthYear: 1991, giftIdeas: [] },
  { id: "p-carol", name: "Carol", birthday: "1967-01-07", birthYear: 1967, giftIdeas: [] },
  { id: "p-steve", name: "Steve", birthday: "1963-09-13", birthYear: 1963, giftIdeas: [] },
  { id: "p-brett", name: "Brett", birthday: "1989-01-29", birthYear: 1989, giftIdeas: [] },
  { id: "p-mat", name: "Mat", birthday: "1984-03-20", birthYear: 1984, giftIdeas: [] },
  { id: "p-jy", name: "Jy", relationship: "child", birthday: "2009-01-14", birthYear: 2009, giftIdeas: [] },
  { id: "p-beau", name: "Beau", relationship: "child", birthday: "2011-04-08", birthYear: 2011, giftIdeas: [] },
  { id: "p-ella", name: "Ella", relationship: "child", birthday: "2012-09-18", birthYear: 2012, giftIdeas: [] },
];

export function sampleData(): AppData {
  return {
    version: CURRENT_VERSION,
    people: people.map((p) => ({ ...p, giftIdeas: p.giftIdeas.map((g) => ({ ...g })) })),
    themes: [...DEFAULT_THEMES],
    updatedAt: new Date().toISOString(),
    appliedSeedIds: people.map((p) => p.id),
  };
}
