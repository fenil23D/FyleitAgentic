import { Link, useLocation } from "react-router-dom";

type LocationState = { email?: string };

export default function VerifyEmailPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-pink/10 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-brand">
        <h1 className="font-heading text-3xl font-bold text-brand-navy">Verify your email</h1>
        <p className="mt-4 font-body text-slate-600">
          We sent a verification link to{" "}
          <span className="font-semibold text-brand-ink">{state?.email ?? "your inbox"}</span>.
          Please verify before logging in.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex rounded-xl border border-brand-navy px-4 py-2 font-body text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
        >
          Back to registration
        </Link>
      </div>
    </main>
  );
}

