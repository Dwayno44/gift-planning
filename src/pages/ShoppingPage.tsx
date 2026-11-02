import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { GiftIdea } from "../types";
import { daysUntilChristmas } from "../utils/christmasUtils";
import {
  buildShoppingList,
  formatShortDate,
  shoppingListText,
  type ShoppingItem,
} from "../utils/shoppingUtils";

type Horizon = "christmas" | "3m" | "6m" | "all";

const HORIZONS: { value: Horizon; label: string }[] = [
  { value: "christmas", label: "Before Christmas" },
  { value: "3m", label: "Next 3 months" },
  { value: "6m", label: "Next 6 months" },
  { value: "all", label: "Everything" },
];

function horizonDays(h: Horizon): number {
  switch (h) {
    case "christmas": return daysUntilChristmas();
    case "3m": return 91;
    case "6m": return 182;
    case "all": return 366;
  }
}

/** Black Friday = the day after the fourth Thursday of November. */
function blackFriday(year: number): Date {
  const nov1 = new Date(year, 10, 1);
  const firstThu = 1 + ((4 - nov1.getDay() + 7) % 7);
  return new Date(year, 10, firstThu + 22);
}

/** Shown through November up to Cyber Monday, when sale shopping is on. */
function saleBanner(today = new Date()): string | null {
  const bf = blackFriday(today.getFullYear());
  const nov1 = new Date(bf.getFullYear(), 10, 1);
  const afterCyberMonday = new Date(bf.getFullYear(), bf.getMonth(), bf.getDate() + 4);
  if (today < nov1 || today >= afterCyberMonday) return null;
  const day = bf.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  return `Black Friday is ${day} — most sales run all week through Cyber Monday. Tick items off as you buy them.`;
}

