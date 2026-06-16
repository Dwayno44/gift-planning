import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import ChristmasPersonCard from "../components/ChristmasPersonCard";
import ChristmasPersonDetail from "../components/ChristmasPersonDetail";
import Modal from "../components/Modal";
import { deriveChristmasStatus, type StatusTone } from "../utils/statusUtils";
import { daysUntilChristmas, christmasCountdownLabel } from "../utils/christmasUtils";

type Filter = "all" | StatusTone;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "red", label: "No ideas" },
  { value: "amber", label: "In progress" },
  { value: "green", label: "Sorted" },
];

const TONE_ORDER: Record<StatusTone, number> = { red: 0, amber: 1, green: 2 };

export default function ChristmasPage() {
  const { people } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const days = daysUntilChristmas();
  const countdownLabel = christmasCountdownLabel(days);

  const sorted = useMemo(() => {
    const visible = people.filter((p) => {
      if (filter === "all") return true;
      return deriveChristmasStatus(p).tone === filter;
    });
    return [...visible].sort((a, b) => {
      const ta = TONE_ORDER[deriveChristmasStatus(a).tone];
      const tb = TONE_ORDER[deriveChristmasStatus(b).tone];
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    });
  }, [people, filter]);

  const totals = useMemo(() => {
    const all = people.length;
    const sorted = people.filter((p) => deriveChristmasStatus(p).tone === "green").length;
    return { all, sorted };
  }, [people]);

  const selected = selectedId ? people.find((p) => p.id === selectedId) ?? null : null;

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Christmas</h1>
            <p className="text-sm text-muted">A calmer December, planned ahead.</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-accent-ink">🎄 {countdownLabel}</p>
            <p className="text-xs text-muted mt-0.5">{totals.sorted} of {totals.all} sorted</p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {totals.all > 0 && (
        <div className="h-2 w-full rounded-full bg-line overflow-hidden">
          <div
            className="h-full rounded-full bg-status-greenVivid transition-all"
            style={{ width: `${(totals.sorted / totals.all) * 100}%` }}
          />
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip shrink-0 border ${
              filter === f.value
                ? "bg-accent text-white border-accent"
                : "bg-white text-muted border-line"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {people.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl">🎄</p>
          <p className="mt-2 font-semibold text-ink">No people yet</p>
          <p className="mt-1 text-sm text-muted">
            Add people from the Birthdays tab to start planning Christmas gifts.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-6 text-center text-muted">
          <p>No one matches that filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((p) => (
            <ChristmasPersonCard key={p.id} person={p} onOpen={() => setSelectedId(p.id)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setSelectedId(null)}
      >
        {selected && <ChristmasPersonDetail person={selected} />}
      </Modal>
    </div>
  );
}
