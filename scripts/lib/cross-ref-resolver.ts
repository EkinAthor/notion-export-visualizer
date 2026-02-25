import type { DatabaseDef, ScannedFile } from './types.js';
import { extractUid, extractTitle } from './uid-extractor.js';

/**
 * Match database rows to page files by matching the row's Name value
 * against page filenames (after URL-decoding and UID stripping).
 */
export function matchRowsToPages(
  db: DatabaseDef,
  pageFiles: ScannedFile[],
): void {
  // Build a lookup: title → uid from page files
  const titleToUid = new Map<string, string>();
  for (const pf of pageFiles) {
    if (pf.uid) {
      const title = extractTitle(pf.name);
      titleToUid.set(normalizeTitle(title), pf.uid);
    }
  }

  for (const row of db.rows) {
    const name = (row.values['Name'] || row.values['Task name'] || '').trim();
    if (!name) continue;

    // Try direct match first
    const uid = titleToUid.get(normalizeTitle(name));
    if (uid) {
      row.uid = uid;
    }
  }
}

/**
 * Resolve inline database references from page CSV refs.
 * Returns map of page UID → array of database UIDs referenced.
 */
export function resolveInlineDatabases(
  csvRefs: Map<string, string[]>,
  csvFiles: ScannedFile[],
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  // Build path → uid lookup for CSV files
  const pathToUid = new Map<string, string>();
  for (const f of csvFiles) {
    if (f.uid) {
      pathToUid.set(f.relativePath, f.uid);
    }
  }

  for (const [pageUid, refs] of csvRefs) {
    const dbUids: string[] = [];
    for (const ref of refs) {
      // Try to find the CSV by extracting UID from the ref path (URL-decode first)
      const decodedRef = decodeURIComponent(ref);
      const uid = extractUid(decodedRef);
      if (uid) {
        dbUids.push(uid);
      }
    }
    if (dbUids.length > 0) {
      result.set(pageUid, dbUids);
    }
  }

  return result;
}

function normalizeTitle(t: string): string {
  return decodeURIComponent(t)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
