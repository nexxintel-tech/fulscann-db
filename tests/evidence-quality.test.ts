import { describe, expect, it } from "vitest";
import {
  getAverageEvidenceLevel,
  getEvidenceCompletionFromLevels,
  getEvidenceForReport,
  hasEvidenceGap
} from "@/lib/evidence/quality";
import { evidenceFiles } from "@/lib/data/sample-data";

describe("evidence quality", () => {
  it("finds evidence attached to a report", () => {
    const evidence = getEvidenceForReport(evidenceFiles, "rep_001");

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.fileName).toBe("sales-invoices-may.pdf");
  });

  it("calculates average evidence level and completion", () => {
    expect(getAverageEvidenceLevel(evidenceFiles)).toBe(1.5);
    expect(getEvidenceCompletionFromLevels(evidenceFiles)).toBe(50);
  });

  it("flags evidence gaps below the minimum average level", () => {
    expect(hasEvidenceGap(evidenceFiles, 2)).toBe(true);
    expect(hasEvidenceGap(evidenceFiles, 1)).toBe(false);
  });
});
