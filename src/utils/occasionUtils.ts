import type { GiftIdea, Occasion, OccasionType } from "../types";
import type { StatusMeta } from "./statusUtils";

export const OCCASION_META: Record<OccasionType, { label: string; emoji: string }> = {
  baby_shower:  { label: "Baby shower",  emoji: "🍼" },
  wedding:      { label: "Wedding",      emoji: "💍" },
  anniversary:  { label: "Anniversary",  emoji: "💝" },
  housewarming: { label: "Housewarming", emoji: "🏠" },
  graduation:   { label: "Graduation",   emoji: "🎓" },
  engagement:   { label: "Engagement",   emoji: "💌" },
  other:        { label: "Other",        emoji: "🎉" },
};

export function daysUntilOccasion(dateStr: string, from: Date = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - from.getTime()) / 86_400_000);
}

export function relativeOccasionLabel(dateStr: string, from: Date = new Date()): string {
  const days = daysUntilOccasion(dateStr, from);
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days < 0) {
    const ago = Math.abs(days);
    if (ago === 1) return "Yesterday";
    if (ago < 7) return `${ago} days ago`;
    const weeks = Math.round(ago / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }
  if (days <= 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""}`;
}

export function formatOccasionDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function deriveOccasionStatus(occasion: Occasion): StatusMeta {
  const ideas: GiftIdea[] = occasion.giftIdeas ?? [];
  const active = ideas.filter((i) => i.status !== "rejected");
  const hasPurchase = ideas.some((i) => i.status === "purchased");
  const hasExplored = active.some(
    (i) => i.status === "exploring" || i.status === "shortlisted" || !!i.purchaseUrl
  );

  if (occasion.readyToGive) return { status: "ready", label: "Wrapped / ready", tone: "green" };
  if (hasPurchase)           return { status: "purchased", label: "Purchased", tone: "green" };
  if (hasExplored)           return { status: "options_explored", label: "Options explored", tone: "amber" };
  if (active.length > 0)     return { status: "ideas_saved", label: "Ideas saved", tone: "amber" };
  return                            { status: "no_ideas", label: "No ideas yet", tone: "red" };
}

export function occasionSuggestedNextAction(occasion: Occasion): string {
  const { status } = deriveOccasionStatus(occasion);
  switch (status) {
    case "no_ideas":        return "Add at least one gift idea";
    case "ideas_saved":     return "Choose or research a purchase option";
    case "options_explored":return "Decide and purchase";
    case "purchased":       return "Wrap it up and you're ready";
    case "ready":           return "All sorted 🎉";
    default:                return "Add a gift idea";
  }
}
