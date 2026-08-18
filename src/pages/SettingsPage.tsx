import { useRef, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { formatBirthdayShort } from "../utils/birthdayUtils";
import { getFirebase, isFirebaseConfigured } from "../lib/firebase";

interface Props {
  onAddPerson: () => void;
  onOpenPerson: (id: string) => void;
}

export default function SettingsPage({ onAddPerson, onOpenPerson }: Props) {
  const {
    people,
    archived,
    themes,
    session,
    exportData,
    importData,
    resetToSample,
    addTheme,
    removeTheme,
    restorePerson,
    deletePerson,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);
  const [newTheme, setNewTheme] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);

  const flash = (kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gift-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flash("ok", "Backup downloaded.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData());
      flash("ok", "Data copied to clipboard.");
    } catch {
      flash("err", "Couldn't copy — try the download instead.");
    }
  };

  const handleFeedback = async () => {
    const text = feedbackText.trim();
    if (!text) return;
    setFeedbackSending(true);
    try {
      if (isFirebaseConfigured()) {
        const { db } = getFirebase();
        await addDoc(collection(db, "feedback"), {
          text,
          email: session.email ?? "unknown",
          createdAt: new Date().toISOString(),
        });
      } else {
        // local mode — open a mailto as fallback
        window.open(`mailto:smithdk44@gmail.com?subject=Gift%20Planner%20feedback&body=${encodeURIComponent(text)}`);
      }
      setFeedbackText("");
      flash("ok", "Thanks! Feedback sent.");
    } catch {
      flash("err", "Couldn't send feedback — try again.");
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importData(text);
      flash("ok", "Data imported successfully.");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "That file couldn't be read.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted">Manage people, themes and your data.</p>
      </header>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "bg-status-greenSoft text-status-green"
              : "bg-status-redSoft text-status-red"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Account + household (cloud sync only) */}
      {session.mode === "cloud" && (
        <>
          <section className="card p-5">
            <h2 className="text-base font-semibold text-ink">Account</h2>
            <p className="mt-1 text-sm text-muted">
              Signed in as <span className="font-medium text-ink">{session.email}</span>. Your list
              syncs live across every signed-in device.
            </p>
            <button className="btn-soft mt-3" onClick={session.signOut}>
              Sign out
            </button>
          </section>

          {session.inviteCode && (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-ink">
                {session.householdName ?? "Household"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Share this code with friends or family so they can join your household and see the shared list.
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent-soft px-4 py-3">
                <span className="font-mono text-2xl font-bold tracking-[0.2em] text-accent-ink">
                  {session.inviteCode}
                </span>
                <button
                  className="btn-soft ml-auto px-3 py-1.5 text-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(session.inviteCode!);
                      flash("ok", "Invite code copied!");
                    } catch {
                      flash("err", "Couldn't copy — select the code manually.");
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* People */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">People</h2>
          <button className="btn-soft px-3 py-2 text-sm" onClick={onAddPerson}>
            + Add person
          </button>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {people.length === 0 && <li className="py-2 text-sm text-muted">No people yet.</li>}
          {people.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onOpenPerson(p.id)}
                className="flex w-full items-center justify-between py-2.5 text-left"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span className="text-sm text-muted">{formatBirthdayShort(p.birthday)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Themes */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink">Gift themes</h2>
        <p className="mt-1 text-sm text-muted">Used when tagging people and ideas.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {themes.map((t) => (
            <span key={t} className="chip bg-accent-soft text-accent-ink">
              {t}
              <button
                onClick={() => removeTheme(t)}
                className="ml-1 text-accent-ink/60 hover:text-status-red"
                aria-label={`Remove ${t}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTheme(newTheme);
            setNewTheme("");
          }}
        >
          <input
            className="input"
            value={newTheme}
            placeholder="Add a theme, e.g. Puzzles"
            onChange={(e) => setNewTheme(e.target.value)}
          />
          <button type="submit" className="btn-soft px-4" disabled={!newTheme.trim()}>
            Add
          </button>
        </form>
      </section>

      {/* Data management */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink">Backup &amp; data</h2>
        <p className="mt-1 text-sm text-muted">
          Everything is stored privately on this device. Export a backup to keep it safe or move it
          to another phone. The JSON file can also be edited or generated with help from Codex.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          <button className="btn-primary" onClick={handleExport}>
            Export backup (JSON)
          </button>
          <button className="btn-soft" onClick={handleCopy}>
            Copy data to clipboard
          </button>
          <button className="btn-soft" onClick={() => fileRef.current?.click()}>
            Import from file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">Archived people</h2>
          <ul className="mt-3 divide-y divide-line">
            {archived.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-ink">{p.name}</span>
                <div className="flex gap-2">
                  <button className="btn-soft px-3 py-1.5 text-sm" onClick={() => restorePerson(p.id)}>
                    Restore
                  </button>
                  <button
                    className="btn-ghost px-3 py-1.5 text-sm text-status-red"
                    onClick={() => {
                      if (confirm(`Permanently delete ${p.name}? This can't be undone.`)) {
                        deletePerson(p.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Feedback */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink">Send feedback</h2>
        <p className="mt-1 text-sm text-muted">
          Something broken? Missing a feature? Let us know.
        </p>
        <textarea
          className="input mt-3 min-h-[88px] resize-y"
          placeholder="What's on your mind…"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        <button
          className="btn-primary mt-2 w-full"
          disabled={!feedbackText.trim() || feedbackSending}
          onClick={handleFeedback}
        >
          {feedbackSending ? "Sending…" : "Send feedback"}
        </button>
      </section>

      {/* Danger zone */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink">Reset</h2>
        <p className="mt-1 text-sm text-muted">
          Restore the original sample data. This replaces everything currently saved.
        </p>
        <button
          className="btn-ghost mt-3 text-status-red"
          onClick={() => {
            if (confirm("Replace all current data with the sample data?")) {
              resetToSample();
              flash("ok", "Sample data restored.");
            }
          }}
        >
          Reset to sample data
        </button>
      </section>
    </div>
  );
}
