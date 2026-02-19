import BigNumber from "bignumber.js";
import type { ModelData, PricingValue } from "./types/models";

export type CostCurrency = "USD"; 

export interface TokenInput {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  imageCount?: number;
  includeRequestFee?: boolean;
}

export interface CostResult {
  inputCost: BigNumber | null;
  outputCost: BigNumber | null;
  cacheReadCost: BigNumber | null;
  cacheWriteCost: BigNumber | null;
  imageCost: BigNumber | null;
  requestCost: BigNumber | null;
  totalCost: BigNumber;
  currency: CostCurrency;
  warnings: string[];
}

export interface FormattedCostResult {
  inputCost: string | null;
  outputCost: string | null;
  cacheReadCost: string | null;
  cacheWriteCost: string | null;
  imageCost: string | null;
  requestCost: string | null;
  totalCost: string;
  currency: CostCurrency;
  warnings: string[];
}

/**
 * Calculates cost for a token count against a PricingValue.
 * Returns null if pricing is null, the count is absent/zero, or the unit is "free".
 */
function computeLineCost(
  pricing: PricingValue | null,
  count: number | undefined,
): BigNumber | null {
  if (!pricing || !count || count === 0) return null;
  if (pricing.unit === "free") return new BigNumber(0);

  switch (pricing.unit) {
    case "per_million_tokens":
      return pricing.amount.dividedBy(1_000_000).multipliedBy(count);
    case "per_thousand_tokens":
      return pricing.amount.dividedBy(1_000).multipliedBy(count);
    case "per_token":
      return pricing.amount.multipliedBy(count)
    case "per_image":
      return pricing.amount.multipliedBy(count);
    case "per_request":
      return pricing.amount;
  }
}

/**
 * Calculates the cost of a model invocation given token counts.
 * Unsupported fields (e.g. cache tokens on a model with no cache pricing) are
 * discarded with a warning. Total reflects only what was provided and valid.
 */
export function calculateCost(
  model: ModelData,
  tokens: TokenInput,
  currency: CostCurrency = "USD",
): CostResult {
  const warnings: string[] = [];

  // Cache read
  let cacheReadCost: BigNumber | null = null;
  if (tokens.cacheReadTokens && tokens.cacheReadTokens > 0) {
    if (!model.pricing.cacheRead) {
      warnings.push(`Model "${model.id}" does not support cache read pricing — cacheReadTokens discarded.`);
    } else {
      cacheReadCost = computeLineCost(model.pricing.cacheRead, tokens.cacheReadTokens);
    }
  }

  // Cache write
  let cacheWriteCost: BigNumber | null = null;
  if (tokens.cacheWriteTokens && tokens.cacheWriteTokens > 0) {
    if (!model.pricing.cacheWrite) {
      warnings.push(`Model "${model.id}" does not support cache write pricing — cacheWriteTokens discarded.`);
    } else {
      cacheWriteCost = computeLineCost(model.pricing.cacheWrite, tokens.cacheWriteTokens);
    }
  }

  // TODO -- Calculating image cost is tricky challenge we'll tackle later, or remove entirely.
  const imageCost: BigNumber | null = null;
  if (tokens.imageCount && tokens.imageCount > 0) {
    warnings.push(`Image cost analysis not supported`);
  }

  // Request fee
  let requestCost: BigNumber | null = null;
  if (tokens.includeRequestFee) {
    if (!model.pricing.request) {
      warnings.push(`Model "${model.id}" does not have a per-request fee — includeRequestFee discarded.`);
    } else {
      requestCost = computeLineCost(model.pricing.request, 1);
    }
  }

  const inputCost = computeLineCost(model.pricing.input, tokens.inputTokens);
  const outputCost = computeLineCost(model.pricing.output, tokens.outputTokens);

  // Total — sum only non-null line items
  const totalCost = [inputCost, outputCost, cacheReadCost, cacheWriteCost, imageCost, requestCost]
    .filter((c): c is BigNumber => c !== null)
    .reduce((acc, c) => acc.plus(c), new BigNumber(0));

  return {
    inputCost,
    outputCost,
    cacheReadCost,
    cacheWriteCost,
    imageCost,
    requestCost,
    totalCost,
    currency,
    warnings,
  };
}

/**
 * Formats a BigNumber cost as a human-readable currency string (e.g. "$5.12").
 * Uses Intl.NumberFormat — no reinventing the wheel.
 */
export function formatCost(amount: BigNumber, currency: CostCurrency = "USD"): string {
  const num = amount.toNumber();
  
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
  };

  // Use more decimal places for small amounts
  if (num > 0 && num < 0.01) {
    options.minimumFractionDigits = 2;
    options.maximumFractionDigits = 6;
  }

  return new Intl.NumberFormat("en-US", options).format(num);
}

/**
 * Formats all line items in a CostResult to human-readable currency strings.
 */
export function formatCostResult(result: CostResult): FormattedCostResult {
  const fmt = (v: BigNumber | null) => v !== null ? formatCost(v, result.currency) : null;

  return {
    inputCost: fmt(result.inputCost),
    outputCost: fmt(result.outputCost),
    cacheReadCost: fmt(result.cacheReadCost),
    cacheWriteCost: fmt(result.cacheWriteCost),
    imageCost: fmt(result.imageCost),
    requestCost: fmt(result.requestCost),
    totalCost: formatCost(result.totalCost, result.currency),
    currency: result.currency,
    warnings: result.warnings,
  };
}