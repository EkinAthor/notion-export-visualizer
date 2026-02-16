import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Manifest } from './types';
import { loadManifest } from './data/loader';
import { useSearch } from './hooks/useSearch';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DatabaseView } from './components/database/DatabaseView';
import { PageView } from './components/page/PageView';
import { SearchDialog } from './components/search/SearchDialog';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import './styles/globals.css';

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const search = useSearch();

  useEffect(() => {
    loadManifest().then(setManifest);
  }, []);

  // Open search on Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        search.open();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [search]);

  if (!manifest) return <LoadingSpinner />;

  // First top-level database for default redirect
  const defaultDb = manifest.databases.find(d => !d.parentPageUid);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar
            databases={manifest.databases}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <div className="main-area">
            <TopBar
              exportName={manifest.exportName}
              onSearchOpen={search.open}
            />

            <main className="content">
              <Routes>
                <Route
                  path="/"
                  element={
                    defaultDb
                      ? <Navigate to={`/db/${defaultDb.uid}`} replace />
                      : <div className="empty-state">No databases found</div>
                  }
                />
                <Route path="/db/:uid" element={<DatabaseView />} />
                <Route path="/page/:uid" element={<PageView />} />
              </Routes>
            </main>
          </div>

          <SearchDialog
            isOpen={search.isOpen}
            query={search.query}
            results={search.results}
            onQueryChange={search.setQuery}
            onClose={search.close}
          />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
