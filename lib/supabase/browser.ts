"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseBrowserConfig();
  return createBrowserClient(url, anonKey);
}
