// src/hooks/useSelection.js
// Generic multi-selection state manager for a list keyed by id.

import { useState, useCallback } from 'react';

export function useSelection(initialIds = []) {
  const [selectedIds, setSelectedIds] = useState(new Set(initialIds));

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll   = useCallback((ids) => setSelectedIds(new Set(ids)), []);
  const clearAll    = useCallback(()    => setSelectedIds(new Set()),    []);
  const isSelected  = useCallback((id)  => selectedIds.has(id),          [selectedIds]);

  return { selectedIds, toggle, selectAll, clearAll, isSelected };
}
