import type { Person } from "../types";
import {
  formatBirthdayShort,
  relativeBirthdayLabel,
  daysUntilBirthday,
  upcomingAge,
  isBirthdayToday,
} from "../utils/birthdayUtils";
import { deriveStatus, toneClasses, activeIdeaCount, hasPurchase } from "../utils/statusUtils";

interface Props {
  person: Person;
  onOpen: () => void;
}

/**
 * The dashboard tile. A coloured status bar runs down the left edge; the body
 * surfaces only the at-a-glance facts. Tapping anywhere opens the full detail.
 */
export default function PersonCard({ person, onOpen }: Props) {
  const { label, tone } = deriveStatus(person);
  const c = toneClasses[tone];
  const days = daysUntilBirthday(person.birthday);
  const age = upcomingAge(person);
  const ideaCount = activeIdeaCount(person);
  const purchased = hasPurchase(person);
  const today = isBirthdayToday(person.birthday);
  const needsMessageReminder = days <= 14 && !person.birthdayMessageReminderCreated && !person.birthdayMessageSent;

  return (
    <button
      onClick={onOpen}
      className="card relative w-full overflow-hidden text-left transition hover:shadow-lift focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${c.bar}`} aria-hidden />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-ink">{person.name}</h3>
            <p className="text-sm text-muted capitalize">
              {person.relationship ? `${person.relationship} · ` : ""}
              {formatBirthdayShort(person.birthday)}
              {age != null ? ` · turning ${age}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-sm font-semibold ${today ? "text-status-green" : "text-accent-ink"}`}>
              {relativeBirthdayLabel(person.birthday)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`chip ${c.chipBg} ${c.chipText}`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
            {label}
          </span>
          <span className="chip bg-line/60 text-ink/70 text-xs">
            {ideaCount === 0 ? "No ideas" : `${ideaCount} idea${ideaCount > 1 ? "s" : ""}`}
          </span>
          {purchased && (
            <span className="chip bg-status-greenSoft text-status-green text-xs">🎁 Bought</span>
          )}
          {needsMessageReminder && (
            <span className="chip bg-accent-soft text-accent-ink text-xs">🔔 Set reminder</span>
          )}
        </div>
      </div>
    </button>
  );
}
