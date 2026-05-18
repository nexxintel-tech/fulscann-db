import type { RiskLevel } from "@/lib/types";

export type SalesFinanceCheckInput = {
  salesValue: number;
  financeInflow: number;
  tolerancePercentage?: number;
};

export type SalesFinanceCheckResult = {
  matched: boolean;
  mismatchAmount: number;
  mismatchPercentage: number;
  riskLevel: RiskLevel;
  title?: string;
};

export function checkSalesFinanceMatch(input: SalesFinanceCheckInput): SalesFinanceCheckResult {
  const tolerancePercentage = input.tolerancePercentage ?? 5;
  const mismatchAmount = Math.abs(input.salesValue - input.financeInflow);
  const mismatchPercentage = input.salesValue === 0 ? 0 : (mismatchAmount / input.salesValue) * 100;
  const matched = mismatchPercentage <= tolerancePercentage;

  return {
    matched,
    mismatchAmount,
    mismatchPercentage: Math.round(mismatchPercentage * 10) / 10,
    riskLevel: getMismatchRiskLevel(mismatchPercentage),
    title: matched ? undefined : "Sales-finance mismatch"
  };
}

function getMismatchRiskLevel(mismatchPercentage: number): RiskLevel {
  if (mismatchPercentage >= 35) return "Red";
  if (mismatchPercentage >= 15) return "Orange";
  if (mismatchPercentage > 5) return "Yellow";
  return "Green";
}
