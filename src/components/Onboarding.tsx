import { useState } from "react";
import type { User } from "firebase/auth";
import { signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createHousehold, joinHousehold, getFirebase } from "../lib/firebase";
import type { HouseholdMeta } from "../lib/firebase";

interface Props {
  user: User;
  onComplete: (meta: HouseholdMeta) => void;
}

type Tab = "create" | "join";

export default function Onboarding({ user, onComplete }: Props) {
  const [tab, setTab] = useState<Tab>("create");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = householdName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const meta = await createHousehold(user.uid, name);
      onComplete(meta);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const householdId = await joinHousehold(user.uid, inviteCode);
      const { db } = getFirebase();
      const snap = await getDoc(doc(db, "households", householdId));
      const data = snap.data() ?? {};
      onComplete({
        householdId,
        name: data.name ?? "Household",
        inviteCode: data.inviteCode ?? "",
        adminUid: data.adminUid ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="card w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <img
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt=""
            className="mx-auto mb-3 h-14 w-14 rounded-2xl object-contain"
          />
          <h1 className="text-xl font-bold text-ink">Welcome to Gift Planner</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="font-medium text-ink">{user.email}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-line/30 p-1 mb-5">
          {(["create", "join"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                tab === t ? "bg-surface shadow text-ink" : "text-muted"
              }`}
            >
              {t === "create" ? "New household" : "Join with code"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-status-redSoft px-3 py-2 text-sm text-status-red">{error}</p>
        )}

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label" htmlFor="hh-name">Household name</label>
              <input
                id="hh-name"
                className="input"
                autoFocus
                placeholder="e.g. The Smiths"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">Your family or group — shown to everyone you invite.</p>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={busy || !householdName.trim()}
            >
              {busy ? "Creating…" : "Create household"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="label" htmlFor="hh-code">Invite code</label>
              <input
                id="hh-code"
                className="input font-mono tracking-widest uppercase text-center text-lg"
                autoFocus
                placeholder="ABC123"
                maxLength={6}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
              <p className="mt-1 text-xs text-muted">Ask the household creator for their 6-character code.</p>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={busy || inviteCode.trim().length < 3}
            >
              {busy ? "Joining…" : "Join household"}
            </button>
          </form>
        )}

        <button
          className="mt-4 w-full text-xs text-muted hover:text-ink"
          onClick={() => fbSignOut(getFirebase().auth)}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
