import { BigNumber } from "bignumber.js";
import type { OpenRouterModel } from "./types";
import type { ModelData, ModelPricing, PricingValue } from "../../types/models";

/**
 * Converts an OpenRouter per-token price string to a normalized PricingValue.
 *
 * OpenRouter returns prices as USD per token strings (e.g. "0.000005").
 * We normalize these to per_million_tokens by multiplying by 1,000,000.
 * A value of "0" is treated as free.
 */
function tokenPriceToValue(raw: string | undefined): PricingValue | null {
  if (raw === undefined || raw === null) return null;

  const amount = new BigNumber(raw);

  if (amount.isNaN()) return null;
  if (amount.isZero()) return { amount: new BigNumber(0), unit: "free" };

  return {
    amount: amount,
    unit: "per_token",
  };
}

/**
 * Converts an OpenRouter flat per-image or per-request price string.
 * These are not per-token so we do not multiply.
 */
function flatPriceToValue(
  raw: string | undefined,
  unit: "per_image" | "per_request",
): PricingValue | null {
  if (raw === undefined || raw === null) return null;

  const amount = new BigNumber(raw);

  if (amount.isNaN()) return null;
  if (amount.isZero()) return { amount: new BigNumber(0), unit: "free" };

  return { amount, unit };
}

function mapPricing(raw: OpenRouterModel["pricing"]): ModelPricing {
  return {
    input: tokenPriceToValue(raw.prompt) ?? {
      amount: BigNumber(0),
      unit: "free",
    },
    output: tokenPriceToValue(raw.completion) ?? {
      amount: BigNumber(0),
      unit: "free",
    },
    cacheRead: tokenPriceToValue(raw.input_cache_read),
    cacheWrite: tokenPriceToValue(raw.input_cache_write),
    image: flatPriceToValue(raw.image, "per_image"),
    request: flatPriceToValue(raw.request, "per_request"),
  };
}

export function mapModel(raw: OpenRouterModel): ModelData {
  return {
    id: raw.id,
    canonicalSlug: raw.canonical_slug,
    name: raw.name,
    contextLength: raw.context_length,
    maxOutputTokens: raw.top_provider?.max_completion_tokens ?? null,
    pricing: mapPricing(raw.pricing),
  };
}

export function mapModels(raw: OpenRouterModel[]): ModelData[] {
  return raw.map(mapModel);
}
