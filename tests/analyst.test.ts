import { describe, expect, it } from "vitest";
import { getBusinessReadiness } from "@/lib/analyst/readiness";
import {
  canAssignBusinessToAnalyst,
  getAnalystWorkloads,
  getAssignableAnalysts,
  getUnassignedBusinesses
} from "@/lib/analyst/workload";
import { analystAssignments, analysts, businesses, controlExceptions } from "@/lib/data/sample-data";

describe("analyst workload", () => {
  it("reports capacity against the 15 business limit", () => {
    const [workload] = getAnalystWorkloads(analysts, analystAssignments);

    expect(workload.assignedCount).toBe(3);
    expect(workload.capacity).toBe(15);
    expect(workload.availableSlots).toBe(12);
    expect(workload.overloaded).toBe(false);
  });

  it("prevents assignment when capacity is full", () => {
    const fullAssignments = Array.from({ length: 15 }, (_, index) => ({
      id: `asg_${index}`,
      analystId: "usr_ana_001",
      businessId: `biz_${index}`,
      status: "active" as const
    }));

    expect(canAssignBusinessToAnalyst("usr_ana_001", fullAssignments)).toBe(false);
  });

  it("finds businesses without an active analyst assignment", () => {
    const unassignedBusinesses = getUnassignedBusinesses(businesses, analystAssignments);

    expect(unassignedBusinesses.map((business) => business.id)).toEqual(["biz_005"]);
  });

  it("excludes analysts who are at capacity", () => {
    const capacityAssignments = Array.from({ length: 15 }, (_, index) => ({
      id: `asg_capacity_${index}`,
      analystId: "usr_ana_001",
      businessId: `biz_capacity_${index}`,
      status: "active" as const
    }));

    const assignableAnalysts = getAssignableAnalysts(analysts, [...analystAssignments, ...capacityAssignments]);

    expect(assignableAnalysts.map((analyst) => analyst.id)).toEqual(["usr_ana_002"]);
  });
});

describe("business readiness", () => {
  it("marks businesses needing analyst intervention", () => {
    const readiness = getBusinessReadiness(businesses, controlExceptions);
    const northline = readiness.find((row) => row.business.id === "biz_002");

    expect(northline?.needsIntervention).toBe(true);
    expect(northline?.missingEvidence).toBe(true);
    expect(northline?.decliningIcScore).toBe(true);
    expect(northline?.decliningVeriScore).toBe(true);
  });
});
