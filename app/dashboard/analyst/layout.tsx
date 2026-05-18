import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function AnalystLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole(["analyst"]);
  return children;
}
