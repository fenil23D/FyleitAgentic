import RegisterForm from "../components/RegisterForm";
import logo from "../assets/logo.jpeg";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-surface px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-brand-pink/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-brand-navy/15 blur-3xl" />
      </div>
      <div className="relative mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-2">
        <section className="flex flex-col justify-center rounded-3xl bg-brand-navy px-7 py-10 text-white shadow-brand">
          <img
            src={logo}
            alt="Fyle logo"
            className="mb-8 h-auto w-56 rounded-2xl border border-white/20 bg-white p-3"
          />
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Welcome to Fyle Tax Return
          </h2>
          <p className="mt-4 font-body text-sm text-slate-200">
            Register once and securely manage your return from a single, verified account.
          </p>
          <div className="mt-8 rounded-xl border border-white/20 bg-white/10 p-4">
            <p className="font-body text-xs uppercase tracking-widest text-brand-pink">
              Security First
            </p>
            <p className="mt-1 font-body text-sm text-slate-100">
              Email verification is required before sign-in access is enabled.
            </p>
          </div>
        </section>
        <section className="self-center">
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}

