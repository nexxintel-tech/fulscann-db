import type { ReactNode } from "react";

type SectionCardProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  subtitle?: string;
  title: string;
};

export function SectionCard({ action, children, className, id, subtitle, title }: SectionCardProps) {
  return (
    <section className={`section-card${className ? ` ${className}` : ""}`} id={id}>
      <div className="section-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="section-card-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
