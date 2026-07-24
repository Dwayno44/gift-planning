import { useState } from "react";
import type { Occasion, OccasionType } from "../types";
import { OCCASION_META } from "../utils/occasionUtils";

type OccasionInput = Omit<Occasion, "id" | "giftIdeas" | "readyToGive" | "archived">;

interface Props {
  initial?: Occasion;
  onSubmit: (data: OccasionInput, id?: string) => void;
  onCancel: () => void;
}

const TYPES = Object.entries(OCCASION_META) as [OccasionType, { label: string; emoji: string }][];

export default function OccasionForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<OccasionType>(initial?.type ?? "other");
  const [date, setDate] = useState(initial?.date ?? "");
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const b = parseFloat(budget);
    onSubmit(
      {
        title: title.trim(),
        type,
        date,
        budget: Number.isFinite(b) ? b : undefined,
        notes: notes.trim() || undefined,
      },
      initial?.id
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="occ-title">Event name <span className="text-status-red">*</span></label>
        <input
          id="occ-title"
          className="input"
          value={title}
          autoFocus
          placeholder="e.g. Sarah & Tom's Wedding"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <span className="label">Type</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {TYPES.map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`chip justify-start gap-2 border px-3 py-2 ${
                type === key
                  ? "bg-accent-soft text-accent-ink border-accent/40"
                  : "bg-white text-muted border-line"
              }`}
            >
              <span>{meta.emoji}</span>
              <span className="text-sm">{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="occ-date">Date <span className="text-status-red">*</span></label>
        <input
          id="occ-date"
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="occ-budget">Budget (optional)</label>
        <input
          id="occ-budget"
          className="input"
          inputMode="decimal"
          value={budget}
          placeholder="0"
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="occ-notes">Notes (optional)</label>
        <textarea
          id="occ-notes"
          className="input min-h-[72px] resize-y"
          value={notes}
          placeholder="Anything to remember…"
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" className="btn-ghost flex-1" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={!title.trim() || !date}>
          {initial ? "Save event" : "Add event"}
        </button>
      </div>
    </form>
  );
}
