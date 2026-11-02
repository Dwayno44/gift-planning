import type { GiftIdea, Occasion, Person } from "../types";
import { daysUntilBirthday, nextBirthday } from "./birthdayUtils";
import { daysUntilChristmas } from "./christmasUtils";
import { daysUntilOccasion, OCCASION_META } from "./occasionUtils";

/** Where an idea lives, so the shopping list can mark it purchased in place. */
export type IdeaSource =
  | { kind: "birthday"; personId: string }
  | { kind: "christmas"; personId: string }
  | { kind: "occasion"; occasionId: string };

export interface ShoppingItem {
  idea: GiftIdea;
  source: IdeaSource;
  /** Who the gift is for — blank for occasions (the group title says it). */
  forName: string;
}

export interface ShoppingGroup {
  key: string;
  title: string;
  emoji: string;
  date: Date;
  days: number;
  items: ShoppingItem[];
}

export interface ShoppingList {
  groups: ShoppingGroup[];
  /** People/events in the window with nothing bought and no ideas to buy. */
  gaps: { birthdays: string[]; christmas: string[]; occasions: string[] };
}

/** Still needs buying: not purchased and not ruled out. */
const isOpen = (i: GiftIdea) => i.status !== "purchased" && i.status !== "rejected";

/** Shortlisted / high priority first, then the order they were added. */
function rank(i: GiftIdea): number {
  if (i.status === "shortlisted") return 0;
  if (i.priority === "high") return 1;
  if (i.status === "exploring") return 2;
  return 3;
}

/**
 * Every gift idea still to buy for a birthday, Christmas or event falling
 * within `horizonDays`, grouped by the date it's needed and soonest first.
 */
export function buildShoppingList(
  people: Person[],
  occasions: Occasion[],
  horizonDays: number,
  from: Date = new Date()
): ShoppingList {
  const groups: ShoppingGroup[] = [];
  const gaps: ShoppingList["gaps"] = { birthdays: [], christmas: [], occasions: [] };
  const active = people.filter((p) => !p.archived);

  // Christmas — one group for everyone
  const xmasDays = daysUntilChristmas(from);
  if (xmasDays <= horizonDays) {
    const items: ShoppingItem[] = [];
    for (const p of active) {
      const ideas = p.christmasGiftIdeas ?? [];
      const open = ideas.filter(isOpen);
      open.forEach((idea) => items.push({ idea, source: { kind: "christmas", personId: p.id }, forName: p.name }));
      const sorted = p.christmasReadyToGive || ideas.some((i) => i.status === "purchased");
      if (!sorted && open.length === 0) gaps.christmas.push(p.name);
    }
    if (items.length > 0) {
      const xmas = new Date(from.getFullYear(), from.getMonth(), from.getDate() + xmasDays);
      groups.push({ key: "christmas", title: "Christmas", emoji: "🎄", date: xmas, days: xmasDays, items });
    }
  }

  // Birthdays — one group per person
  for (const p of active) {
    const days = daysUntilBirthday(p.birthday, from);
    if (days > horizonDays) continue;
    const ideas = p.giftIdeas ?? [];
    const open = ideas.filter(isOpen);
    const sorted = p.readyToGive || !!p.purchasedGift?.trim() || ideas.some((i) => i.status === "purchased");
    if (open.length === 0) {
      if (!sorted) gaps.birthdays.push(p.name);
      continue;
    }
    groups.push({
      key: `bday-${p.id}`,
      title: `${p.name}'s birthday`,
      emoji: "🎂",
      date: nextBirthday(p.birthday, from),
      days,
      items: open.map((idea) => ({ idea, source: { kind: "birthday", personId: p.id }, forName: "" })),
    });
  }

  // One-off events
  for (const o of occasions) {
    if (o.archived) continue;
    const days = daysUntilOccasion(o.date, from);
    if (days < 0 || days > horizonDays) continue;
    const ideas = o.giftIdeas ?? [];
    const open = ideas.filter(isOpen);
    const sorted = o.readyToGive || ideas.some((i) => i.status === "purchased");
    if (open.length === 0) {
      if (!sorted) gaps.occasions.push(o.title);
      continue;
    }
    groups.push({
      key: `occ-${o.id}`,
      title: o.title,
      emoji: OCCASION_META[o.type]?.emoji ?? "🎉",
      date: new Date(o.date + "T00:00:00"),
      days,
      items: open.map((idea) => ({ idea, source: { kind: "occasion", occasionId: o.id }, forName: "" })),
    });
  }

  for (const g of groups) g.items.sort((a, b) => rank(a.idea) - rank(b.idea));
  groups.sort((a, b) => a.days - b.days);
  return { groups, gaps };
}

export interface CostSummary {
  total: number;
  priced: number;
  unpriced: number;
}

/** Sum of approx. prices, plus how many items have no price yet. */
export function costSummary(items: ShoppingItem[]): CostSummary {
  let total = 0;
  let priced = 0;
  for (const { idea } of items) {
    if (idea.estimatedPrice != null) {
      total += idea.estimatedPrice;
      priced++;
    }
  }
  return { total, priced, unpriced: items.length - priced };
}

export function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-AU")}`;
}

/** "~$340 · 2 unpriced", "~$340", "no prices yet" — "" when there's nothing to say. */
export function costLabel({ total, priced, unpriced }: CostSummary): string {
  if (priced === 0) return unpriced > 0 ? "no prices yet" : "";
  return unpriced > 0 ? `~${formatMoney(total)} · ${unpriced} unpriced` : `~${formatMoney(total)}`;
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/** Plain-text version for pasting into Messages / Notes / an email. */
export function shoppingListText(groups: ShoppingGroup[], heading: string): string {
  const lines = [`🛒 ${heading}`];
  const overall = costLabel(costSummary(groups.flatMap((g) => g.items)));
  if (overall) lines.push(`Total: ${overall}`);
  for (const g of groups) {
    const cost = costLabel(costSummary(g.items));
    lines.push("", `${g.emoji} ${g.title} — ${formatShortDate(g.date)}${cost ? ` (${cost})` : ""}`);
    for (const { idea, forName } of g.items) {
      const extras = [
        idea.estimatedPrice != null ? `~$${idea.estimatedPrice}` : "",
        idea.store ?? "",
        idea.status === "shortlisted" ? "⭐ shortlisted" : "",
      ].filter(Boolean);
      const who = forName ? `${forName}: ` : "";
      lines.push(`• ${who}${idea.title}${extras.length ? ` (${extras.join(", ")})` : ""}`);
      if (idea.purchaseUrl) lines.push(`  ${idea.purchaseUrl}`);
    }
  }
  return lines.join("\n");
}
