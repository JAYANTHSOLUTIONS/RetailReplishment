// src/components/ui/StatusBadge.jsx
// Visual indicator for product / order status (e.g. critical, low, ok, ordered).
const STATUS_LABELS = {
  critical: 'Critical',
  low: 'Low',
  healthy: 'Healthy',
  excess: 'Excess',
  ordered: 'Ordered',
  ok: 'OK',
};

export default function StatusBadge({ status, label, className = '' }) {
  const key = String(status || '').toLowerCase();
  const displayLabel = label || STATUS_LABELS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');

  return (
    <span className={`st-badge ${key} ${className}`.trim()} aria-label={displayLabel}>
      <span className="st-dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
