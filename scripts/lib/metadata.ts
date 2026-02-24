import * as fs from 'fs';
import * as path from 'path';
import type { ColumnType, DatabaseDef } from './types.js';

const VALID_TYPES: ColumnType[] = [
  'title', 'text', 'date', 'date_range', 'multi_select',
  'url', 'person', 'status', 'select',
];

interface ColumnMetadata {
  type: ColumnType;
  _inferred: ColumnType;
}

interface DatabaseMetadata {
  title: string;
  columns: Record<string, ColumnMetadata>;
}

interface MetadataFile {
  _description: string;
  _validTypes: ColumnType[];
  databases: Record<string, DatabaseMetadata>;
}

/** Types that carry an options array */
const OPTION_TYPES: ColumnType[] = ['select', 'multi_select', 'status', 'person'];

/**
 * Read an existing metadata.json from an export directory.
 * Returns null if the file doesn't exist or is invalid.
 */
export function readMetadata(exportPath: string): MetadataFile | null {
  const filePath = path.join(exportPath, 'metadata.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    console.warn(`Warning: Could not parse ${filePath}, ignoring existing metadata`);
    return null;
  }
}

/**
 * Apply user type overrides from metadata.json to database columns.
 * When a user has edited the `type` field (so type !== _inferred), that override is applied.
 * If the type changes to/from an option-bearing type, options are recalculated from data.
 */
export function applyMetadataOverrides(
  databases: DatabaseDef[],
  exportPath: string,
): void {
  const existing = readMetadata(exportPath);
  if (!existing) return;

  for (const db of databases) {
    const dbMeta = existing.databases[db.uid];
    if (!dbMeta) continue;

    for (const col of db.columns) {
      const colMeta = dbMeta.columns[col.name];
      if (!colMeta) continue;

      // Only apply if the user made an override (type differs from _inferred)
      if (colMeta.type === colMeta._inferred) continue;
      if (!VALID_TYPES.includes(colMeta.type)) continue;

      const oldType = col.type;
      col.type = colMeta.type;

      // Recalculate options if type changed to/from option-bearing
      const needsOptions = OPTION_TYPES.includes(col.type);
      const hadOptions = OPTION_TYPES.includes(oldType);

      if (needsOptions && !hadOptions) {
        // Newly needs options — compute from row data
        col.options = computeOptions(db, col.name, col.type);
      } else if (!needsOptions && hadOptions) {
        // No longer option-bearing — remove options
        delete col.options;
      }

      console.log(`  Override: ${db.title} / "${col.name}": ${oldType} → ${col.type}`);
    }
  }
}

/**
 * Merge current inferred types with any existing user overrides, then write metadata.json.
 * - When type === _inferred in old file, update both to new inferred value (no user override)
 * - When type !== _inferred in old file, keep user's type, update _inferred to new value
 */
export function mergeAndWriteMetadata(
  exportPath: string,
  databases: DatabaseDef[],
  inferredTypes: Map<string, Map<string, ColumnType>>,
): void {
  const existing = readMetadata(exportPath);

  const meta: MetadataFile = {
    _description: "Schema metadata for Notion Export Visualizer. Edit 'type' to override inferred types. Run 'npm run build:data' to apply.",
    _validTypes: VALID_TYPES,
    databases: {},
  };

  for (const db of databases) {
    const dbInferred = inferredTypes.get(db.uid);
    const oldDbMeta = existing?.databases[db.uid];

    const columns: Record<string, ColumnMetadata> = {};

    for (const col of db.columns) {
      const inferred = dbInferred?.get(col.name) ?? col.type;
      const oldColMeta = oldDbMeta?.columns[col.name];

      if (oldColMeta && oldColMeta.type !== oldColMeta._inferred) {
        // User had an override — preserve their type, update _inferred
        columns[col.name] = { type: oldColMeta.type, _inferred: inferred };
      } else {
        // No override — use current (post-override) type, record inferred
        columns[col.name] = { type: col.type, _inferred: inferred };
      }
    }

    meta.databases[db.uid] = { title: db.title, columns };
  }

  const filePath = path.join(exportPath, 'metadata.json');
  fs.writeFileSync(filePath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${filePath}`);
}

/**
 * Compute unique option values from row data for a column.
 */
function computeOptions(db: DatabaseDef, colName: string, type: ColumnType): string[] {
  const uniqueVals = new Set<string>();
  for (const row of db.rows) {
    const v = (row.values[colName] ?? '').trim();
    if (!v) continue;
    if (type === 'multi_select' || type === 'person') {
      v.split(',').forEach(s => uniqueVals.add(s.trim()));
    } else {
      uniqueVals.add(v);
    }
  }
  return [...uniqueVals].sort();
}
