import type { AppData, Person } from "../types";
import { CURRENT_VERSION } from "./storage";

// Realistic-but-fake seed data. Birthdays are spread across the year, with a
// few intentionally placed in the next 4–6 weeks so the Weekly Digest has
// something to show on first run. No real personal information.

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
  {
    id: "p-rose",
    name: "Grandma Rose",
    relationship: "parent",
    birthday: "1955-06-09",
    birthYear: 1955,
    themes: ["Gardening", "Books"],
    notes: "Loves her roses and a good crime novel.",
    budget: 60,
    giftIdeas: [], // intentionally empty → RED, and it's urgent
  },
  {
    id: "p-liam",
    name: "Liam",
    relationship: "friend",
    birthday: "1992-06-22",
    birthYear: 1992,
    themes: ["Tech", "Music"],
    giftIdeas: [
      {
        id: "g-liam-1",
        title: "Wireless earbuds",
        theme: "Tech",
        notes: "His old ones are dying.",
        priority: "medium",
        status: "idea",
        dateAdded: "2026-02-11",
      },
      {
        id: "g-liam-2",
        title: "Vinyl record — favourite band",
        theme: "Music",
        priority: "low",
        status: "idea",
        dateAdded: "2026-03-02",
      },
    ],
  },
  {
    id: "p-maya",
    name: "Maya",
    relationship: "child",
    birthday: "2018-07-04",
    birthYear: 2018,
    themes: ["Lego", "Books"],
    notes: "Into space and dinosaurs.",
    budget: 40,
    giftIdeas: [
      {
        id: "g-maya-1",
        title: "Lego space shuttle set",
        theme: "Lego",
        purchaseUrl: "https://www.lego.com/",
        estimatedPrice: 35,
        store: "Lego",
        priority: "high",
        status: "shortlisted",
        dateAdded: "2026-04-18",
      },
      {
        id: "g-maya-2",
        title: "Glow-in-the-dark star stickers",
        theme: "Homeware",
        estimatedPrice: 12,
        priority: "low",
        status: "exploring",
        dateAdded: "2026-05-01",
      },
    ],
  },
  {
    id: "p-peter",
    name: "Dad (Peter)",
    relationship: "parent",
    birthday: "1958-07-12",
    birthYear: 1958,
    themes: ["Food", "Gardening"],
    budget: 80,
    purchasedGift: "Artisan BBQ spice gift box",
    birthdayMessageReminderCreated: true,
    giftIdeas: [
      {
        id: "g-peter-1",
        title: "Artisan BBQ spice gift box",
        theme: "Food",
        purchaseUrl: "https://example.com/bbq-box",
        estimatedPrice: 55,
        store: "The Spice Merchant",
        priority: "high",
        status: "purchased",
        dateAdded: "2026-03-20",
      },
    ],
  },
  {
    id: "p-sophie",
    name: "Sophie",
    relationship: "friend",
    birthday: "1990-09-15",
    birthYear: 1990,
    themes: ["Beauty", "Experience"],
    giftIdeas: [
      {
        id: "g-sophie-1",
        title: "Spa day voucher",
        theme: "Experience",
        purchaseUrl: "https://example.com/spa",
        estimatedPrice: 90,
        priority: "medium",
        status: "exploring",
        dateAdded: "2026-05-10",
      },
    ],
  },
  {
    id: "p-noah",
    name: "Noah",
    relationship: "child",
    birthday: "2020-11-02",
    birthYear: 2020,
    themes: ["Lego"],
    notes: "Just turned into a big fan of trucks.",
    giftIdeas: [],
  },
  {
    id: "p-carol",
    name: "Aunt Carol",
    relationship: "family",
    birthday: "1963-03-22",
    birthYear: 1963,
    themes: ["Homeware", "Food"],
    purchasedGift: "Hand-thrown ceramic mug set",
    readyToGive: true,
    birthdayMessageReminderCreated: true,
    birthdayMessageSent: true,
    giftIdeas: [
      {
        id: "g-carol-1",
        title: "Ceramic mug set",
        theme: "Homeware",
        estimatedPrice: 45,
        status: "purchased",
        dateAdded: "2026-01-30",
      },
    ],
  },
  {
    id: "p-tom",
    name: "Tom",
    relationship: "colleague",
    birthday: "1988-12-12",
    birthYear: 1988,
    themes: ["Food"],
    notes: "Secret Santa backup ideas welcome.",
    giftIdeas: [],
  },
];

export function sampleData(): AppData {
  return {
    version: CURRENT_VERSION,
    people: people.map((p) => ({ ...p, giftIdeas: p.giftIdeas.map((g) => ({ ...g })) })),
    themes: [...DEFAULT_THEMES],
    updatedAt: new Date().toISOString(),
  };
}
