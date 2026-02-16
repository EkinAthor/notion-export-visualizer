const TAG_COLORS: Record<string, string> = {
  Customer: '#e8deee',
  internal: '#d3e5ef',
  '1on1': '#dbeddb',
  Partner: '#fadec9',
  Analyst: '#fdecc8',
  NorthAM: '#d3e5ef',
  Emea: '#e8deee',
  apac: '#fadec9',
  Product: '#dbeddb',
  Marketing: '#fdecc8',
  Conference: '#e8deee',
  Event: '#fadec9',
};

const DEFAULT_COLOR = '#e3e2e0';

export function TagsCell({ value }: { value: string }) {
  if (!value) return null;
  const tags = value.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="cell-tags">
      {tags.map(tag => (
        <span
          key={tag}
          className="tag"
          style={{ backgroundColor: TAG_COLORS[tag] || DEFAULT_COLOR }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
