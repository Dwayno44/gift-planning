import { useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import OccasionCard from "../components/OccasionCard";
import OccasionDetail from "../components/OccasionDetail";
import OccasionForm from "../components/OccasionForm";
import CalendarImportModal from "../components/CalendarImportModal";
import Modal from "../components/Modal";
import { daysUntilOccasion } from "../utils/occasionUtils";
import { parseICS, matchCalEvents } from "../utils/icsParser";
import type { MatchedCalEvent } from "../utils/icsParser";

export default function EventsPage() {
  const { occasions, addOccasion, updateOccasion } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);
  const [importMatches, setImportMatches] = useState<MatchedCalEvent[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleICSFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";
    try {
      const text = await file.text();
      const events = parseICS(text);
      const matches = matchCalEvents(events);
      // Filter out events already tracked (by title+date match)
      const existingKeys = new Set(occasions.map((o) => `${o.title.toLowerCase()}|${o.date}`));
      const fresh = matches.filter(
        (m) => !existingKeys.has(`${m.event.summary.toLowerCase()}|${m.event.date}`)
      );
      setImportMatches(fresh);
    } catch {
      alert("Couldn't read that file — make sure it's an .ics calendar export.");
    }
  };

  const handleImportConfirm = (selected: MatchedCalEvent[]) => {
    for (const { event, suggestedType } of selected) {
      addOccasion({ title: event.summary, type: suggestedType, date: event.date });
    }
    setImportMatches(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Events</h1>
          <p className="text-sm text-muted">Weddings, baby showers, and more</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="btn-soft px-3 py-2 text-sm"
            onClick={() => fileRef.current?.click()}
            title="Import from Apple Calendar (.ics)"
          >
            📅 Import
          </button>
          <button className="btn-primary px-4" onClick={() => setFormState({ mode: "add" })}>
            + Add
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={handleICSFile}
        />
      </header>

      {occasions.filter((o) => !o.archived).length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 font-semibold text-ink">No events yet</p>
          <p className="mt-1 text-sm text-muted">
            Add one manually or tap <strong>📅 Import</strong> to pull events from your Apple Calendar.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button className="btn-primary" onClick={() => setFormState({ mode: "add" })}>
              Add an event
            </button>
            <button className="btn-soft" onClick={() => fileRef.current?.click()}>
              📅 Import from calendar
            </button>
          </div>
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

      {/* Calendar import modal */}
      <Modal
        open={importMatches !== null}
        title="Import from calendar"
        onClose={() => setImportMatches(null)}
      >
        {importMatches !== null && (
          <CalendarImportModal
            matches={importMatches}
            onImport={handleImportConfirm}
            onCancel={() => setImportMatches(null)}
          />
        )}
      </Modal>

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
