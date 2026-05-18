import {
  createBusinessProfile,
  createDepartment,
  createKpiTarget,
  submitAssessment
} from "@/app/dashboard/ceo/onboarding/actions";
import { StatCard } from "@/components/ui/stat-card";
import { getPlatformSnapshot } from "@/lib/data/repository";

type CeoOnboardingPageProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function CeoOnboardingPage({ searchParams }: CeoOnboardingPageProps) {
  const params = await searchParams;
  const { businesses, departments, kpiTargets, assessmentResults } = await getPlatformSnapshot();
  const business = businesses[0];
  const businessDepartments = business ? departments.filter((department) => department.businessId === business.id) : [];
  const businessKpis = business ? kpiTargets.filter((kpi) => kpi.businessId === business.id) : [];
  const latestAssessment = business
    ? assessmentResults.find((assessment) => assessment.businessId === business.id)
    : undefined;

  return (
    <div className="stack">
      <section className="page-title">
        <h1>CEO onboarding</h1>
        <p>
          Create the business profile, complete the structural assessment, set KPIs, and create the first departments.
        </p>
        {params.action ? <p className="notice">{getActionMessage(params.action)}</p> : null}
      </section>

      <section className="grid grid-3">
        <StatCard label="Business profile" value={business ? "Created" : "Missing"} detail={business?.legalName ?? "Create a profile first"} />
        <StatCard label="Latest VeriScore" value={latestAssessment?.veriscore ?? business?.currentVeriScore ?? 0} detail={latestAssessment?.version ?? "No assessment yet"} />
        <StatCard label="Departments" value={businessDepartments.length} detail="Initial operating structure" />
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Business profile</h2>
          <form action={createBusinessProfile} className="form">
            <label>
              Legal name
              <input name="legalName" required minLength={2} maxLength={180} defaultValue={business?.legalName ?? ""} />
            </label>
            <label>
              Trading name
              <input name="tradingName" maxLength={180} />
            </label>
            <label>
              Sector
              <input name="sector" required minLength={2} maxLength={120} defaultValue={business?.sector ?? ""} />
            </label>
            <label>
              Location
              <input name="location" required minLength={2} maxLength={160} placeholder="Lagos, Nigeria" />
            </label>
            <button className="button primary" type="submit">
              Create profile
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Structural assessment</h2>
          <form action={submitAssessment} className="form">
            <BusinessIdInput businessId={business?.id} />
            <ScoreInput name="structure" label="Structure" />
            <ScoreInput name="finance" label="Finance" />
            <ScoreInput name="controls" label="Controls" />
            <ScoreInput name="evidence" label="Evidence" />
            <ScoreInput name="governance" label="Governance" />
            <button className="button primary" type="submit" disabled={!business}>
              Calculate VeriScore
            </button>
          </form>
        </article>

        <article className="card">
          <h2>KPI setup</h2>
          <form action={createKpiTarget} className="form">
            <BusinessIdInput businessId={business?.id} />
            <label>
              KPI name
              <input name="name" required minLength={2} maxLength={160} placeholder="Sales-to-Finance Match Rate" />
            </label>
            <label>
              Target value
              <input name="targetValue" type="number" min="1" step="0.01" required placeholder="95" />
            </label>
            <label>
              Unit
              <input name="unit" required minLength={1} maxLength={40} placeholder="%" />
            </label>
            <label>
              Period
              <select name="period" required defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <button className="button primary" type="submit" disabled={!business}>
              Add KPI
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Department setup</h2>
          <form action={createDepartment} className="form">
            <BusinessIdInput businessId={business?.id} />
            <label>
              Department name
              <input name="name" required minLength={2} maxLength={120} placeholder="Sales" />
            </label>
            <label>
              Department type
              <select name="departmentType" required defaultValue="sales">
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
                <option value="procurement">Procurement</option>
                <option value="operations">Operations</option>
                <option value="hr">HR/Admin</option>
              </select>
            </label>
            <button className="button primary" type="submit" disabled={!business}>
              Create department
            </button>
          </form>
        </article>
      </section>

      <section className="grid grid-2">
        <article className="card">
          <h2>Current KPIs</h2>
          <ul className="list">
            {businessKpis.map((kpi) => (
              <li key={kpi.id}>
                <strong>{kpi.name}</strong>
                <br />
                {kpi.targetValue}
                {kpi.unit} {kpi.period}
              </li>
            ))}
            {businessKpis.length === 0 ? <li>No KPIs created yet.</li> : null}
          </ul>
        </article>
        <article className="card">
          <h2>Departments</h2>
          <ul className="list">
            {businessDepartments.map((department) => (
              <li key={department.id}>
                <strong>{department.name}</strong>
                <br />
                {department.departmentType}
              </li>
            ))}
            {businessDepartments.length === 0 ? <li>No departments created yet.</li> : null}
          </ul>
        </article>
      </section>
    </div>
  );
}

function BusinessIdInput({ businessId }: { businessId?: string }) {
  return <input type="hidden" name="businessId" value={businessId ?? ""} />;
}

function ScoreInput({ name, label }: { name: string; label: string }) {
  return (
    <label>
      {label}
      <input name={name} type="number" min="0" max="100" required defaultValue="70" />
    </label>
  );
}

function getActionMessage(status: string) {
  if (status === "business-created") return "Business profile created and audited.";
  if (status === "assessment-submitted") return "Assessment submitted and VeriScore calculated.";
  if (status === "kpi-created") return "KPI target created and audited.";
  if (status === "department-created") return "Department created and audited.";
  if (status === "demo") return "Demo mode: connect Supabase to persist onboarding actions.";
  if (status === "invalid") return "Complete the required fields before submitting.";
  return `Onboarding action failed: ${status}`;
}
