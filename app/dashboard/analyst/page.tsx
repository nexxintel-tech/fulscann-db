import { BusinessTable } from "@/components/dashboard/business-table";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { StatCard } from "@/components/ui/stat-card";
import {
  addInternalNote,
  escalateException,
  escalateIssue,
  markExceptionInReview,
  markReportReviewReady,
  requestExceptionClarification,
  requestClarification
} from "@/app/dashboard/analyst/actions";
import { getBusinessReadiness } from "@/lib/analyst/readiness";
import { ANALYST_BUSINESS_CAPACITY } from "@/lib/analyst/workload";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getAssignedOpenExceptions, getAvailableExceptionActions } from "@/lib/ic-engine/actions";
import { getBusinessesNeedingIcAction, getIcBusinessActions } from "@/lib/ic-engine/dashboard";

type AnalystDashboardProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function AnalystDashboard({ searchParams }: AnalystDashboardProps) {
  const params = await searchParams;
  const { businesses, analysts, analystAssignments, controlExceptions, departmentReports, icScoreResults, evidenceFiles } = await getPlatformSnapshot();
  const currentAnalystId = analysts[0]?.id;
  const assignedBusinessIds = new Set(
    analystAssignments
      .filter((assignment) => assignment.analystId === currentAnalystId && assignment.status === "active")
      .map((assignment) => assignment.businessId)
  );
  const assignedBusinesses = businesses.filter((business) => assignedBusinessIds.has(business.id));
  const readiness = getBusinessReadiness(assignedBusinesses, controlExceptions, evidenceFiles);
  const highRiskCount = readiness.filter((row) => row.openHighRiskExceptions > 0).length;
  const missingEvidenceCount = readiness.filter((row) => row.missingEvidence).length;
  const readyCount = readiness.filter((row) => row.business.integrityReportReady).length;
  const decliningIcCount = readiness.filter((row) => row.decliningIcScore).length;
  const inactiveCount = readiness.filter((row) => row.inactive).length;
  const automatedScoreCount = icScoreResults.filter((score) => assignedBusinessIds.has(score.businessId)).length;
  const icActions = getIcBusinessActions(assignedBusinesses, controlExceptions, icScoreResults);
  const icActionQueue = getBusinessesNeedingIcAction(icActions);
  const assignedReports = departmentReports.filter((report) => assignedBusinessIds.has(report.businessId));
  const submittedReports = assignedReports.filter((report) => report.status === "submitted");
  const assignedExceptions = currentAnalystId
    ? getAssignedOpenExceptions(controlExceptions, analystAssignments, currentAnalystId)
    : [];

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Analyst dashboard</h1>
        <p>
          Oversight, review, support, and escalation for assigned businesses. Analysts can comment, request
          clarification, and mark reports review-ready, but CEOs retain ownership and approval authority.
        </p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Assigned businesses" value={`${assignedBusinesses.length}/${ANALYST_BUSINESS_CAPACITY}`} detail="Workload indicator" />
        <StatCard label="Red/Orange exceptions" value={highRiskCount} detail="Requires close review" />
        <StatCard label="Missing evidence" value={missingEvidenceCount} detail="Evidence quality queue" />
        <StatCard label="Report-ready" value={readyCount} detail="Ready for CEO review" />
        <StatCard label="Declining IC Score" value={decliningIcCount} detail="Control movement risk" />
        <StatCard label="Inactive businesses" value={inactiveCount} detail="No recent activity" />
        <StatCard label="Automated IC scores" value={automatedScoreCount} detail="Recalculated from report checks" />
        <StatCard label="IC actions" value={icActionQueue.length} detail="Assigned businesses needing review" />
      </section>

      <section className="card">
        <h2>IC review queue</h2>
        <IcActionTable rows={icActionQueue} />
      </section>

      <section className="card">
        <h2>Exception action queue</h2>
        <p>
          Analyst actions move exceptions into review, request clarification, or escalate high-risk issues. Resolution
          remains CEO-owned.
        </p>
        <ul className="list">
          {assignedExceptions.map((exception) => {
            const business = businesses.find((item) => item.id === exception.businessId);
            const actions = getAvailableExceptionActions("analyst", exception);

            return (
              <li key={exception.id}>
                <strong>{business?.legalName ?? "Business"} - {exception.title}</strong>
                <br />
                {exception.riskLevel} risk, {exception.status}, open {exception.daysOpen} days
                <div className="grid grid-3 action-grid">
                  <form action={markExceptionInReview} className="compact-form">
                    <input type="hidden" name="businessId" value={exception.businessId} />
                    <input type="hidden" name="exceptionId" value={exception.id} />
                    <button className="button" type="submit" disabled={!actions.includes("start_review")}>
                      Start review
                    </button>
                  </form>
                  <form action={requestExceptionClarification} className="form compact-form">
                    <input type="hidden" name="businessId" value={exception.businessId} />
                    <input type="hidden" name="exceptionId" value={exception.id} />
                    <textarea name="body" required minLength={3} maxLength={2000} placeholder="Request clarification." />
                    <button className="button" type="submit" disabled={!actions.includes("request_clarification")}>
                      Request clarification
                    </button>
                  </form>
                  <form action={escalateException} className="form compact-form">
                    <input type="hidden" name="businessId" value={exception.businessId} />
                    <input type="hidden" name="exceptionId" value={exception.id} />
                    <textarea name="body" required minLength={3} maxLength={2000} placeholder="Escalation reason." />
                    <button className="button" type="submit" disabled={!actions.includes("escalate")}>
                      Escalate
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
          {assignedExceptions.length === 0 ? <li>No open assigned exceptions.</li> : null}
        </ul>
      </section>

      <section className="card">
        <h2>Assigned business readiness</h2>
        <BusinessTable rows={readiness} />
      </section>

      <section className="card">
        <h2>Analyst action center</h2>
        <p>
          These actions support the business without taking CEO ownership. Clarification requests are business-visible;
          internal notes and escalations stay within Fulscann operations.
        </p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
        <div className="grid grid-2 action-grid">
          <form action={addInternalNote} className="form">
            <h3>Add internal note</h3>
            <BusinessSelect businesses={assignedBusinesses} />
            <label>
              Note
              <textarea name="body" required minLength={3} maxLength={2000} placeholder="Record what needs review." />
            </label>
            <button className="button primary" type="submit" disabled={assignedBusinesses.length === 0}>
              Add note
            </button>
          </form>

          <form action={requestClarification} className="form">
            <h3>Request clarification</h3>
            <BusinessSelect businesses={assignedBusinesses} />
            <label>
              Request
              <textarea name="body" required minLength={3} maxLength={2000} placeholder="Ask the CEO or staff for clarification." />
            </label>
            <button className="button primary" type="submit" disabled={assignedBusinesses.length === 0}>
              Request clarification
            </button>
          </form>

          <form action={markReportReviewReady} className="form">
            <h3>Mark report review-ready</h3>
            <label>
              Submitted report
              <select name="reportKey" required disabled={submittedReports.length === 0}>
                <option value="">Select report</option>
                {submittedReports.map((report) => {
                  const business = businesses.find((item) => item.id === report.businessId);
                  return (
                    <option key={report.id} value={`${report.id}::${report.businessId}`}>
                      {business?.legalName ?? "Business"} - {report.department}
                    </option>
                  );
                })}
              </select>
            </label>
            <button className="button primary" type="submit" disabled={submittedReports.length === 0}>
              Mark review-ready
            </button>
          </form>

          <form action={escalateIssue} className="form">
            <h3>Escalate high-risk issue</h3>
            <BusinessSelect businesses={assignedBusinesses} />
            <label>
              Risk level
              <select name="riskLevel" required>
                <option value="Orange">Orange</option>
                <option value="Red">Red</option>
              </select>
            </label>
            <label>
              Reason
              <textarea name="body" required minLength={3} maxLength={2000} placeholder="Explain the escalation." />
            </label>
            <button className="button primary" type="submit" disabled={assignedBusinesses.length === 0}>
              Escalate
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function BusinessSelect({ businesses }: { businesses: { id: string; legalName: string }[] }) {
  return (
    <label>
      Business
      <select name="businessId" required disabled={businesses.length === 0}>
        <option value="">Select business</option>
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.legalName}
          </option>
        ))}
      </select>
    </label>
  );
}

function getActionMessage(status: string) {
  if (status === "note-added") return "Internal note added and audited.";
  if (status === "clarification-requested") return "Clarification request added and audited.";
  if (status === "review-ready") return "Report marked review-ready and audited.";
  if (status === "escalated") return "Issue escalated to Super Admin and audited.";
  if (status === "exception-in-review") return "Exception moved to Analyst review and audited.";
  if (status === "exception-clarification-requested") return "Exception clarification requested and review status updated.";
  if (status === "exception-escalated") return "Exception escalated to Super Admin and review status updated.";
  if (status === "demo") return "Demo mode: connect Supabase to persist Analyst actions.";
  if (status === "invalid") return "Complete the required fields before submitting.";
  if (status === "invalid-transition") return "That exception lifecycle movement is not allowed for this role.";
  if (status === "not-assigned") return "Analysts can act only on assigned businesses.";
  if (status === "no-super-admin") return "No Super Admin profile exists for escalation routing.";
  return `Action failed: ${status}`;
}
