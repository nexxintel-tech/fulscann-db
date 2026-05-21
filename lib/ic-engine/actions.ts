import type { AnalystAssignment, ControlException, ExceptionStatus, RiskLevel } from "@/lib/types";

export type IcActionActor = "analyst" | "ceo" | "super_admin" | "staff" | "institution";
export type IcExceptionAction = "start_review" | "request_clarification" | "escalate" | "resolve";
export type IcEscalationAction = "start_review" | "resolve";

const ESCALATABLE_RISK_LEVELS: RiskLevel[] = ["Orange", "Red"];

export function canStartExceptionReview(actor: IcActionActor, exception: ControlException) {
  return actor === "analyst" && exception.status === "open";
}

export function canRequestExceptionClarification(actor: IcActionActor, exception: ControlException) {
  return actor === "analyst" && exception.status !== "resolved";
}

export function canEscalateException(actor: IcActionActor, exception: ControlException) {
  return actor === "analyst" && exception.status !== "resolved" && ESCALATABLE_RISK_LEVELS.includes(exception.riskLevel);
}

export function canResolveException(actor: IcActionActor, exception: ControlException) {
  return actor === "ceo" && exception.status !== "resolved";
}

export function canMoveExceptionStatus(
  actor: IcActionActor,
  currentStatus: ExceptionStatus,
  nextStatus: ExceptionStatus
) {
  if (currentStatus === nextStatus) return false;
  if (actor === "analyst") return currentStatus === "open" && nextStatus === "in_review";
  if (actor === "ceo") return currentStatus !== "resolved" && nextStatus === "resolved";
  return false;
}

export function canMoveEscalationStatus(
  actor: IcActionActor,
  currentStatus: ExceptionStatus,
  nextStatus: ExceptionStatus
) {
  if (currentStatus === nextStatus) return false;
  if (actor !== "super_admin") return false;
  if (currentStatus === "open" && nextStatus === "in_review") return true;
  return currentStatus !== "resolved" && nextStatus === "resolved";
}

export function getAvailableExceptionActions(actor: IcActionActor, exception: ControlException): IcExceptionAction[] {
  const actions: IcExceptionAction[] = [];

  if (canStartExceptionReview(actor, exception)) actions.push("start_review");
  if (canRequestExceptionClarification(actor, exception)) actions.push("request_clarification");
  if (canEscalateException(actor, exception)) actions.push("escalate");
  if (canResolveException(actor, exception)) actions.push("resolve");

  return actions;
}

export function getAssignedOpenExceptions(
  exceptions: ControlException[],
  assignments: AnalystAssignment[],
  analystId: string
) {
  const assignedBusinessIds = new Set(
    assignments
      .filter((assignment) => assignment.analystId === analystId && assignment.status === "active")
      .map((assignment) => assignment.businessId)
  );

  return exceptions
    .filter((exception) => assignedBusinessIds.has(exception.businessId) && exception.status !== "resolved")
    .sort(sortExceptionsForAction);
}

export function sortExceptionsForAction(a: ControlException, b: ControlException) {
  const riskDelta = riskWeight(b.riskLevel) - riskWeight(a.riskLevel);
  if (riskDelta !== 0) return riskDelta;
  return b.daysOpen - a.daysOpen;
}

function riskWeight(riskLevel: RiskLevel) {
  if (riskLevel === "Red") return 4;
  if (riskLevel === "Orange") return 3;
  if (riskLevel === "Yellow") return 2;
  return 1;
}
