/**
 * Extract 32-char hex UID from Notion export filenames.
 * Pattern: "Some Title cae28491886748b2a87ec06fb8ce3f89.md"
 */
const UID_REGEX = /\s([0-9a-f]{32})(?:[._]|$)/;

export function extractUid(filename: string): string | null {
  const match = filename.match(UID_REGEX);
  return match ? match[1] : null;
}

/**
 * Strip the UID and extension from a filename to get the title.
 * "ABSA - 2024 planning 83016875ffb04abb89a97755538684e1.md" → "ABSA - 2024 planning"
 */
export function extractTitle(filename: string): string {
  return filename
    .replace(/\s[0-9a-f]{32}/, '')
    .replace(/(_all)?\.csv$/, '')
    .replace(/\.md$/, '')
    .trim();
}
