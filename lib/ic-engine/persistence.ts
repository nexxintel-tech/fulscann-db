import type { BusinessIcAutomationResult } from "@/lib/ic-engine/automation";
import type { ExceptionCandidate, ExceptionLifecycleReview } from "@/lib/ic-engine/lifecycle";

export type IcPersistencePlan = {
  exceptionCandidatesToCreate: ExceptionCandidate[];
  suppressedExceptionCandidates: ExceptionLifecycleReview[];
  auditMetadata: {
    icScore: number;
    checksRun: number;
    newExceptionCount: number;
    suppressedExceptionCount: number;
    scoreFactors: BusinessIcAutomationResult["scoreFactors"];
  };
};

export function buildIcPersistencePlan(result: BusinessIcAutomationResult): IcPersistencePlan {
  const exceptionCandidatesToCreate = result.exceptionLifecycle
    .filter((review) => review.shouldCreate)
    .map((review) => review.candidate);
  const suppressedExceptionCandidates = result.exceptionLifecycle.filter((review) => !review.shouldCreate);

  return {
    exceptionCandidatesToCreate,
    suppressedExceptionCandidates,
    auditMetadata: {
      icScore: result.icScore,
      checksRun: result.checks.length,
      newExceptionCount: exceptionCandidatesToCreate.length,
      suppressedExceptionCount: suppressedExceptionCandidates.length,
      scoreFactors: result.scoreFactors
    }
  };
}
