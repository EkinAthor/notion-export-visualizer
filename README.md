# Notion Export Visualizer

A read-only web app that loads data from an unzipped Notion export folder and renders it in a Notion-like fashion: database table views, page content with markdown rendering, search, and filtering.

Built with React + Vite. Fully client-side with build-time data processing into static JSON.

## Quick Start

```bash
npm install
npm run build:data   # Process Notion export into static JSON
npm run dev          # Start dev server at http://localhost:5173
```

## How It Works

The app has two phases:

### 1. Build-time data pipeline (`npm run build:data`)

A TypeScript script (`scripts/build-data.ts`) scans the Notion export folder, parses all CSVs and markdown files, infers column types, resolves cross-references between database rows and pages, copies image/document assets, and emits static JSON files to `public/data/`.

Output:
- `public/data/manifest.json` -- database list and export metadata
- `public/data/db-{uid}.json` -- per-database schema + all rows
- `public/data/page-{uid}.json` -- per-page metadata + markdown body
- `public/data/search-index.json` -- pre-built search index
- `public/data/assets/{pageUid}/` -- copied images and attachments

### 2. React SPA (`npm run dev`)

Loads the prebuilt JSON and renders:
- **Database table views** with typed cell renderers, column sorting, filtering, and pagination
- **Page views** with rendered markdown (GFM), images, attachments, and inline databases
- **Global search** (Ctrl+K) with word-matching across all pages
- **Sidebar navigation** between databases

## Notion Export Structure

The app expects an unzipped Notion export at `data/<db_name>/`. The standard structure Notion produces:

```
data/<db_name>/
└── Private & Shared/
    ├── {DatabaseName} {uid}.csv          # View column order
    ├── {DatabaseName} {uid}_all.csv      # All columns, all rows
    └── {DatabaseName}/
        ├── {PageTitle} {uid}.md          # Page markdown
        ├── {PageTitle}/                  # Assets for that page
        │   ├── image.png
        │   └── document.pptx
        └── {SubPage}/                   # Nested sub-pages
            ├── {InlineDB} {uid}.csv
            └── {SubPageTitle} {uid}.md
```

Key patterns:
- **UIDs**: 32-char hex appended to filenames (e.g., `cae28491886748b2a87ec06fb8ce3f89`)
- **CSV pairs**: `_all.csv` has all columns; the non-`_all` variant preserves the user's view column order
- **Markdown format**: `# Title` heading, `Key: Value` metadata lines, blank line, then body
- **Images**: Relative paths in markdown like `![alt](FolderName/image.png)`
- **Inline databases**: Markdown links to CSVs: `[Label](path/to/DB.csv)`

## Project Structure

```
scripts/                      # Build-time data pipeline
  build-data.ts               # Pipeline entry point
  lib/
    types.ts                  # Build-time TypeScript interfaces
    scanner.ts                # Recursive directory walker
    csv-parser.ts             # CSV parsing (BOM handling, PapaParse)
    md-parser.ts              # Markdown parsing (title, metadata, body, refs)
    type-inferrer.ts          # Infer column types from data
    uid-extractor.ts          # Extract UIDs from filenames
    asset-resolver.ts         # Copy images/attachments to public/
    cross-ref-resolver.ts     # Match rows to pages, resolve inline DB refs
    json-emitter.ts           # Write manifest + db/page JSON files

src/                          # React SPA
  App.tsx                     # Root: routing, sidebar, search dialog
  main.tsx                    # Entry point
  types/index.ts              # Frontend TypeScript interfaces
  data/
    loader.ts                 # Fetch + cache prebuilt JSON
    search-index.ts           # Client-side word-matching search
  hooks/
    useDatabase.ts            # Load database by UID
    usePage.ts                # Load page by UID
    useSearch.ts              # Search state + Ctrl+K
    useFilter.ts              # URL-serialized column filters
    useSort.ts                # URL-serialized column sorting
  components/
    layout/                   # Sidebar, TopBar
    database/                 # DatabaseView, TableHeader, TableRow, FilterBar, Pagination
    cells/                    # TextCell, DateCell, TagsCell, UrlCell, PersonCell, StatusCell, SelectCell
    page/                     # PageView, PageMetadataBar, MarkdownRenderer, InlineDatabase, AttachmentLink
    search/                   # SearchDialog
    shared/                   # LoadingSpinner, ErrorBoundary
  styles/
    globals.css               # Notion-like theme
```

## Column Type Detection

The build pipeline infers column types from CSV data:

| Type | Detection | Example |
|------|-----------|---------|
| `date` | Matches `"Month DD, YYYY"` pattern | `January 31, 2024` |
| `date_range` | Contains ` → ` separator | `Sep 8, 2024 → Sep 12, 2024` |
| `multi_select` | Comma-separated recurring values | `1on1, internal` |
| `url` | Starts with `http://` or `https://` | Slide deck links |
| `person` | Column name hint (Attendees, Assignee, etc.) | `Marek Ovcacek, Scott Lewis` |
| `status` | Small set: Done / In progress / Not started | Task Status |
| `select` | <15 unique values, no commas | Priority |
| `text` | Default fallback | Name, Company |

## Routes

| URL | View | Description |
|-----|------|-------------|
| `/` | Redirect | Redirects to first top-level database |
| `/db/:uid` | DatabaseView | Table with `?sort=...&dir=...&f_Column=...&page=...` |
| `/page/:uid` | PageView | Page content with metadata + rendered markdown |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build:data` | Process Notion export into static JSON in `public/data/` |
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- **React 19** + **TypeScript** -- UI framework
- **Vite 7** -- Build tooling and dev server
- **react-router-dom** -- Client-side routing
- **react-markdown** + **remark-gfm** + **rehype-raw** -- Markdown rendering
- **PapaParse** -- CSV parsing with BOM handling
- **tsx** -- Run TypeScript build scripts directly

## Using with Your Own Data

1. Export your Notion workspace (Settings > Export > Markdown & CSV)
2. Unzip the export into `data/{name}/`
3. Update the `EXPORT_DIR` path in `scripts/build-data.ts`
4. Run `npm run build:data` and `npm run dev`
