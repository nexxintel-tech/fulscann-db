import type { ReactNode } from "react";

type MetricCardProps = {
  helperText?: string;
  icon?: ReactNode;
  label: string;
  status?: ReactNode;
  trendText?: string;
  value: string | number;
};

export function MetricCard({ helperText, icon, label, status, trendText, value }: MetricCardProps) {
  return (
    <section className="metric-card">
      <div className="metric-card-top">
        {icon ? <span className="metric-icon">{icon}</span> : <span className="metric-icon" aria-hidden="true" />}
        {status}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      {helperText ? <p>{helperText}</p> : null}
      {trendText ? <small>{trendText}</small> : null}
    </section>
  );
}
