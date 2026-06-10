import type { HelpRole } from "@/lib/help/getting-started-content";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function RoleCard({ role }: { role: HelpRole }) {
  return (
    <article className="help-card role-card">
      <div className="help-card-title">
        <h3>{role.title}</h3>
        <StatusBadge label={role.title === "Institution User" ? "Approved access only" : "Role scoped"} tone="info" />
      </div>
      <p>{role.summary}</p>
      <ul>
        {role.can.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {role.boundary ? <p className="boundary-note">{role.boundary}</p> : null}
    </article>
  );
}
