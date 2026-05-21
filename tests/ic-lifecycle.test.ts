import { describe, expect, it } from "vitest";
import { reviewExceptionCandidate } from "@/lib/ic-engine/lifecycle";
import type { ControlException } from "@/lib/types";

const candidate = {
  title: "Sales-finance mismatch",
  description: "Mismatch detected.",
  riskLevel: "Red" as const
};

describe("IC exception lifecycle", () => {
  it("marks a candidate as new when no matching exception exists", () => {
    expect(reviewExceptionCandidate(candidate, [])).toMatchObject({
      state: "new",
      shouldCreate: true
    });
  });

  it("suppresses duplicate open exceptions", () => {
    expect(reviewExceptionCandidate(candidate, [exception("open")])).toMatchObject({
      state: "duplicate_open",
      shouldCreate: false
    });
  });

  it("suppresses candidates already in review", () => {
    expect(reviewExceptionCandidate(candidate, [exception("in_review")])).toMatchObject({
      state: "in_review",
      shouldCreate: false
    });
  });

  it("allows a candidate when only resolved history exists", () => {
    expect(reviewExceptionCandidate(candidate, [exception("resolved")])).toMatchObject({
      state: "resolved_history",
      shouldCreate: true
    });
  });
});

function exception(status: ControlException["status"]): ControlException {
  return {
    id: `exc_${status}`,
    businessId: "biz_1",
    title: candidate.title,
    riskLevel: "Red",
    status,
    daysOpen: 1
  };
}
