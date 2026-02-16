import * as fs from 'fs';
import * as path from 'path';
import type { ExportData, Manifest } from './types.js';

/**
 * Write all processed data as static JSON files to the output directory.
 * Accepts an array of exports, each with their databases and pages.
 */
export function emitJson(
  outputDir: string,
  exports: ExportData[],
): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Write manifest
  const manifest: Manifest = {
    exports: exports.map(exp => ({
      name: exp.name,
      databases: exp.databases.map(db => ({
        uid: db.uid,
        title: db.title,
        rowCount: db.rows.length,
        columnCount: db.columns.length,
        parentPageUid: db.parentPageUid,
      })),
      pageCount: exp.pages.length,
    })),
    generatedAt: new Date().toISOString(),
  };
  writeJson(path.join(outputDir, 'manifest.json'), manifest);

  // Write per-database and per-page JSON (flat, UIDs are globally unique)
  let totalDbs = 0;
  let totalPages = 0;

  for (const exp of exports) {
    for (const db of exp.databases) {
      writeJson(path.join(outputDir, `db-${db.uid}.json`), db);
      totalDbs++;
    }

    for (const page of exp.pages) {
      writeJson(path.join(outputDir, `page-${page.uid}.json`), page);
      totalPages++;
    }
  }

  // Write combined search index across all exports
  const searchIndex = exports.flatMap(exp =>
    exp.pages.map(p => ({
      uid: p.uid,
      title: p.title,
      metadata: p.metadata,
      bodyPreview: p.body.slice(0, 300),
      databaseUid: p.databaseUid,
    }))
  );
  writeJson(path.join(outputDir, 'search-index.json'), searchIndex);

  console.log(`Emitted: manifest + ${totalDbs} databases + ${totalPages} pages + search index`);
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
