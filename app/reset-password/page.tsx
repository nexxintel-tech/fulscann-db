"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabasePasswordResetClient } from "@/lib/supabase/password-reset-browser";
import { PasswordField } from "@/components/ui/PasswordField";

type ResetStatus = "checking" | "ready" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabasePasswordResetClient(), []);
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function prepareResetSession() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const recoveryType = params.get("type") ?? hashParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!isMounted) {
          return;
        }

        if (error) {
          setStatus("error");
          setErrorMessage("This password reset link is invalid or expired. Request a new link.");
          return;
        }

        window.history.replaceState(null, "", "/reset-password");
      }

      if (accessToken && refreshToken && recoveryType === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (!isMounted) {
          return;
        }

        if (error) {
          setStatus("error");
          setErrorMessage("This password reset link is invalid or expired. Request a new link.");
          return;
        }

        window.history.replaceState(null, "", "/reset-password");
      }

      if (tokenHash && recoveryType === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery"
        });

        if (!isMounted) {
          return;
        }

        if (error) {
          setStatus("error");
          setErrorMessage("This password reset link is invalid or expired. Request a new link.");
          return;
        }

        window.history.replaceState(null, "", "/reset-password");
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        setStatus("error");
        setErrorMessage("This password reset link is invalid or expired. Request a new link.");
        return;
      }

      setStatus("ready");
    }

    prepareResetSession().catch(() => {
      if (!isMounted) {
        return;
      }

      setStatus("error");
      setErrorMessage("Unable to verify this password reset link. Request a new link.");
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8 || confirmPassword.length < 8) {
      setStatus("ready");
      setErrorMessage("Enter matching passwords of at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("ready");
      setErrorMessage("Passwords must match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatus("ready");
      setErrorMessage("Unable to update the password. Request a new reset link or contact Fulscann support.");
      return;
    }

    setStatus("success");
    await supabase.auth.signOut();
    router.replace("/login?reset=password-updated");
  }

  const isBusy = status === "checking" || status === "loading" || status === "success";

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Choose a new password</h1>
        <p>Create a new password of at least 8 characters for your Fulscann account.</p>
      </section>

      <section className="card" style={{ maxWidth: 520 }}>
        {status === "checking" ? (
          <p className="notice">Verifying your password reset link...</p>
        ) : null}

        {status === "success" ? (
          <p className="notice">Password updated. Redirecting you to sign in...</p>
        ) : null}

        {errorMessage ? (
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>{errorMessage}</p>
        ) : null}

        {status === "error" ? (
          <p>
            <a className="button primary" href="/forgot-password">
              Request a new reset link
            </a>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <PasswordField
              label="New password"
              name="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              disabled={isBusy}
            />

            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Repeat password"
              disabled={isBusy}
            />

            <button className="button primary" type="submit" disabled={isBusy}>
              {status === "loading" ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16 }}>
          <a className="button" href="/login">
            Back to sign in
          </a>
        </p>
      </section>
    </div>
  );
}
