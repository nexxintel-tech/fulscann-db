import Link from "next/link";
import { BusinessTable } from "@/components/dashboard/business-table";
import { StatCard } from "@/components/ui/stat-card";
import { getBusinessReadiness } from "@/lib/analyst/readiness";
import { getAnalystWorkloads } from "@/lib/analyst/workload";
import { getPlatformSnapshot } from "@/lib/data/repository";

export default async function HomePage() {
  const { businesses, analysts, analystAssignments, controlExceptions, evidenceFiles, source } = await getPlatformSnapshot();
  const readiness = getBusinessReadiness(businesses, controlExceptions, evidenceFiles);
  const workloads = getAnalystWorkloads(analysts, analystAssignments);
  const readyReports = businesses.filter((business) => business.integrityReportReady).length;
  const interventionCount = readiness.filter((row) => row.needsIntervention).length;

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Control intelligence for SME trust readiness.</h1>
        <p>
          Fulscann-DB turns business profile data, assessments, reports, evidence, exceptions, and scores into
          reviewable trust intelligence for CEOs, analysts, and approved institutions.
        </p>
        <p>Data source: {source === "supabase" ? "Supabase" : "sample data"}</p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Businesses tracked" value={businesses.length} detail="Sample operating portfolio" />
        <StatCard label="Report-ready" value={readyReports} detail="Integrity Reports ready for CEO review" />
        <StatCard label="Needs intervention" value={interventionCount} detail="Analyst follow-up queue" />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Current build slice</h2>
          <p>
            The implementation starts with a Super Admin assigning businesses to Analysts, Analysts reviewing readiness,
            CEOs owning business activity, and Institutions seeing only approved report intelligence.
          </p>
        </article>
        <article className="card">
          <h2>Analyst capacity</h2>
          <ul className="list">
            {workloads.map((workload) => (
              <li key={workload.analyst.id}>
                <strong>{workload.analyst.name}</strong>
                <br />
                {workload.assignedCount}/{workload.capacity} assigned businesses
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Business readiness queue</h2>
        <BusinessTable rows={readiness} />
      </section>

      <section className="grid grid-3">
        <Link className="button" href="/dashboard/super-admin">
          Open Super Admin dashboard
        </Link>
        <Link className="button" href="/dashboard/analyst">
          Open Analyst dashboard
        </Link>
        <Link className="button" href="/dashboard/ceo">
          Open CEO dashboard
        </Link>
      </section>
    </div>
  );
}
