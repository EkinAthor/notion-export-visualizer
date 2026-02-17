import { useParams, Link } from 'react-router-dom';
import { usePage } from '../../hooks/usePage';
import { useDatabase } from '../../hooks/useDatabase';
import { PageMetadataBar } from './PageMetadataBar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AttachmentLink } from './AttachmentLink';
import { InlineDatabase } from './InlineDatabase';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function PageView() {
  const { uid } = useParams<{ uid: string }>();
  const { page, loading, error } = usePage(uid);
  const { database } = useDatabase(page?.databaseUid);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!page) return <div className="empty-state">Page not found</div>;

  const attachments = page.assets.filter(a => {
    const ext = a.split('.').pop()?.toLowerCase() || '';
    return !['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
  });

  return (
    <div className="page-view">
      {page.databaseUid && (
        <div className="page-breadcrumb">
          <Link to={`/db/${page.databaseUid}`}>← Back to database</Link>
        </div>
      )}

      <h1 className="page-title">{page.title}</h1>

      <PageMetadataBar metadata={page.metadata} columns={database?.columns} />

      {attachments.length > 0 && (
        <div className="page-attachments">
          {attachments.map(a => (
            <AttachmentLink key={a} path={a} />
          ))}
        </div>
      )}

      <MarkdownRenderer content={page.body} pageUid={page.uid} />

      {page.inlineDatabaseUids.map(dbUid => (
        <InlineDatabase key={dbUid} uid={dbUid} />
      ))}
    </div>
  );
}
