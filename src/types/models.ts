import type { ModelInfoProvider } from "../config";

export type FetchResult<T> =
  | { status: 304 }
  | { status: 200; data: T[]; etag: string | null };

export type PricingUnit =
  | "per_million_tokens"
  | "per_thousand_tokens"
  | "per_token"
  | "per_image"
  | "per_request"
  | "free";

export interface PricingValue {
  amount: BigNumber;
  unit: PricingUnit;
}

export interface ModelPricing {
  input: PricingValue;
  output: PricingValue;
  cacheRead: PricingValue | null;
  cacheWrite: PricingValue | null;
  image: PricingValue | null;
  request: PricingValue | null;
}

// Normalized model
export interface ModelData {
  id: string;
  canonicalSlug: string,
  name: string;
  contextLength: number;
  maxOutputTokens: number | null;
  pricing: ModelPricing;
}

export type ModelResultStatus = "fresh" | "cached" | "stale-fallback";
export type ProviderSource = "openrouter";

export interface ModelsResult {
  source: ModelInfoProvider;
  status: ModelResultStatus;
  data: ModelData[];
  fetchedAt: Date;
}

export interface ModelResult {
  source: ModelInfoProvider;
  status: ModelResultStatus;
  data: ModelData;
  fetchedAt: Date;
}