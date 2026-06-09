import type { IcBusinessAction } from "@/lib/ic-engine/dashboard";

type IcActionTableProps = {
  rows: IcBusinessAction[];
};

export function IcActionTable({ rows }: IcActionTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Business</th>
          <th>IC Score</th>
          <th>Movement</th>
          <th>Open IC issues</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.business.id}>
            <td>
              <strong>{row.business.legalName}</strong>
              <br />
              {row.business.sector}
            </td>
            <td><span className="pill blue">{row.latestIcScore}</span></td>
            <td><span className={row.scoreDelta < 0 ? "pill yellow" : "pill green"}>{formatDelta(row.scoreDelta)}</span></td>
            <td>
              {row.openExceptionCount} open
              <br />
              {row.highRiskExceptionCount} high-risk
            </td>
            <td><span className="pill purple">{row.actionLabel}</span></td>
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr>
            <td colSpan={5}>No IC actions currently require attention.</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function formatDelta(delta: number) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
