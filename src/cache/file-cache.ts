import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from "node:path";

import type { LLMIntelConfigOutput } from "../config";

export interface CacheMeta {
  fetchedAt: string; // ISO 8601 — last time we checked (200 or 304)
  dataUpdatedAt: string; // ISO 8601 — last time data actually changed (200 only)
  source: "openrouter";
  etag?: string | null; // ETag from last 200 response
}

/** 
 * Derives the `.meta.json` path from a data file path. If already a meta path, 
 * returns it unchanged. 
 */
function getMetaFilePath(path: string) {
  if (path.includes(".meta.")) return path;
  const parts = path.split(".").toSpliced(-1, 0, "meta");
  return parts.join(".");
}

/** 
 * Reads cache metadata from `{cacheDir}/{fileName}.meta.json`. Returns null if
 * missing or unparseable. 
 */
async function readMeta(
  fileName: string,
  opts: LLMIntelConfigOutput,
): Promise<CacheMeta | null> {
  try {
    const filePath = join(opts.cacheDir, fileName);
    const metaPath = getMetaFilePath(filePath);
    const metaData = await readFile(metaPath, 'utf-8');
    return JSON.parse(metaData) as CacheMeta;
  } catch {
    return null;
  }
}

/** 
 * Reads cached data from `{cacheDir}/{fileName}.json`. Returns null if missing or 
 * unparseable. 
 */
async function readData<T>(
  fileName: string,
  opts: LLMIntelConfigOutput,
): Promise<T[] | null> {
  try {
    const filePath = join(opts.cacheDir, fileName);
    const fileData = await readFile(filePath, 'utf-8');
    return JSON.parse(fileData) as T[];
  } catch {
    return null;
  }
}

/**
 * Reads both files. If either is missing or unparseable, returns null
 * and treats the whole cache as a miss
 */
export async function readCache<T>(
  fileName: string,
  opts: LLMIntelConfigOutput,
): Promise<{ meta: CacheMeta; data: T[] } | null> {
  const [meta, data] = await Promise.all([
    readMeta(fileName, opts),
    readData(fileName, opts),
  ]);
  if (!meta || !data) return null;
  return { meta, data: data as T[] };
}

/**
 * Writes data first, meta second. This ensures that if a write is interrupted,
 * the meta file either reflects a previous valid state or doesn't exist —
 * we never have a meta file pointing at incomplete or missing data.
 */
export async function writeCache<T>(
  fileName: string,
  data: T[],
  meta: CacheMeta,
  opts: LLMIntelConfigOutput,
): Promise<void> {
  const dataPath = join(opts.cacheDir, fileName);
  await mkdir(dirname(dataPath), { recursive: true });
  const metaPath = getMetaFilePath(dataPath);
  const serializedData = JSON.stringify(data, null, 2);
  const serializedMeta = JSON.stringify(meta, null, 2);
  await writeFile(dataPath, serializedData);
  await writeFile(metaPath, serializedMeta);
}

/**
 * Updates only the meta file — used on 304 responses where data hasn't changed
 * but we want to refresh fetchedAt so we don't check again until next TTL window.
 */
export async function updateMeta(
  fileName: string,
  meta: CacheMeta,
  opts: LLMIntelConfigOutput,
): Promise<void> {
  const filePath = join(opts.cacheDir, fileName);
  const metaPath = getMetaFilePath(filePath);
  const serializedMeta = JSON.stringify(meta, null, 2);
  await writeFile(metaPath, serializedMeta);
}

/**
 * Checks TTL against fetchedAt — the last time we contacted OpenRouter,
 * regardless of whether data actually changed.
 */
export function isCacheFresh(meta: CacheMeta, ttlMs: number): boolean {
  const fetchedAt = new Date(meta.fetchedAt).getTime();
  return Date.now() - fetchedAt < ttlMs;
}
