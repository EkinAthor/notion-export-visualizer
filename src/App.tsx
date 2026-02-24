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

  // Flatten all databases across exports for default redirect
  const allDatabases = manifest.exports.flatMap(e => e.databases);
  const defaultDb = allDatabases.find(d => !d.parentPageUid);
  const allStandalonePages = manifest.exports.flatMap(e => e.standalonePages || []);
  const defaultPage = allStandalonePages[0];

  let defaultRedirect: React.ReactNode;
  if (defaultDb) {
    defaultRedirect = <Navigate to={`/db/${defaultDb.uid}`} replace />;
  } else if (defaultPage) {
    defaultRedirect = <Navigate to={`/page/${defaultPage.uid}`} replace />;
  } else {
    defaultRedirect = <div className="empty-state">No databases or pages found</div>;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar
            exports={manifest.exports}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <div className="main-area">
            <TopBar
              onSearchOpen={search.open}
            />

            <main className="content">
              <Routes>
                <Route
                  path="/"
                  element={defaultRedirect}
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
