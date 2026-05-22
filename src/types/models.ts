import { BigNumber } from "bignumber.js";
import {
  object,
  string,
  number,
  nullable,
  picklist,
  custom,
  pipe,
  transform,
  type InferOutput,
} from "valibot";
import type { ModelInfoProvider } from "../config";

export type FetchResult<T> =
  | { status: 304 }
  | { status: 200; data: T[]; etag: string | null };

const BigNumberSchema = pipe(
  custom<BigNumber>(
    (val) =>
      BigNumber.isBigNumber(val) ||
      typeof val === "number" ||
      typeof val === "string",
    "Expected a BigNumber, number, or numeric string",
  ),
  transform((val) => new BigNumber(val as string | number | BigNumber)),
);

export const PricingUnitSchema = picklist([
  "per_million_tokens",
  "per_thousand_tokens",
  "per_token",
  "per_image",
  "per_request",
  "free",
]);

export const PricingValueSchema = object({
  amount: BigNumberSchema,
  unit: PricingUnitSchema,
});

export const ModelPricingSchema = object({
  input: PricingValueSchema,
  output: PricingValueSchema,
  cacheRead: nullable(PricingValueSchema),
  cacheWrite: nullable(PricingValueSchema),
  image: nullable(PricingValueSchema),
  request: nullable(PricingValueSchema),
});

export const ModelDataSchema = object({
  id: string(),
  canonicalSlug: string(),
  name: string(),
  contextLength: number(),
  maxOutputTokens: nullable(number()),
  pricing: ModelPricingSchema,
});

// Derive types from schemas — single source of truth
export type PricingUnit = InferOutput<typeof PricingUnitSchema>;
export type PricingValue = InferOutput<typeof PricingValueSchema>;
export type ModelPricing = InferOutput<typeof ModelPricingSchema>;
export type ModelData = InferOutput<typeof ModelDataSchema>;

export type ModelResultStatus = "fresh" | "cached" | "stale-fallback";
export type ProviderSource = "openrouter";

// These remain as interfaces since they include ModelInfoProvider
// which comes from config and isn't part of the validation boundary
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
