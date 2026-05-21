import { DemoBanner } from "@/components/demo/demo-banner";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { StatCard } from "@/components/ui/stat-card";
import { getAnalystWorkloads, getUnassignedBusinesses } from "@/lib/analyst/workload";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";
import { getBusinessesNeedingIcAction, getIcBusinessActions } from "@/lib/ic-engine/dashboard";

export default function DemoSuperAdminPage() {
  const { businesses, analysts, analystAssignments, controlExceptions, icScoreResults } = getDemoSnapshot();
  const workloads = getAnalystWorkloads(analysts, analystAssignments);
  const unassignedBusinesses = getUnassignedBusinesses(businesses, analystAssignments);
  const icActionQueue = getBusinessesNeedingIcAction(getIcBusinessActions(businesses, controlExceptions, icScoreResults));

  return (
    <div className="stack">
      <DemoBanner role="Super Admin" />
      <section className="page-title">
        <h1>Super Admin dashboard</h1>
        <p>Platform-wide assignment coverage, analyst workload, escalations, and report pipeline visibility.</p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Analysts" value={analysts.length} detail="Internal reviewers" />
        <StatCard label="Unassigned businesses" value={unassignedBusinesses.length} detail="Coverage gap" />
        <StatCard label="Red exceptions" value={controlExceptions.filter((item) => item.riskLevel === "Red").length} detail="Escalated IC risk" />
        <StatCard label="IC action queue" value={icActionQueue.length} detail="Businesses needing control action" />
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
    </div>
  );
}
