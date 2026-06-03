import { useState } from "react";
import type { GiftIdea, GiftIdeaStatus, Priority } from "../types";
import { useApp } from "../context/AppContext";

interface Props {
  initial?: GiftIdea;
  onSubmit: (idea: Omit<GiftIdea, "id" | "dateAdded">) => void;
  onCancel?: () => void;
}

const STATUS_OPTIONS: { value: GiftIdeaStatus; label: string }[] = [
  { value: "idea", label: "Just an idea" },
  { value: "exploring", label: "Exploring" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "purchased", label: "Purchased" },
  { value: "rejected", label: "Not this one" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/**
 * Add / edit a gift idea. Progressive disclosure: only the title is required
 * and shown by default; "Add more details" reveals the optional fields so a
 * rough thought can be captured in two taps.
 */
export default function GiftIdeaForm({ initial, onSubmit, onCancel }: Props) {
  const { themes } = useApp();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [purchaseUrl, setPurchaseUrl] = useState(initial?.purchaseUrl ?? "");
  const [estimatedPrice, setEstimatedPrice] = useState(
    initial?.estimatedPrice != null ? String(initial.estimatedPrice) : ""
  );
  const [store, setStore] = useState(initial?.store ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [status, setStatus] = useState<GiftIdeaStatus>(initial?.status ?? "idea");
  const [showMore, setShowMore] = useState(
    !!(initial?.notes || initial?.purchaseUrl || initial?.store || initial?.estimatedPrice)
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const price = parseFloat(estimatedPrice);
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      theme: theme || undefined,
      purchaseUrl: purchaseUrl.trim() || undefined,
      estimatedPrice: Number.isFinite(price) ? price : undefined,
      store: store.trim() || undefined,
      priority,
      status,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="idea-title">
          What's the idea? <span className="text-status-red">*</span>
        </label>
        <input
          id="idea-title"
          className="input"
          value={title}
          autoFocus
          placeholder="e.g. Cosy reading lamp"
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted">
          That's enough to save — no need to fill in the rest.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="idea-url">
          Paste a link (optional)
        </label>
        <input
          id="idea-url"
          className="input"
          type="url"
          inputMode="url"
          value={purchaseUrl}
          placeholder="https://…"
          onChange={(e) => setPurchaseUrl(e.target.value)}
        />
      </div>

      {!showMore && (
        <button type="button" className="btn-ghost w-full" onClick={() => setShowMore(true)}>
          + Add more details
        </button>
      )}

      {showMore && (
        <div className="space-y-4 rounded-xl bg-white/60 border border-line p-4">
          <div>
            <label className="label" htmlFor="idea-theme">Theme</label>
            <select id="idea-theme" className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">No theme</option>
              {themes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="idea-price">Approx. price</label>
              <input
                id="idea-price"
                className="input"
                inputMode="decimal"
                value={estimatedPrice}
                placeholder="0"
                onChange={(e) => setEstimatedPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="idea-store">Store / vendor</label>
              <input
                id="idea-store"
                className="input"
                value={store}
                placeholder="e.g. Etsy"
                onChange={(e) => setStore(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="idea-notes">Notes</label>
            <textarea
              id="idea-notes"
              className="input min-h-[80px] resize-y"
              value={notes}
              placeholder="Anything to remember…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <span className="label">Priority</span>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setPriority(o.value)}
                  className={`chip flex-1 justify-center border ${
                    priority === o.value
                      ? "bg-accent-soft text-accent-ink border-accent/40"
                      : "bg-white text-muted border-line"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="idea-status">Status</label>
            <select
              id="idea-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as GiftIdeaStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary flex-1" disabled={!title.trim()}>
          {initial ? "Save idea" : "Add idea"}
        </button>
      </div>
    </form>
  );
}
