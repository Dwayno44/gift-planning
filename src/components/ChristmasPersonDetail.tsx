import { useState } from "react";
import type { GiftIdea, Person } from "../types";
import { useApp } from "../context/AppContext";
import { deriveChristmasStatus, toneClasses, christmasSuggestedNextAction } from "../utils/statusUtils";
import GiftIdeaCard from "./GiftIdeaCard";
import GiftIdeaForm from "./GiftIdeaForm";

interface Props {
  person: Person;
}

export default function ChristmasPersonDetail({ person }: Props) {
  const {
    addChristmasGiftIdea,
    updateChristmasGiftIdea,
    deleteChristmasGiftIdea,
    carryOverBirthdayIdeas,
    updatePerson,
  } = useApp();

  const [adding, setAdding] = useState(false);
  const [editingIdea, setEditingIdea] = useState<GiftIdea | null>(null);

  const { tone } = deriveChristmasStatus(person);
  const c = toneClasses[tone];
  const ideas = person.christmasGiftIdeas ?? [];

  const existingTitles = new Set(ideas.map((i) => i.title.toLowerCase()));
  const birthdayIdeasToCarry = (person.giftIdeas ?? []).filter(
    (i) => i.status !== "rejected" && !existingTitles.has(i.title.toLowerCase())
  );

  const togglePurchased = (idea: GiftIdea) =>
    updateChristmasGiftIdea(person.id, idea.id, {
      status: idea.status === "purchased" ? "shortlisted" : "purchased",
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`rounded-xl2 p-4 ${c.chipBg}`}>
        <p className="text-sm text-ink/70 capitalize">{person.relationship || "Someone special"}</p>
        <div className="mt-2">
          <span className={`chip ${c.chipBg} ${c.chipText} border border-current/20`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
            {deriveChristmasStatus(person).label}
          </span>
        </div>
      </div>

      {/* Next action */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink/70">Next step</p>
        <p className="mt-1 text-ink font-medium">{christmasSuggestedNextAction(person)}</p>
      </div>

      {/* Carry over birthday ideas */}
      {birthdayIdeasToCarry.length > 0 && (
        <div className="rounded-xl border border-line bg-white/60 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Import from birthday list</p>
            <p className="text-xs text-muted mt-0.5">
              {birthdayIdeasToCarry.length} idea{birthdayIdeasToCarry.length !== 1 ? "s" : ""} not yet on this list
            </p>
          </div>
          <button
            className="btn-soft px-3 py-2 text-sm shrink-0"
            onClick={() => carryOverBirthdayIdeas(person.id)}
          >
            Copy ideas →
          </button>
        </div>
      )}

      {/* Christmas gift ideas */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Christmas gift ideas</h3>
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
                addChristmasGiftIdea(person.id, idea);
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
                updateChristmasGiftIdea(person.id, editingIdea.id, patch);
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
                <p className="text-ink font-medium">No Christmas ideas yet</p>
                <p className="mt-1 text-sm text-muted">Add one now, or copy from their birthday list above.</p>
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
                  onDelete={() => deleteChristmasGiftIdea(person.id, idea.id)}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* Finishing touches */}
      <section className="space-y-2.5">
        <h3 className="text-base font-semibold text-ink">Finishing touches</h3>
        <label className="card flex items-center gap-3 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!person.christmasReadyToGive}
            onChange={(e) => updatePerson(person.id, { christmasReadyToGive: e.target.checked })}
            className="h-5 w-5 rounded border-line text-accent focus:ring-accent/40"
          />
          <span className="text-ink">Gift is wrapped &amp; ready 🎄</span>
        </label>
      </section>
    </div>
  );
}
