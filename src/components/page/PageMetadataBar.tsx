import { useMemo } from 'react';
import type { ColumnSchema } from '../../types';
import { CellRenderer } from '../cells/CellRenderer';

interface PageMetadataBarProps {
  metadata: Record<string, string>;
  columns?: ColumnSchema[];
}

export function PageMetadataBar({ metadata, columns }: PageMetadataBarProps) {
  const entries = Object.entries(metadata).filter(([, v]) => v);

  const columnMap = useMemo(() => {
    if (!columns) return new Map<string, ColumnSchema>();
    const map = new Map<string, ColumnSchema>();
    for (const col of columns) {
      map.set(col.name, col);
    }
    return map;
  }, [columns]);

  if (entries.length === 0) return null;

  return (
    <div className="page-metadata">
      {entries.map(([key, value]) => {
        const col = columnMap.get(key);
        return (
          <div key={key} className="metadata-row">
            <span className="metadata-key">{key}</span>
            <span className="metadata-value">
              {col ? <CellRenderer type={col.type} value={value} /> : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
