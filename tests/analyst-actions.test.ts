import { describe, expect, it } from "vitest";
import { canEscalateRiskLevel, isAnalystAssignedToBusiness } from "@/lib/analyst/actions";
import { analystAssignments } from "@/lib/data/sample-data";

describe("analyst actions", () => {
  it("allows actions only on actively assigned businesses", () => {
    expect(isAnalystAssignedToBusiness("usr_ana_001", "biz_001", analystAssignments)).toBe(true);
    expect(isAnalystAssignedToBusiness("usr_ana_001", "biz_003", analystAssignments)).toBe(false);
  });

  it("limits escalation actions to high-risk levels", () => {
    expect(canEscalateRiskLevel("Orange")).toBe(true);
    expect(canEscalateRiskLevel("Red")).toBe(true);
    expect(canEscalateRiskLevel("Yellow")).toBe(false);
    expect(canEscalateRiskLevel("Green")).toBe(false);
  });
});
