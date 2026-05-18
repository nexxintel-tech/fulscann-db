import type { RiskLevel } from "@/lib/types";

type RiskPillProps = {
  level: RiskLevel;
};

export function RiskPill({ level }: RiskPillProps) {
  return <span className={`pill ${level.toLowerCase()}`}>{level}</span>;
}
