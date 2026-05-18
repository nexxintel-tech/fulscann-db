import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function StaffLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole(["business_user"]);
  return children;
}
