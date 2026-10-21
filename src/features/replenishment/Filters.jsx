// src/features/replenishment/Filters.jsx
// Filter bar: supplier dropdown, status filter, search by SKU / name.

import { Select, Input } from '../../components/ui';

export default function Filters({ filters, onChange }) {
  return (
    <div className="replenishment-filters" role="search" aria-label="Filter products">
      <Input
        id="filter-search"
        label="Search SKU / Name"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <Select
        id="filter-supplier"
        label="Supplier"
        value={filters.supplier}
        onChange={(e) => onChange({ ...filters, supplier: e.target.value })}
        options={[
          { value: '', label: 'All Suppliers' },
          // TODO: populated from API
        ]}
      />
      <Select
        id="filter-status"
        label="Status"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        options={[
          { value: '',         label: 'All Statuses' },
          { value: 'critical', label: 'Critical' },
          { value: 'low',      label: 'Low' },
          { value: 'ok',       label: 'OK' },
          { value: 'ordered',  label: 'Ordered' },
        ]}
      />
    </div>
  );
}
