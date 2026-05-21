import { describe, expect, it } from "vitest";
import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { IC_WORKBENCH_SCENARIOS, getIcWorkbenchScenario } from "@/lib/ic-engine/scenarios";

describe("IC scenario library", () => {
  it("provides named workbench scenarios", () => {
    expect(IC_WORKBENCH_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "balanced",
      "mismatch",
      "procurement_gap",
      "missing_finance"
    ]);
  });

  it("defaults to the mismatch scenario for unknown ids", () => {
    expect(getIcWorkbenchScenario("unknown").id).toBe("mismatch");
  });

  it("produces a stronger score for balanced controls than a mismatch scenario", () => {
    const balanced = getIcWorkbenchScenario("balanced");
    const mismatch = getIcWorkbenchScenario("mismatch");
    const balancedResult = runBusinessIcAutomation(balanced);
    const mismatchResult = runBusinessIcAutomation(mismatch);

    expect(balancedResult.icScore).toBeGreaterThan(mismatchResult.icScore);
    expect(mismatchResult.newExceptionCandidates.map((candidate) => candidate.title)).toContain("Sales-finance mismatch");
  });
});
