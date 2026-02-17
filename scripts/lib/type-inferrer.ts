import type { ColumnType, ColumnSchema } from './types.js';

// "January 31, 2024" or "Sep 8, 2024"
const DATE_PATTERN = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
// "Sep 8, 2024 → Sep 12, 2024"
const DATE_RANGE_PATTERN = /→/;
const URL_PATTERN = /^https?:\/\//;

// Column name hints for person type
const PERSON_HINTS = ['attendees', 'assignee', 'owner', 'person', 'people', 'assigned'];
// Column name hints for status type
const STATUS_HINTS = ['status'];

/**
 * Infer column types from a set of CSV rows.
 * Uses a combination of value patterns and column name heuristics.
 */
export function inferColumnTypes(
  headers: string[],
  rows: Record<string, string>[],
): ColumnSchema[] {
  return headers.map(name => {
    const values = rows
      .map(r => (r[name] ?? '').trim())
      .filter(v => v.length > 0);

    if (values.length === 0) {
      return { name, type: 'text' as ColumnType };
    }

    const type = inferSingleColumn(name, values);
    const schema: ColumnSchema = { name, type };

    if (type === 'select' || type === 'multi_select' || type === 'status' || type === 'person') {
      const uniqueVals = new Set<string>();
      for (const v of values) {
        if (type === 'multi_select' || type === 'person') {
          v.split(',').forEach(s => uniqueVals.add(s.trim()));
        } else {
          uniqueVals.add(v);
        }
      }
      schema.options = [...uniqueVals].sort();
    }

    return schema;
  });
}

function inferSingleColumn(name: string, values: string[]): ColumnType {
  const lowerName = name.toLowerCase();

  // Date range check first (contains →)
  const dateRangeCount = values.filter(v => DATE_RANGE_PATTERN.test(v)).length;
  if (dateRangeCount > values.length * 0.3) {
    return 'date_range';
  }

  // Date check
  const dateCount = values.filter(v => DATE_PATTERN.test(v)).length;
  if (dateCount > values.length * 0.5) {
    return 'date';
  }

  // URL check
  const urlCount = values.filter(v => URL_PATTERN.test(v)).length;
  if (urlCount > values.length * 0.3) {
    return 'url';
  }

  // Person check (by column name hint)
  if (PERSON_HINTS.some(h => lowerName.includes(h))) {
    return 'person';
  }

  // Status check (by column name + small set of values)
  if (STATUS_HINTS.some(h => lowerName.includes(h))) {
    const unique = new Set(values);
    if (unique.size <= 10) {
      return 'status';
    }
  }

  // Multi-select: contains commas and has recurring values
  const commaCount = values.filter(v => v.includes(',')).length;
  if (commaCount > values.length * 0.1) {
    return 'multi_select';
  }

  // Select: small number of unique values (< 15) and column is not "Name"
  if (lowerName !== 'name') {
    const unique = new Set(values);
    if (unique.size <= 15 && unique.size < values.length * 0.3) {
      return 'select';
    }
  }

  return 'text';
}
