import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/SectionCard";

type DataTableCardProps = {
  children: ReactNode;
  id?: string;
  subtitle?: string;
  title: string;
};

export function DataTableCard({ children, id, subtitle, title }: DataTableCardProps) {
  return (
    <SectionCard id={id} subtitle={subtitle} title={title}>
      <div className="table-wrap">{children}</div>
    </SectionCard>
  );
}
