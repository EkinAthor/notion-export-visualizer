import * as fs from 'fs';
import * as path from 'path';
import type { DatabaseDef, PageDef, Manifest } from './types.js';

/**
 * Write all processed data as static JSON files to the output directory.
 */
export function emitJson(
  outputDir: string,
  databases: DatabaseDef[],
  pages: PageDef[],
  exportName: string,
): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Write manifest
  const manifest: Manifest = {
    exportName,
    databases: databases.map(db => ({
      uid: db.uid,
      title: db.title,
      rowCount: db.rows.length,
      columnCount: db.columns.length,
      parentPageUid: db.parentPageUid,
    })),
    pageCount: pages.length,
    generatedAt: new Date().toISOString(),
  };
  writeJson(path.join(outputDir, 'manifest.json'), manifest);

  // Write per-database JSON
  for (const db of databases) {
    writeJson(path.join(outputDir, `db-${db.uid}.json`), db);
  }

  // Write per-page JSON
  for (const page of pages) {
    writeJson(path.join(outputDir, `page-${page.uid}.json`), page);
  }

  // Write search index
  const searchIndex = pages.map(p => ({
    uid: p.uid,
    title: p.title,
    metadata: p.metadata,
    bodyPreview: p.body.slice(0, 300),
    databaseUid: p.databaseUid,
  }));
  writeJson(path.join(outputDir, 'search-index.json'), searchIndex);

  console.log(`Emitted: manifest + ${databases.length} databases + ${pages.length} pages + search index`);
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
