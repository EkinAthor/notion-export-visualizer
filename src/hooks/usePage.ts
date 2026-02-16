import { useState, useEffect } from 'react';
import type { Page } from '../types';
import { loadPage } from '../data/loader';

export function usePage(uid: string | undefined) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    loadPage(uid)
      .then(setPage)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uid]);

  return { page, loading, error };
}
