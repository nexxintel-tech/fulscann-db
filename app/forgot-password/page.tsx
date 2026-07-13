"use client";

import { useState, type FormEvent } from "react";
import { createSupabasePasswordResetClient } from "@/lib/supabase/password-reset-browser";

type RequestStatus = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      setStatus("error");
      setErrorMessage("Enter a valid account email.");
      return;
    }

    const supabase = createSupabasePasswordResetClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Supabase Auth must allow this URL under Authentication -> URL Configuration -> Redirect URLs:
      // https://your-domain.com/reset-password and http://localhost:3000/reset-password.
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setStatus("error");
      setErrorMessage("Unable to send a password reset email right now. Try again or contact Fulscann support.");
      return;
    }

    setStatus("success");
  }

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Reset your password</h1>
        <p>Enter your account email and Fulscann will send a secure password reset link.</p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {status === "success" ? (
          <p className="notice">If an account exists for that email, a password reset link has been sent.</p>
        ) : null}

        {status === "error" ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>{errorMessage}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>

          <button className="button primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send reset link"}
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
