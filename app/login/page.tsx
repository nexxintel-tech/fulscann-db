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
      <section
        className="card"
        style={{
          overflow: "hidden",
          padding: 0,
          border: "1px solid rgba(148, 163, 184, 0.28)",
          background:
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.18), transparent 32%), #020617",
          color: "white",
        }}
      >
        <div
          style={{
            padding: "64px 28px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <p
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#bfdbfe",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Fulscann Trust Intelligence
          </p>

          <h1
            style={{
              maxWidth: 860,
              margin: "0 auto",
              fontSize: "clamp(2.8rem, 8vw, 6.2rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              fontWeight: 950,
            }}
          >
            Ready to scale? Get started with Trust
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: "24px auto 0",
              color: "rgba(226,232,240,0.86)",
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              lineHeight: 1.7,
            }}
          >
            Access the Fulscann control workspace built to help SMEs structure evidence,
            monitor trust signals, improve readiness, and operate with decision confidence.
          </p>
        </div>
      </section>

      <section className="page-title">
        <h1>{createMode ? "Create account" : "Sign in"}</h1>
        <p>
          {createMode
            ? "Create a Business CEO account to begin onboarding. Fulscann internal roles and staff users are provisioned separately."
            : "Fulscann is an internal control system for SMEs that want to scale. Use your account to access the dashboard for your role. Analyst access can be provisioned on your request."}
        </p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {params.created ? (
          <p className="notice">{getCreatedMessage(params.created)}</p>
        ) : null}

        {params.error ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>
            {getLoginErrorMessage(params.error)}
          </p>
        ) : null}

        {!supabaseConfigured ? (
          <p style={{ marginBottom: 16 }}>
            Supabase is not configured, so this build is running in demo mode.
            Submitting will open the Super Admin dashboard.
          </p>
        ) : null}

        {createMode ? <CreateAccountForm /> : <SignInForm />}

        <p style={{ marginTop: 16 }}>
          {createMode ? (
            <a className="button" href="/login">
              Use an existing account
            </a>
          ) : (
            <a
              className="login-create-link"
              href="/login?mode=create"
            >
              Create Business CEO Account
            </a>
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
        <input
          name="fullName"
          required
          minLength={2}
          maxLength={120}
          placeholder="Business owner name"
        />
      </label>

      <label>
        Email
        <input name="email" type="email" required placeholder="ceo@example.com" />
      </label>

      <label>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </label>

      <label>
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          placeholder="Repeat password"
        />
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
