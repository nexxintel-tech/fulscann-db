import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";
import { getActiveStaffMembership } from "@/lib/staff/onboarding";
import { getReportsForDepartment } from "@/lib/staff/reporting";

export default function DemoStaffPage() {
  const { businesses, departments, departmentReports, businessUsers, evidenceFiles } = getDemoSnapshot();
  const membership = getActiveStaffMembership(businessUsers);
  const business = businesses.find((item) => item.id === membership?.businessId) ?? businesses[0];
  const department = departments.find((item) => item.id === membership?.departmentId);
  const reports = department ? getReportsForDepartment(departmentReports, business.id, department.departmentType) : [];

  return (
    <div className="stack">
      <DemoBanner role="Staff" />
      <section className="page-title">
        <h1>Staff dashboard</h1>
        <p>Department reporting and evidence submission view for an accepted staff membership.</p>
      </section>

      <section className="grid grid-3">
        <StatCard label="Business" value={business.legalName} detail="Assigned workspace" />
        <StatCard label="Department" value={department?.name ?? "Unassigned"} detail={membership?.role ?? "No role"} />
        <StatCard label="Reports" value={reports.length} detail="Visible for this department" />
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
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.department}</td>
                <td>{report.status}</td>
                <td>NGN {report.value.toLocaleString("en-NG")}</td>
                <td>{evidenceFiles.filter((file) => file.reportId === report.id).length || report.evidenceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