export default function ShoppingPage() {
  const { people, occasions, updateGiftIdea, updateChristmasGiftIdea, updateOccasionGiftIdea } = useApp();
  const [horizon, setHorizon] = useState<Horizon>("3m");
  const [message, setMessage] = useState<string | null>(null);
  // Ideas ticked off on this visit → their status before ticking. Keeps them
  // on screen (struck through) so a mis-tap can be undone.
  const [bought, setBought] = useState<Record<string, GiftIdea["status"]>>({});

  const list = useMemo(() => {
    const revert = (ideas?: GiftIdea[]) =>
      ideas?.map((i) => (bought[i.id] ? { ...i, status: bought[i.id] } : i));
    return buildShoppingList(
      people.map((p) => ({ ...p, giftIdeas: revert(p.giftIdeas) ?? [], christmasGiftIdeas: revert(p.christmasGiftIdeas) })),
      occasions.map((o) => ({ ...o, giftIdeas: revert(o.giftIdeas) ?? [] })),
      horizonDays(horizon)
    );
  }, [people, occasions, horizon, bought]);

  const remaining = list.groups
    .map((g) => ({ ...g, items: g.items.filter((it) => !bought[it.idea.id]) }))
    .filter((g) => g.items.length > 0);
  const remainingCount = remaining.reduce((n, g) => n + g.items.length, 0);
  const banner = saleBanner();

  const setStatus = ({ idea, source }: ShoppingItem, status: GiftIdea["status"]) => {
    if (source.kind === "birthday") updateGiftIdea(source.personId, idea.id, { status });
    else if (source.kind === "christmas") updateChristmasGiftIdea(source.personId, idea.id, { status });
    else updateOccasionGiftIdea(source.occasionId, idea.id, { status });
  };

  const toggle = (item: ShoppingItem) => {
    const prev = bought[item.idea.id];
    if (prev) {
      setStatus(item, prev);
      setBought(({ [item.idea.id]: _, ...rest }) => rest);
    } else {
      setStatus(item, "purchased");
      setBought((b) => ({ ...b, [item.idea.id]: item.idea.status }));
    }
  };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const label = HORIZONS.find((h) => h.value === horizon)!.label.toLowerCase();
  const text = () => shoppingListText(remaining, `Gift shopping list (${label})`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      flash("List copied — paste it into Messages or Notes.");
    } catch {
      flash("Couldn't copy on this device.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: "Gift shopping list", text: text() });
    } catch {
      // user dismissed the share sheet
    }
  };

  const { gaps } = list;
  const hasGaps = gaps.birthdays.length + gaps.christmas.length + gaps.occasions.length > 0;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">Shopping list</h1>
        <p className="text-sm text-muted">Every idea not yet bought, by when it's needed.</p>
      </header>

      {banner && (
        <div className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-ink">🏷️ {banner}</div>
      )}

      {/* Horizon chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {HORIZONS.map((h) => (
          <button
            key={h.value}
            onClick={() => setHorizon(h.value)}
            className={`chip shrink-0 border ${
              horizon === h.value ? "bg-accent text-white border-accent" : "bg-white text-muted border-line"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Export */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{remainingCount}</span> to buy
        </p>
        <div className="ml-auto flex gap-2">
          {"share" in navigator && (
            <button className="btn-soft px-3 py-2 text-sm" onClick={handleShare} disabled={remainingCount === 0}>
              Share
            </button>
          )}
          <button className="btn-primary px-4 py-2 text-sm" onClick={handleCopy} disabled={remainingCount === 0}>
            Copy list
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-status-greenSoft px-4 py-3 text-sm text-status-green">{message}</div>
      )}

      {list.groups.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl">🛍️</p>
          <p className="mt-2 font-semibold text-ink">Nothing left to buy</p>
          <p className="mt-1 text-sm text-muted">No open gift ideas in this window. Try a longer one.</p>
        </div>
      ) : (
        list.groups.map((g) => (
          <section key={g.key} className="card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold text-ink">
                {g.emoji} {g.title}
              </h2>
              <span className="shrink-0 text-xs text-muted">
                {formatShortDate(g.date)} · {g.days === 0 ? "today" : `${g.days}d`}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {g.items.map((item) => {
                const { idea, forName } = item;
                const done = !!bought[idea.id];
                return (
                  <li key={idea.id} className="flex items-start gap-3 py-2.5">
                    <button
                      onClick={() => toggle(item)}
                      aria-label={done ? `Unmark ${idea.title}` : `Mark ${idea.title} bought`}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        done ? "border-status-greenVivid bg-status-greenVivid text-white" : "border-line"
                      }`}
                    >
                      {done && "✓"}
                    </button>
                    <div className={`min-w-0 flex-1 ${done ? "opacity-50" : ""}`}>
                      <p className={`font-medium text-ink ${done ? "line-through" : ""}`}>
                        {forName && <span className="text-muted">{forName}: </span>}
                        {idea.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">
                        {idea.status === "shortlisted" && <span>⭐ Shortlisted</span>}
                        {idea.priority === "high" && <span>High priority</span>}
                        {idea.estimatedPrice != null && <span>~${idea.estimatedPrice}</span>}
                        {idea.store && <span>{idea.store}</span>}
                        {idea.notes && <span className="truncate">{idea.notes}</span>}
                      </div>
                    </div>
                    {idea.purchaseUrl && (
                      <a
                        href={idea.purchaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-sm text-accent-ink hover:underline"
                      >
                        Link
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {hasGaps && (
        <section className="card p-4">
          <h2 className="font-semibold text-ink">No ideas yet</h2>
          <p className="mt-1 text-xs text-muted">Nothing bought and nothing on the list — worth a think before the sales.</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {gaps.christmas.length > 0 && (
              <div>
                <dt className="inline font-medium text-ink">🎄 Christmas: </dt>
                <dd className="inline text-muted">{gaps.christmas.join(", ")}</dd>
              </div>
            )}
            {gaps.birthdays.length > 0 && (
              <div>
                <dt className="inline font-medium text-ink">🎂 Birthdays: </dt>
                <dd className="inline text-muted">{gaps.birthdays.join(", ")}</dd>
              </div>
            )}
            {gaps.occasions.length > 0 && (
              <div>
                <dt className="inline font-medium text-ink">🎉 Events: </dt>
                <dd className="inline text-muted">{gaps.occasions.join(", ")}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
