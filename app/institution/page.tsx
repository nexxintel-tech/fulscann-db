import { StatCard } from "@/components/ui/stat-card";
import { getInstitutionSnapshot } from "@/lib/data/repository";

export default async function InstitutionDashboard() {
  const { businesses, controlExceptions, institutionAccess, businessKpis } = await getInstitutionSnapshot();
  const approvedBusinesses = businesses.filter((business) => business.integrityReportReady);
  const approvedBusinessIds = new Set(approvedBusinesses.map((business) => business.id));
  const salesKpiSummaries = businessKpis.filter(
    (kpi) =>
      approvedBusinessIds.has(kpi.businessId) &&
      ["sales_to_finance_match_rate", "sales_to_inventory_match_rate", "outstanding_receivables"].includes(kpi.kpiKey)
  );

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Institution dashboard</h1>
        <p>
          Approved trust intelligence only. Institution users see interpreted reports, not raw private business records
          unless explicitly approved by the CEO.
        </p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Approved businesses" value={approvedBusinesses.length} detail="Consent-based access" />
        <StatCard label="Open risk flags" value={controlExceptions.filter((exception) => exception.status !== "resolved").length} detail="Portfolio review queue" />
        <StatCard label="Reports available" value={institutionAccess.length} detail="Integrity Reports" />
        <StatCard label="KPI summaries" value={salesKpiSummaries.length} detail="Approved intelligence only" />
      </section>

      <section className="card" id="approved-reports">
        <h2>Approved business profiles</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Business</th>
              <th>VeriScore</th>
              <th>IC Score</th>
              <th>Evidence confidence</th>
              <th>Report access</th>
            </tr>
          </thead>
          <tbody>
            {approvedBusinesses.map((business) => (
              <tr key={business.id}>
                <td>
                  <strong>{business.legalName}</strong>
                  <br />
                  {business.sector}
                </td>
                <td>{business.currentVeriScore}</td>
                <td>{business.currentIcScore}</td>
                <td>{business.evidenceCompletion}%</td>
                <td>Approved report only</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>KPI intelligence summary</h2>
        <ul className="list">
          {salesKpiSummaries.map((kpi) => {
            const business = approvedBusinesses.find((item) => item.id === kpi.businessId);
            return (
              <li key={kpi.id}>
                <strong>{business?.legalName ?? "Approved business"} - {kpi.name}</strong>
                <br />
                {kpi.targetValue === null ? "Target not disclosed" : `Target ${kpi.targetValue}${kpi.unit ?? ""}`} - {kpi.defaultFrequency}
              </li>
            );
          })}
          {salesKpiSummaries.length === 0 ? <li>No approved KPI summaries available.</li> : null}
        </ul>
      </section>
    </div>
  );
}
