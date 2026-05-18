"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getCurrentProfile, getDefaultRouteForRole } from "@/lib/auth/session";

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
  redirect(profile ? getDefaultRouteForRole(profile.platformRole) : "/login?error=missing-profile");
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseRouteClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
