import { useDatabase } from '../../hooks/useDatabase';
import { TableHeader } from '../database/TableHeader';
import { TableRow } from '../database/TableRow';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface InlineDatabaseProps {
  uid: string;
}

export function InlineDatabase({ uid }: InlineDatabaseProps) {
  const { database, loading, error } = useDatabase(uid);

  if (loading) return <LoadingSpinner />;
  if (error || !database) return null;

  return (
    <div className="inline-database">
      <h3 className="inline-db-title">{database.title}</h3>
      <div className="table-container">
        <table className="database-table">
          <TableHeader columns={database.columns} sort={null} onSort={() => {}} />
          <tbody>
            {database.rows.map((row, i) => (
              <TableRow key={`${row.uid ?? 'r'}-${i}`} row={row} columns={database.columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
