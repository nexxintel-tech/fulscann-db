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
                <span className="pill green">VeriScore {row.business.currentVeriScore}</span>
                <br />
                <span className="pill blue">IC {row.business.currentIcScore}</span>
              </td>
              <td>{row.business.evidenceCompletion}%</td>
              <td>
                <RiskPill level={riskLevel} />
              </td>
              <td>
                <span className={`pill ${row.needsIntervention ? "yellow" : "green"}`}>
                  {row.needsIntervention ? "Needs analyst review" : "Report-ready"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
