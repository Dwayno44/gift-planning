import { useState } from "react";
import type { MatchedCalEvent } from "../utils/icsParser";
import { OCCASION_META } from "../utils/occasionUtils";
import { formatOccasionDate } from "../utils/occasionUtils";

interface Props {
  matches: MatchedCalEvent[];
  onImport: (selected: MatchedCalEvent[]) => void;
  onCancel: () => void;
}

export default function CalendarImportModal({ matches, onImport, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(matches.map((m) => m.event.uid))
  );

  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const allSelected = selected.size === matches.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(matches.map((m) => m.event.uid)));

  const handleImport = () => {
    onImport(matches.filter((m) => selected.has(m.event.uid)));
  };

  if (matches.length === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-dashed border-line bg-white/50 p-6 text-center">
          <p className="text-2xl">📅</p>
          <p className="mt-2 font-semibold text-ink">No gift-worthy events found</p>
          <p className="mt-1 text-sm text-muted">
            The calendar didn't contain any weddings, showers, anniversaries, or similar events in the next 6 months.
          </p>
        </div>
        <button className="btn-soft w-full" onClick={onCancel}>Close</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Found {matches.length} event{matches.length !== 1 ? "s" : ""} that might need a gift.
        Select the ones you'd like to track.
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {selected.size} of {matches.length} selected
        </span>
        <button className="text-xs text-accent-ink underline underline-offset-2" onClick={toggleAll}>
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {matches.map(({ event, suggestedType }) => {
          const meta = OCCASION_META[suggestedType];
          const isSelected = selected.has(event.uid);
          return (
            <li key={event.uid}>
              <button
                onClick={() => toggle(event.uid)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-accent/40 bg-accent-soft"
                    : "border-line bg-white/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-white"
                    }`}
                    aria-hidden
                  >
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{event.summary}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {meta.emoji} {meta.label} · {formatOccasionDate(event.date)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-3 pt-1 border-t border-line">
        <button className="btn-ghost flex-1" onClick={onCancel}>Cancel</button>
        <button
          className="btn-primary flex-1"
          disabled={selected.size === 0}
          onClick={handleImport}
        >
          Add {selected.size > 0 ? selected.size : ""} event{selected.size !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
