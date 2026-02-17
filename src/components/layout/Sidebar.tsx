import { NavLink } from 'react-router-dom';
import type { ExportEntry } from '../../types';

interface SidebarProps {
  exports: ExportEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ exports, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Databases</h2>
        </div>
        <nav className="sidebar-nav">
          {exports.map(exp => {
            const topLevel = exp.databases.filter(d => !d.parentPageUid);
            const nested = exp.databases.filter(d => d.parentPageUid);

            return (
              <div key={exp.name} className="sidebar-export-group">
                {exports.length > 1 && (
                  <div className="sidebar-section">{exp.name}</div>
                )}
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
                    <div className="sidebar-section sidebar-section-nested">Inline Databases</div>
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
              </div>
            );
          })}
        </nav>
      </aside>
      <button className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </button>
    </>
  );
}
