// src/components/ui/StatusBadge.jsx
// Visual indicator for product / order status (e.g. critical, low, ok, ordered).

import React from 'react';

const STATUS_LABELS = {
  critical: 'Critical',
  low:      'Low',
  ok:       'OK',
  ordered:  'Ordered',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`ui-status-badge ui-status-badge--${status}`} aria-label={STATUS_LABELS[status]}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
