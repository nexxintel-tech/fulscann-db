import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function SuperAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole(["super_admin"]);
  return children;
}
