import type { Person } from "../types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Strip the time portion so all date maths is done at local midnight. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse the month/day out of a YYYY-MM-DD string (year ignored here). */
function monthDay(birthday: string): { month: number; day: number } {
  const [, m, d] = birthday.split("-").map(Number);
  return { month: (m || 1) - 1, day: d || 1 };
}

/**
 * The next time this birthday occurs, on or after `from` (default: today).
 * If the birthday already happened this year, returns next year's date.
 */
export function nextBirthday(birthday: string, from: Date = new Date()): Date {
  const today = startOfDay(from);
  const { month, day } = monthDay(birthday);
  let candidate = new Date(today.getFullYear(), month, day);
  if (candidate < today) {
    candidate = new Date(today.getFullYear() + 1, month, day);
  }
  return candidate;
}

/** Whole days from today until the next occurrence of the birthday. 0 = today. */
export function daysUntilBirthday(birthday: string, from: Date = new Date()): number {
  const today = startOfDay(from);
  const next = nextBirthday(birthday, from);
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

export function isBirthdayToday(birthday: string, from: Date = new Date()): boolean {
  return daysUntilBirthday(birthday, from) === 0;
}

/** Age the person will turn on their next birthday (needs birthYear). */
export function upcomingAge(person: Pick<Person, "birthday" | "birthYear">, from: Date = new Date()): number | null {
  if (!person.birthYear) return null;
  const next = nextBirthday(person.birthday, from);
  return next.getFullYear() - person.birthYear;
}

/** Current age right now (needs birthYear). */
export function currentAge(person: Pick<Person, "birthday" | "birthYear">, from: Date = new Date()): number | null {
  const upcoming = upcomingAge(person, from);
  if (upcoming === null) return null;
  return isBirthdayToday(person.birthday, from) ? upcoming : upcoming - 1;
}

/** Sort a copy of the people array by soonest upcoming birthday. */
export function sortByNextBirthday<T extends Pick<Person, "birthday">>(people: T[], from: Date = new Date()): T[] {
  return [...people].sort(
    (a, b) => daysUntilBirthday(a.birthday, from) - daysUntilBirthday(b.birthday, from)
  );
}

/** People whose birthday falls within the next `weeks` weeks (inclusive). */
export function birthdaysWithinWeeks<T extends Pick<Person, "birthday">>(
  people: T[],
  weeks: number,
  from: Date = new Date()
): T[] {
  const limit = weeks * 7;
  return sortByNextBirthday(
    people.filter((p) => daysUntilBirthday(p.birthday, from) <= limit),
    from
  );
}

export const birthdaysWithin4Weeks = <T extends Pick<Person, "birthday">>(people: T[], from?: Date) =>
  birthdaysWithinWeeks(people, 4, from);

export const birthdaysWithin6Weeks = <T extends Pick<Person, "birthday">>(people: T[], from?: Date) =>
  birthdaysWithinWeeks(people, 6, from);

/** "in 3 days", "today", "tomorrow", "in 5 weeks" — friendly relative text. */
export function relativeBirthdayLabel(birthday: string, from: Date = new Date()): string {
  const days = daysUntilBirthday(birthday, from);
  if (days === 0) return "Today 🎉";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  const weeks = Math.round(days / 7);
  if (days < 70) return `In ${weeks} weeks`;
  const months = Math.round(days / 30);
  return `In ${months} months`;
}

/** e.g. "14 Mar" — short, no year. */
export function formatBirthdayShort(birthday: string): string {
  const { month, day } = monthDay(birthday);
  const d = new Date(2000, month, day);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
