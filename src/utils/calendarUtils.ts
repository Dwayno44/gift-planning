import type { Person } from "../types";
import { nextBirthday } from "./birthdayUtils";

// ---------------------------------------------------------------------------
// Calendar reminder generation.
//
// For v1 we generate a downloadable .ics file (works with Apple Calendar,
// Google Calendar, Outlook, etc.). The logic is deliberately split into a
// pure `buildBirthdayReminderICS` so that a future provider — Google/Outlook
// OAuth, a serverless scheduled job — can reuse the same event shape.
// ---------------------------------------------------------------------------

export interface ReminderEvent {
  title: string;
  date: Date; // event day (all-day)
  note?: string;
}

/** Build the reminder event for "send a birthday message to X". */
export function buildBirthdayReminder(person: Person, from: Date = new Date()): ReminderEvent {
  return {
    title: `Send birthday message to ${person.name}`,
    date: nextBirthday(person.birthday, from),
    note: "Check gift tracker before messaging 🎁",
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a date as YYYYMMDD for an all-day VEVENT. */
function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Format a UTC timestamp as YYYYMMDDTHHMMSSZ. */
function icsStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Build a valid .ics document for the reminder. Yearly-recurring all-day event
 * with a same-day alarm so it surfaces on the birthday itself.
 */
export function buildBirthdayReminderICS(event: ReminderEvent): string {
  const start = event.date;
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const uid = `${icsDate(start)}-${Math.random().toString(36).slice(2)}@gift-planner`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gift Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    "RRULE:FREQ=YEARLY",
    `SUMMARY:${escapeText(event.title)}`,
    event.note ? `DESCRIPTION:${escapeText(event.note)}` : "",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    "TRIGGER:PT0S",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  // .ics requires CRLF line endings.
  return lines.join("\r\n");
}

/** Trigger a browser download of the .ics file for a person. */
export function downloadBirthdayReminder(person: Person, from: Date = new Date()): void {
  const event = buildBirthdayReminder(person, from);
  const ics = buildBirthdayReminderICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = person.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `birthday-message-${safeName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
