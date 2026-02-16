import type { SearchEntry } from '../types';

export interface SearchResult {
  entry: SearchEntry;
  score: number;
}

/**
 * Simple client-side word-matching search over prebuilt index.
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string,
  limit = 20,
): SearchResult[] {
  if (!query.trim()) return [];

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const entry of entries) {
    const searchText = [
      entry.title,
      Object.values(entry.metadata).join(' '),
      entry.bodyPreview,
    ].join(' ').toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (searchText.includes(term)) {
        score++;
        // Boost title matches
        if (entry.title.toLowerCase().includes(term)) {
          score += 2;
        }
      }
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
