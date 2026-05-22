"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSelfServiceSignupRole, normalizeSignupEmail } from "@/lib/auth/signup";
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

export async function signInWithEmailPassword(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/dashboard/super-admin");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  const profile = await getCurrentProfile();
  redirect(profile ? await getDefaultRouteForProfile(profile) : "/login?error=missing-profile");
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
  const email = normalizeSignupEmail(parsed.data.email);
  const platformRole = getSelfServiceSignupRole();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        platform_role: platformRole
      }
    }
  });

  if (error || !data.user) {
    redirect(`/login?mode=create&error=${encodeURIComponent(error?.message ?? "create-account-failed")}`);
  }

  await createSupabaseAdminClient()
    .from("profiles")
    .upsert({
      id: data.user.id,
      email,
      full_name: parsed.data.fullName,
      platform_role: platformRole
    });

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
