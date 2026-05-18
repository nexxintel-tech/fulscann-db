import type { PlatformRole } from "@/lib/auth/roles";

export const ROUTE_ROLE_POLICY = {
  "/dashboard/super-admin": ["super_admin"],
  "/dashboard/analyst": ["analyst"],
  "/dashboard/ceo": ["business_user"],
  "/dashboard/staff": ["business_user"],
  "/institution": ["institution_user"]
} as const satisfies Record<string, readonly PlatformRole[]>;

export function getAllowedRolesForPath(pathname: string): readonly PlatformRole[] | null {
  const match = Object.entries(ROUTE_ROLE_POLICY).find(([prefix]) => pathname.startsWith(prefix));
  return match?.[1] ?? null;
}
