import type { Occasion } from "../types";
import { parseICS, matchCalEvents } from "./icsParser";
import type { MatchedCalEvent } from "./icsParser";

/** Cloudflare Worker that relays webcal feeds (see worker/). Empty until deployed. */
export const CALENDAR_PROXY_URL = "";

export const isCalendarSyncAvailable = () => CALENDAR_PROXY_URL !== "";

/** Key used to remember events the user has already added or skipped. */
export const calEventKey = (m: MatchedCalEvent) => m.event.uid;

export function looksLikeCalendarLink(url: string): boolean {
  return /^(webcals?|https):\/\/\S+$/i.test(url.trim());
}

/**
 * Fetch the subscribed calendar and return gift-worthy events that aren't
 * already tracked and haven't been skipped before.
 */
export async function fetchNewCalendarEvents(
  url: string,
  occasions: Occasion[],
  dismissed: string[]
): Promise<MatchedCalEvent[]> {
  const res = await fetch(CALENDAR_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(body || "Couldn't reach the calendar.");

  const existing = new Set(occasions.map((o) => `${o.title.toLowerCase()}|${o.date}`));
  const skipped = new Set(dismissed);
  return matchCalEvents(parseICS(body)).filter(
    (m) => !skipped.has(calEventKey(m)) && !existing.has(`${m.event.summary.toLowerCase()}|${m.event.date}`)
  );
}
