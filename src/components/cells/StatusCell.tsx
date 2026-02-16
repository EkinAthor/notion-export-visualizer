const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Done: { bg: '#dbeddb', fg: '#1e5a1e' },
  'In progress': { bg: '#d3e5ef', fg: '#183c50' },
  'Not started': { bg: '#e3e2e0', fg: '#555' },
};

const DEFAULT_STATUS = { bg: '#e3e2e0', fg: '#555' };

export function StatusCell({ value }: { value: string }) {
  if (!value) return null;
  const colors = STATUS_COLORS[value] || DEFAULT_STATUS;

  return (
    <span
      className="cell-status"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      {value}
    </span>
  );
}
