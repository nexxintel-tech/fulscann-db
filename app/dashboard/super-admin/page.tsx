import { StatCard } from "@/components/ui/stat-card";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { assignBusinessToAnalyst, moveEscalationLifecycle } from "@/app/dashboard/super-admin/actions";
import { canMoveEscalationStatus } from "@/lib/ic-engine/actions";
import { getAnalystWorkloads, getAssignableAnalysts, getUnassignedBusinesses } from "@/lib/analyst/workload";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getBusinessesNeedingIcAction, getIcBusinessActions, getIcRiskDistribution } from "@/lib/ic-engine/dashboard";

type SuperAdminDashboardProps = {
  searchParams: Promise<{ assignment?: string; escalation?: string }>;
};

export default async function SuperAdminDashboard({ searchParams }: SuperAdminDashboardProps) {
  const params = await searchParams;
  const { businesses, analysts, analystAssignments, analystEscalations, controlExceptions, icScoreResults } = await getPlatformSnapshot();
  const workloads = getAnalystWorkloads(analysts, analystAssignments);
  const unassignedBusinesses = getUnassignedBusinesses(businesses, analystAssignments);
  const assignableAnalysts = getAssignableAnalysts(analysts, analystAssignments);
  const unassignedCount = unassignedBusinesses.length;
  const openEscalations = analystEscalations.filter((escalation) => escalation.status !== "resolved");
  const escalatedCases = openEscalations.length;
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

      <section className="card" id="escalations">
        <h2>Platform IC action queue</h2>
        <IcActionTable rows={icActionQueue} />
      </section>

      <section className="card" id="analyst-workload">
        <h2>Escalation lifecycle</h2>
        <p>Super Admins handle escalated Analyst issues and route them to closure without taking CEO ownership.</p>
        {params.escalation ? <p className="notice">{getEscalationMessage(params.escalation)}</p> : null}
        <ul className="list">
          {openEscalations.map((escalation) => {
            const business = businesses.find((item) => item.id === escalation.businessId);
            const analyst = analysts.find((item) => item.id === escalation.analystId);

            return (
              <li key={escalation.id}>
                <strong>{business?.legalName ?? "Business"} - {escalation.riskLevel} escalation</strong>
                <br />
                Analyst: {analyst?.name ?? "Unknown"}; status: {escalation.status}; open {escalation.daysOpen} days
                <p>{escalation.reason}</p>
                <div className="form-inline">
                  <form action={moveEscalationLifecycle} className="compact-form">
                    <input type="hidden" name="businessId" value={escalation.businessId} />
                    <input type="hidden" name="escalationId" value={escalation.id} />
                    <input type="hidden" name="nextStatus" value="in_review" />
                    <button className="button" type="submit" disabled={!canMoveEscalationStatus("super_admin", escalation.status, "in_review")}>
                      Start review
                    </button>
                  </form>
                  <form action={moveEscalationLifecycle} className="compact-form">
                    <input type="hidden" name="businessId" value={escalation.businessId} />
                    <input type="hidden" name="escalationId" value={escalation.id} />
                    <input type="hidden" name="nextStatus" value="resolved" />
                    <button className="button primary" type="submit" disabled={!canMoveEscalationStatus("super_admin", escalation.status, "resolved")}>
                      Resolve escalation
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
          {openEscalations.length === 0 ? <li>No open escalations.</li> : null}
        </ul>
      </section>

      <section className="card" id="assign-analyst">
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

function getEscalationMessage(status: string) {
  if (status === "in-review") return "Escalation moved to Super Admin review and audited.";
  if (status === "resolved") return "Escalation resolved and audited.";
  if (status === "demo") return "Demo mode: connect Supabase to persist escalation actions.";
  if (status === "invalid") return "Choose a valid escalation action.";
  if (status === "invalid-transition") return "That escalation lifecycle movement is not allowed.";
  return `Escalation update failed: ${status}`;
}
