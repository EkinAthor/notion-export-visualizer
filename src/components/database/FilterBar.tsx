import { useState, useRef, useEffect } from 'react';
import type { ColumnSchema, FilterState } from '../../types';

interface FilterBarProps {
  columns: ColumnSchema[];
  filters: FilterState[];
  onSetFilter: (column: string, value: string | null) => void;
  onSetFilters: (updates: Record<string, string | null>) => void;
  onClearFilters: () => void;
}

export function FilterBar({ columns, filters, onSetFilter, onSetFilters, onClearFilters }: FilterBarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const filterableColumns = columns.filter(c =>
    ['multi_select', 'select', 'status', 'person', 'text', 'date'].includes(c.type)
  );

  // Local draft state for all columns while popover is open
  const [draft, setDraft] = useState<Record<string, string>>({});

  function openPopover() {
    // Seed draft from current filters
    const initial: Record<string, string> = {};
    for (const f of filters) {
      initial[f.column] = f.value;
    }
    setDraft(initial);
    setShowPopover(true);
  }

  function applyAll() {
    const updates: Record<string, string | null> = {};
    for (const col of filterableColumns) {
      const val = draft[col.name]?.trim() || '';
      updates[col.name] = val || null;
    }
    onSetFilters(updates);
    setShowPopover(false);
  }

  function setDraftValue(column: string, value: string) {
    setDraft(prev => ({ ...prev, [column]: value }));
  }

  return (
    <div className="filter-bar">
      <button className="filter-btn" onClick={() => showPopover ? setShowPopover(false) : openPopover()}>
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
              value={draft[col.name] || ''}
              onChange={v => setDraftValue(col.name, v)}
              onSubmit={applyAll}
            />
          ))}
          <button className="filter-apply-btn" onClick={applyAll}>Apply</button>
        </div>
      )}
    </div>
  );
}

function FilterOption({
  column,
  value,
  onChange,
  onSubmit,
}: {
  column: ColumnSchema;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (column.options && column.options.length > 0) {
    return (
      <div className="filter-option">
        <label>{column.name}</label>
        <SearchableSelect
          options={column.options}
          value={value}
          onChange={onChange}
        />
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
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
    </div>
  );
}

function SearchableSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  function toggle(opt: string) {
    let next: string[];
    if (selected.includes(opt)) {
      next = selected.filter(s => s !== opt);
    } else {
      next = [...selected, opt];
    }
    onChange(next.join(','));
  }

  return (
    <div className="searchable-select" ref={containerRef}>
      <div
        className="searchable-select-trigger"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          <span className="searchable-select-placeholder">All</span>
        ) : (
          <span className="searchable-select-chips">
            {selected.map(s => (
              <span key={s} className="searchable-select-chip">
                {s}
                <button
                  className="searchable-select-chip-remove"
                  onClick={e => { e.stopPropagation(); toggle(s); }}
                >
                  ×
                </button>
              </span>
            ))}
          </span>
        )}
        <span className="searchable-select-arrow">▾</span>
      </div>
      {open && (
        <div className="searchable-select-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="searchable-select-search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="searchable-select-options">
            {filtered.length === 0 ? (
              <div className="searchable-select-empty">No matches</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  className={`searchable-select-option ${selected.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggle(opt)}
                >
                  <span className="searchable-select-check">
                    {selected.includes(opt) ? '✓' : ''}
                  </span>
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
