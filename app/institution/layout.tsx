import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function InstitutionLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole(["institution_user"]);
  return children;
}
