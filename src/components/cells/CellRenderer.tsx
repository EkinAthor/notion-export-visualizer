import type { ColumnType } from '../../types';
import { TextCell } from './TextCell';
import { DateCell } from './DateCell';
import { TagsCell } from './TagsCell';
import { UrlCell } from './UrlCell';
import { PersonCell } from './PersonCell';
import { StatusCell } from './StatusCell';
import { SelectCell } from './SelectCell';

interface CellRendererProps {
  type: ColumnType;
  value: string;
}

export function CellRenderer({ type, value }: CellRendererProps) {
  switch (type) {
    case 'date':
    case 'date_range':
      return <DateCell value={value} />;
    case 'multi_select':
      return <TagsCell value={value} />;
    case 'url':
      return <UrlCell value={value} />;
    case 'person':
      return <PersonCell value={value} />;
    case 'status':
      return <StatusCell value={value} />;
    case 'select':
      return <SelectCell value={value} />;
    default:
      return <TextCell value={value} />;
  }
}
