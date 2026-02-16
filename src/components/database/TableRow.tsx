import { useNavigate } from 'react-router-dom';
import type { ColumnSchema, DatabaseRow } from '../../types';
import { CellRenderer } from '../cells/CellRenderer';

interface TableRowProps {
  row: DatabaseRow;
  columns: ColumnSchema[];
}

export function TableRow({ row, columns }: TableRowProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (row.uid) {
      navigate(`/page/${row.uid}`);
    }
  };

  return (
    <tr
      className={`table-row ${row.uid ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      {columns.map(col => (
        <td key={col.name} className="table-cell">
          <CellRenderer type={col.type} value={row.values[col.name] || ''} />
        </td>
      ))}
    </tr>
  );
}
