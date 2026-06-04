import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";
import { getFirebase, isEmailAllowed } from "../lib/firebase";

/** Map Firebase auth error codes to friendly, non-technical messages. */
function friendly(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/network-request-failed":
      return "Network problem — check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

/**
 * Email + password sign-in, gated to the household allow-list. First time an
 * allowed email is used, the account is created automatically (no separate
 * sign-up step, no email verification). Firebase keeps the session signed in
 * across reloads, so this is shown only when nobody is signed in.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr || !password) return;
    if (!isEmailAllowed(addr)) {
      setError("That email isn't on the household list. Check the address, or ask to be added.");
      return;
    }
    if (password.length < 6) {
      setError("Pick a password of at least 6 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    const { auth } = getFirebase();
    try {
      await signInWithEmailAndPassword(auth, addr, password);
      // success → AppContext's auth listener swaps in the app
    } catch (err) {
      const code = (err as AuthError).code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        // Could be a brand-new account — try creating it with this password.
        try {
          await createUserWithEmailAndPassword(auth, addr, password);
        } catch (err2) {
          const code2 = (err2 as AuthError).code;
          if (code2 === "auth/email-already-in-use") {
            setError("That password doesn't match this email. Please try again.");
          } else if (code2 === "auth/weak-password") {
            setError("Pick a password of at least 6 characters.");
          } else {
            setError(friendly(code2));
          }
        }
      } else {
        setError(friendly(code));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="card w-full max-w-sm p-6 text-center">
        <img
          src={`${import.meta.env.BASE_URL}icon.png`}
          alt=""
          className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain"
        />
        <h1 className="text-xl font-bold text-ink">Gift Planner</h1>
        <p className="mt-1 text-sm text-muted">Sign in to see your shared list on any device.</p>

        <form onSubmit={submit} className="mt-5 space-y-3 text-left">
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-status-redSoft px-3 py-2 text-sm text-status-red">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy || !email.trim() || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-muted">
            First time? Just choose a password — we'll create your account.
          </p>
        </form>
      </div>
    </div>
  );
}
