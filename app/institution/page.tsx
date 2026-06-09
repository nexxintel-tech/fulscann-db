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
  const openSignals = controlExceptions.filter((exception) => exception.status !== "resolved");
  const averageVeriScore = average(approvedBusinesses.map((business) => business.currentVeriScore));
  const averageIcScore = average(approvedBusinesses.map((business) => business.currentIcScore));
  const averageEvidenceConfidence = average(approvedBusinesses.map((business) => business.evidenceCompletion));

  return (
    <div className="institution-shell">
      <aside className="institution-sidebar" aria-label="Institution console">
        <section className="institution-logo">
          <span className="institution-logo-mark" aria-hidden="true" />
          <strong>Fulscann Institution</strong>
          <span>External trust intelligence portal</span>
        </section>
        <section className="sidebar-section sidebar-links">
          <h2>Navigation</h2>
          <a className="active" href="/institution">Institution dashboard</a>
          <a href="/institution#approved-reports">Approved reports</a>
        </section>
        <section className="sidebar-trust-card">
          <strong>CEO-approved access</strong>
          <span>Only interpreted report intelligence and approved summaries are visible here.</span>
        </section>
      </aside>

      <div className="institution-main stack">
        <section className="page-title">
          <h1>Institution Intelligence Portal</h1>
          <p>
            Review CEO-approved business trust intelligence, readiness signals, and control risk summaries without
            accessing raw private business records.
          </p>
        </section>

        <section className="grid grid-3">
          <StatCard label="Approved Reports" value={approvedBusinesses.length} detail="Consent-based access" />
          <StatCard label="Open Control Signals" value={openSignals.length} detail="Portfolio review queue" />
          <StatCard label="Average VeriScore" value={averageVeriScore} detail="Approved businesses" />
          <StatCard label="Average IC Score" value={averageIcScore} detail="Control maturity signal" />
          <StatCard label="Evidence Confidence" value={`${averageEvidenceConfidence}%`} detail="Average approved support" />
          <StatCard label="KPI Summaries" value={salesKpiSummaries.length} detail="Approved intelligence only" />
        </section>

        <section className="card trust-notice">
          <h2>Consent-based trust visibility</h2>
          <p>
            Institution access is limited to CEO-approved Integrity Reports, readiness signals, and interpreted control
            risk summaries. Business-owned records and approval decisions remain outside this portal.
          </p>
        </section>

        <section className="institution-portal-grid">
          <div className="stack">
            <section className="card" id="approved-reports">
              <h2>Approved Trust Reports</h2>
              <div className="stack">
                {approvedBusinesses.map((business) => {
                  const businessOpenSignals = openSignals.filter((exception) => exception.businessId === business.id);

                  return (
                    <article className="report-card" key={business.id}>
                      <div className="report-card-header">
                        <div>
                          <h3>{business.legalName}</h3>
                          <p>{business.sector} / SME profile</p>
                        </div>
                        <span className="pill green">Approved</span>
                      </div>
                      <div className="report-badge-row">
                        <span className="pill green">VeriScore {business.currentVeriScore}</span>
                        <span className="pill blue">IC Score {business.currentIcScore}</span>
                        <span className="pill purple">Evidence {business.evidenceCompletion}%</span>
                        <span className={businessOpenSignals.length > 0 ? "pill yellow" : "pill green"}>
                          {businessOpenSignals.length} open signals
                        </span>
                      </div>
                      <div className="report-actions">
                        <a className="button primary" href={`/institution#report-${business.id}`}>Open Integrity Report</a>
                        <a className="button secondary" href={`/institution#risk-${business.id}`}>View Risk Summary</a>
                      </div>
                    </article>
                  );
                })}
                {approvedBusinesses.length === 0 ? <p>No approved business reports available.</p> : null}
              </div>
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

          <aside className="stack">
            <section className="card">
              <h2>Readiness Signals</h2>
              <ul className="list">
                <li><strong>{averageEvidenceConfidence}% evidence confidence</strong><p>Average approved evidence support across visible reports.</p></li>
                <li><strong>{openSignals.length} open control signals</strong><p>Signals remain interpreted for institution review.</p></li>
                <li><strong>{institutionAccess.length} active access grants</strong><p>Report visibility follows CEO approval.</p></li>
              </ul>
            </section>

            <section className="card">
              <h2>Quick Actions</h2>
              <div className="stack">
                <a className="button primary" href="/institution#approved-reports">Review approved reports</a>
                <a className="button secondary" href="/institution#approved-reports">Compare control signals</a>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
