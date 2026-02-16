#!/usr/bin/env tsx
/**
 * Build-time data processing pipeline.
 * Scans all subdirectories of data/ as separate Notion exports,
 * parses CSVs + MDs, and emits static JSON.
 *
 * Usage: npm run build:data
 */

import * as path from 'path';
import * as fs from 'fs';
import { scanDirectory } from './lib/scanner.js';
import { parseCsv } from './lib/csv-parser.js';
import { parseMarkdown } from './lib/md-parser.js';
import { inferColumnTypes } from './lib/type-inferrer.js';
import { extractTitle } from './lib/uid-extractor.js';
import { resolveAssets } from './lib/asset-resolver.js';
import { matchRowsToPages, resolveInlineDatabases } from './lib/cross-ref-resolver.js';
import { emitJson } from './lib/json-emitter.js';
import type { DatabaseDef, PageDef, ScannedFile, ExportData } from './lib/types.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_ROOT = path.join(PROJECT_ROOT, 'data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'data');

// Discover all subdirectories of data/ as exports
const exportDirs = fs.readdirSync(DATA_ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => ({ name: d.name, path: path.join(DATA_ROOT, d.name) }));

if (exportDirs.length === 0) {
  console.error('No export directories found in data/. Place Notion exports as subdirectories of data/.');
  process.exit(1);
}

console.log(`Found ${exportDirs.length} export(s): ${exportDirs.map(d => d.name).join(', ')}`);

const allExports: ExportData[] = [];

for (const exportDir of exportDirs) {
  console.log(`\n=== Processing export: ${exportDir.name} ===`);
  const exportData = processExport(exportDir.name, exportDir.path);
  allExports.push(exportData);
}

// Emit all JSON
emitJson(OUTPUT_DIR, allExports);

console.log('\nBuild complete!');

