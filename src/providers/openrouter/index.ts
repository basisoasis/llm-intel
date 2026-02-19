import type { LLMIntelConfigOutput } from "../../config";
import {
  isCacheFresh,
  readCache,
  updateMeta,
  writeCache,
  type CacheMeta,
} from "../../cache/file-cache";

import { fetchOpenRouterModels } from "./client";
import type { ModelsResult, ModelResultStatus, ModelResult } from "../../types/models";
import type { OpenRouterModel } from "./types";
import { mapModel, mapModels } from "./mapper";

const CACHE_FILE_NAME = "openrouter-models.json";

export async function getRawModels(
  config: LLMIntelConfigOutput,
): Promise<{
  meta: CacheMeta;
  data: OpenRouterModel[];
  status: ModelResultStatus;
}> {
  // Use cache if evaluated as fresh
  const cached = await readCache<OpenRouterModel>(CACHE_FILE_NAME, config);
  if (cached && isCacheFresh(cached.meta, config.cacheTtl)) {
    return {
      meta: cached.meta,
      data: cached.data,
      status: "cached",
    };
  }

  // Attempt to fetch fresh data
  try {
    const result = await fetchOpenRouterModels(
      config.openRouterApiKey,
      cached?.meta.etag,
    );
    const now = new Date();
    const nowIso = now.toISOString();

    if (result.status === 304) {
      if (!cached) throw Error("Unexpectedly cache object is null");

      // Data unchanged -- update fetched at so TTL resets, keep existing data
      const updatedMeta: CacheMeta = {
        ...cached.meta,
        fetchedAt: nowIso,
      };
      await updateMeta(CACHE_FILE_NAME, updatedMeta, config);

      return {
        meta: updatedMeta,
        data: cached.data,
        status: "cached",
      };
    }

    // Status 200 -- new data, write both files
    const etag = result?.etag;
    const newMeta: CacheMeta = {
      source: "openrouter",
      fetchedAt: nowIso,
      dataUpdatedAt: nowIso,
      etag,
    };
    await writeCache(CACHE_FILE_NAME, result.data, newMeta, config);

    return {
      meta: newMeta,
      data: result.data,
      status: "fresh",
    };
  } catch (err) {
    // Fetch failed — fall back to stale cache if available
    if (cached) {
      console.warn(
        `[LLMIntel] Failed to fetch latest models from OpenRouter. ` +
          `Falling back to stale cache from ${cached.meta.fetchedAt}.`,
        err,
      );

      return {
        meta: cached.meta,
        data: cached.data,
        status: "stale-fallback",
      };
    }

    // No cache at all — we have nothing, rethrow
    throw new Error(
      `[LLMIntel] Failed to fetch models and no cache is available.`,
      { cause: err },
    );
  }
}

export async function getModels(
  config: LLMIntelConfigOutput,
): Promise<ModelsResult> {
  const { meta, data, status } = await getRawModels(config);
  return {
    source: meta.source,
    status,
    data: mapModels(data),
    fetchedAt: new Date(meta.fetchedAt),
  };
}

export async function getModelById(
  modelId: string,
  config: LLMIntelConfigOutput,
): Promise<ModelResult | null> {
  const { meta, data, status } = await getRawModels(config);

  const model = data.find((m) => m.id === modelId);

  if (!model) return null;

  return {
    source: meta.source,
    status,
    data: mapModel(model),
    fetchedAt: new Date(meta.fetchedAt),
  };
}
