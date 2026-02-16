import * as fs from 'fs';

export interface ParsedPage {
  title: string;
  metadata: Record<string, string>;
  body: string;
  /** Raw CSV link references found in the body: path strings */
  csvRefs: string[];
  /** Image references found in the body */
  imageRefs: string[];
}

/**
 * Parse a Notion-exported markdown file.
 * Format:
 *   # Title
 *   Key: Value     (metadata lines, no blank line before them)
 *   Key: Value
 *                  (blank line separates metadata from body)
 *   Body content...
 */
export function parseMarkdown(filePath: string): ParsedPage {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  let title = '';
  const metadata: Record<string, string> = {};
  let bodyStartIndex = 0;

  // Parse title (first # heading)
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;

  if (i < lines.length && lines[i].startsWith('# ')) {
    title = lines[i].replace(/^# /, '').trim();
    i++;
  }

  // Skip blank lines between title and metadata
  while (i < lines.length && lines[i].trim() === '') i++;

  // Parse metadata lines (Key: Value) until blank line or non-metadata line
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '') {
      // A blank line after metadata means end of metadata section
      if (Object.keys(metadata).length > 0) {
        i++;
        break;
      }
      // No metadata found yet → this blank line is just spacing, skip it
      i++;
      continue;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      // Only treat as metadata if key looks like a property name (no spaces galore)
      if (key.split(' ').length <= 5) {
        metadata[key] = val;
        i++;
        continue;
      }
    }
    // Not a metadata line — this is body content
    break;
  }

  bodyStartIndex = i;
  const body = lines.slice(bodyStartIndex).join('\n').trim();

  // Extract references
  const csvRefs: string[] = [];
  const imageRefs: string[] = [];

  // CSV links: [Label](path/to/file.csv)
  const linkRegex = /\[([^\]]*)\]\(([^)]+\.csv)\)/g;
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    csvRefs.push(match[2]);
  }

  // Image refs: ![alt](path/to/image.png)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = imgRegex.exec(body)) !== null) {
    imageRefs.push(match[2]);
  }

  return { title, metadata, body, csvRefs, imageRefs };
}
