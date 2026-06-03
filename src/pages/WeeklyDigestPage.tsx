import { useApp } from "../context/AppContext";
import WeeklyDigest from "../components/WeeklyDigest";

interface Props {
  onOpenPerson: (id: string) => void;
}

export default function WeeklyDigestPage({ onOpenPerson }: Props) {
  const { people } = useApp();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">Weekly digest</h1>
        <p className="text-sm text-muted">
          Your gentle 6-week planning window — tackle the top group first.
        </p>
      </header>

      <WeeklyDigest people={people} onOpenPerson={onOpenPerson} />

      <p className="px-1 pt-2 text-center text-xs text-muted">
        Coming later: email summaries, push notifications &amp; calendar sync.
      </p>
    </div>
  );
}
