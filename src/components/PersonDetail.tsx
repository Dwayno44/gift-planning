import { useState } from "react";
import type { GiftIdea, Person } from "../types";
import { useApp } from "../context/AppContext";
import {
  formatBirthdayShort,
  relativeBirthdayLabel,
  upcomingAge,
  currentAge,
} from "../utils/birthdayUtils";
import { deriveStatus, toneClasses, suggestedNextAction } from "../utils/statusUtils";
import StatusBadge from "./StatusBadge";
import GiftIdeaCard from "./GiftIdeaCard";
import GiftIdeaForm from "./GiftIdeaForm";
import CalendarReminderButton from "./CalendarReminderButton";

interface Props {
  person: Person;
  onEdit: () => void;
}

/** Full detail of one person: their info, the "next action" nudge, gift idea
 *  capture/management, calendar reminder, and final-stage toggles. */
export default function PersonDetail({ person, onEdit }: Props) {
  const { addGiftIdea, updateGiftIdea, deleteGiftIdea, updatePerson, archivePerson } = useApp();
  const [adding, setAdding] = useState(false);
  const [editingIdea, setEditingIdea] = useState<GiftIdea | null>(null);

  const { tone } = deriveStatus(person);
  const c = toneClasses[tone];
  const age = currentAge(person);
  const nextAge = upcomingAge(person);
  const ideas = person.giftIdeas ?? [];

  const togglePurchased = (idea: GiftIdea) =>
    updateGiftIdea(person.id, idea.id, {
      status: idea.status === "purchased" ? "shortlisted" : "purchased",
    });

  return (
    <div className="space-y-5">
      {/* Header summary */}
      <div className={`rounded-xl2 p-4 ${c.chipBg}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/70 capitalize">
              {person.relationship || "Someone special"}
            </p>
            <p className="text-base font-semibold text-ink">
              🎂 {formatBirthdayShort(person.birthday)}
              {age != null ? ` · currently ${age}` : ""}
              {nextAge != null ? ` · turning ${nextAge}` : ""}
            </p>
          </div>
          <span className="text-sm font-semibold text-ink/80">
            {relativeBirthdayLabel(person.birthday)}
          </span>
        </div>
        <div className="mt-3">
          <StatusBadge person={person} />
        </div>
      </div>

      {/* Next action nudge */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink/70">Next step</p>
        <p className="mt-1 text-ink font-medium">{suggestedNextAction(person)}</p>
      </div>

      {(person.notes || person.budget != null || person.reminderNotes || person.themes?.length) && (
        <div className="space-y-2 text-sm">
          {person.notes && <p className="text-ink/80">{person.notes}</p>}
          {person.themes && person.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {person.themes.map((t) => (
                <span key={t} className="chip bg-line/70 text-ink/70 text-xs">{t}</span>
              ))}
            </div>
          )}
          {person.budget != null && <p className="text-muted">Budget: ~${person.budget}</p>}
          {person.reminderNotes && (
            <p className="text-muted">🔔 {person.reminderNotes}</p>
          )}
        </div>
      )}

      {/* Gift ideas */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Gift ideas</h3>
          {!adding && !editingIdea && (
            <button className="btn-soft px-3 py-2 text-sm" onClick={() => setAdding(true)}>
              + Add idea
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-3 rounded-xl border border-accent/30 bg-white p-4">
            <GiftIdeaForm
              onSubmit={(idea) => {
                addGiftIdea(person.id, idea);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {editingIdea && (
          <div className="mt-3 rounded-xl border border-accent/30 bg-white p-4">
            <GiftIdeaForm
              initial={editingIdea}
              onSubmit={(patch) => {
                updateGiftIdea(person.id, editingIdea.id, patch);
                setEditingIdea(null);
              }}
              onCancel={() => setEditingIdea(null)}
            />
          </div>
        )}

        {!adding && !editingIdea && (
          <div className="mt-3 space-y-2.5">
            {ideas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/50 p-5 text-center">
                <p className="text-ink font-medium">No ideas yet</p>
                <p className="mt-1 text-sm text-muted">
                  Add a quick thought now — it doesn't need to be perfect.
                </p>
                <button className="btn-primary mt-3" onClick={() => setAdding(true)}>
                  Add the first idea
                </button>
              </div>
            ) : (
              ideas.map((idea) => (
                <GiftIdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={() => setEditingIdea(idea)}
                  onTogglePurchased={() => togglePurchased(idea)}
                  onDelete={() => deleteGiftIdea(person.id, idea.id)}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* Final stages */}
      <section className="space-y-2.5">
        <h3 className="text-base font-semibold text-ink">Finishing touches</h3>
        <label className="card flex items-center gap-3 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!person.readyToGive}
            onChange={(e) => updatePerson(person.id, { readyToGive: e.target.checked })}
            className="h-5 w-5 rounded border-line text-accent focus:ring-accent/40"
          />
          <span className="text-ink">Gift is wrapped &amp; ready</span>
        </label>
        <label className="card flex items-center gap-3 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!person.birthdayMessageSent}
            onChange={(e) => updatePerson(person.id, { birthdayMessageSent: e.target.checked })}
            className="h-5 w-5 rounded border-line text-accent focus:ring-accent/40"
          />
          <span className="text-ink">Birthday message sent 🎉</span>
        </label>
        <CalendarReminderButton person={person} className="w-full" />
      </section>

      {/* Manage */}
      <section className="flex gap-3 pt-2 border-t border-line">
        <button className="btn-soft flex-1" onClick={onEdit}>
          Edit details
        </button>
        <button
          className="btn-ghost flex-1 text-status-red"
          onClick={() => {
            if (confirm(`Archive ${person.name}? You can restore them from Settings.`)) {
              archivePerson(person.id);
            }
          }}
        >
          Archive
        </button>
      </section>
    </div>
  );
}
