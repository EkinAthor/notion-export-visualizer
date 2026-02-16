import type { Manifest, Database, Page, SearchEntry } from '../types';

const cache = new Map<string, unknown>();
const BASE = import.meta.env.BASE_URL + 'data';

async function fetchJson<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data as T;
}

export async function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>('manifest.json');
}

export async function loadDatabase(uid: string): Promise<Database> {
  return fetchJson<Database>(`db-${uid}.json`);
}

export async function loadPage(uid: string): Promise<Page> {
  return fetchJson<Page>(`page-${uid}.json`);
}

export async function loadSearchIndex(): Promise<SearchEntry[]> {
  return fetchJson<SearchEntry[]>('search-index.json');
}
