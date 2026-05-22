import type { FetchResult } from "../../types/models";
import type { OpenRouterModel } from "./types";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * Fetches the OpenRouter models list. Sends `If-None-Match` if an etag is provided.
 * Returns a 304 (unchanged) or 200 (new data) result.
 */
export async function fetchOpenRouterModels(
  apiKey?: string,
  etag?: string | null,
): Promise<FetchResult<OpenRouterModel>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  // Note: Doesn't appear OpenRouter supports ETags. Preserved for posterity.
  if (etag) {
    headers["If-None-Match"] = etag;
  }

  const response = await fetch(OPENROUTER_MODELS_URL, { headers });

  if (response.status === 304) {
    return { status: 304 };
  }

  if (!response.ok) {
    throw new Error(
      `OpenRouter models fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { data: OpenRouterModel[] };

  if (!Array.isArray(json.data)) {
    throw new Error("OpenRouter response missing expected 'data' array");
  }

  return {
    status: 200,
    data: json.data,
    etag: response.headers.get("etag"),
  };
}
