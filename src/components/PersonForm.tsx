import { useState } from "react";
import type { Person } from "../types";
import { useApp } from "../context/AppContext";

interface Props {
  initial?: Person;
  onSubmit: (data: Omit<Person, "id" | "giftIdeas">, id?: string) => void;
  onCancel: () => void;
}

const RELATIONSHIPS = ["family", "friend", "child", "parent", "partner", "colleague", "other"];

/**
 * Add / edit a person. Name + birthday are the only things needed up front;
 * everything else lives behind "Add more details" so the common case is fast.
 */
export default function PersonForm({ initial, onSubmit, onCancel }: Props) {
  const { themes } = useApp();
  const [name, setName] = useState(initial?.name ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [birthday, setBirthday] = useState(initial?.birthday ?? "");
  const [knowYear, setKnowYear] = useState(initial?.birthYear != null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : "");
  const [reminderNotes, setReminderNotes] = useState(initial?.reminderNotes ?? "");
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initial?.themes ?? []);
  const [showMore, setShowMore] = useState(
    !!(initial?.notes || initial?.budget || initial?.reminderNotes || initial?.themes?.length)
  );

  const toggleTheme = (t: string) =>
    setSelectedThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthday) return;
    const birthYear = knowYear && birthday ? Number(birthday.slice(0, 4)) : undefined;
    const budgetNum = parseFloat(budget);
    onSubmit(
      {
        ...initial,
        name: name.trim(),
        relationship: relationship || undefined,
        birthday,
        birthYear,
        notes: notes.trim() || undefined,
        budget: Number.isFinite(budgetNum) ? budgetNum : undefined,
        reminderNotes: reminderNotes.trim() || undefined,
        themes: selectedThemes,
      },
      initial?.id
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="p-name">
          Name <span className="text-status-red">*</span>
        </label>
        <input
          id="p-name"
          className="input"
          value={name}
          autoFocus
          placeholder="e.g. Grandma Rose"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="p-bday">
          Birthday <span className="text-status-red">*</span>
        </label>
        <input
          id="p-bday"
          className="input"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={knowYear}
            onChange={(e) => setKnowYear(e.target.checked)}
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent/40"
          />
          The year is their real birth year (used to show their age)
        </label>
      </div>

      <div>
        <span className="label">Relationship</span>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIPS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRelationship(relationship === r ? "" : r)}
              className={`chip border capitalize ${
                relationship === r
                  ? "bg-accent-soft text-accent-ink border-accent/40"
                  : "bg-white text-muted border-line"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!showMore && (
        <button type="button" className="btn-ghost w-full" onClick={() => setShowMore(true)}>
          + Add more details
        </button>
      )}

      {showMore && (
        <div className="space-y-4 rounded-xl bg-white/60 border border-line p-4">
          <div>
            <span className="label">Gift themes they'd love</span>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTheme(t)}
                  className={`chip border ${
                    selectedThemes.includes(t)
                      ? "bg-accent-soft text-accent-ink border-accent/40"
                      : "bg-white text-muted border-line"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="p-budget">Budget (optional)</label>
            <input
              id="p-budget"
              className="input"
              inputMode="decimal"
              value={budget}
              placeholder="e.g. 50"
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="p-notes">Notes</label>
            <textarea
              id="p-notes"
              className="input min-h-[80px] resize-y"
              value={notes}
              placeholder="Likes, sizes, things to avoid…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="p-reminder">Reminder notes</label>
            <input
              id="p-reminder"
              className="input"
              value={reminderNotes}
              placeholder="e.g. Order early — ships from overseas"
              onChange={(e) => setReminderNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={!name.trim() || !birthday}>
          {initial ? "Save" : "Add person"}
        </button>
      </div>
    </form>
  );
}
