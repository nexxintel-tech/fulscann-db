import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getAnalystWorkloads, getUnassignedBusinesses } from "@/lib/analyst/workload";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";

export default function DemoSuperAdminPage() {
  const { businesses, analysts, analystAssignments, controlExceptions } = getDemoSnapshot();
  const workloads = getAnalystWorkloads(analysts, analystAssignments);
  const unassignedBusinesses = getUnassignedBusinesses(businesses, analystAssignments);

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
