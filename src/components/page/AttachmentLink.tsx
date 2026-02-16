const ICON_MAP: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  pptx: '📊',
  ppt: '📊',
  xlsx: '📈',
  xls: '📈',
  zip: '📦',
};

interface AttachmentLinkProps {
  path: string;
}

export function AttachmentLink({ path }: AttachmentLinkProps) {
  const filename = path.split('/').pop() || path;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const icon = ICON_MAP[ext] || '📎';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);

  if (isImage) return null; // Images are rendered inline via markdown

  return (
    <a
      href={`${import.meta.env.BASE_URL}data/${path}`}
      className="attachment-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="attachment-icon">{icon}</span>
      <span className="attachment-name">{filename}</span>
    </a>
  );
}
