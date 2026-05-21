import { describe, expect, it } from "vitest";
import {
  getBusinessesNeedingIcAction,
  getIcBusinessActions,
  getIcRiskDistribution
} from "@/lib/ic-engine/dashboard";
import { businesses, controlExceptions, icScoreResults } from "@/lib/data/sample-data";

describe("IC dashboard selectors", () => {
  it("builds action rows from exceptions and IC score movement", () => {
    const actions = getIcBusinessActions(businesses, controlExceptions, icScoreResults);
    const northline = actions.find((action) => action.business.id === "biz_002");

    expect(northline?.openExceptionCount).toBe(1);
    expect(northline?.highRiskExceptionCount).toBe(1);
    expect(northline?.declining).toBe(true);
    expect(northline?.actionLabel).toBe("Review high-risk IC exception");
  });

  it("filters businesses needing IC action", () => {
    const queue = getBusinessesNeedingIcAction(getIcBusinessActions(businesses, controlExceptions, icScoreResults));

    expect(queue.map((action) => action.business.id)).toContain("biz_002");
    expect(queue.map((action) => action.business.id)).toContain("biz_004");
  });

  it("summarizes open IC risk distribution", () => {
    expect(getIcRiskDistribution(controlExceptions)).toEqual({
      red: 1,
      orange: 1,
      yellow: 1,
      green: 0
    });
  });
});
