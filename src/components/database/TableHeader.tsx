import type { ColumnSchema, SortState } from '../../types';

interface TableHeaderProps {
  columns: ColumnSchema[];
  sort: SortState | null;
  onSort: (column: string) => void;
}

export function TableHeader({ columns, sort, onSort }: TableHeaderProps) {
  return (
    <thead>
      <tr>
        {columns.map(col => (
          <th
            key={col.name}
            className={`table-header-cell ${sort?.column === col.name ? 'sorted' : ''}`}
            onClick={() => onSort(col.name)}
          >
            <div className="header-content">
              <span className="header-name">{col.name}</span>
              <span className="header-type">{col.type.replace('_', ' ')}</span>
              {sort?.column === col.name && (
                <span className="sort-indicator">
                  {sort.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
