import Link from "next/link";
import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { getDemoSnapshot } from "@/lib/data/demo-snapshot";

type IcDemoPageProps = {
  searchParams: Promise<{
    sales?: string;
    finance?: string;
    evidence?: string;
    duplicate?: string;
  }>;
};

export default async function IcDemoPage({ searchParams }: IcDemoPageProps) {
  const params = await searchParams;
  const salesValue = toNumber(params.sales, 2_000_000);
  const financeValue = toNumber(params.finance, 1_200_000);
  const evidenceCompletion = toNumber(params.evidence, 70);
  const { departmentReports, controlExceptions } = getDemoSnapshot();
  const reports = [
    { ...departmentReports[0], id: "demo_sales", value: salesValue, department: "sales" as const },
    { ...departmentReports[1], id: "demo_finance", value: financeValue, department: "finance" as const },
    {
      ...departmentReports[0],
      id: "demo_procurement",
      value: 750_000,
      department: "procurement" as const,
      evidenceCount: 0
    }
  ];
  const existingExceptions = params.duplicate === "1" ? controlExceptions : [];
  const result = runBusinessIcAutomation({
    reports,
    existingExceptions,
    evidenceCompletion
  });

  return (
    <div className="stack">
      <DemoBanner role="IC mechanism" />
      <section className="page-title">
        <h1>IC mechanism test</h1>
        <p>Run internal control checks without authentication or database writes.</p>
      </section>

      <section className="grid grid-3">
        <Link className="button" href="/ic?sales=1000000&finance=980000&evidence=85">
          Green scenario
        </Link>
        <Link className="button" href="/ic?sales=1000000&finance=850000&evidence=65">
          Orange scenario
        </Link>
        <Link className="button" href="/ic?sales=2000000&finance=1200000&evidence=45">
          Red scenario
        </Link>
      </section>

      <section className="card">
        <h2>Inputs</h2>
        <form className="form form-inline" action="/ic">
          <label>
            Sales report value
            <input name="sales" type="number" min="0" step="1000" defaultValue={salesValue} />
          </label>
          <label>
            Finance inflow
            <input name="finance" type="number" min="0" step="1000" defaultValue={financeValue} />
          </label>
          <label>
            Evidence completion
            <input name="evidence" type="number" min="0" max="100" step="1" defaultValue={evidenceCompletion} />
          </label>
          <button className="button primary" type="submit">
            Run IC check
          </button>
        </form>
      </section>

      {result ? (
        <>
          <section className="grid grid-3">
            <StatCard label="Checks run" value={result.checks.length} detail="Rule-level IC tests" />
            <StatCard label="New exceptions" value={result.newExceptionCandidates.length} detail="Duplicate-safe exception candidates" />
            <StatCard label="IC Score" value={result.icScore} detail="Calculated control score" />
          </section>

          <section className="card">
            <h2>Rule results</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Finding</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {result.checks.map((check) => (
                  <tr key={check.id}>
                    <td>{check.title}</td>
                    <td>{check.status}</td>
                    <td>{check.riskLevel}</td>
                    <td>{check.description}</td>
                    <td>{check.scoreImpact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid grid-2">
            <article className="card">
              <h2>Score factors</h2>
              <table className="table">
                <tbody>
                  {Object.entries(result.scoreFactors).map(([factor, value]) => (
                    <tr key={factor}>
                      <td>{formatFactor(factor)}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="card">
              <h2>Exception candidates</h2>
              <ul className="list">
                {result.newExceptionCandidates.map((exception) => (
                  <li key={exception.title}>
                    <strong>{exception.riskLevel}: {exception.title}</strong>
                    <br />
                    {exception.description}
                  </li>
                ))}
                {result.newExceptionCandidates.length === 0 ? <li>No new exception candidates.</li> : null}
              </ul>
            </article>
          </section>
        </>
      ) : (
        <section className="card">
          <h2>IC result</h2>
          <p>Sales and finance reports are both required.</p>
        </section>
      )}
    </div>
  );
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatFactor(value: string) {
  return value.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}
