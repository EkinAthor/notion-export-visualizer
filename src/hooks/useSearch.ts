import { useState, useEffect, useCallback } from 'react';
import type { SearchEntry } from '../types';
import { loadSearchIndex } from '../data/loader';
import { searchEntries, type SearchResult } from '../data/search-index';

export function useSearch() {
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSearchIndex().then(setIndex);
  }, []);

  useEffect(() => {
    if (index.length > 0 && query) {
      setResults(searchEntries(index, query));
    } else {
      setResults([]);
    }
  }, [query, index]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return { query, setQuery, results, isOpen, open, close };
}
