import { describe, expect, it } from "vitest";
import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { buildIcPersistencePlan } from "@/lib/ic-engine/persistence";
import { getIcWorkbenchScenario } from "@/lib/ic-engine/scenarios";
import type { ControlException } from "@/lib/types";

describe("IC persistence plan", () => {
  it("selects lifecycle-approved exception candidates for creation", () => {
    const scenario = getIcWorkbenchScenario("procurement_gap");
    const result = runBusinessIcAutomation(scenario);
    const plan = buildIcPersistencePlan(result);

    expect(plan.exceptionCandidatesToCreate.map((candidate) => candidate.title)).toContain("Procurement approval gap");
    expect(plan.auditMetadata.icScore).toBe(result.icScore);
    expect(plan.auditMetadata.newExceptionCount).toBe(plan.exceptionCandidatesToCreate.length);
  });

  it("separates suppressed duplicate candidates from creatable candidates", () => {
    const scenario = getIcWorkbenchScenario("mismatch");
    const existingExceptions: ControlException[] = [
      {
        id: "exc_existing",
        businessId: "biz_demo",
        title: "Sales-finance mismatch",
        riskLevel: "Red",
        status: "open",
        daysOpen: 1
      }
    ];
    const result = runBusinessIcAutomation({
      ...scenario,
      existingExceptions
    });
    const plan = buildIcPersistencePlan(result);

    expect(plan.exceptionCandidatesToCreate.map((candidate) => candidate.title)).not.toContain("Sales-finance mismatch");
    expect(plan.suppressedExceptionCandidates.map((review) => review.candidate.title)).toContain("Sales-finance mismatch");
    expect(plan.auditMetadata.suppressedExceptionCount).toBeGreaterThan(0);
  });
});
