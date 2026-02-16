# CLAUDE.md

This file provides context for AI agents working on this codebase.

## Project Overview

Notion Export Visualizer -- a read-only web app that renders Notion export data (CSVs + markdown) as a Notion-like UI. Two-phase architecture: build-time data pipeline emits static JSON, React SPA consumes it.

## Architecture

### Two distinct codebases in one repo

1. **Build pipeline** (`scripts/`): Node.js TypeScript scripts run with `tsx`. Uses `fs`, `path`, `papaparse`. No React. Emits JSON to `public/data/`.
2. **React SPA** (`src/`): Vite + React + TypeScript. Fetches prebuilt JSON at runtime. No server, no Node.js APIs.

These share no code. Type definitions are intentionally duplicated (`scripts/lib/types.ts` vs `src/types/index.ts`) because they target different runtimes.

### Data flow

```
Notion export (data/) → build-data.ts → public/data/*.json → React SPA
```

### Key identifiers

Every database, page, and route uses 32-char hex UIDs extracted from Notion filenames. The UID is the universal join key across CSVs, markdown files, JSON output, and frontend routes.

## Commands

```bash
npm run build:data   # Run data pipeline (writes to public/data/)
npm run dev          # Vite dev server
npm run build        # tsc + vite build (production)
npm run lint         # ESLint
```

## Important Conventions

- **No tests exist yet.** If adding tests, use Vitest (already compatible with the Vite setup).
- **URL-serialized state.** Filter and sort state lives in URL search params (`?sort=Date&dir=desc&f_Tags=Customer`), not React state. This makes views shareable/bookmarkable.
- **One JSON file per page.** Pages are loaded on demand to keep initial load fast. Databases are loaded in full (largest is 602 rows).
- **Column types are inferred, not declared.** The type inferrer (`scripts/lib/type-inferrer.ts`) uses heuristics (value patterns + column name hints). Adjust thresholds there if type detection is wrong.
- **`_all.csv` for data, view CSV for column order.** The build pipeline reads row data from `*_all.csv` but takes column ordering from the non-`_all` variant (which reflects the user's Notion view).

## File Organization

### Build pipeline (`scripts/lib/`)

| File | Responsibility |
|------|---------------|
| `scanner.ts` | Recursively walk export dir, categorize files |
| `csv-parser.ts` | Parse CSV with BOM handling (PapaParse) |
| `md-parser.ts` | Extract title, metadata key-values, body, CSV/image refs |
| `type-inferrer.ts` | Infer column types from data patterns |
| `uid-extractor.ts` | Extract 32-char hex UID from filenames |
| `asset-resolver.ts` | Copy images/docs to `public/data/assets/` |
| `cross-ref-resolver.ts` | Match DB rows to pages, resolve inline DB refs |
| `json-emitter.ts` | Write manifest, per-db, per-page, search-index JSON |
| `types.ts` | Build-time interfaces |

### React SPA (`src/`)

| Area | Key files |
|------|-----------|
| Data loading | `data/loader.ts` (fetch + cache), `data/search-index.ts` |
| Hooks | `useDatabase`, `usePage`, `useSearch`, `useFilter`, `useSort` |
| Database view | `components/database/DatabaseView.tsx` (main), `FilterBar`, `Pagination`, `TableHeader`, `TableRow` |
| Cell renderers | `components/cells/CellRenderer.tsx` dispatches to `TextCell`, `DateCell`, `TagsCell`, `UrlCell`, `PersonCell`, `StatusCell`, `SelectCell` |
| Page view | `components/page/PageView.tsx` (main), `MarkdownRenderer`, `PageMetadataBar`, `InlineDatabase`, `AttachmentLink` |
| Layout | `components/layout/Sidebar.tsx`, `TopBar.tsx` |
| Search | `components/search/SearchDialog.tsx` |
| Routing | `App.tsx` -- `/`, `/db/:uid`, `/page/:uid` |
| Styles | `styles/globals.css` -- single CSS file, Notion-like theme |

## Common Tasks

### Adding a new column type
1. Add the type to `ColumnType` in both `scripts/lib/types.ts` and `src/types/index.ts`
2. Add detection logic in `scripts/lib/type-inferrer.ts`
3. Create a cell renderer in `src/components/cells/`
4. Register it in `src/components/cells/CellRenderer.tsx`
5. Rebuild data: `npm run build:data`

### Fixing type inference for a column
Edit `scripts/lib/type-inferrer.ts`. The inferrer checks in priority order: date_range, date, url, person (name hint), status (name hint + small set), multi_select (commas), select (small unique set), text (fallback). Adjust thresholds or add column name hints.

### Adding a new Notion export
1. Unzip into `data/{name}/` (each subdirectory of `data/` is auto-discovered as a separate export)
2. Run `npm run build:data`

Note: `data/test/` contains a synthetic test export committed to git for development/testing. All other `data/` subdirectories are gitignored.

### Improving row-to-page matching
The matching logic is in `scripts/lib/cross-ref-resolver.ts` (`matchRowsToPages`). It normalizes titles by lowercasing and stripping non-alphanumeric chars. The 19 unmatched rows (out of 602) in the Meetings DB likely have title mismatches due to special characters or truncation.

## Gotchas

- **BOM in CSVs.** Notion exports CSVs with a UTF-8 BOM (`\uFEFF`). The CSV parser strips it, but if you add alternative parsers, handle this.
- **URL-encoded paths in markdown.** Image and CSV references in markdown use URL encoding (e.g., `%20` for spaces). The UID extractor and cross-ref resolver decode these before matching.
- **The UID regex.** Pattern: `/\s([0-9a-f]{32})(?:[._]|$)/`. Must match both `.md` (UID before `.`) and `_all.csv` (UID before `_`).
- **Metadata parsing.** The MD parser treats `Key: Value` lines after the `# Title` as metadata until the first blank line. Lines where the colon position is >40 chars in or the key has >5 words are treated as body content, not metadata.
- **No `import.meta.dirname` in browsers.** Build scripts use `import.meta.dirname` (Node.js only). The React SPA uses `import.meta.env.BASE_URL` (Vite only). Don't mix these.
