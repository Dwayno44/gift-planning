// ---------------------------------------------------------------------------
// Core data model for the Gift Planner app.
// Keep this the single source of truth — UI components and storage both depend
// on these shapes. Status is *derived* from data wherever possible (see
// utils/statusUtils.ts) rather than stored and kept in sync by hand.
// ---------------------------------------------------------------------------

/** Overall gift status for a person. Mostly derived, but stored values for
 *  "ready" and "message_sent" let the user mark those final stages by hand. */
export type GiftStatus =
  | "no_ideas"
  | "ideas_saved"
  | "options_explored"
  | "purchased"
  | "ready"
  | "message_sent";

/** Status of a single gift idea within a person's list. */
export type GiftIdeaStatus =
  | "idea"
  | "exploring"
  | "shortlisted"
  | "purchased"
  | "rejected";

export type Priority = "low" | "medium" | "high";

export interface GiftIdea {
  id: string;
  title: string;
  notes?: string;
  theme?: string;
  purchaseUrl?: string;
  estimatedPrice?: number;
  store?: string;
  priority?: Priority;
  status: GiftIdeaStatus;
  dateAdded: string; // ISO date
}

export interface Person {
  id: string;
  name: string;
  relationship?: string;
  birthday: string; // YYYY-MM-DD (year is optional context — see birthYear)
  birthYear?: number;
  notes?: string;
  themes?: string[];
  giftIdeas: GiftIdea[];
  purchasedGift?: string;
  budget?: number;
  reminderNotes?: string;
  /** Manual final-stage flags. These let a user mark "wrapped/ready" and
   *  "message sent" which can't be inferred from the data alone. */
  readyToGive?: boolean;
  birthdayMessageReminderCreated?: boolean;
  birthdayMessageSent?: boolean;
  archived?: boolean;
}

/** Shape of the full persisted document. Versioned so future migrations and
 *  cloud sync (Supabase/Firebase/etc.) can be added without breaking imports. */
export interface AppData {
  version: number;
  people: Person[];
  themes: string[];
  updatedAt: string;
  /**
   * Seed person ids that have already been applied to this device. Lets the
   * app pull in NEW people added to the seed (so a device already in use picks
   * them up on next load) while never resurrecting a seed person the user has
   * intentionally deleted.
   */
  appliedSeedIds?: string[];
}
