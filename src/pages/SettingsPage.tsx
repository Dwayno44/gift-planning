import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { formatBirthdayShort } from "../utils/birthdayUtils";

interface Props {
  onAddPerson: () => void;
  onOpenPerson: (id: string) => void;
}

export default function SettingsPage({ onAddPerson, onOpenPerson }: Props) {
  const {
    people,
    archived,
    themes,
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
