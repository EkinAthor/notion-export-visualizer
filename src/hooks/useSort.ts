import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { SortState, DatabaseRow } from '../types';

export function useSort() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort: SortState | null = useMemo(() => {
    const col = searchParams.get('sort');
    const dir = searchParams.get('dir') as 'asc' | 'desc' | null;
    if (col) return { column: col, direction: dir || 'asc' };
    return null;
  }, [searchParams]);

  const setSort = useCallback((column: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const currentCol = prev.get('sort');
      const currentDir = prev.get('dir');
      if (currentCol === column && currentDir !== 'desc') {
        next.set('sort', column);
        next.set('dir', 'desc');
      } else if (currentCol === column && currentDir === 'desc') {
        next.delete('sort');
        next.delete('dir');
      } else {
        next.set('sort', column);
        next.set('dir', 'asc');
      }
      return next;
    });
  }, [setSearchParams]);

  const applySort = useCallback((rows: DatabaseRow[]): DatabaseRow[] => {
    if (!sort) return rows;
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const aVal = a.values[sort.column] || '';
      const bVal = b.values[sort.column] || '';

      // Try date comparison
      const aDate = parseNotionDate(aVal);
      const bDate = parseNotionDate(bVal);
      if (aDate && bDate) {
        return sort.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [sort]);

  return { sort, setSort, applySort };
}

function parseNotionDate(val: string): number | null {
  // "January 31, 2024" or "Sep 8, 2024"
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
