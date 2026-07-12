"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { headers } from "next/headers";
import { z } from "zod";
import { getSelfServiceSignupRole, normalizeAuthEmail } from "@/lib/auth/signup";
import {
  buildPasswordResetRedirect,
  buildSignupEmailRedirect,
  getCanonicalAppOrigin,
  parsePasswordResetEmail,
  updatePasswordSchema
} from "@/lib/auth/password-reset";
import {
  buildCreateAccountErrorRedirect,
  getStableSignupErrorCode,
  logSignupFailure,
  recoverProfile,
  upsertProfile
} from "@/lib/auth/profile-recovery";
import { hasSupabaseConfig, hasSupabaseServiceConfig } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/server";
import { getCurrentProfile, getDefaultRouteForProfile } from "@/lib/auth/session";

const createAccountSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine((input) => input.password === input.confirmPassword, {
  message: "Passwords must match.",
  path: ["confirmPassword"]
});

function redirectToLoginRoute(path: string): never {
  redirect(path as Route);
}

async function getAuthRedirectOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const fallbackOrigin = host ? `${protocol}://${host}` : "http://localhost:3000";

  return getCanonicalAppOrigin(fallbackOrigin);
}

export async function requestPasswordReset(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirectToLoginRoute("/forgot-password?sent=demo");
  }

  const email = parsePasswordResetEmail(formData.get("email"));

  if (!email) {
    redirectToLoginRoute("/forgot-password?error=invalid-email");
  }

  const origin = await getAuthRedirectOrigin();
  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPasswordResetRedirect(origin)
  });

  if (error) {
    redirectToLoginRoute("/forgot-password?error=reset-email-failed");
  }

  redirectToLoginRoute("/forgot-password?sent=check-email");
}

export async function updatePassword(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/login?reset=demo");
  }

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirectToLoginRoute("/reset-password?error=invalid-reset-password");
  }

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    redirectToLoginRoute("/reset-password?error=update-password-failed");
  }

  await supabase.auth.signOut();
  redirect("/login?reset=password-updated");
}

export async function signInWithEmailPassword(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/dashboard/super-admin");
  }

  const email = normalizeAuthEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  const profile = await getCurrentProfile();

  if (profile) {
    redirect(await getDefaultRouteForProfile(profile));
  }

  if (!hasSupabaseServiceConfig()) {
    redirect("/login?error=profile-recovery-unavailable");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=missing-profile");
  }

  const recoveryError = await recoverProfile(createSupabaseAdminClient(), {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata
  });

  if (recoveryError) {
    redirect(`/login?error=${recoveryError}`);
  }

  const recoveredProfile = await getCurrentProfile();
  redirect(recoveredProfile ? await getDefaultRouteForProfile(recoveredProfile) : "/login?error=profile-recovery-failed");
}

export async function createBusinessAccount(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/dashboard/ceo");
  }

  if (!hasSupabaseServiceConfig()) {
    redirect("/login?mode=create&error=server-config");
  }

  const parsed = createAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect("/login?mode=create&error=invalid-create-account");
  }

  const supabase = await createSupabaseRouteClient();
  const email = normalizeAuthEmail(parsed.data.email);
  const platformRole = getSelfServiceSignupRole();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: buildSignupEmailRedirect(await getAuthRedirectOrigin()),
      data: {
        full_name: parsed.data.fullName,
        platform_role: platformRole
      }
    }
  });

  if (error || !data.user) {
    logSignupFailure(error);
    redirectToLoginRoute(buildCreateAccountErrorRedirect(getStableSignupErrorCode(error)));
  }

  const profileCreateError = await upsertProfile(createSupabaseAdminClient(), {
    id: data.user.id,
    email,
    full_name: parsed.data.fullName,
    platform_role: platformRole
  });

  if (profileCreateError) {
    redirectToLoginRoute(buildCreateAccountErrorRedirect(profileCreateError));
  }

  if (!data.session) {
    redirect("/login?created=check-email");
  }

  redirect("/dashboard/ceo/onboarding");
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseRouteClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
