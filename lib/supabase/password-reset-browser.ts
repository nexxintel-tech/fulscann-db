"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export function createSupabasePasswordResetClient() {
  const { url, anonKey } = getSupabaseBrowserConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Password recovery links must work when opened from email clients or another browser profile.
      flowType: "implicit",
      persistSession: true,
      storageKey: "fulscann-password-reset-auth"
    }
  });
}
