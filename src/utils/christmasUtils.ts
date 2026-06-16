export function daysUntilChristmas(from: Date = new Date()): number {
  const year = from.getFullYear();
  let xmas = new Date(year, 11, 25);
  if (xmas <= from) xmas = new Date(year + 1, 11, 25);
  return Math.ceil((xmas.getTime() - from.getTime()) / 86_400_000);
}

export function christmasCountdownLabel(days: number): string {
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  if (days <= 7) return `${days} days away`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} away`;
}
