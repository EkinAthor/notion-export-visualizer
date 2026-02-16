import { NavLink } from 'react-router-dom';
import type { ManifestDatabase } from '../../types';

interface SidebarProps {
  databases: ManifestDatabase[];
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ databases, isOpen, onToggle }: SidebarProps) {
  const topLevel = databases.filter(d => !d.parentPageUid);
  const nested = databases.filter(d => d.parentPageUid);

  return (
    <>
      <button className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Databases</h2>
        </div>
        <nav className="sidebar-nav">
          {topLevel.map(db => (
            <NavLink
              key={db.uid}
              to={`/db/${db.uid}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📋</span>
              <span className="sidebar-label">{db.title}</span>
              <span className="sidebar-count">{db.rowCount}</span>
            </NavLink>
          ))}
          {nested.length > 0 && (
            <>
              <div className="sidebar-section">Inline Databases</div>
              {nested.map(db => (
                <NavLink
                  key={db.uid}
                  to={`/db/${db.uid}`}
                  className={({ isActive }) => `sidebar-link nested ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">📎</span>
                  <span className="sidebar-label">{db.title}</span>
                  <span className="sidebar-count">{db.rowCount}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
