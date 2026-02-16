// Build-time types for the data processing pipeline

export type ColumnType =
  | 'text'
  | 'date'
  | 'date_range'
  | 'multi_select'
  | 'url'
  | 'person'
  | 'status'
  | 'select';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  /** Unique values seen (for select/multi_select/status) */
  options?: string[];
}

export interface DatabaseRecord {
  /** 32-char hex UID from CSV row's Name field matching a .md file */
  uid: string | null;
  /** Column name → raw string value */
  values: Record<string, string>;
}

export interface DatabaseDef {
  uid: string;
  title: string;
  /** Column schemas in view order */
  columns: ColumnSchema[];
  /** All rows */
  rows: DatabaseRecord[];
  /** Parent page UID if this is an inline/nested database */
  parentPageUid?: string;
}

export interface PageDef {
  uid: string;
  title: string;
  /** Key-value metadata parsed from MD header */
  metadata: Record<string, string>;
  /** Raw markdown body (after metadata) */
  body: string;
  /** UID of the database this page belongs to */
  databaseUid?: string;
  /** UIDs of inline databases referenced in this page */
  inlineDatabaseUids: string[];
  /** Asset files (images, attachments) relative to public/data/assets/ */
  assets: string[];
}

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  name: string;
  uid: string | null;
  type: 'csv' | 'csv_all' | 'md' | 'asset';
  /** Parent directory names for context */
  dirParts: string[];
}

export interface Manifest {
  exportName: string;
  databases: Array<{
    uid: string;
    title: string;
    rowCount: number;
    columnCount: number;
    parentPageUid?: string;
  }>;
  pageCount: number;
  generatedAt: string;
}
