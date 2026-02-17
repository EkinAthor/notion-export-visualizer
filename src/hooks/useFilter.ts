import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { FilterState, DatabaseRow, ColumnSchema } from '../types';

export function useFilter(columns: ColumnSchema[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState[] = useMemo(() => {
    const result: FilterState[] = [];
    for (const col of columns) {
      const val = searchParams.get(`f_${col.name}`);
      if (val) {
        result.push({ column: col.name, value: val });
      }
    }
    return result;
  }, [searchParams, columns]);

  const setFilter = useCallback((column: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(`f_${column}`, value);
      } else {
        next.delete(`f_${column}`);
      }
      next.delete('page'); // reset pagination on filter change
      return next;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const col of columns) {
        next.delete(`f_${col.name}`);
      }
      next.delete('page');
      return next;
    });
  }, [setSearchParams, columns]);

  const applyFilters = useCallback((rows: DatabaseRow[]): DatabaseRow[] => {
    if (filters.length === 0) return rows;
    return rows.filter(row => {
      return filters.every(f => {
        const cellVal = (row.values[f.column] || '').toLowerCase();
        const filterParts = f.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (filterParts.length <= 1) {
          return cellVal.includes(f.value.toLowerCase());
        }
        // AND: every selected tag must appear in the cell value
        return filterParts.every(part => cellVal.includes(part));
      });
    });
  }, [filters]);

  const setFilters = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [column, value] of Object.entries(updates)) {
        if (value) {
          next.set(`f_${column}`, value);
        } else {
          next.delete(`f_${column}`);
        }
      }
      next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  return { filters, setFilter, setFilters, clearFilters, applyFilters };
}
