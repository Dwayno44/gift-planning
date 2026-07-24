import type { Occasion } from "../types";
import { OCCASION_META, deriveOccasionStatus, daysUntilOccasion, relativeOccasionLabel, formatOccasionDate } from "../utils/occasionUtils";
import { toneClasses } from "../utils/statusUtils";

interface Props {
  occasion: Occasion;
  onOpen: () => void;
}

export default function OccasionCard({ occasion, onOpen }: Props) {
  const { label, tone } = deriveOccasionStatus(occasion);
  const c = toneClasses[tone];
  const meta = OCCASION_META[occasion.type];
  const days = daysUntilOccasion(occasion.date);
  const isPast = days < 0;
  const ideaCount = (occasion.giftIdeas ?? []).filter((i) => i.status !== "rejected").length;
  const purchased = (occasion.giftIdeas ?? []).some((i) => i.status === "purchased");

  return (
    <button
      onClick={onOpen}
      className="card relative w-full overflow-hidden text-left transition hover:shadow-lift focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${isPast ? "bg-line" : c.bar}`} aria-hidden />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{meta.emoji}</span>
              <h3 className="truncate text-base font-semibold text-ink">{occasion.title}</h3>
            </div>
            <p className="mt-1 text-sm text-muted">
              {meta.label} · {formatOccasionDate(occasion.date)}
            </p>
          </div>
          <p className={`text-sm font-semibold shrink-0 ${isPast ? "text-muted" : "text-accent-ink"}`}>
            {relativeOccasionLabel(occasion.date)}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`chip ${isPast ? "bg-line/60 text-ink/50" : c.chipBg + " " + c.chipText}`}>
            {!isPast && <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />}
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
