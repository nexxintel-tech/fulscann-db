import type { Business, ControlException, IcScoreResult, RiskLevel } from "@/lib/types";

const HIGH_RISK_LEVELS: RiskLevel[] = ["Orange", "Red"];

export type IcBusinessAction = {
  business: Business;
  openExceptionCount: number;
  highRiskExceptionCount: number;
  redExceptionCount: number;
  latestIcScore: number;
  previousIcScore: number;
  scoreDelta: number;
  declining: boolean;
  actionLabel: string;
};

export function getIcBusinessActions(
  businesses: Business[],
  exceptions: ControlException[],
  scores: IcScoreResult[] = []
): IcBusinessAction[] {
  return businesses
    .map((business) => {
      const businessExceptions = exceptions.filter(
        (exception) => exception.businessId === business.id && exception.status !== "resolved"
      );
      const latestScore = scores.find((score) => score.businessId === business.id)?.score ?? business.currentIcScore;
      const scoreDelta = latestScore - business.previousIcScore;
      const highRiskExceptionCount = businessExceptions.filter((exception) => HIGH_RISK_LEVELS.includes(exception.riskLevel)).length;
      const redExceptionCount = businessExceptions.filter((exception) => exception.riskLevel === "Red").length;

      return {
        business,
        openExceptionCount: businessExceptions.length,
        highRiskExceptionCount,
        redExceptionCount,
        latestIcScore: latestScore,
        previousIcScore: business.previousIcScore,
        scoreDelta,
        declining: scoreDelta < 0,
        actionLabel: getActionLabel(highRiskExceptionCount, scoreDelta)
      };
    })
    .sort((a, b) => {
      if (b.redExceptionCount !== a.redExceptionCount) return b.redExceptionCount - a.redExceptionCount;
      if (b.highRiskExceptionCount !== a.highRiskExceptionCount) return b.highRiskExceptionCount - a.highRiskExceptionCount;
      return a.scoreDelta - b.scoreDelta;
    });
}

export function getIcRiskDistribution(exceptions: ControlException[]) {
  const open = exceptions.filter((exception) => exception.status !== "resolved");

  return {
    red: open.filter((exception) => exception.riskLevel === "Red").length,
    orange: open.filter((exception) => exception.riskLevel === "Orange").length,
    yellow: open.filter((exception) => exception.riskLevel === "Yellow").length,
    green: open.filter((exception) => exception.riskLevel === "Green").length
  };
}

export function getBusinessesNeedingIcAction(actions: IcBusinessAction[]) {
  return actions.filter((action) => action.openExceptionCount > 0 || action.declining);
}

function getActionLabel(highRiskExceptionCount: number, scoreDelta: number) {
  if (highRiskExceptionCount > 0) return "Review high-risk IC exception";
  if (scoreDelta < 0) return "Investigate IC score decline";
  return "Monitor";
}
