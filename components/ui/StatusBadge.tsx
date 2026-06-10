type StatusTone = "good" | "watch" | "high" | "info" | "moderate";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <span className={`status-badge ${tone ?? getTone(label)}`}>{label}</span>;
}

function getTone(label: string): StatusTone {
  const normalized = label.toLowerCase();
  if (["good", "approved", "active", "resolved", "ready"].some((value) => normalized.includes(value))) return "good";
  if (["watch", "medium", "pending", "open"].some((value) => normalized.includes(value))) return "watch";
  if (["high", "review", "escalated", "risk"].some((value) => normalized.includes(value))) return "high";
  if (normalized.includes("moderate")) return "moderate";
  return "info";
}
