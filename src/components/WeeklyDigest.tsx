import type { Person } from "../types";
import {
  birthdaysWithinWeeks,
  daysUntilBirthday,
  formatBirthdayShort,
  relativeBirthdayLabel,
} from "../utils/birthdayUtils";
import { deriveStatus, toneClasses, suggestedNextAction } from "../utils/statusUtils";

interface Props {
  people: Person[];
  onOpenPerson: (id: string) => void;
}

interface Group {
  key: string;
  title: string;
  hint: string;
  people: Person[];
}

/**
 * Reusable digest grouping logic. Kept pure and exported so the email
 * script can build the same buckets without the UI.
 *
 *   Urgent   → birthday within 4 weeks, not yet "green"
 *   Upcoming → birthday 4–6 weeks out, not yet "green"
 *   Sorted   → birthday within 6 weeks, gift ready
 *   Horizon  → birthday 6 weeks – 6 months out (plan-ahead view)
 */
export function buildDigest(people: Person[], from: Date = new Date()): Group[] {
  const within6 = birthdaysWithinWeeks(people, 6, from);
  const within26 = birthdaysWithinWeeks(people, 26, from);
  const within6Ids = new Set(within6.map((p) => p.id));

  const urgent: Person[] = [];
  const upcoming: Person[] = [];
  const sorted: Person[] = [];

  for (const p of within6) {
    const isGreen = deriveStatus(p).tone === "green";
    const days = daysUntilBirthday(p.birthday, from);
    if (isGreen) {
      sorted.push(p);
    } else if (days <= 28) {
      urgent.push(p);
    } else {
      upcoming.push(p);
    }
  }

  const horizon = within26
    .filter((p) => !within6Ids.has(p.id))
    .sort((a, b) => daysUntilBirthday(a.birthday, from) - daysUntilBirthday(b.birthday, from));

  return [
    {
      key: "urgent",
      title: "Needs attention now",
      hint: "Birthdays within 4 weeks that aren't sorted yet",
      people: urgent,
    },
    {
      key: "upcoming",
      title: "Coming up soon",
      hint: "Birthdays within the next 6 weeks",
      people: upcoming,
    },
    {
      key: "sorted",
      title: "Already sorted",
      hint: "Upcoming birthdays with a gift ready to go",
      people: sorted,
    },
    {
      key: "horizon",
      title: "On the horizon",
      hint: "Birthdays 6 weeks to 6 months away — good time to start thinking",
      people: horizon,
    },
  ];
}

const ACCENTS: Record<string, string> = {
  urgent: "border-status-red/30 bg-status-redSoft/40",
  upcoming: "border-status-amber/30 bg-status-amberSoft/40",
  sorted: "border-status-green/30 bg-status-greenSoft/40",
  horizon: "border-line bg-white/60",
};

export default function WeeklyDigest({ people, onOpenPerson }: Props) {
  const groups = buildDigest(people);
  const [near, horizon] = [groups.slice(0, 3), groups[3]];
  const nearTotal = near.reduce((n, g) => n + g.people.length, 0);
  const totalAll = nearTotal + horizon.people.length;

  if (totalAll === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-3xl">🌿</p>
        <p className="mt-2 font-semibold text-ink">Nothing coming up</p>
        <p className="mt-1 text-sm text-muted">
          No birthdays in the next 6 months. Enjoy the calm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6-week window */}
      {near.map((group) => (
        <section key={group.key}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">{group.title}</h2>
            <span className="text-sm text-muted">{group.people.length}</span>
          </div>
          <p className="mb-3 text-sm text-muted">{group.hint}</p>

          {group.people.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-white/40 px-4 py-3 text-sm text-muted">
              {group.key === "urgent"
                ? "Nothing urgent — lovely."
                : group.key === "sorted"
                ? "Nothing fully sorted yet."
                : "Nothing here right now."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {group.people.map((p) => {
                const { label, tone } = deriveStatus(p);
                const c = toneClasses[tone];
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpenPerson(p.id)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:shadow-card ${ACCENTS[group.key]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-sm text-muted">
                          {formatBirthdayShort(p.birthday)} · {relativeBirthdayLabel(p.birthday)}
                        </p>
                      </div>
                      <span className={`chip ${c.chipBg} ${c.chipText} text-xs shrink-0`}>
                        <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
                        {label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-accent-ink font-medium">
                      → {suggestedNextAction(p)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ))}

      {/* Horizon — only shown when populated */}
      {horizon.people.length > 0 && (
        <>
          <hr className="border-line" />
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-ink">{horizon.title}</h2>
              <span className="text-sm text-muted">{horizon.people.length}</span>
            </div>
            <p className="mb-3 text-sm text-muted">{horizon.hint}</p>
            <div className="space-y-2.5">
              {horizon.people.map((p) => {
                const { label, tone } = deriveStatus(p);
                const c = toneClasses[tone];
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpenPerson(p.id)}
                    className="w-full rounded-xl border border-line bg-white/60 p-4 text-left transition hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-sm text-muted">
                          {formatBirthdayShort(p.birthday)} · {relativeBirthdayLabel(p.birthday)}
                        </p>
                      </div>
                      <span className={`chip ${c.chipBg} ${c.chipText} text-xs shrink-0`}>
                        <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
