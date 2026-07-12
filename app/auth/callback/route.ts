import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getSafeAuthCallbackNextPath } from "@/lib/auth/password-reset";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeAuthCallbackNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/reset-password?error=reset-session-failed", requestUrl.origin));
  }

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/reset-password?error=reset-session-failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
