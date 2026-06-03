import { useState } from "react";
import type { Person } from "../types";
import { downloadBirthdayReminder } from "../utils/calendarUtils";
import { useApp } from "../context/AppContext";

interface Props {
  person: Person;
  variant?: "primary" | "soft";
  className?: string;
}

/**
 * Downloads an .ics reminder ("Send birthday message to X") and records that a
 * reminder was created. Structured so a future Google/Outlook integration can
 * replace the download with an API call without touching callers.
 */
export default function CalendarReminderButton({ person, variant = "soft", className = "" }: Props) {
  const { updatePerson } = useApp();
  const [done, setDone] = useState(false);

  const handleClick = () => {
    downloadBirthdayReminder(person);
    updatePerson(person.id, { birthdayMessageReminderCreated: true });
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${variant === "primary" ? "btn-primary" : "btn-soft"} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
      </svg>
      {done ? "Reminder downloaded ✓" : "Add birthday message reminder"}
    </button>
  );
}
