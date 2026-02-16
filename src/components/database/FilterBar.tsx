import { useState } from 'react';
import type { ColumnSchema, FilterState } from '../../types';

interface FilterBarProps {
  columns: ColumnSchema[];
  filters: FilterState[];
  onSetFilter: (column: string, value: string | null) => void;
  onClearFilters: () => void;
}

export function FilterBar({ columns, filters, onSetFilter, onClearFilters }: FilterBarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const filterableColumns = columns.filter(c =>
    ['multi_select', 'select', 'status', 'person', 'text', 'date'].includes(c.type)
  );

  return (
    <div className="filter-bar">
      <button className="filter-btn" onClick={() => setShowPopover(!showPopover)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 2h12M3 7h8M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Filter
      </button>

      {filters.length > 0 && (
        <>
          {filters.map(f => (
            <span key={f.column} className="filter-chip">
              {f.column}: {f.value}
              <button
                className="filter-chip-remove"
                onClick={() => onSetFilter(f.column, null)}
              >
                ×
              </button>
            </span>
          ))}
          <button className="filter-clear" onClick={onClearFilters}>
            Clear all
          </button>
        </>
      )}

      {showPopover && (
        <div className="filter-popover">
          {filterableColumns.map(col => (
            <FilterOption
              key={col.name}
              column={col}
              currentValue={filters.find(f => f.column === col.name)?.value || ''}
              onApply={(value) => {
                onSetFilter(col.name, value || null);
                setShowPopover(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterOption({
  column,
  currentValue,
  onApply,
}: {
  column: ColumnSchema;
  currentValue: string;
  onApply: (value: string) => void;
}) {
  const [value, setValue] = useState(currentValue);

  if (column.options && column.options.length > 0) {
    return (
      <div className="filter-option">
        <label>{column.name}</label>
        <select
          value={value}
          onChange={e => {
            setValue(e.target.value);
            onApply(e.target.value);
          }}
        >
          <option value="">All</option>
          {column.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="filter-option">
      <label>{column.name}</label>
      <input
        type="text"
        value={value}
        placeholder={`Filter ${column.name}...`}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onApply(value); }}
      />
      <button onClick={() => onApply(value)}>Apply</button>
    </div>
  );
}
