import { useState } from "react";
import { isCalendarSyncAvailable, looksLikeCalendarLink } from "../utils/calendarFeed";

interface Props {
  currentUrl: string | null;
  checking: boolean;
  error: string | null;
  onSave: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}

export default function CalendarLinkForm({ currentUrl, checking, error, onSave, onRemove, onCancel }: Props) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [copied, setCopied] = useState(false);
  const valid = looksLikeCalendarLink(url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the field is still selectable by hand
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(url.trim());
      }}
    >
      <p className="text-sm text-muted">
        Paste a shared calendar link and the app will check it each time you open Events, suggesting
        any parties, showers or weddings that aren't on your list yet.
      </p>

      <div>
        <label className="label" htmlFor="cal-url">Calendar link</label>
        <div className="flex gap-2">
          <input
            id="cal-url"
            className="input font-mono text-xs"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="webcal://p01-caldav.icloud.com/published/2/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="button" className="btn-soft shrink-0 px-3 text-sm" onClick={copy} disabled={!url.trim()}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {url.trim() && !valid && (
          <p className="mt-1 text-xs text-status-red">Links start with webcal:// or https://</p>
        )}
      </div>

      <details className="rounded-xl bg-accent-soft/50 px-3 py-2 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-ink">How to get the link on iPhone</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Open the <strong>Calendar</strong> app and tap <strong>Calendars</strong> at the bottom.</li>
          <li>Tap the <strong>ⓘ</strong> next to the calendar you want.</li>
          <li>Turn on <strong>Public Calendar</strong>, then tap <strong>Share Link…</strong> → <strong>Copy</strong>.</li>
          <li>Paste it above.</li>
        </ol>
        <p className="mt-2 text-xs">
          Anyone with a public link can view that calendar, so treat it like a private address.
        </p>
      </details>

      {!isCalendarSyncAvailable() && (
        <p className="rounded-xl bg-status-amberSoft px-3 py-2 text-sm text-status-amber">
          Calendar checking isn't switched on yet. You can save the link now and it'll start working once it is.
        </p>
      )}
      {error && <p className="rounded-xl bg-status-redSoft px-3 py-2 text-sm text-status-red">{error}</p>}

      <div className="flex gap-3 border-t border-line pt-3">
        {currentUrl ? (
          <button type="button" className="btn-ghost text-status-red" onClick={onRemove}>
            Remove
          </button>
        ) : (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary flex-1" disabled={!valid || checking}>
          {checking ? "Checking…" : "Save & check"}
        </button>
      </div>
    </form>
  );
}
