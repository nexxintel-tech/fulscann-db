import Link from "next/link";
import { IcActionTable } from "@/components/dashboard/ic-action-table";
import { StatCard } from "@/components/ui/stat-card";
import {
  respondToClarification,
  resolveException,
  revokeIntegrityReportAccess,
  shareIntegrityReport
} from "@/app/dashboard/ceo/actions";
import {
  canShareIntegrityReport,
  getActiveInstitutionAccess,
  getOpenClarificationRequests,
  getOpenExceptions
} from "@/lib/ceo/actions";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getBusinessesNeedingIcAction, getIcBusinessActions } from "@/lib/ic-engine/dashboard";

type CeoDashboardProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function CeoDashboard({ searchParams }: CeoDashboardProps) {
  const params = await searchParams;
  const {
    businesses,
    controlExceptions,
    departmentReports,
    evidenceFiles,
    analystNotes,
    ceoResponses,
    institutionAccess,
    icScoreResults
  } = await getPlatformSnapshot();
  const business = businesses[0];

  if (!business) {
    return null;
  }

  const reports = departmentReports.filter((report) => report.businessId === business.id);
  const exceptions = controlExceptions.filter((exception) => exception.businessId === business.id);
  const openExceptions = getOpenExceptions(controlExceptions, business.id);
  const clarificationRequests = getOpenClarificationRequests(analystNotes, business.id);
  const activeAccess = getActiveInstitutionAccess(institutionAccess, business.id);
  const responseCount = ceoResponses.filter((response) => response.businessId === business.id).length;
  const reportCanBeShared = canShareIntegrityReport(business.integrityReportReady);
  const latestIcScore = icScoreResults.find((score) => score.businessId === business.id);
  const icActions = getIcBusinessActions([business], controlExceptions, icScoreResults);
  const icActionQueue = getBusinessesNeedingIcAction(icActions);

  return (
    <div className="stack">
      <section className="page-title">
        <h1>{business.legalName}</h1>
        <p>
          CEO control center for business profile readiness, KPI setup, department reporting, exceptions, evidence, and
          Integrity Report status.
        </p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
        <Link className="button" href="/dashboard/ceo/onboarding">
          Continue onboarding
        </Link>
        <Link className="button" href="/dashboard/ceo/staff">
          Manage staff
        </Link>
      </section>

      <section className="grid grid-3">
        <StatCard label="VeriScore" value={business.currentVeriScore} detail="Business maturity signal" />
        <StatCard label="IC Score" value={business.currentIcScore} detail="Internal control signal" />
        <StatCard label="Evidence completion" value={`${business.evidenceCompletion}%`} detail="Report support level" />
        <StatCard label="IC actions" value={icActionQueue.length} detail="Control issues needing CEO action" />
      </section>

      <section className="card">
        <h2>IC action queue</h2>
        <IcActionTable rows={icActionQueue} />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>CEO-owned actions</h2>
          <ul className="list">
            <li>Approve sensitive items</li>
            <li>Resolve exceptions</li>
            <li>Invite staff and manage departments</li>
            <li>Share Integrity Report externally</li>
          </ul>
        </article>
        <article className="card">
          <h2>Integrity Report</h2>
          <p>{business.integrityReportReady ? "Ready for CEO review and controlled sharing." : "Not ready yet."}</p>
          <p>{activeAccess.length} active institution access grant{activeAccess.length === 1 ? "" : "s"}.</p>
        </article>
        <article className="card">
          <h2>IC Score movement</h2>
          <p>Latest automated IC Score: {latestIcScore?.score ?? business.currentIcScore}.</p>
          <p>Previous score: {business.previousIcScore}. Current score: {business.currentIcScore}.</p>
        </article>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Clarification requests</h2>
          <p>{clarificationRequests.length} open request{clarificationRequests.length === 1 ? "" : "s"} from Fulscann Analysts.</p>
          <ul className="list">
            {clarificationRequests.map((note) => (
              <li key={note.id}>
                <strong>Analyst request</strong>
                <p>{note.body}</p>
                <form action={respondToClarification} className="form compact-form">
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="linkedEntityId" value={note.id} />
                  <label>
                    CEO response
                    <textarea name="body" required minLength={3} maxLength={2000} placeholder="Respond with clarification or next action." />
                  </label>
                  <button className="button primary" type="submit">
                    Send response
                  </button>
                </form>
              </li>
            ))}
            {clarificationRequests.length === 0 ? <li>No open clarification requests.</li> : null}
          </ul>
        </article>

        <article className="card">
          <h2>Resolve exceptions</h2>
          <p>{openExceptions.length} open exception{openExceptions.length === 1 ? "" : "s"} need CEO-owned resolution.</p>
          <ul className="list">
            {openExceptions.map((exception) => (
              <li key={exception.id}>
                <strong>{exception.title}</strong>
                <br />
                {exception.riskLevel} risk, open {exception.daysOpen} days
                <form action={resolveException} className="form compact-form">
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="linkedEntityId" value={exception.id} />
                  <label>
                    Resolution note
                    <textarea name="body" required minLength={3} maxLength={2000} placeholder="Explain the resolution and supporting action." />
                  </label>
                  <button className="button primary" type="submit">
                    Resolve exception
                  </button>
                </form>
              </li>
            ))}
            {openExceptions.length === 0 ? <li>No open exceptions.</li> : null}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Department reports</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Status</th>
              <th>Value</th>
              <th>Evidence files</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const reportEvidence = evidenceFiles.filter((evidence) => evidence.reportId === report.id);
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
                            )}{" "}
                            level {evidence.evidenceLevel}
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
      </section>

      <section className="card">
        <h2>Exceptions</h2>
        <ul className="list">
          {exceptions.map((exception) => (
            <li key={exception.id}>
              <strong>{exception.title}</strong>
              <br />
              {exception.riskLevel} risk, {exception.status}, open {exception.daysOpen} days
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Integrity Report sharing</h2>
        <p>
          The CEO controls external report sharing. Analysts can mark readiness, but only the CEO can grant or revoke
          institution access.
        </p>
        <form action={shareIntegrityReport} className="form form-inline">
          <input type="hidden" name="businessId" value={business.id} />
          <label>
            Institution name
            <input name="institutionName" required minLength={2} maxLength={160} placeholder="Institution name" />
          </label>
          <label>
            Institution email
            <input name="institutionEmail" type="email" required placeholder="credit@example.com" />
          </label>
          <button className="button primary" type="submit" disabled={!reportCanBeShared}>
            Share report
          </button>
        </form>

        <h3>Active access</h3>
        <ul className="list">
          {activeAccess.map((access) => (
            <li key={access.id}>
              <strong>{access.institutionName}</strong>
              <br />
              {access.institutionEmail}
              <form action={revokeIntegrityReportAccess} className="compact-form">
                <input type="hidden" name="businessId" value={business.id} />
                <input type="hidden" name="accessId" value={access.id} />
                <button className="button" type="submit">
                  Revoke access
                </button>
              </form>
            </li>
          ))}
          {activeAccess.length === 0 ? <li>No active institution access.</li> : null}
        </ul>
        <p>{responseCount} CEO response record{responseCount === 1 ? "" : "s"} logged.</p>
      </section>
    </div>
  );
}

function getActionMessage(status: string) {
  if (status === "clarification-sent") return "Clarification response sent and audited.";
  if (status === "exception-resolved") return "Exception resolved and audited.";
  if (status === "report-shared") return "Integrity Report access granted and audited.";
  if (status === "report-revoked") return "Integrity Report access revoked and audited.";
  if (status === "demo") return "Demo mode: connect Supabase to persist CEO actions.";
  if (status === "invalid") return "Complete the required fields before submitting.";
  if (status === "invalid-transition") return "Only unresolved exceptions can be resolved by the CEO.";
  return `Action failed: ${status}`;
}
