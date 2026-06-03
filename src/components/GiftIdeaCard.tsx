import type { GiftIdea } from "../types";

interface Props {
  idea: GiftIdea;
  onEdit: () => void;
  onTogglePurchased: () => void;
  onDelete: () => void;
}

const STATUS_LABEL: Record<GiftIdea["status"], string> = {
  idea: "Idea",
  exploring: "Exploring",
  shortlisted: "Shortlisted",
  purchased: "Purchased",
  rejected: "Not this one",
};

const PRIORITY_LABEL: Record<NonNullable<GiftIdea["priority"]>, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** A single captured gift idea, with quick "mark purchased" and edit actions. */
export default function GiftIdeaCard({ idea, onEdit, onTogglePurchased, onDelete }: Props) {
  const purchased = idea.status === "purchased";
  const rejected = idea.status === "rejected";

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        purchased
          ? "border-status-green/30 bg-status-greenSoft/50"
          : rejected
          ? "border-line bg-white/50 opacity-70"
          : "border-line bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold text-ink ${rejected ? "line-through" : ""}`}>{idea.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span className="chip bg-accent-soft text-accent-ink py-0.5">{STATUS_LABEL[idea.status]}</span>
            {idea.theme && <span className="chip bg-line/70 text-ink/70 py-0.5">{idea.theme}</span>}
            {idea.priority && idea.priority !== "medium" && (
              <span className="py-0.5">{PRIORITY_LABEL[idea.priority]} priority</span>
            )}
            {idea.estimatedPrice != null && <span className="py-0.5">~${idea.estimatedPrice}</span>}
            {idea.store && <span className="py-0.5">· {idea.store}</span>}
          </div>
        </div>
      </div>

      {idea.notes && <p className="mt-2 text-sm text-ink/80">{idea.notes}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {idea.purchaseUrl && (
          <a
            href={idea.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-3 py-2 text-sm text-accent-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" strokeLinecap="round" />
              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" strokeLinecap="round" />
            </svg>
            Open link
          </a>
        )}
        <button onClick={onEdit} className="btn-ghost px-3 py-2 text-sm">Edit</button>
        <button onClick={onTogglePurchased} className="btn-ghost px-3 py-2 text-sm">
          {purchased ? "Unmark purchased" : "Mark purchased"}
        </button>
        <button onClick={onDelete} className="btn-ghost px-3 py-2 text-sm text-status-red ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}
