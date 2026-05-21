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
            <td>{row.latestIcScore}</td>
            <td>{formatDelta(row.scoreDelta)}</td>
            <td>
              {row.openExceptionCount} open
              <br />
              {row.highRiskExceptionCount} high-risk
            </td>
            <td>{row.actionLabel}</td>
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
