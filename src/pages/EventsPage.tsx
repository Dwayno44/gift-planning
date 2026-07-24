import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import OccasionCard from "../components/OccasionCard";
import OccasionDetail from "../components/OccasionDetail";
import OccasionForm from "../components/OccasionForm";
import Modal from "../components/Modal";
import { daysUntilOccasion } from "../utils/occasionUtils";

export default function EventsPage() {
  const { occasions, addOccasion, updateOccasion } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);

  const { upcoming, past } = useMemo(() => {
    const active = occasions.filter((o) => !o.archived);
    const upcoming = active
      .filter((o) => daysUntilOccasion(o.date) >= -30)
      .sort((a, b) => daysUntilOccasion(a.date) - daysUntilOccasion(b.date));
    const past = active
      .filter((o) => daysUntilOccasion(o.date) < -30)
      .sort((a, b) => daysUntilOccasion(b.date) - daysUntilOccasion(a.date));
    return { upcoming, past };
  }, [occasions]);

  const selected = selectedId ? occasions.find((o) => o.id === selectedId) ?? null : null;
  const editing = formState?.mode === "edit" ? occasions.find((o) => o.id === formState.id) ?? null : null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Events</h1>
          <p className="text-sm text-muted">Weddings, baby showers, and more</p>
        </div>
        <button className="btn-primary px-4" onClick={() => setFormState({ mode: "add" })}>
          + Add
        </button>
      </header>

      {occasions.filter((o) => !o.archived).length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 font-semibold text-ink">No events yet</p>
          <p className="mt-1 text-sm text-muted">
            Track gifts for weddings, baby showers, housewarmings and more.
          </p>
          <button className="btn-primary mt-4" onClick={() => setFormState({ mode: "add" })}>
            Add an event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Upcoming · {upcoming.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcoming.map((o) => (
                  <OccasionCard key={o.id} occasion={o} onOpen={() => setSelectedId(o.id)} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Past · {past.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {past.map((o) => (
                  <OccasionCard key={o.id} occasion={o} onOpen={() => setSelectedId(o.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected && !formState} title={selected?.title ?? ""} onClose={() => setSelectedId(null)}>
        {selected && (
          <OccasionDetail
            occasion={selected}
            onEdit={() => setFormState({ mode: "edit", id: selected.id })}
          />
        )}
      </Modal>

      {/* Add / edit modal */}
      <Modal
        open={!!formState}
        title={formState?.mode === "edit" ? "Edit event" : "Add an event"}
        onClose={() => setFormState(null)}
      >
        {formState && (
          <OccasionForm
            initial={editing ?? undefined}
            onSubmit={(data, id) => {
              if (id) {
                updateOccasion(id, data);
              } else {
                const created = addOccasion(data);
                setSelectedId(created.id);
              }
              setFormState(null);
            }}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>
    </div>
  );
}
