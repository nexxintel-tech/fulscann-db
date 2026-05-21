import { StatCard } from "@/components/ui/stat-card";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { assignBusinessToAnalyst } from "@/app/dashboard/super-admin/actions";
import { getAnalystWorkloads, getAssignableAnalysts, getUnassignedBusinesses } from "@/lib/analyst/workload";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getBusinessesNeedingIcAction, getIcBusinessActions, getIcRiskDistribution } from "@/lib/ic-engine/dashboard";

type SuperAdminDashboardProps = {
  searchParams: Promise<{ assignment?: string }>;
};

export default async function SuperAdminDashboard({ searchParams }: SuperAdminDashboardProps) {
  const params = await searchParams;
  const { businesses, analysts, analystAssignments, controlExceptions, icScoreResults } = await getPlatformSnapshot();
  const workloads = getAnalystWorkloads(analysts, analystAssignments);
  const unassignedBusinesses = getUnassignedBusinesses(businesses, analystAssignments);
  const assignableAnalysts = getAssignableAnalysts(analysts, analystAssignments);
  const unassignedCount = unassignedBusinesses.length;
  const escalatedCases = controlExceptions.filter((exception) => exception.riskLevel === "Red").length;
  const reportPipeline = businesses.filter((business) => business.integrityReportReady).length;
  const icActions = getIcBusinessActions(businesses, controlExceptions, icScoreResults);
  const icActionQueue = getBusinessesNeedingIcAction(icActions);
  const riskDistribution = getIcRiskDistribution(controlExceptions);

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Super Admin dashboard</h1>
        <p>
          Manage analyst workload, assignment coverage, escalated issues, and platform-wide report readiness without
          taking control of business-owned data.
        </p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Analysts" value={analysts.length} detail="Active internal reviewers" />
        <StatCard label="Businesses without analysts" value={unassignedCount} detail="Assignment coverage gap" />
        <StatCard label="Escalated cases" value={escalatedCases} detail="High-risk issues needing review" />
        <StatCard label="IC action queue" value={icActionQueue.length} detail="Businesses needing control review" />
      </section>

      <section className="card">
        <h2>Platform IC action queue</h2>
        <IcActionTable rows={icActionQueue} />
      </section>

      <section className="card">
        <h2>Analyst workload</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Analyst</th>
              <th>Email</th>
              <th>Assigned</th>
              <th>Available slots</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {workloads.map((workload) => (
              <tr key={workload.analyst.id}>
                <td>{workload.analyst.name}</td>
                <td>{workload.analyst.email}</td>
                <td>{workload.assignedCount}/{workload.capacity}</td>
                <td>{workload.availableSlots}</td>
                <td>{workload.utilization}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Assign business to Analyst</h2>
        <p>
          Super Admins can assign unassigned businesses to Analysts with available capacity. The database trigger also
          enforces the 15-business limit.
        </p>
        {params.assignment ? <p className="notice">{getAssignmentMessage(params.assignment)}</p> : null}
        <form action={assignBusinessToAnalyst} className="form form-inline">
          <label>
            Business
            <select name="businessId" required disabled={unassignedBusinesses.length === 0}>
              <option value="">Select business</option>
              {unassignedBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.legalName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Analyst
            <select name="analystId" required disabled={assignableAnalysts.length === 0}>
              <option value="">Select analyst</option>
              {assignableAnalysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>
                  {analyst.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button primary" type="submit" disabled={unassignedBusinesses.length === 0 || assignableAnalysts.length === 0}>
            Assign
          </button>
        </form>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Platform IC risk distribution</h2>
          <p>
            {controlExceptions.filter((exception) => exception.riskLevel === "Red").length} red,{" "}
            {riskDistribution.orange} orange,{" "}
            {riskDistribution.yellow} yellow exceptions.
          </p>
        </article>
        <article className="card">
          <h2>Report pipeline</h2>
          <p>{reportPipeline} businesses are ready for Integrity Report review.</p>
        </article>
      </section>
    </div>
  );
}

function getAssignmentMessage(status: string) {
  if (status === "success") {
    return "Business assigned and audit event recorded.";
  }

  if (status === "demo") {
    return "Demo mode: connect Supabase to persist analyst assignments.";
  }

  if (status === "invalid") {
    return "Choose both a business and an analyst.";
  }

  return `Assignment failed: ${status}`;
}
