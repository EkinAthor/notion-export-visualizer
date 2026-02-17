import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { useFilter } from '../../hooks/useFilter';
import { useSort } from '../../hooks/useSort';
import { useViewPersistence } from '../../hooks/useViewPersistence';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const PAGE_SIZE = 50;

export function DatabaseView() {
  const { uid } = useParams<{ uid: string }>();
  const { database, loading, error } = useDatabase(uid);
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = database?.columns || [];
  const { filters, setFilter, setFilters, clearFilters, applyFilters } = useFilter(columns);
  const { sort, setSort, applySort } = useSort();
  useViewPersistence(uid, columns);

  const currentPage = Number(searchParams.get('page')) || 1;

  const processedRows = useMemo(() => {
    if (!database) return [];
    const filtered = applyFilters(database.rows);
    return applySort(filtered);
  }, [database, applyFilters, applySort]);

  const totalPages = Math.ceil(processedRows.length / PAGE_SIZE);
  const pagedRows = processedRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (page <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(page));
      }
      return next;
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!database) return <div className="empty-state">Database not found</div>;

  return (
    <div className="database-view">
      <div className="database-header">
        <h1>{database.title}</h1>
        <span className="row-count">{processedRows.length} rows</span>
      </div>

      <FilterBar
        columns={columns}
        filters={filters}
        onSetFilter={setFilter}
        onSetFilters={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="table-container">
        <table className="database-table">
          <TableHeader columns={columns} sort={sort} onSort={setSort} />
          <tbody>
            {pagedRows.map((row, i) => (
              <TableRow key={`${row.uid ?? 'r'}-${i}`} row={row} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={processedRows.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
