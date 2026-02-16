// Frontend types matching the JSON schema emitted by build-data

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
  options?: string[];
}

export interface DatabaseRow {
  uid: string | null;
  values: Record<string, string>;
}

export interface Database {
  uid: string;
  title: string;
  columns: ColumnSchema[];
  rows: DatabaseRow[];
  parentPageUid?: string;
}

export interface Page {
  uid: string;
  title: string;
  metadata: Record<string, string>;
  body: string;
  databaseUid?: string;
  inlineDatabaseUids: string[];
  assets: string[];
}

export interface ManifestDatabase {
  uid: string;
  title: string;
  rowCount: number;
  columnCount: number;
  parentPageUid?: string;
}

export interface ExportEntry {
  name: string;
  databases: ManifestDatabase[];
  pageCount: number;
}

export interface Manifest {
  exports: ExportEntry[];
  generatedAt: string;
}

export interface SearchEntry {
  uid: string;
  title: string;
  metadata: Record<string, string>;
  bodyPreview: string;
  databaseUid?: string;
}

export interface FilterState {
  column: string;
  value: string;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}
