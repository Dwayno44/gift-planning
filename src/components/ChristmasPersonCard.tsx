import type { Person } from "../types";
import { deriveChristmasStatus, toneClasses } from "../utils/statusUtils";

interface Props {
  person: Person;
  onOpen: () => void;
}

export default function ChristmasPersonCard({ person, onOpen }: Props) {
  const { label, tone } = deriveChristmasStatus(person);
  const c = toneClasses[tone];
  const ideaCount = (person.christmasGiftIdeas ?? []).filter((i) => i.status !== "rejected").length;
  const purchased = (person.christmasGiftIdeas ?? []).some((i) => i.status === "purchased");

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
            {person.relationship && (
              <p className="text-sm text-muted capitalize">{person.relationship}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`chip ${c.chipBg} ${c.chipText}`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
            {label}
          </span>
          <span className="chip bg-line/60 text-ink/70 text-xs">
            {ideaCount === 0 ? "No ideas" : `${ideaCount} idea${ideaCount !== 1 ? "s" : ""}`}
          </span>
          {purchased && (
            <span className="chip bg-status-greenSoft text-status-green text-xs">🎁 Bought</span>
          )}
        </div>
      </div>
    </button>
  );
}
