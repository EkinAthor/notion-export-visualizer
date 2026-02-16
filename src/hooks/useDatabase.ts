import { useState, useEffect } from 'react';
import type { Database } from '../types';
import { loadDatabase } from '../data/loader';

export function useDatabase(uid: string | undefined) {
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setDatabase(null);
    setLoading(true);
    setError(null);
    loadDatabase(uid)
      .then(setDatabase)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uid]);

  return { database, loading, error };
}
