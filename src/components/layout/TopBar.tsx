interface TopBarProps {
  exportName: string;
  onSearchOpen: () => void;
}

export function TopBar({ exportName, onSearchOpen }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{exportName}</h1>
      </div>
      <button className="search-trigger" onClick={onSearchOpen}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 9l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Search</span>
        <kbd>Ctrl+K</kbd>
      </button>
    </header>
  );
}
