import { hasSupabaseConfig } from "@/lib/supabase/config";
import { signInWithEmailPassword } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabaseConfigured = hasSupabaseConfig();

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Sign in</h1>
        <p>
          Use your Fulscann account to access the dashboard for your role. Super Admin and Analyst access should be
          provisioned internally.
        </p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {params.error ? <p style={{ color: "var(--danger)", marginBottom: 16 }}>Unable to sign in. Check the account and profile setup.</p> : null}
        {!supabaseConfigured ? (
          <p style={{ marginBottom: 16 }}>
            Supabase is not configured, so this build is running in demo mode. Submitting will open the Super Admin
            dashboard.
          </p>
        ) : null}
        <form action={signInWithEmailPassword} className="form">
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" required placeholder="Password" />
          </label>
          <button className="button primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </div>
  );
}
