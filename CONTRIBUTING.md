# Contributing to Notion Export Visualizer

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/marek-ovcacek/notion-export-visualizer.git
cd notion-export-visualizer
npm install
npm run build:data   # Processes the test export in data/test/
npm run dev          # Starts dev server at http://localhost:5173
```

The repo includes a synthetic test export in `data/test/` so you can run the app without a real Notion export.

## Adding a Notion Export for Testing

1. Export your Notion workspace (Settings > Export > Markdown & CSV)
2. Unzip the export into `data/{name}/`
3. Run `npm run build:data` to process it
4. Real exports in `data/` are gitignored -- only `data/test/` is committed

## Architecture Overview

See [CLAUDE.md](./CLAUDE.md) for a detailed architecture guide covering:
- Two-phase architecture (build pipeline + React SPA)
- File organization and responsibilities
- Key conventions and gotchas

## Making Changes

1. Fork the repo and create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run build` to verify
4. Submit a pull request against `main`

## Code Conventions

- TypeScript throughout (strict mode)
- Build pipeline (`scripts/`) and React SPA (`src/`) are separate codebases with no shared code
- Types are intentionally duplicated between `scripts/lib/types.ts` and `src/types/index.ts`
- Filter/sort state is URL-serialized, not stored in React state
- Single CSS file (`src/styles/globals.css`) with Notion-like theming
