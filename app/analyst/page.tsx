import { BusinessTable } from "@/components/dashboard/business-table";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getBusinessReadiness } from "@/lib/analyst/readiness";
import { ANALYST_BUSINESS_CAPACITY } from "@/lib/analyst/workload";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";
import { getBusinessesNeedingIcAction, getIcBusinessActions } from "@/lib/ic-engine/dashboard";

export default function DemoAnalystPage() {
  const { businesses, analysts, analystAssignments, controlExceptions, evidenceFiles, icScoreResults } = getDemoSnapshot();
  const currentAnalystId = analysts[0]?.id;
  const assignedBusinessIds = new Set(
    analystAssignments
      .filter((assignment) => assignment.analystId === currentAnalystId && assignment.status === "active")
      .map((assignment) => assignment.businessId)
  );
  const assignedBusinesses = businesses.filter((business) => assignedBusinessIds.has(business.id));
  const readiness = getBusinessReadiness(assignedBusinesses, controlExceptions, evidenceFiles);
  const icActionQueue = getBusinessesNeedingIcAction(getIcBusinessActions(assignedBusinesses, controlExceptions, icScoreResults));

  return (
    <div className="stack">
      <DemoBanner role="Analyst" />
      <section className="page-title">
        <h1>Analyst dashboard</h1>
        <p>Oversight, review, support, and escalation for assigned businesses without replacing the CEO.</p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Assigned businesses" value={`${assignedBusinesses.length}/${ANALYST_BUSINESS_CAPACITY}`} detail="Workload" />
        <StatCard label="Needs intervention" value={readiness.filter((row) => row.needsIntervention).length} detail="Review queue" />
        <StatCard label="Automated IC scores" value={icScoreResults.filter((score) => assignedBusinessIds.has(score.businessId)).length} detail="IC engine output" />
        <StatCard label="IC actions" value={icActionQueue.length} detail="Assigned businesses needing review" />
      </section>

      <section className="card">
        <h2>IC review queue</h2>
        <IcActionTable rows={icActionQueue} />
      </section>

      <section className="card">
        <h2>Assigned business readiness</h2>
        <BusinessTable rows={readiness} />
      </section>
    </div>
  );
}
