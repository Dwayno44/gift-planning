import { useState } from "react";
import type { GiftIdea, Occasion } from "../types";
import { useApp } from "../context/AppContext";
import { OCCASION_META, deriveOccasionStatus, occasionSuggestedNextAction, formatOccasionDate, relativeOccasionLabel } from "../utils/occasionUtils";
import { toneClasses } from "../utils/statusUtils";
import GiftIdeaCard from "./GiftIdeaCard";
import GiftIdeaForm from "./GiftIdeaForm";

interface Props {
  occasion: Occasion;
  onEdit: () => void;
}

export default function OccasionDetail({ occasion, onEdit }: Props) {
  const { addOccasionGiftIdea, updateOccasionGiftIdea, deleteOccasionGiftIdea, updateOccasion, archiveOccasion } = useApp();
  const [adding, setAdding] = useState(false);
  const [editingIdea, setEditingIdea] = useState<GiftIdea | null>(null);

  const { tone, label } = deriveOccasionStatus(occasion);
  const c = toneClasses[tone];
  const meta = OCCASION_META[occasion.type];
  const ideas = occasion.giftIdeas ?? [];

  const togglePurchased = (idea: GiftIdea) =>
    updateOccasionGiftIdea(occasion.id, idea.id, {
      status: idea.status === "purchased" ? "shortlisted" : "purchased",
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`rounded-xl2 p-4 ${c.chipBg}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/70">{meta.emoji} {meta.label}</p>
            <p className="text-base font-semibold text-ink">
              📅 {formatOccasionDate(occasion.date)}
            </p>
          </div>
          <span className="text-sm font-semibold text-ink/80">{relativeOccasionLabel(occasion.date)}</span>
        </div>
        <div className="mt-3">
          <span className={`chip ${c.chipBg} ${c.chipText} border border-current/20`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
            {label}
          </span>
        </div>
      </div>

      {/* Next action */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink/70">Next step</p>
        <p className="mt-1 text-ink font-medium">{occasionSuggestedNextAction(occasion)}</p>
      </div>

      {/* Notes / budget */}
      {(occasion.notes || occasion.budget != null) && (
        <div className="space-y-1 text-sm">
          {occasion.notes && <p className="text-ink/80">{occasion.notes}</p>}
          {occasion.budget != null && <p className="text-muted">Budget: ~${occasion.budget}</p>}
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
              onSubmit={(idea) => { addOccasionGiftIdea(occasion.id, idea); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {editingIdea && (
          <div className="mt-3 rounded-xl border border-accent/30 bg-white p-4">
            <GiftIdeaForm
              initial={editingIdea}
              onSubmit={(patch) => { updateOccasionGiftIdea(occasion.id, editingIdea.id, patch); setEditingIdea(null); }}
              onCancel={() => setEditingIdea(null)}
            />
          </div>
        )}

        {!adding && !editingIdea && (
          <div className="mt-3 space-y-2.5">
            {ideas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/50 p-5 text-center">
                <p className="text-ink font-medium">No ideas yet</p>
                <p className="mt-1 text-sm text-muted">Add a quick thought — it doesn't need to be perfect.</p>
                <button className="btn-primary mt-3" onClick={() => setAdding(true)}>Add the first idea</button>
              </div>
            ) : (
              ideas.map((idea) => (
                <GiftIdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={() => setEditingIdea(idea)}
                  onTogglePurchased={() => togglePurchased(idea)}
                  onDelete={() => deleteOccasionGiftIdea(occasion.id, idea.id)}
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
            checked={!!occasion.readyToGive}
            onChange={(e) => updateOccasion(occasion.id, { readyToGive: e.target.checked })}
            className="h-5 w-5 rounded border-line text-accent focus:ring-accent/40"
          />
          <span className="text-ink">Gift is wrapped &amp; ready 🎉</span>
        </label>
      </section>

      {/* Manage */}
      <section className="flex gap-3 pt-2 border-t border-line">
        <button className="btn-soft flex-1" onClick={onEdit}>Edit details</button>
        <button
          className="btn-ghost flex-1 text-status-red"
          onClick={() => { if (confirm(`Archive "${occasion.title}"?`)) archiveOccasion(occasion.id); }}
        >
          Archive
        </button>
      </section>
    </div>
  );
}
