import { RiskPill } from "@/components/ui/risk-pill";
import type { BusinessReadiness, RiskLevel } from "@/lib/types";

type BusinessTableProps = {
  rows: BusinessReadiness[];
};

export function BusinessTable({ rows }: BusinessTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Business</th>
          <th>Onboarding</th>
          <th>Scores</th>
          <th>Evidence</th>
          <th>Risk</th>
          <th>Action state</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const riskLevel: RiskLevel = row.openHighRiskExceptions > 0 ? "Orange" : row.missingEvidence ? "Yellow" : "Green";
          return (
            <tr key={row.business.id}>
              <td>
                <strong>{row.business.legalName}</strong>
                <br />
                <span>{row.business.sector}</span>
              </td>
              <td>{row.business.onboardingProgress}%</td>
              <td>
                VeriScore {row.business.currentVeriScore}
                <br />
                IC {row.business.currentIcScore}
              </td>
              <td>{row.business.evidenceCompletion}%</td>
              <td>
                <RiskPill level={riskLevel} />
              </td>
              <td>{row.needsIntervention ? "Needs analyst review" : "Report-ready"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
