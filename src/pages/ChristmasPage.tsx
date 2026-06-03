/**
 * Placeholder for the future Christmas planning page. Routed and reachable now
 * so the navigation is complete; the real per-recipient Christmas tracker will
 * reuse the same data layer and gift-idea components.
 */
export default function ChristmasPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">Christmas</h1>
        <p className="text-sm text-muted">A calmer December, planned ahead.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="bg-status-greenSoft/60 px-6 py-10 text-center">
          <p className="text-4xl">🎄</p>
          <p className="mt-3 text-lg font-semibold text-ink">Christmas planning coming soon</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            A separate space to plan gifts by recipient, track budgets, and avoid the
            last-minute rush — built on the same simple cards you use for birthdays.
          </p>
        </div>
        <ul className="divide-y divide-line text-sm">
          {[
            "Gift tracking per person, just like birthdays",
            "A shared list for the whole household",
            "Budget overview across everyone",
            "Carry ideas over from the year's birthday notes",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 px-5 py-3 text-ink/80">
              <span className="text-status-green">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
