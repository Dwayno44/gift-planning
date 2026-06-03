import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { getFirebase, isEmailAllowed } from "../lib/firebase";

const EMAIL_KEY = "gift-planner:emailForSignIn";

/** The sign-in URL the magic link returns to — works locally and on Pages. */
function actionUrl(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

/**
 * Passwordless email-link sign-in screen. The user enters their email, we send
 * a one-time link, and completing it (handled in AppContext on load) signs
 * them in. Shown by the cloud provider whenever no one is signed in.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    if (!isEmailAllowed(addr)) {
      setError("That email isn't on the household list. Check the address, or ask to be added.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { auth } = getFirebase();
      await sendSignInLinkToEmail(auth, addr, { url: actionUrl(), handleCodeInApp: true });
      window.localStorage.setItem(EMAIL_KEY, addr);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link. Please try again.");
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

        {sent ? (
          <div className="mt-4">
            <p className="text-3xl">📬</p>
            <p className="mt-2 font-medium text-ink">Check your email</p>
            <p className="mt-1 text-sm text-muted">
              We sent a sign-in link to <span className="font-medium">{email.trim()}</span>. Open it
              on this device to sign in.
            </p>
            <button className="btn-ghost mt-4 w-full" onClick={() => setSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3 text-left">
            <p className="text-center text-sm text-muted">
              Sign in to see your shared list on any device.
            </p>
            <div>
              <label className="label" htmlFor="login-email">Your email</label>
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
            {error && (
              <p className="rounded-xl bg-status-redSoft px-3 py-2 text-sm text-status-red">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export { EMAIL_KEY };
