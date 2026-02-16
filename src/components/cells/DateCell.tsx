export function DateCell({ value }: { value: string }) {
  if (!value) return null;

  // Parse and format: "January 31, 2024" → "Jan 31, 2024"
  const d = new Date(value);
  if (isNaN(d.getTime())) return <span className="cell-date">{value}</span>;

  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return <span className="cell-date">{formatted}</span>;
}
