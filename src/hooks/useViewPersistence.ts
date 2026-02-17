import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ColumnSchema } from '../types';

const STORAGE_PREFIX = 'db_view_';

/**
 * Persist filter/sort URL params to localStorage, keyed by database UID.
 * On mount with no URL params, hydrates from localStorage.
 * URL params always take precedence (preserves shareability).
 */
export function useViewPersistence(uid: string | undefined, columns: ColumnSchema[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount (once per UID, only if no URL params exist)
  useEffect(() => {
    if (!uid || columns.length === 0) return;
    if (hydrated.current) return;
    hydrated.current = true;

    // Check if URL already has filter/sort params
    const hasSort = searchParams.has('sort');
    const hasFilter = columns.some(c => searchParams.has(`f_${c.name}`));
    if (hasSort || hasFilter) return;

    const stored = localStorage.getItem(STORAGE_PREFIX + uid);
    if (!stored) return;

    try {
      const params = JSON.parse(stored) as Record<string, string>;
      if (Object.keys(params).length === 0) return;
      setSearchParams(params, { replace: true });
    } catch {
      // ignore corrupt localStorage
    }
  }, [uid, columns, searchParams, setSearchParams]);

  // Reset hydration flag when UID changes
  useEffect(() => {
    hydrated.current = false;
  }, [uid]);

  // Persist current state to localStorage on every change
  useEffect(() => {
    if (!uid || columns.length === 0) return;

    const state: Record<string, string> = {};
    const sort = searchParams.get('sort');
    const dir = searchParams.get('dir');
    if (sort) state.sort = sort;
    if (dir) state.dir = dir;
    for (const col of columns) {
      const val = searchParams.get(`f_${col.name}`);
      if (val) state[`f_${col.name}`] = val;
    }

    if (Object.keys(state).length > 0) {
      localStorage.setItem(STORAGE_PREFIX + uid, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_PREFIX + uid);
    }
  }, [uid, columns, searchParams]);
}
