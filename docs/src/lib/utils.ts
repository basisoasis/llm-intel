import type { ModelData } from "llm-intel";

// ── Provider derivation ───────────────────────────────────────────────────────
// Provider is the prefix before the first '/' in canonicalSlug.
// e.g. "x-ai/grok-build-0.1-20260520" -> "x-ai"

export function getProvider(model: ModelData): string {
  return model.canonicalSlug.split("/")[0];
}

// ── Unique providers ──────────────────────────────────────────────────────────
// Derives a sorted, deduplicated list of providers from a model list.

export function getProviders(models: ModelData[]): string[] {
  return [...new Set(models.map(getProvider))].sort();
}

// ── Filter by provider ────────────────────────────────────────────────────────

export function filterByProvider(
  models: ModelData[],
  provider: string,
): ModelData[] {
  return models.filter((m) => getProvider(m) === provider);
}
