import { updatePassword } from "@/app/login/actions";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Choose a new password</h1>
        <p>Create a new password of at least 8 characters for your Fulscann account.</p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {params.error ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>
            {getResetPasswordErrorMessage(params.error)}
          </p>
        ) : null}

        <form action={updatePassword} className="form">
          <label>
            New password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Repeat password"
            />
          </label>

          <button className="button primary" type="submit">
            Update password
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

function getResetPasswordErrorMessage(error: string) {
  if (error === "invalid-reset-password") {
    return "Enter matching passwords of at least 8 characters.";
  }

  if (error === "reset-session-failed") {
    return "This password reset link is invalid or expired. Request a new link.";
  }

  if (error === "update-password-failed") {
    return "Unable to update the password. Request a new reset link or contact Fulscann support.";
  }

  return "Unable to reset this password.";
}
