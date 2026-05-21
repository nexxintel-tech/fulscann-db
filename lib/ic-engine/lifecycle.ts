import type { ControlException } from "@/lib/types";

export type ExceptionCandidate = {
  title: string;
  description: string;
  riskLevel: "Yellow" | "Orange" | "Red";
};

export type ExceptionLifecycleState = "new" | "duplicate_open" | "in_review" | "resolved_history";

export type ExceptionLifecycleReview = {
  candidate: ExceptionCandidate;
  state: ExceptionLifecycleState;
  existingExceptionId?: string;
  shouldCreate: boolean;
};

export function reviewExceptionCandidate(
  candidate: ExceptionCandidate,
  existingExceptions: ControlException[]
): ExceptionLifecycleReview {
  const matching = existingExceptions.filter((exception) => exception.title === candidate.title);
  const active = matching.find((exception) => exception.status === "open");
  const inReview = matching.find((exception) => exception.status === "in_review");
  const resolved = matching.find((exception) => exception.status === "resolved");

  if (active) {
    return {
      candidate,
      state: "duplicate_open",
      existingExceptionId: active.id,
      shouldCreate: false
    };
  }

  if (inReview) {
    return {
      candidate,
      state: "in_review",
      existingExceptionId: inReview.id,
      shouldCreate: false
    };
  }

  if (resolved) {
    return {
      candidate,
      state: "resolved_history",
      existingExceptionId: resolved.id,
      shouldCreate: true
    };
  }

  return {
    candidate,
    state: "new",
    shouldCreate: true
  };
}

export function reviewExceptionCandidates(
  candidates: ExceptionCandidate[],
  existingExceptions: ControlException[]
) {
  return candidates.map((candidate) => reviewExceptionCandidate(candidate, existingExceptions));
}
