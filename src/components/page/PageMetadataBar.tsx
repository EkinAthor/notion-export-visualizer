interface PageMetadataBarProps {
  metadata: Record<string, string>;
}

export function PageMetadataBar({ metadata }: PageMetadataBarProps) {
  const entries = Object.entries(metadata).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <div className="page-metadata">
      {entries.map(([key, value]) => (
        <div key={key} className="metadata-row">
          <span className="metadata-key">{key}</span>
          <span className="metadata-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
