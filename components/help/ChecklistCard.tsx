import type { Checklist } from "@/lib/help/getting-started-content";

export function ChecklistCard({ checklist }: { checklist: Checklist }) {
  return (
    <article className="help-card checklist-card">
      <h3>{checklist.title}</h3>
      <ul>
        {checklist.items.map((item) => (
          <li key={item}>
            <span aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
