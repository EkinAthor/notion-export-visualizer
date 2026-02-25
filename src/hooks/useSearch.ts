import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SearchEntry } from '../types';
import { loadSearchIndex } from '../data/loader';
import { searchEntries, type SearchResult } from '../data/search-index';

export function useSearch() {
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSearchIndex().then(setIndex);
  }, []);

  const results: SearchResult[] = useMemo(() => {
    if (index.length > 0 && query) {
      return searchEntries(index, query);
    }
    return [];
  }, [query, index]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return { query, setQuery, results, isOpen, open, close };
}
