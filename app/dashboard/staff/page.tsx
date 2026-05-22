import { attachEvidenceToReport, submitDepartmentReport } from "@/app/dashboard/staff/actions";
import { FormSuggestions } from "@/components/forms/form-suggestions";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getEvidenceForReport } from "@/lib/evidence/quality";
import { getEvidenceUploadSuggestions, getStaffReportSuggestions } from "@/lib/forms/suggestions";
import { getActiveStaffMembership } from "@/lib/staff/onboarding";
import { getReportsForDepartment } from "@/lib/staff/reporting";

type StaffDashboardProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function StaffDashboard({ searchParams }: StaffDashboardProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const { businesses, departments, departmentReports, evidenceFiles, businessUsers, controlExceptions, analystNotes } = await getPlatformSnapshot();
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
  const pendingReports = reports.filter((report) => report.status === "draft").length;
  const submittedReports = reports.filter((report) => report.status === "submitted").length;
  const reportEvidenceFiles = evidenceFiles.filter((evidence) => reports.some((report) => report.id === evidence.reportId));
  const businessExceptions = business ? controlExceptions.filter((exception) => exception.businessId === business.id) : [];
  const departmentIssues = assignedDepartment
    ? businessExceptions.filter((exception) => exception.title.toLowerCase().includes(assignedDepartment.departmentType))
    : businessExceptions;
  const returnedCorrections = business
    ? analystNotes.filter((note) => note.businessId === business.id && note.noteType === "clarification_request")
    : [];
  const reportSuggestions = getStaffReportSuggestions({
    department: assignedDepartment,
    reports,
    evidenceFiles: reportEvidenceFiles,
    exceptions: businessExceptions
  });
  const evidenceSuggestions = getEvidenceUploadSuggestions({
    report: reports.find((report) => report.status === "submitted") ?? reports[0],
    exceptions: businessExceptions
  });

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Staff dashboard</h1>
        <p>Submit department reports and evidence counts for CEO review and internal control checks.</p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
      </section>

      <section className="grid grid-3">
        <StatCard label="Assigned department" value={assignedDepartment?.name ?? "Unassigned"} detail={business?.legalName ?? "No business"} />
        <StatCard label="Staff role" value={formatRole(membership?.role ?? "pending")} detail={membership ? "Accepted membership" : "Awaiting assignment"} />
        <StatCard label="Submitted reports" value={submittedReports} detail="Awaiting review" />
        <StatCard label="Draft reports" value={pendingReports} detail="Not yet submitted" />
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
          <h2>Recent reports</h2>
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
              {reports.map((report) => {
                const reportEvidence = getEvidenceForReport(evidenceFiles, report.id);
                return (
                  <tr key={report.id}>
                    <td>{report.department}</td>
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
            {returnedCorrections.length === 0 ? <li>No returned corrections for this department.</li> : null}
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
    </div>
  );
}


function getActionMessage(status: string) {
  if (status === "invite-accepted") return "Invitation accepted. Staff workspace is now linked to the assigned business.";
  if (status === "demo-accepted") return "Demo mode: staff invitation acceptance previewed.";
  if (status === "report-submitted") return "Department report submitted and audited.";
  if (status === "evidence-attached") return "Evidence metadata attached and audited.";
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
