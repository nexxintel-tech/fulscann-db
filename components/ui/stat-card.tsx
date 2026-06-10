import { MetricCard } from "@/components/ui/MetricCard";

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return <MetricCard helperText={detail} label={label} value={value} />;
}
