import { describe, expect, it } from "vitest";
import { checkSalesFinanceMatch } from "@/lib/ic-engine/checks";

describe("IC sales-finance checks", () => {
  it("passes reports within the default tolerance", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 1_000_000,
      financeInflow: 960_000
    });

    expect(result.matched).toBe(true);
    expect(result.riskLevel).toBe("Green");
    expect(result.mismatchPercentage).toBe(4);
    expect(result.title).toBeUndefined();
  });

  it("classifies mismatch risk levels by percentage", () => {
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 940_000 }).riskLevel).toBe("Yellow");
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 850_000 }).riskLevel).toBe("Orange");
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 650_000 }).riskLevel).toBe("Red");
  });

  it("supports custom tolerance without changing risk classification", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 1_000_000,
      financeInflow: 900_000,
      tolerancePercentage: 12
    });

    expect(result.matched).toBe(true);
    expect(result.riskLevel).toBe("Yellow");
  });

  it("handles zero reported sales without division errors", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 0,
      financeInflow: 0
    });

    expect(result.matched).toBe(true);
    expect(result.mismatchAmount).toBe(0);
    expect(result.mismatchPercentage).toBe(0);
    expect(result.riskLevel).toBe("Green");
  });
});
