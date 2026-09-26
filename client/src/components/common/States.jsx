import { STATUS_LABELS } from '../../utils/format';

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load this page.', description, onRetry }) {
  return (
    <div className="error-state">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {onRetry ? <button className="btn" type="button" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="card card-pad" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <div className="skeleton" />
          <div className="skeleton" style={{ width: '70%' }} />
        </div>
      ))}
    </div>
  );
}

export function Badge({ value }) {
  const raw = String(value || '');
  const key = raw.toLowerCase();
  const label = STATUS_LABELS[raw] || STATUS_LABELS[key] || key.replaceAll('_', ' ');
  return <span className={`badge ${key}`}>{label}</span>;
}
