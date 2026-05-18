import { StatCard } from "@/components/ui/stat-card";
import { getPlatformSnapshot } from "@/lib/data/repository";

export default async function InstitutionDashboard() {
  const { businesses, controlExceptions } = await getPlatformSnapshot();
  const approvedBusinesses = businesses.filter((business) => business.integrityReportReady);

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
        <StatCard label="Reports available" value={approvedBusinesses.length} detail="Integrity Reports" />
      </section>

      <section className="card">
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
    </div>
  );
}
