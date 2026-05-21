import Link from "next/link";
import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { IC_RULE_REGISTRY } from "@/lib/ic-engine/rules";
import { IC_WORKBENCH_SCENARIOS, getIcWorkbenchScenario } from "@/lib/ic-engine/scenarios";

type IcDemoPageProps = {
  searchParams: Promise<{
    scenario?: string;
    sales?: string;
    finance?: string;
    evidence?: string;
    duplicate?: string;
  }>;
};

export default async function IcDemoPage({ searchParams }: IcDemoPageProps) {
  const params = await searchParams;
  const scenario = getIcWorkbenchScenario(params.scenario);
  const salesValue = toNumber(params.sales, scenario.reports.find((report) => report.department === "sales")?.value ?? 2_000_000);
  const financeValue = toNumber(params.finance, scenario.reports.find((report) => report.department === "finance")?.value ?? 1_200_000);
  const evidenceCompletion = toNumber(params.evidence, scenario.evidenceCompletion);
  const reports = scenario.reports.map((report) => {
    if (report.department === "sales") return { ...report, value: salesValue };
    if (report.department === "finance") return { ...report, value: financeValue };
    return report;
  });
  const existingExceptions = params.duplicate === "1" ? scenario.existingExceptions : [];
  const result = runBusinessIcAutomation({
    reports,
    existingExceptions,
    evidenceCompletion,
    evidenceFiles: scenario.evidenceFiles
  });

  return (
    <div className="stack">
      <DemoBanner role="IC mechanism" />
      <section className="page-title">
        <h1>IC mechanism test</h1>
        <p>Run internal control checks without authentication or database writes.</p>
        <p>Scenario: {scenario.name}. {scenario.description}</p>
      </section>

      <section className="grid grid-3">
        {IC_WORKBENCH_SCENARIOS.map((item) => (
          <Link key={item.id} className="button" href={`/ic?scenario=${item.id}`}>
            {item.name}
          </Link>
        ))}
      </section>

      <section className="card">
        <h2>Rule registry</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Description</th>
              <th>Score factors</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(IC_RULE_REGISTRY).map((rule) => (
              <tr key={rule.id}>
                <td>{rule.title}</td>
                <td>{rule.description}</td>
                <td>{rule.scoreFactors.map(formatFactor).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Inputs</h2>
        <form className="form form-inline" action="/ic">
          <input type="hidden" name="scenario" value={scenario.id} />
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
              <h2>Exception lifecycle</h2>
              <ul className="list">
                {result.exceptionLifecycle.map((review) => (
                  <li key={`${review.candidate.title}:${review.state}`}>
                    <strong>{review.candidate.riskLevel}: {review.candidate.title}</strong>
                    <br />
                    {review.state} {review.shouldCreate ? "(create)" : "(do not create)"}
                  </li>
                ))}
                {result.exceptionLifecycle.length === 0 ? <li>No exception candidates.</li> : null}
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
