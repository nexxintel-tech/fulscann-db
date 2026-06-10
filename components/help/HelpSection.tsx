import type { ReactNode } from "react";

type HelpSectionProps = {
  children: ReactNode;
  eyebrow?: string;
  id: string;
  intro?: string;
  title: string;
};

export function HelpSection({ children, eyebrow, id, intro, title }: HelpSectionProps) {
  return (
    <section className="help-section" id={id}>
      <div className="help-section-header">
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}
