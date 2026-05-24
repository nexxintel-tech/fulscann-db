import {
  attachEvidenceToReport,
  escalateDepartmentIssueToCeo,
  markDepartmentResponseReady,
  requestDepartmentCorrection,
  submitDepartmentReport
} from "@/app/dashboard/staff/actions";
import { FormSuggestions } from "@/components/forms/form-suggestions";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getEvidenceForReport } from "@/lib/evidence/quality";
import { getEvidenceUploadSuggestions, getStaffReportSuggestions } from "@/lib/forms/suggestions";
import { getBusinessKpisForDepartment, getIncompleteDepartmentKpis } from "@/lib/kpis/business-kpis";
import { getActiveStaffMembership } from "@/lib/staff/onboarding";
import { isDepartmentHeadRole } from "@/lib/staff/roles";
import { getReportsForDepartment } from "@/lib/staff/reporting";

type StaffDashboardProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function StaffDashboard({ searchParams }: StaffDashboardProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const { businesses, departments, departmentReports, evidenceFiles, businessUsers, controlExceptions, analystNotes, auditEvents, businessKpis } = await getPlatformSnapshot();
  const membership = getActiveStaffMembership(businessUsers, profile?.id);
  const business = membership
    ? businesses.find((item) => item.id === membership.businessId)
    : businesses[0];
  const assignedDepartment = membership?.departmentId
    ? departments.find((department) => department.id === membership.departmentId)
    : business
      ? departments.find((department) => department.businessId === business.id)
      : undefined;
  const reports = business && assignedDepartment
    ? getReportsForDepartment(departmentReports, business.id, assignedDepartment.departmentType)
    : [];
  const departmentKpis = business && assignedDepartment
    ? getBusinessKpisForDepartment({
        businessKpis,
        businessId: business.id,
        departmentId: assignedDepartment.id,
        activeOnly: true
      })
    : [];
  const isDepartmentHead = isDepartmentHeadRole(membership?.role);
  const pendingReports = reports.filter((report) => report.status === "draft").length;
  const submittedReports = reports.filter((report) => report.status === "submitted").length;
  const reviewReadyReports = reports.filter((report) => report.status === "review_ready").length;
  const reportEvidenceFiles = evidenceFiles.filter((evidence) => reports.some((report) => report.id === evidence.reportId));
  const missingEvidenceReports = reports.filter((report) => {
    const attachedEvidence = getEvidenceForReport(evidenceFiles, report.id);
    return report.evidenceCount === 0 && attachedEvidence.length === 0;
  });
  const incompleteDepartmentKpis = getIncompleteDepartmentKpis({ businessKpis: departmentKpis, reports });
  const departmentStaffCount = business && assignedDepartment
    ? businessUsers.filter(
        (user) =>
          user.businessId === business.id &&
          user.departmentId === assignedDepartment.id &&
          user.status === "active" &&
          user.role !== "ceo"
      ).length
    : 0;
  const businessExceptions = business ? controlExceptions.filter((exception) => exception.businessId === business.id) : [];
  const departmentIssues = assignedDepartment
    ? businessExceptions.filter((exception) => exception.title.toLowerCase().includes(assignedDepartment.departmentType))
    : businessExceptions;
  const returnedCorrections = business
    ? analystNotes.filter((note) => note.businessId === business.id && note.noteType === "clarification_request")
    : [];
  const departmentCorrectionRequests = auditEvents.filter(
    (event) =>
      event.businessId === business?.id &&
      event.eventType === "department_head_requested_correction" &&
      event.entityType === "department_report" &&
      reports.some((report) => report.id === event.entityId)
  );
  const reportSuggestions = getStaffReportSuggestions({
    department: assignedDepartment,
    reports,
    evidenceFiles: reportEvidenceFiles,
    exceptions: businessExceptions,
    businessKpis: departmentKpis
  });
  const evidenceSuggestions = getEvidenceUploadSuggestions({
    report: reports.find((report) => report.status === "submitted") ?? reports[0],
    exceptions: businessExceptions,
    businessKpis: departmentKpis
  });

  return (
    <div className="stack">
      <section className="page-title">
        <h1>{isDepartmentHead ? "Departmental Head workspace" : "Staff dashboard"}</h1>
        <p>
          {isDepartmentHead
            ? "Coordinate departmental compliance, evidence follow-up, staff correction, and exception escalation."
            : "Submit department reports and evidence counts for CEO review and internal control checks."}
        </p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
      </section>

      <section className="grid grid-3">
        <StatCard label="Assigned department" value={assignedDepartment?.name ?? "Unassigned"} detail={business?.legalName ?? "No business"} />
        <StatCard label="Staff role" value={formatRole(membership?.role ?? "pending")} detail={membership ? "Accepted membership" : "Awaiting assignment"} />
        <StatCard label="Submitted reports" value={submittedReports} detail="Awaiting review" />
        <StatCard label={isDepartmentHead ? "Missing evidence" : "Draft reports"} value={isDepartmentHead ? missingEvidenceReports.length : pendingReports} detail={isDepartmentHead ? "Department follow-up needed" : "Not yet submitted"} />
        {isDepartmentHead ? <StatCard label="Department staff" value={departmentStaffCount} detail="Active department members" /> : null}
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2 id="submit-report">Submit report</h2>
          <FormSuggestions suggestions={reportSuggestions} />
          <form action={submitDepartmentReport} className="form">
            <input type="hidden" name="businessId" value={business?.id ?? ""} />
            <label>
              Department
              <select name="department" required defaultValue={assignedDepartment?.departmentType ?? "sales"} disabled={!assignedDepartment}>
                {assignedDepartment ? (
                  <option value={assignedDepartment.departmentType}>{assignedDepartment.name}</option>
                ) : (
                  <option value="">No assigned department</option>
                )}
              </select>
            </label>
            <label>
              KPI
              <select name="kpiKey" defaultValue="" disabled={departmentKpis.length === 0}>
                <option value="">General department report</option>
                {departmentKpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.kpiKey}>
                    {kpi.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Report value
              <input name="value" type="number" min="0" step="0.01" required placeholder="1200000" />
            </label>
            <label>
              Evidence files count
              <input name="evidenceCount" type="number" min="0" step="1" required placeholder="3" />
            </label>
            <label>
              Note
              <textarea name="note" maxLength={1000} placeholder="Optional context for the CEO or reviewer." />
            </label>
            <button className="button primary" type="submit" disabled={!business || !assignedDepartment}>
              Submit report
            </button>
          </form>
        </article>

        <article className="card">
          <h2 id="department-reports">Recent reports</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Department</th>
                <th>KPI</th>
                <th>Status</th>
                <th>Value</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const reportEvidence = getEvidenceForReport(evidenceFiles, report.id);
                return (
                  <tr key={report.id}>
                    <td>{report.department}</td>
                    <td>{departmentKpis.find((kpi) => kpi.kpiKey === report.kpiKey)?.name ?? "General"}</td>
                    <td>{report.status}</td>
                    <td>NGN {report.value.toLocaleString("en-NG")}</td>
                    <td>
                      {reportEvidence.length || report.evidenceCount}
                      {reportEvidence.length > 0 ? (
                        <ul className="mini-list">
                          {reportEvidence.map((evidence) => (
                            <li key={evidence.id}>
                              {evidence.signedUrl ? (
                                <a href={evidence.signedUrl} target="_blank" rel="noreferrer">
                                  {evidence.fileName}
                                </a>
                              ) : (
                                evidence.fileName
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {reports.length === 0 ? <p>No reports submitted for this department.</p> : null}
        </article>
      </section>

      <section className="card">
        <h2 id="upload-evidence">Attach evidence</h2>
        <div id="staff-suggestions" />
        <FormSuggestions suggestions={evidenceSuggestions} />
        <form action={attachEvidenceToReport} className="form form-inline">
          <input type="hidden" name="businessId" value={business?.id ?? ""} />
          <label>
            Report
            <select name="reportId" required disabled={reports.length === 0}>
              <option value="">Select report</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.department} - NGN {report.value.toLocaleString("en-NG")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Evidence file
            <input name="evidenceFile" type="file" required />
          </label>
          <label>
            File type
            <input name="fileType" required minLength={2} maxLength={80} placeholder="invoice" />
          </label>
          <label>
            Evidence level
            <select name="evidenceLevel" required defaultValue="1">
              <option value="0">Level 0 - claim only</option>
              <option value="1">Level 1 - basic evidence</option>
              <option value="2">Level 2 - verified evidence</option>
              <option value="3">Level 3 - cross-verified evidence</option>
            </select>
          </label>
          <button className="button primary" type="submit" disabled={!business || reports.length === 0}>
            Attach evidence
          </button>
        </form>
      </section>

      <section className="grid grid-2">
        <article className="card" id="returned-corrections">
          <h2>Returned corrections</h2>
          <ul className="list">
            {returnedCorrections.map((note) => (
              <li key={note.id}>
                <strong>Correction request</strong>
                <p>{note.body}</p>
              </li>
            ))}
            {departmentCorrectionRequests.map((event) => (
              <li key={event.id}>
                <strong>Departmental Head request</strong>
                <p>{getAuditBody(event.metadata)}</p>
              </li>
            ))}
            {returnedCorrections.length === 0 && departmentCorrectionRequests.length === 0 ? <li>No returned corrections for this department.</li> : null}
          </ul>
        </article>

        <article className="card" id="department-ic-issues">
          <h2>Department IC issues</h2>
          <ul className="list">
            {departmentIssues.map((exception) => (
              <li key={exception.id}>
                <strong>{exception.title}</strong>
                <br />
                {exception.riskLevel} risk, {exception.status}, open {exception.daysOpen} days
              </li>
            ))}
            {departmentIssues.length === 0 ? <li>No open department IC issues.</li> : null}
          </ul>
        </article>
      </section>

      {isDepartmentHead ? (
        <>
          <section className="grid grid-3" id="staff-compliance">
            <StatCard label="Department IC issues" value={departmentIssues.length} detail="Linked to assigned department" />
            <StatCard label="Sales KPI completion" value={`${departmentKpis.length - incompleteDepartmentKpis.length}/${departmentKpis.length}`} detail="Active department KPIs reported" />
            <StatCard label="Reports ready for review" value={reviewReadyReports} detail="Prepared for CEO or Analyst review" />
          </section>

          <section className="grid grid-3" id="department-head-actions">
            <article className="card">
              <h2>KPI gaps</h2>
              <ul className="list">
                {incompleteDepartmentKpis.map((kpi) => (
                  <li key={kpi.id}>
                    <strong>{kpi.name}</strong>
                    <br />
                    {kpi.description}
                  </li>
                ))}
                {incompleteDepartmentKpis.length === 0 ? <li>All active department KPIs have a linked report.</li> : null}
              </ul>
            </article>

            <article className="card" id="missing-evidence">
              <h2>Missing evidence</h2>
              <ul className="list">
                {missingEvidenceReports.map((report) => (
                  <li key={report.id}>
                    <strong>{formatRole(report.department)} report</strong>
                    <br />
                    {report.status}, NGN {report.value.toLocaleString("en-NG")}
                  </li>
                ))}
                {missingEvidenceReports.length === 0 ? <li>No reports are missing evidence.</li> : null}
              </ul>
            </article>

            <article className="card">
              <h2>Request correction</h2>
              <form action={requestDepartmentCorrection} className="form">
                <input type="hidden" name="businessId" value={business?.id ?? ""} />
                <label>
                  Report
                  <select name="reportId" required disabled={reports.length === 0}>
                    <option value="">Select report</option>
                    {reports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.department} - {report.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Correction request
                  <textarea name="body" required maxLength={1000} placeholder="Describe the missing evidence or correction needed from department staff." />
                </label>
                <button className="button secondary" type="submit" disabled={!business || reports.length === 0}>
                  Request correction
                </button>
              </form>
            </article>

            <article className="card" id="ready-for-review">
              <h2>Ready for review</h2>
              <form action={markDepartmentResponseReady} className="form">
                <input type="hidden" name="businessId" value={business?.id ?? ""} />
                <label>
                  Report
                  <select name="reportId" required disabled={reports.length === 0}>
                    <option value="">Select report</option>
                    {reports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.department} - {report.status}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button primary" type="submit" disabled={!business || reports.length === 0}>
                  Mark ready
                </button>
              </form>
            </article>

            <article className="card">
              <h2>Escalate to CEO</h2>
              <form action={escalateDepartmentIssueToCeo} className="form">
                <input type="hidden" name="businessId" value={business?.id ?? ""} />
                <label>
                  Department issue
                  <select name="exceptionId" required disabled={departmentIssues.length === 0}>
                    <option value="">Select issue</option>
                    {departmentIssues.map((exception) => (
                      <option key={exception.id} value={exception.id}>
                        {exception.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Escalation note
                  <textarea name="body" required maxLength={1000} placeholder="Explain why CEO attention is needed." />
                </label>
                <button className="button secondary" type="submit" disabled={!business || departmentIssues.length === 0}>
                  Escalate issue
                </button>
              </form>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}


function getActionMessage(status: string) {
  if (status === "invite-accepted") return "Invitation accepted. Staff workspace is now linked to the assigned business.";
  if (status === "demo-accepted") return "Demo mode: staff invitation acceptance previewed.";
  if (status === "report-submitted") return "Department report submitted and audited.";
  if (status === "evidence-attached") return "Evidence metadata attached and audited.";
  if (status === "correction-requested") return "Correction request recorded for the department.";
  if (status === "response-ready") return "Department response marked ready for CEO and Analyst review.";
  if (status === "issue-escalated") return "Department issue escalated to the CEO.";
  if (status === "department-head-required") return "This action requires a Departmental Head membership.";
  if (status === "unauthorized-department") return "This action is limited to the assigned department.";
  if (status === "demo") return "Demo mode: connect Supabase to persist staff reports.";
  if (status === "invalid") return "Complete the required fields before submitting.";
  return `Report action failed: ${status}`;
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAuditBody(metadata: Record<string, unknown>) {
  return typeof metadata.body === "string" ? metadata.body : "Correction details were recorded in the department audit trail.";
}
