import type { OccasionType } from "../types";

export interface ParsedCalEvent {
  uid: string;
  summary: string;
  date: string; // YYYY-MM-DD
}

export interface MatchedCalEvent {
  event: ParsedCalEvent;
  suggestedType: OccasionType;
}

// ---------------------------------------------------------------------------
// ICS parser — handles folded lines and the main DTSTART formats
// ---------------------------------------------------------------------------

function unfold(text: string): string {
  // ICS "folding": continuation lines start with a single space or tab
  return text.replace(/\r?\n[ \t]/g, "");
}

function extractVEvents(text: string): string[] {
  const blocks: string[] = [];
  const re = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) blocks.push(m[1]);
  return blocks;
}

function getField(block: string, name: string): string | null {
  // Match "NAME" or "NAME;anything:" at line start
  const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)`, "m");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function parseDate(raw: string): string | null {
  // Strip time part — we only need YYYYMMDD
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length !== 8) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function parseICS(text: string): ParsedCalEvent[] {
  const unfolded = unfold(text);
  const blocks = extractVEvents(unfolded);
  const events: ParsedCalEvent[] = [];

  for (const block of blocks) {
    const summary = getField(block, "SUMMARY");
    const dtstart = getField(block, "DTSTART");
    const uid = getField(block, "UID") ?? Math.random().toString(36).slice(2);

    if (!summary || !dtstart) continue;
    const date = parseDate(dtstart);
    if (!date) continue;

    // Skip events in the past (more than 30 days ago)
    const days = Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86_400_000);
    if (days < -30) continue;

    events.push({ uid, summary: summary.replace(/\\,/g, ",").replace(/\\n/g, " "), date });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Keyword matcher — maps event titles to OccasionType
// ---------------------------------------------------------------------------

type Rule = { keywords: string[]; type: OccasionType };

const RULES: Rule[] = [
  { keywords: ["baby shower", "babyshower", "baby sprinkle"], type: "baby_shower" },
  { keywords: ["bridal shower", "hens night", "hen's night", "hens party", "hen do", "bucks night", "buck's night", "bucks party", "stag do", "wedding"], type: "wedding" },
  { keywords: ["anniversary"], type: "anniversary" },
  { keywords: ["housewarming", "house warming", "new home"], type: "housewarming" },
  { keywords: ["graduation", "grad night", "prom"], type: "graduation" },
  { keywords: ["engagement", "engaged", "got engaged"], type: "engagement" },
  { keywords: ["christening", "baptism", "naming day", "naming ceremony", "baby shower", "birth"], type: "baby_shower" },
];

export function matchCalEvents(events: ParsedCalEvent[]): MatchedCalEvent[] {
  const matched: MatchedCalEvent[] = [];

  for (const event of events) {
    const lower = event.summary.toLowerCase();
    for (const rule of RULES) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        matched.push({ event, suggestedType: rule.type });
        break;
      }
    }
  }

  return matched;
}
