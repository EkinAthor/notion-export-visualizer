import * as fs from 'fs';
import * as path from 'path';
import { extractUid } from './uid-extractor.js';
import type { ScannedFile } from './types.js';

const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.pdf', '.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls',
  '.zip', '.mp4', '.mov', '.mp3',
]);

/**
 * Recursively scan a Notion export directory.
 * Returns categorized files: CSVs, markdown pages, and assets.
 */
export function scanDirectory(rootDir: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = path.relative(rootDir, fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        const uid = extractUid(entry.name);
        const dirParts = path.dirname(relativePath).split(path.sep).filter(p => p !== '.');

        let type: ScannedFile['type'];
        if (ext === '.csv') {
          type = entry.name.endsWith('_all.csv') ? 'csv_all' : 'csv';
        } else if (ext === '.md') {
          type = 'md';
        } else if (ASSET_EXTENSIONS.has(ext)) {
          type = 'asset';
        } else {
          continue; // skip unknown file types
        }

        results.push({
          absolutePath: fullPath,
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          uid,
          type,
          dirParts,
        });
      }
    }
  }

  walk(rootDir);
  return results;
}
