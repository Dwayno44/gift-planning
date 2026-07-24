import { useState } from "react";
import { useApp } from "./context/AppContext";
import BirthdaysPage from "./pages/BirthdaysPage";
import WeeklyDigestPage from "./pages/WeeklyDigestPage";
import SettingsPage from "./pages/SettingsPage";
import ChristmasPage from "./pages/ChristmasPage";
import EventsPage from "./pages/EventsPage";
import Modal from "./components/Modal";
import PersonDetail from "./components/PersonDetail";
import PersonForm from "./components/PersonForm";

type Page = "birthdays" | "digest" | "christmas" | "events" | "settings";

interface NavItem {
  page: Page;
  label: string;
  icon: JSX.Element;
}

const NAV: NavItem[] = [
  {
    page: "birthdays",
    label: "Birthdays",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 21h16v-7H4v7zM5 14V11a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" strokeLinecap="round" />
        <path d="M12 8V5M9 5.5c0-1 .8-1.5 1.5-2.5C11.2 3.7 12 4 12 5M12 5c0-1 .8-1.3 1.5-2.5C14.2 3.5 15 4.5 15 5.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    page: "digest",
    label: "Digest",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    page: "christmas",
    label: "Christmas",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l5 7h-3l4 6H6l4-6H7l5-7zM12 16v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    page: "events",
    label: "Events",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    page: "settings",
    label: "Settings",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13H3a2 2 0 0 1 0-4h.2A1.7 1.7 0 0 0 4.3 6L4.2 6a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 2.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 0 1 0 4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const TITLES: Record<Page, string> = {
  birthdays: "Birthdays",
  digest: "Weekly digest",
  christmas: "Christmas",
  events: "Events",
  settings: "Settings",
};

export default function App() {
  const { people, addPerson, updatePerson } = useApp();
  const [page, setPage] = useState<Page>("birthdays");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);

  const selected = selectedId ? people.find((p) => p.id === selectedId) ?? null : null;
  const editing =
    formState?.mode === "edit" ? people.find((p) => p.id === formState.id) ?? null : null;

  const openPerson = (id: string) => setSelectedId(id);
  const openAdd = () => setFormState({ mode: "add" });

  return (
    <div className="min-h-screen bg-cream">
      {/* App bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
            {/* scale up + clip to crop the icon's internal whitespace so the
                illustration fills the tile boldly */}
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt=""
              className="h-full w-full scale-[1.3] object-cover"
            />
          </span>
          <h1 className="text-lg font-bold text-ink">Gift Planner</h1>
          <span className="ml-auto text-sm text-muted">{TITLES[page]}</span>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        {page === "birthdays" && <BirthdaysPage onOpenPerson={openPerson} onAddPerson={openAdd} />}
        {page === "digest" && <WeeklyDigestPage onOpenPerson={openPerson} />}
        {page === "christmas" && <ChristmasPage />}
        {page === "events" && <EventsPage />}
        {page === "settings" && <SettingsPage onOpenPerson={openPerson} onAddPerson={openAdd} />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur [padding-bottom:var(--safe-bottom)]">
        <div className="mx-auto flex max-w-2xl">
          {NAV.map((item) => {
            const active = page === item.page;
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className={active ? "scale-110 transition" : "transition"}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Person detail */}
      <Modal open={!!selected && !formState} title={selected?.name ?? ""} onClose={() => setSelectedId(null)}>
        {selected && (
          <PersonDetail
            person={selected}
            onEdit={() => setFormState({ mode: "edit", id: selected.id })}
          />
        )}
      </Modal>

      {/* Add / edit person */}
      <Modal
        open={!!formState}
        title={formState?.mode === "edit" ? "Edit person" : "Add a person"}
        onClose={() => setFormState(null)}
      >
        {formState && (
          <PersonForm
            initial={editing ?? undefined}
            onCancel={() => setFormState(null)}
            onSubmit={(data, id) => {
              if (id) {
                updatePerson(id, data);
              } else {
                const created = addPerson(data);
                setSelectedId(created.id); // jump straight into the new person
              }
              setFormState(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