function processExport(exportName: string, exportPath: string): ExportData {
  console.log('Scanning export directory:', exportPath);

  // 1. Scan all files
  const allFiles = scanDirectory(exportPath);
  const csvAllFiles = allFiles.filter(f => f.type === 'csv_all');
  const csvViewFiles = allFiles.filter(f => f.type === 'csv');
  const mdFiles = allFiles.filter(f => f.type === 'md');
  const assetFiles = allFiles.filter(f => f.type === 'asset');

  console.log(`Found: ${csvAllFiles.length} _all.csv, ${csvViewFiles.length} view.csv, ${mdFiles.length} .md, ${assetFiles.length} assets`);

  // 2. Parse databases from CSV pairs (_all for data, view for column order)
  const databases: DatabaseDef[] = [];

  // Group _all CSVs with their view counterpart by UID
  const csvByUid = new Map<string, { all?: ScannedFile; view?: ScannedFile }>();

  for (const f of csvAllFiles) {
    if (f.uid) {
      csvByUid.set(f.uid, { ...csvByUid.get(f.uid), all: f });
    }
  }
  for (const f of csvViewFiles) {
    if (f.uid) {
      csvByUid.set(f.uid, { ...csvByUid.get(f.uid), view: f });
    }
  }

  for (const [uid, files] of csvByUid) {
    const allFile = files.all;
    if (!allFile) continue;

    const { headers: allHeaders, rows } = parseCsv(allFile.absolutePath);

    // Use view CSV for column order if available
    let orderedHeaders: string[];
    if (files.view) {
      const { headers: viewHeaders } = parseCsv(files.view.absolutePath);
      orderedHeaders = viewHeaders;
    } else {
      orderedHeaders = allHeaders;
    }

    const columns = inferColumnTypes(orderedHeaders, rows);
    const title = extractTitle(allFile.name);

    // Determine if this is a nested DB (lives inside a page's folder)
    let parentPageUid: string | undefined;
    if (allFile.dirParts.length >= 2) {
      // Look for a .md file that corresponds to the parent directory
      const parentDirName = allFile.dirParts[allFile.dirParts.length - 1];
      const parentMd = mdFiles.find(m => {
        const mdTitle = extractTitle(m.name);
        return normalizeTitle(mdTitle) === normalizeTitle(parentDirName);
      });
      if (parentMd?.uid) {
        parentPageUid = parentMd.uid;
      }
    }

    const dbRows = rows.map(r => ({
      uid: null as string | null,
      values: r,
    }));

    databases.push({
      uid,
      title,
      columns,
      rows: dbRows,
      parentPageUid,
    });
  }

  console.log(`Parsed ${databases.length} databases`);

  // 3. Parse markdown pages
  const pages: PageDef[] = [];
  // Map from directory path (URL-decoded folder name matching a page) to page UID
  const pageUidByDir = new Map<string, string>();
  // CSV refs from pages for inline DB resolution
  const pageCsvRefs = new Map<string, string[]>();

  for (const mf of mdFiles) {
    if (!mf.uid) continue;

    const parsed = parseMarkdown(mf.absolutePath);

    // Determine which database this page belongs to
    // Strategy: find the DB whose title-named folder is the closest ancestor
    let databaseUid: string | undefined;
    let bestMatchDepth = -1;
    for (const db of databases) {
      for (let d = 0; d < mf.dirParts.length; d++) {
        if (normalizeTitle(mf.dirParts[d]) === normalizeTitle(db.title)) {
          if (d > bestMatchDepth) {
            bestMatchDepth = d;
            databaseUid = db.uid;
          }
        }
      }
    }

    // Map the page's asset folder
    const titleForDir = extractTitle(mf.name);
    const parentDir = mf.dirParts.join('/');
    const assetDirKey = parentDir ? `${parentDir}/${titleForDir}` : titleForDir;
    pageUidByDir.set(assetDirKey, mf.uid);

    // Also try URL-encoded version
    const encodedTitle = titleForDir.replace(/ /g, '%20').replace(/&/g, '%26');
    if (encodedTitle !== titleForDir) {
      const encodedKey = parentDir ? `${parentDir}/${encodedTitle}` : encodedTitle;
      pageUidByDir.set(encodedKey, mf.uid);
    }

    if (parsed.csvRefs.length > 0) {
      pageCsvRefs.set(mf.uid, parsed.csvRefs);
    }

    pages.push({
      uid: mf.uid,
      title: parsed.title || titleForDir,
      metadata: parsed.metadata,
      body: parsed.body,
      databaseUid,
      inlineDatabaseUids: [],
      assets: [],
    });
  }

  console.log(`Parsed ${pages.length} pages`);

  // 4. Match database rows ↔ pages
  for (const db of databases) {
    const dbPageFiles = mdFiles.filter(mf => {
      const page = pages.find(p => p.uid === mf.uid);
      return page?.databaseUid === db.uid;
    });
    matchRowsToPages(db, dbPageFiles);
    const matched = db.rows.filter(r => r.uid).length;
    console.log(`  DB "${db.title}": ${matched}/${db.rows.length} rows matched to pages`);
  }

  // 5. Resolve inline database references
  const inlineDbMap = resolveInlineDatabases(pageCsvRefs, allFiles.filter(f => f.type === 'csv_all'));
  for (const [pageUid, dbUids] of inlineDbMap) {
    const page = pages.find(p => p.uid === pageUid);
    if (page) {
      page.inlineDatabaseUids = dbUids;
    }
  }

  // 6. Copy assets and resolve paths
  const assetMap = resolveAssets(assetFiles, pageUidByDir, OUTPUT_DIR);
  for (const [pageUid, assetPaths] of assetMap) {
    const page = pages.find(p => p.uid === pageUid);
    if (page) {
      page.assets = assetPaths;
    }
  }

  console.log(`Copied assets for ${assetMap.size} pages`);

  return { name: exportName, databases, pages };
}

function normalizeTitle(t: string): string {
  return decodeURIComponent(t)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
