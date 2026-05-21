import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createBusinessAccount, signInWithEmailPassword } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{ created?: string; error?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabaseConfigured = hasSupabaseConfig();
  const createMode = params.mode === "create";

  return (
    <div className="stack">
      <section className="page-title">
        <h1>{createMode ? "Create account" : "Sign in"}</h1>
        <p>
          {createMode
            ? "Create a Business CEO account to begin onboarding. Fulscann internal roles and staff users are provisioned separately."
            : "Use your Fulscann account to access the dashboard for your role. Super Admin and Analyst access should be provisioned internally."}
        </p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {params.created ? (
          <p className="notice">{getCreatedMessage(params.created)}</p>
        ) : null}
        {params.error ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>{getLoginErrorMessage(params.error)}</p>
        ) : null}
        {!supabaseConfigured ? (
          <p style={{ marginBottom: 16 }}>
            Supabase is not configured, so this build is running in demo mode. Submitting will open the Super Admin
            dashboard.
          </p>
        ) : null}
        {createMode ? <CreateAccountForm /> : <SignInForm />}
        <p style={{ marginTop: 16 }}>
          {createMode ? (
            <a className="button" href="/login">Use an existing account</a>
          ) : (
            <a className="button" href="/login?mode=create">Create Business CEO account</a>
          )}
        </p>
      </section>
    </div>
  );
}

function SignInForm() {
  return (
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
  );
}

function CreateAccountForm() {
  return (
    <form action={createBusinessAccount} className="form">
      <label>
        Full name
        <input name="fullName" required minLength={2} maxLength={120} placeholder="Business owner name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required placeholder="ceo@example.com" />
      </label>
      <label>
        Password
        <input name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
      </label>
      <label>
        Confirm password
        <input name="confirmPassword" type="password" required minLength={8} placeholder="Repeat password" />
      </label>
      <button className="button primary" type="submit">
        Create account
      </button>
    </form>
  );
}

function getLoginErrorMessage(error: string) {
  if (error === "invalid-create-account") {
    return "Enter a valid name, email, and matching password of at least 8 characters.";
  }

  if (error === "server-config") {
    return "Account creation requires server-side Supabase service configuration.";
  }

  if (error === "missing-profile") {
    return "Sign-in succeeded, but this Auth user does not have a Fulscann profile yet.";
  }

  if (error === "staff-invite-login") {
    return "Sign in with the email address that received the staff invitation.";
  }

  return "Unable to sign in. Check the account and profile setup.";
}

function getCreatedMessage(status: string) {
  if (status === "check-email") {
    return "Account created. Check your email to confirm the account before signing in.";
  }

  return "Account created.";
}
