# Plan: Multi-Export Support + Test Export

## Context

The app currently hardcodes a single Notion export directory (`data/meetings`). We need to support multiple exports, where each subdirectory of `data/` is a separate export. Additionally, we'll create a `data/test/` directory with synthetic Notion export files committed to git for easy testing.

## Design Decisions

- **Flat output, grouped manifest**: Since Notion UIDs are globally unique 32-char hex strings, `db-{uid}.json` and `page-{uid}.json` stay flat in `public/data/`. No subdirectories needed. The manifest is restructured to list multiple exports, each with their databases.
- **No route changes**: Routes stay as `/db/:uid` and `/page/:uid` — UIDs are unique across exports.
- **Sidebar groups databases by export name**: Each export becomes a collapsible section heading.

---

## 1. Build Pipeline Changes

### `scripts/build-data.ts`
- Remove hardcoded `EXPORT_DIR = path.join(PROJECT_ROOT, 'data', 'meetings')`
- Auto-discover all subdirectories of `data/` (each is an export)
- Loop over each export dir, run the existing pipeline per-export
- Collect all databases/pages across exports, tag each with `exportName`
- Pass the full set to `emitJson()`

### `scripts/lib/json-emitter.ts`
- Change `emitJson()` signature to accept an array of exports: `{ name: string, databases: DatabaseDef[], pages: PageDef[] }[]`
- Emit a single `manifest.json` with the new multi-export schema
- DB/page JSON files stay as `db-{uid}.json` / `page-{uid}.json` (flat, since UIDs are unique)
- Emit a single combined `search-index.json` across all exports

### `scripts/lib/types.ts`
- Add `ExportData` interface: `{ name: string, databases: DatabaseDef[], pages: PageDef[] }`
- Update `Manifest` to have `exports: ExportEntry[]` instead of top-level `exportName`/`databases`/`pageCount`
- Add `ExportEntry`: `{ name: string, databases: ManifestDatabase[], pageCount: number }`

---

## 2. Frontend Type Changes

### `src/types/index.ts`
- Add `ExportEntry`: `{ name: string, databases: ManifestDatabase[], pageCount: number }`
- Change `Manifest` from `{ exportName, databases, pageCount, generatedAt }` to `{ exports: ExportEntry[], generatedAt: string }`
- Add optional `exportName` field to `ManifestDatabase` for convenience in sidebar

---

## 3. Frontend Component Changes

### `src/data/loader.ts`
- No changes needed (flat structure preserved)

### `src/App.tsx`
- Adapt to new manifest shape: flatten `manifest.exports[].databases` for routing/default redirect
- Pass full `manifest.exports` to Sidebar

### `src/components/layout/Sidebar.tsx`
- Accept `exports: ExportEntry[]` instead of `databases: ManifestDatabase[]`
- Render each export as a section heading with its databases underneath

### `src/components/layout/TopBar.tsx`
- Change from showing single `exportName` to showing app name

---

## 4. Test Export (`data/test/`)

Synthetic Notion export with 2 databases and pages exercising all column types.

---

## Files Modified

1. `.gitignore` — allow `data/test/`
2. `scripts/lib/types.ts` — add `ExportData`, update `Manifest`
3. `scripts/lib/json-emitter.ts` — multi-export emit logic
4. `scripts/build-data.ts` — discover + loop over export dirs
5. `src/types/index.ts` — add `ExportEntry`, update `Manifest`
6. `src/App.tsx` — adapt to new manifest shape
7. `src/components/layout/Sidebar.tsx` — group by export
8. `src/components/layout/TopBar.tsx` — remove single exportName
9. `data/test/` — synthetic test data
10. `CLAUDE.md` — updated docs
