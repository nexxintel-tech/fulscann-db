import { inviteStaffMember } from "@/app/dashboard/ceo/staff/actions";
import { StatCard } from "@/components/ui/stat-card";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getPendingStaffInvitations, getStaffAssignableDepartments } from "@/lib/staff/reporting";

type CeoStaffPageProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function CeoStaffPage({ searchParams }: CeoStaffPageProps) {
  const params = await searchParams;
  const { businesses, departments, staffInvitations } = await getPlatformSnapshot();
  const business = businesses[0];
  const assignableDepartments = business ? getStaffAssignableDepartments(departments, business.id) : [];
  const pendingInvitations = business ? getPendingStaffInvitations(staffInvitations, business.id) : [];

  return (
    <div className="stack">
      <section className="page-title">
        <h1>Staff management</h1>
        <p>Invite staff into departments so they can submit operating reports and evidence for CEO review.</p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
      </section>

      <section className="grid grid-3">
        <StatCard label="Departments" value={assignableDepartments.length} detail="Available for assignment" />
        <StatCard label="Pending invitations" value={pendingInvitations.length} detail="Awaiting staff acceptance" />
        <StatCard label="Business" value={business?.legalName ?? "None"} detail="Current CEO workspace" />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Invite staff</h2>
          <form action={inviteStaffMember} className="form">
            <input type="hidden" name="businessId" value={business?.id ?? ""} />
            <label>
              Department
              <select name="departmentId" required disabled={assignableDepartments.length === 0}>
                <option value="">Select department</option>
                {assignableDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Staff email
              <input name="email" type="email" required placeholder="staff@example.com" />
            </label>
            <label>
              Role
              <select name="role" required defaultValue="sales_officer">
                <option value="sales_officer">Sales Officer</option>
                <option value="finance_officer">Finance Officer</option>
                <option value="procurement_officer">Procurement Officer</option>
                <option value="operations_officer">Operations Officer</option>
                <option value="hr_admin">HR/Admin Officer</option>
              </select>
            </label>
            <button className="button primary" type="submit" disabled={!business || assignableDepartments.length === 0}>
              Send invite
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Pending invitations</h2>
          <ul className="list">
            {pendingInvitations.map((invitation) => {
              const department = departments.find((item) => item.id === invitation.departmentId);
              const acceptPath = `/staff/accept?token=${encodeURIComponent(invitation.invitationToken)}`;
              return (
                <li key={invitation.id}>
                  <strong>{invitation.email}</strong>
                  <br />
                  {department?.name ?? "Department"} - {invitation.role}
                  <br />
                  <a href={acceptPath}>Acceptance link</a>
                </li>
              );
            })}
            {pendingInvitations.length === 0 ? <li>No pending staff invitations.</li> : null}
          </ul>
        </article>
      </section>
    </div>
  );
}

function getActionMessage(status: string) {
  if (status === "staff-invited") return "Staff invitation created and audited.";
  if (status === "demo") return "Demo mode: connect Supabase to persist staff invitations.";
  if (status === "invalid") return "Complete the required fields before submitting.";
  return `Staff action failed: ${status}`;
}
