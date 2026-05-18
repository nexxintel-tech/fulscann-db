import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { PlatformRole } from "@/lib/auth/roles";

export type AuthProfile = {
  id: string;
  fullName: string;
  email: string;
  platformRole: PlatformRole;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  platform_role: PlatformRole;
};

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  if (!hasSupabaseConfig()) {
    return getDemoProfile();
  }

  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, platform_role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as ProfileRow);
}

export async function requireRole(allowedRoles: PlatformRole[]) {
  if (!hasSupabaseConfig()) {
    return getDemoProfile(allowedRoles[0]);
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.platformRole)) {
    redirect(getDefaultRouteForRole(profile.platformRole));
  }

  return profile;
}

export function getDefaultRouteForRole(role: PlatformRole) {
  switch (role) {
    case "super_admin":
      return "/dashboard/super-admin";
    case "analyst":
      return "/dashboard/analyst";
    case "business_user":
      return "/dashboard/ceo";
    case "institution_user":
      return "/institution";
  }
}

export function mapProfile(row: ProfileRow): AuthProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    platformRole: row.platform_role
  };
}

function getDemoProfile(role: PlatformRole = "super_admin"): AuthProfile {
  return {
    id: `demo_${role}`,
    fullName: `Demo ${formatRole(role)}`,
    email: "demo@fulscann.local",
    platformRole: role
  };
}

function formatRole(role: PlatformRole) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
