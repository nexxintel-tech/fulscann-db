import { describe, expect, it } from "vitest";
import {
  canEscalateException,
  canMoveEscalationStatus,
  canMoveExceptionStatus,
  canRequestExceptionClarification,
  canResolveException,
  canStartExceptionReview,
  getAssignedOpenExceptions,
  getAvailableExceptionActions
} from "@/lib/ic-engine/actions";
import { analystAssignments, controlExceptions } from "@/lib/data/sample-data";
import type { ControlException } from "@/lib/types";

describe("IC action execution policy", () => {
  it("allows Analysts to move open exceptions into review only", () => {
    const exception = makeException({ status: "open" });

    expect(canStartExceptionReview("analyst", exception)).toBe(true);
    expect(canMoveExceptionStatus("analyst", "open", "in_review")).toBe(true);
    expect(canMoveExceptionStatus("analyst", "in_review", "resolved")).toBe(false);
    expect(canMoveExceptionStatus("analyst", "open", "resolved")).toBe(false);
  });

  it("keeps exception resolution CEO-owned", () => {
    const exception = makeException({ status: "in_review" });

    expect(canResolveException("ceo", exception)).toBe(true);
    expect(canMoveExceptionStatus("ceo", "in_review", "resolved")).toBe(true);
    expect(canMoveExceptionStatus("analyst", "in_review", "resolved")).toBe(false);
    expect(canResolveException("super_admin", exception)).toBe(false);
  });

  it("limits Analyst escalation to unresolved Orange or Red exceptions", () => {
    expect(canEscalateException("analyst", makeException({ riskLevel: "Red" }))).toBe(true);
    expect(canEscalateException("analyst", makeException({ riskLevel: "Orange" }))).toBe(true);
    expect(canEscalateException("analyst", makeException({ riskLevel: "Yellow" }))).toBe(false);
    expect(canEscalateException("analyst", makeException({ status: "resolved", riskLevel: "Red" }))).toBe(false);
  });

  it("allows clarification requests only for unresolved exceptions", () => {
    expect(canRequestExceptionClarification("analyst", makeException({ status: "open" }))).toBe(true);
    expect(canRequestExceptionClarification("analyst", makeException({ status: "resolved" }))).toBe(false);
    expect(canRequestExceptionClarification("ceo", makeException({ status: "open" }))).toBe(false);
  });

  it("returns only assigned unresolved exceptions for Analyst action queues", () => {
    const exceptions = getAssignedOpenExceptions(controlExceptions, analystAssignments, "usr_ana_001");

    expect(exceptions.map((exception) => exception.id)).toEqual(["exc_002", "exc_001", "exc_003"]);
  });

  it("keeps Super Admin lifecycle movement scoped to escalation records", () => {
    expect(canMoveEscalationStatus("super_admin", "open", "in_review")).toBe(true);
    expect(canMoveEscalationStatus("super_admin", "in_review", "resolved")).toBe(true);
    expect(canMoveEscalationStatus("analyst", "open", "in_review")).toBe(false);
    expect(canMoveEscalationStatus("super_admin", "resolved", "in_review")).toBe(false);
  });

  it("summarizes available actions by actor and exception state", () => {
    const actions = getAvailableExceptionActions("analyst", makeException({ riskLevel: "Red", status: "open" }));

    expect(actions).toEqual(["start_review", "request_clarification", "escalate"]);
    expect(getAvailableExceptionActions("ceo", makeException({ status: "in_review" }))).toEqual(["resolve"]);
  });
});

function makeException(overrides: Partial<ControlException> = {}): ControlException {
  return {
    id: "exc_test",
    businessId: "biz_001",
    title: "Test exception",
    riskLevel: "Orange",
    status: "open",
    daysOpen: 1,
    ...overrides
  };
}
