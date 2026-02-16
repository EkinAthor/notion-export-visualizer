export function UrlCell({ value }: { value: string }) {
  if (!value) return null;

  // Truncate display URL
  let display = value;
  try {
    const url = new URL(value);
    display = url.hostname + (url.pathname.length > 1 ? url.pathname.slice(0, 30) + '...' : '');
  } catch {
    // not a valid URL
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="cell-url"
      onClick={e => e.stopPropagation()}
    >
      {display}
    </a>
  );
}
