import type { GiftStatus, Person } from "../types";

export type StatusTone = "red" | "amber" | "green";

interface StatusMeta {
  status: GiftStatus;
  label: string;
  tone: StatusTone;
}

/**
 * Derive a person's overall gift status from their data. Manual final-stage
 * flags (readyToGive / birthdayMessageSent) take precedence, otherwise the
 * status is inferred from the gift ideas and purchased gift.
 *
 *   Red    → no ideas captured yet
 *   Amber  → ideas/options exist but nothing purchased
 *   Green  → purchased or complete
 */
export function deriveStatus(person: Person): StatusMeta {
  const ideas = person.giftIdeas ?? [];
  const activeIdeas = ideas.filter((i) => i.status !== "rejected");
  const hasPurchasedIdea = ideas.some((i) => i.status === "purchased");
  const hasPurchase = hasPurchasedIdea || !!person.purchasedGift?.trim();
  const hasExploredOptions = activeIdeas.some(
    (i) => i.status === "exploring" || i.status === "shortlisted" || !!i.purchaseUrl
  );

  if (person.birthdayMessageSent) {
    return { status: "message_sent", label: "Message sent", tone: "green" };
  }
  if (person.readyToGive) {
    return { status: "ready", label: "Wrapped / ready", tone: "green" };
  }
  if (hasPurchase) {
    return { status: "purchased", label: "Purchased", tone: "green" };
  }
  if (hasExploredOptions) {
    return { status: "options_explored", label: "Options explored", tone: "amber" };
  }
  if (activeIdeas.length > 0) {
    return { status: "ideas_saved", label: "Ideas saved", tone: "amber" };
  }
  return { status: "no_ideas", label: "No ideas yet", tone: "red" };
}

/** Tailwind classes for each tone — soft, accessible, label-backed. */
export const toneClasses: Record<
  StatusTone,
  { bar: string; chipBg: string; chipText: string; dot: string }
> = {
  red: {
    bar: "bg-status-redVivid",
    chipBg: "bg-status-redSoft",
    chipText: "text-status-red",
    dot: "bg-status-redVivid",
  },
  amber: {
    bar: "bg-status-amberVivid",
    chipBg: "bg-status-amberSoft",
    chipText: "text-status-amber",
    dot: "bg-status-amberVivid",
  },
  green: {
    bar: "bg-status-greenVivid",
    chipBg: "bg-status-greenSoft",
    chipText: "text-status-green",
    dot: "bg-status-greenVivid",
  },
};

/** Count of ideas that haven't been rejected. */
export function activeIdeaCount(person: Person): number {
  return (person.giftIdeas ?? []).filter((i) => i.status !== "rejected").length;
}

export function hasPurchase(person: Person): boolean {
  return (
    !!person.purchasedGift?.trim() ||
    (person.giftIdeas ?? []).some((i) => i.status === "purchased")
  );
}

/**
 * The single most useful next action for a person, given their status.
 * Drives the "make the next action obvious" UX principle.
 */
export function suggestedNextAction(person: Person): string {
  const { status } = deriveStatus(person);
  switch (status) {
    case "no_ideas":
      return "Add at least one gift idea";
    case "ideas_saved":
      return "Choose or research a purchase option";
    case "options_explored":
      return "Decide and purchase";
    case "purchased":
      return person.birthdayMessageReminderCreated
        ? "Wrap it up and you're ready"
        : "Add a birthday message reminder";
    case "ready":
      return "All set — send a message on the day";
    case "message_sent":
      return "Complete 🎉";
    default:
      return "Add a gift idea";
  }
}
