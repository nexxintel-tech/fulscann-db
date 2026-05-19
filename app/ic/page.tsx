import Link from "next/link";
import { DemoBanner } from "@/components/demo/demo-banner";
import { StatCard } from "@/components/ui/stat-card";
import { runSalesFinanceAutomation } from "@/lib/ic-engine/automation";
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
    { ...departmentReports[1], id: "demo_finance", value: financeValue, department: "finance" as const }
  ];
  const existingExceptions = params.duplicate === "1" ? controlExceptions : [];
  const result = runSalesFinanceAutomation({
    reports,
    existingExceptions,
    evidenceCompletion
  });

  return (
    <div className="stack">
      <DemoBanner role="IC mechanism" />
      <section className="page-title">
        <h1>IC mechanism test</h1>
        <p>Run the sales-finance internal control check without authentication or database writes.</p>
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
            <StatCard label="Matched" value={result.matched ? "Yes" : "No"} detail="Sales vs finance tolerance" />
            <StatCard label="Create exception" value={result.shouldCreateException ? "Yes" : "No"} detail="Duplicate-safe exception rule" />
            <StatCard label="IC Score" value={result.icScore} detail="Calculated control score" />
          </section>

          <section className="card">
            <h2>IC result</h2>
            {result.exception ? (
              <p>
                {result.exception.riskLevel} risk: {result.exception.description}
              </p>
            ) : (
              <p>No exception generated. Reports are within tolerance.</p>
            )}
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
