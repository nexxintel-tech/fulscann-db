import Link from "next/link";
import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getOpenExceptions } from "@/lib/ceo/actions";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";

export default function DemoCeoPage() {
  const { businesses, controlExceptions, departmentReports, evidenceFiles, icScoreResults } = getDemoSnapshot();
  const business = businesses[0];
  const reports = departmentReports.filter((report) => report.businessId === business.id);
  const openExceptions = getOpenExceptions(controlExceptions, business.id);
  const latestIcScore = icScoreResults.find((score) => score.businessId === business.id);

  return (
    <div className="stack">
      <DemoBanner role="CEO" />
      <section className="page-title">
        <h1>{business.legalName}</h1>
        <p>CEO-owned view of readiness, department reporting, evidence, open exceptions, and IC movement.</p>
        <Link className="button" href="/ic">
          Test IC mechanism
        </Link>
      </section>

      <section className="grid grid-3">
        <StatCard label="VeriScore" value={business.currentVeriScore} detail="Business maturity signal" />
        <StatCard label="IC Score" value={latestIcScore?.score ?? business.currentIcScore} detail="Internal control signal" />
        <StatCard label="Open exceptions" value={openExceptions.length} detail="CEO-owned resolution queue" />
      </section>

      <section className="card">
        <h2>Department reports</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Status</th>
              <th>Value</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.department}</td>
                <td>{report.status}</td>
                <td>NGN {report.value.toLocaleString("en-NG")}</td>
                <td>{evidenceFiles.filter((file) => file.reportId === report.id).length || report.evidenceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
