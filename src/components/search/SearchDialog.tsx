import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../data/search-index';

interface SearchDialogProps {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  onQueryChange: (q: string) => void;
  onClose: () => void;
}

export function SearchDialog({ isOpen, query, results, onQueryChange, onClose }: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onQueryChange('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, onQueryChange]);

  if (!isOpen) return null;

  const handleSelect = (uid: string) => {
    navigate(`/page/${uid}`);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 9l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search pages..."
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
          <kbd className="search-kbd">Esc</kbd>
        </div>

        {query && (
          <div className="search-results">
            {results.length === 0 ? (
              <div className="search-empty">No results found</div>
            ) : (
              results.map(r => (
                <button
                  key={r.entry.uid}
                  className="search-result-item"
                  onClick={() => handleSelect(r.entry.uid)}
                >
                  <span className="search-result-title">{r.entry.title}</span>
                  {r.entry.metadata.Company && (
                    <span className="search-result-meta">{r.entry.metadata.Company}</span>
                  )}
                  <span className="search-result-preview">
                    {r.entry.bodyPreview.slice(0, 120)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
