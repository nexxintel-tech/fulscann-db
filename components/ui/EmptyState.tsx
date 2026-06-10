type EmptyStateProps = {
  actionLabel?: string;
  actionHref?: string;
  message: string;
  title: string;
};

export function EmptyState({ actionHref, actionLabel, message, title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
      {actionHref && actionLabel ? <a className="button secondary" href={actionHref}>{actionLabel}</a> : null}
    </div>
  );
}
