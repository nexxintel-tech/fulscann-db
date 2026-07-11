import { requestPasswordReset } from "@/app/login/actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Reset your password</h1>
        <p>Enter your account email and Fulscann will send a secure password reset link.</p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {params.sent ? (
          <p className="notice">{getPasswordResetSentMessage(params.sent)}</p>
        ) : null}

        {params.error ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>
            {getPasswordResetErrorMessage(params.error)}
          </p>
        ) : null}

        <form action={requestPasswordReset} className="form">
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>

          <button className="button primary" type="submit">
            Send reset link
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          <a className="button" href="/login">
            Back to sign in
          </a>
        </p>
      </section>
    </div>
  );
}

function getPasswordResetSentMessage(status: string) {
  if (status === "demo") {
    return "Supabase is not configured, so password reset email delivery is disabled in demo mode.";
  }

  return "If an account exists for that email, a password reset link has been sent.";
}

function getPasswordResetErrorMessage(error: string) {
  if (error === "invalid-email") {
    return "Enter a valid account email.";
  }

  if (error === "reset-email-failed") {
    return "Unable to send a password reset email right now. Try again or contact Fulscann support.";
  }

  return "Unable to process this password reset request.";
}
