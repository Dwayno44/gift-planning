import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import OccasionCard from "../components/OccasionCard";
import OccasionDetail from "../components/OccasionDetail";
import OccasionForm from "../components/OccasionForm";
import CalendarImportModal from "../components/CalendarImportModal";
import CalendarLinkForm from "../components/CalendarLinkForm";
import Modal from "../components/Modal";
import { daysUntilOccasion } from "../utils/occasionUtils";
import { parseICS, matchCalEvents } from "../utils/icsParser";
import type { MatchedCalEvent } from "../utils/icsParser";
import { calEventKey, fetchNewCalendarEvents, isCalendarSyncAvailable } from "../utils/calendarFeed";

export default function EventsPage() {
  const { occasions, addOccasion, updateOccasion, calendarFeed, setCalendarUrl, dismissCalendarEvents } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);
  const [importMatches, setImportMatches] = useState<MatchedCalEvent[] | null>(null);
  // Where the open import list came from — feed events left unticked are remembered as skipped
  const [importSource, setImportSource] = useState<"file" | "feed">("file");
  const [linkOpen, setLinkOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [feedMatches, setFeedMatches] = useState<MatchedCalEvent[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const feedUrl = calendarFeed?.url ?? null;

  const checkFeed = async (url: string): Promise<MatchedCalEvent[] | null> => {
    if (!isCalendarSyncAvailable()) return null;
    setChecking(true);
    setLinkError(null);
    try {
      const fresh = await fetchNewCalendarEvents(url, occasions, calendarFeed?.url === url ? calendarFeed.dismissed : []);
      setFeedMatches(fresh);
      return fresh;
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Couldn't reach the calendar.");
      return null;
    } finally {
      setChecking(false);
    }
  };

  // Quietly check the subscribed calendar whenever the Events tab opens
  useEffect(() => {
    if (feedUrl) checkFeed(feedUrl);
    else setFeedMatches([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedUrl]);

  const handleSaveLink = async (url: string) => {
    setCalendarUrl(url);
    const fresh = await checkFeed(url);
    if (fresh) {
      setLinkOpen(false);
      setImportSource("feed");
      setImportMatches(fresh);
    } else if (!isCalendarSyncAvailable()) {
      setLinkOpen(false);
    }
  };

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
      setImportSource("file");
      setImportMatches(fresh);
    } catch {
      alert("Couldn't read that file — make sure it's an .ics calendar export.");
    }
  };

  const handleImportConfirm = (selected: MatchedCalEvent[]) => {
    for (const { event, suggestedType } of selected) {
      addOccasion({ title: event.summary, type: suggestedType, date: event.date });
    }
    if (importSource === "feed" && importMatches) {
      // Added and unticked alike — don't offer these again
      dismissCalendarEvents(importMatches.map(calEventKey));
      setFeedMatches([]);
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
            onClick={() => {
              setLinkError(null);
              setLinkOpen(true);
            }}
            title="Subscribe to a shared calendar link"
          >
            🔗{feedUrl ? " Linked" : " Link"}
          </button>
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

      {feedMatches.length > 0 && importMatches === null && (
        <button
          className="card flex w-full items-center gap-3 p-4 text-left"
          onClick={() => {
            setImportSource("feed");
            setImportMatches(feedMatches);
          }}
        >
          <span className="text-2xl">📅</span>
          <span className="flex-1">
            <span className="block font-semibold text-ink">
              {feedMatches.length} new event{feedMatches.length !== 1 ? "s" : ""} on your calendar
            </span>
            <span className="block text-sm text-muted">Tap to review and add</span>
          </span>
          <span className="text-accent-ink">→</span>
        </button>
      )}

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

      {/* Calendar link modal */}
      <Modal open={linkOpen} title="Calendar link" onClose={() => setLinkOpen(false)}>
        {linkOpen && (
          <CalendarLinkForm
            currentUrl={feedUrl}
            checking={checking}
            error={linkError}
            onSave={handleSaveLink}
            onRemove={() => {
              setCalendarUrl(null);
              setLinkOpen(false);
            }}
            onCancel={() => setLinkOpen(false)}
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
