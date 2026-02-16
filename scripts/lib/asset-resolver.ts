import * as fs from 'fs';
import * as path from 'path';
import type { ScannedFile } from './types.js';

/**
 * Copy asset files to public/data/assets/{pageUid}/ and return mapping.
 * Groups assets by the page they belong to (based on directory structure).
 */
export function resolveAssets(
  assets: ScannedFile[],
  pageUidByDir: Map<string, string>,
  outputDir: string,
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const assetsDir = path.join(outputDir, 'assets');

  for (const asset of assets) {
    // Find which page this asset belongs to by walking up the directory
    let pageUid: string | undefined;
    const dirPath = asset.dirParts.join('/');

    // Try to match the asset's directory to a page's asset folder
    // Assets are in folders like: Meetings/{PageTitle}/image.png
    // or Meetings/{PageTitle}/{SubFolder}/image.png
    for (let depth = asset.dirParts.length; depth >= 1; depth--) {
      const tryDir = asset.dirParts.slice(0, depth).join('/');
      if (pageUidByDir.has(tryDir)) {
        pageUid = pageUidByDir.get(tryDir);
        break;
      }
    }

    if (!pageUid) continue;

    const destDir = path.join(assetsDir, pageUid);
    fs.mkdirSync(destDir, { recursive: true });
    const destFile = path.join(destDir, asset.name);
    fs.copyFileSync(asset.absolutePath, destFile);

    const existing = result.get(pageUid) || [];
    existing.push(`assets/${pageUid}/${asset.name}`);
    result.set(pageUid, existing);
  }

  return result;
}
