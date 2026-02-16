# agents.md

Guidelines for AI agents contributing to this project. Covers development patterns, coordination rules, and task-specific instructions.

## Agent Roles

### Build Pipeline Agent
Works on `scripts/` code. Responsible for parsing Notion exports, type inference, cross-reference resolution, and JSON output.

**Tools available**: Node.js fs/path APIs, PapaParse, tsx runtime.

**Verification**: After any change to `scripts/`, always run `npm run build:data` and check:
- All databases parsed (currently 4)
- Row-to-page match rates (aim for >95%)
- No runtime errors in console output
- Output JSON in `public/data/` is valid

### Frontend Agent
Works on `src/` code. Responsible for React components, hooks, routing, and CSS.

**Verification**: After any change to `src/`, always run:
1. `npx tsc -b` -- must pass with zero errors
2. `npx vite build` -- must succeed
3. Visually inspect in browser if possible

### Full-Stack Agent
Can modify both `scripts/` and `src/`. Required when a change spans both layers (e.g., adding a new column type, changing the JSON schema).

**Verification**: Run both build pipelines:
1. `npm run build:data`
2. `npx tsc -b`
3. `npx vite build`

## Development Rules

### Before modifying code
1. **Read the file first.** Always use Read before Edit/Write.
2. **Understand the data flow.** Changes to JSON schema in `scripts/` require matching changes in `src/types/index.ts` and any components that consume the data.
3. **Check existing patterns.** This codebase follows consistent patterns -- new code should match existing conventions.

### Type safety
- Build pipeline types: `scripts/lib/types.ts`
- Frontend types: `src/types/index.ts`
- These are intentionally separate (different runtimes). If you change one, check whether the other needs a matching change.
- The JSON schema is the contract between them. Any field added to a build-time type that gets emitted to JSON must also exist in the frontend type.

### CSS conventions
- Single file: `src/styles/globals.css`
- BEM-lite naming: `.component-element` (e.g., `.table-header-cell`, `.filter-chip-remove`)
- CSS variables for theming: `var(--bg-primary)`, `var(--text-secondary)`, etc.
- No CSS modules, no CSS-in-JS, no Tailwind
- Keep styles in the single globals.css file unless the file grows beyond 800 lines

### Component conventions
- Functional components only, no class components (except ErrorBoundary)
- Props interfaces defined inline or colocated in the component file
- Hooks in `src/hooks/`, prefixed with `use`
- Components export named exports (not default), except `App.tsx`

### State management
- No global state library. State is managed via:
  - URL search params (filters, sort, pagination) -- via react-router `useSearchParams`
  - React hooks (local component state)
  - Fetch cache (in `src/data/loader.ts`)

### Routing
- Three routes: `/` (redirect), `/db/:uid`, `/page/:uid`
- All state is URL-serialized where possible
- Adding new routes: update `App.tsx` Routes

## Task Patterns

### Adding a new feature to the database view
1. Read `src/components/database/DatabaseView.tsx` to understand the current flow
2. Add any new hooks to `src/hooks/`
3. Add new components to `src/components/database/`
4. Wire into `DatabaseView.tsx`
5. Add CSS to `src/styles/globals.css`
6. Verify: `npx tsc -b && npx vite build`

### Adding a new feature to the page view
1. Read `src/components/page/PageView.tsx`
2. If it needs new data from the build pipeline, modify `scripts/lib/md-parser.ts` or `scripts/build-data.ts` and the corresponding types
3. Add new components to `src/components/page/`
4. Verify: `npm run build:data && npx tsc -b && npx vite build`

### Improving the build pipeline
1. Read `scripts/build-data.ts` to understand the 7-step pipeline
2. Individual steps are in `scripts/lib/` -- modify the relevant module
3. If changing the JSON output shape, update `scripts/lib/types.ts`, `scripts/lib/json-emitter.ts`, `src/types/index.ts`, and any consuming components
4. Verify: `npm run build:data` and inspect the generated JSON

### Adding tests
- Use Vitest (install with `npm install -D vitest`)
- Build pipeline tests: test individual modules in `scripts/lib/` with sample data
- Frontend tests: use `@testing-library/react` for component tests
- Place test files next to the source: `scanner.test.ts`, `DatabaseView.test.tsx`

## Coordination Rules (Multi-Agent)

When multiple agents work in parallel:

1. **Claim files before editing.** Don't have two agents editing the same file simultaneously.
2. **Schema changes are serialized.** Only one agent should modify `types.ts` at a time.
3. **CSS is append-only for parallel work.** When multiple agents add styles, append to the end of `globals.css` to avoid merge conflicts.
4. **Build pipeline runs are exclusive.** Only one agent should run `npm run build:data` at a time (it writes to `public/data/`).
5. **Communicate via task descriptions.** If an agent's work creates a dependency for another, note it in the task description.

## Current State and Known Gaps

### Working
- Build pipeline processes all 4 databases and 644 pages
- Main Meetings DB: 583/602 rows matched to pages (96.8%)
- All other DBs: 100% row-to-page matching
- Table view with sorting, filtering, pagination
- Page view with markdown rendering, images, metadata
- Search (Ctrl+K) across all pages
- Inline database rendering
- Sidebar navigation
- Responsive layout

### Known gaps / future work
- **19 unmatched Meetings rows**: likely due to title normalization edge cases (special chars, encoding mismatches). Investigate in `cross-ref-resolver.ts` `matchRowsToPages`.
- **No tests**: add Vitest unit tests for build pipeline modules and component tests for key views.
- **No dark mode**: CSS variables are set up for it; add a theme toggle and `:root[data-theme="dark"]` overrides.
- **Bundle size warning**: main JS chunk is 577KB. Could code-split with `React.lazy()` for PageView and SearchDialog.
- **Hardcoded export path**: `scripts/build-data.ts` has `EXPORT_DIR` hardcoded to `data/meetings`. Make this a CLI argument.
- **No permalink support for filters**: filter/sort state is in URL params but there's no "copy link" UI.
- **Date range cells**: `DateCell` handles them but doesn't split on `→` for separate formatting.
- **Tag colors**: hardcoded in `TagsCell.tsx`. Could generate deterministic colors from tag names.
- **Missing `Untitled` CSV handling**: There's an `Untitled 9fb1f31545b84c1a94c3511ddb901c93.csv` in Megha handover folder (inline DB with no title).
