import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

const MD_UID_RE = /([0-9a-f]{32})\.md$/;

interface MarkdownRendererProps {
  content: string;
  pageUid: string;
}

export function MarkdownRenderer({ content, pageUid }: MarkdownRendererProps) {
  const basePath = `${import.meta.env.BASE_URL}data/assets/${pageUid}/`;
  const navigate = useNavigate();

  const components: Components = {
    img: ({ src, alt, ...props }) => {
      // Resolve relative image paths to the assets directory
      let resolvedSrc = src || '';
      if (resolvedSrc && !resolvedSrc.startsWith('http')) {
        // Extract just the filename from the path (handles URL-encoded folder names)
        const filename = resolvedSrc.split('/').pop() || resolvedSrc;
        resolvedSrc = basePath + filename;
      }
      return (
        <img
          src={resolvedSrc}
          alt={alt || ''}
          className="page-image"
          loading="lazy"
          {...props}
        />
      );
    },
    a: ({ href, children, ...props }) => {
      // Handle CSV links as inline database references
      if (href?.endsWith('.csv')) {
        return <span className="inline-db-ref">{children}</span>;
      }
      // Handle internal .md links — extract UID and navigate via SPA
      if (href) {
        const decoded = decodeURIComponent(href);
        const match = decoded.match(MD_UID_RE);
        if (match) {
          const targetUid = match[1];
          return (
            <a
              href={`/page/${targetUid}`}
              className="page-subpage-link"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/page/${targetUid}`);
              }}
              {...props}
            >
              {children}
            </a>
          );
        }
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
