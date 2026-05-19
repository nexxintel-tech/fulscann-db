import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";

export default function DemoInstitutionPage() {
  const { businesses, controlExceptions } = getDemoSnapshot();
  const approvedBusinesses = businesses.filter((business) => business.integrityReportReady);

  return (
    <div className="stack">
      <DemoBanner role="Institution" />
      <section className="page-title">
        <h1>Institution dashboard</h1>
        <p>Consent-based report intelligence only, using local demo data.</p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Approved businesses" value={approvedBusinesses.length} detail="Consent-based access" />
        <StatCard label="Open risk flags" value={controlExceptions.filter((exception) => exception.status !== "resolved").length} detail="Review queue" />
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
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {approvedBusinesses.map((business) => (
              <tr key={business.id}>
                <td>{business.legalName}</td>
                <td>{business.currentVeriScore}</td>
                <td>{business.currentIcScore}</td>
                <td>{business.evidenceCompletion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
