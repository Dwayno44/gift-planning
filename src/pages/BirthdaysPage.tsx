import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import PersonCard from "../components/PersonCard";
import { sortByNextBirthday } from "../utils/birthdayUtils";
import { deriveStatus, type StatusTone } from "../utils/statusUtils";

interface Props {
  onOpenPerson: (id: string) => void;
  onAddPerson: () => void;
}

type Filter = "all" | StatusTone;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "red", label: "No ideas" },
  { value: "amber", label: "In progress" },
  { value: "green", label: "Sorted" },
];

export default function BirthdaysPage({ onOpenPerson, onAddPerson }: Props) {
  const { people } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = people.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || deriveStatus(p).tone === filter;
      return matchesQuery && matchesFilter;
    });
    return sortByNextBirthday(filtered);
  }, [people, query, filter]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Birthdays</h1>
          <p className="text-sm text-muted">Sorted by who's coming up next</p>
        </div>
        <button className="btn-primary px-4" onClick={onAddPerson}>
          + Add
        </button>
      </header>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        <input
          className="input pl-10"
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search people by name"
        />
      </div>

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

      {people.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl">🎈</p>
          <p className="mt-2 font-semibold text-ink">No people yet</p>
          <p className="mt-1 text-sm text-muted">
            Add the first person and start capturing gift ideas any time of year.
          </p>
          <button className="btn-primary mt-4" onClick={onAddPerson}>
            Add a person
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-6 text-center text-muted">
          <p>No one matches that. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((p) => (
            <PersonCard key={p.id} person={p} onOpen={() => onOpenPerson(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
