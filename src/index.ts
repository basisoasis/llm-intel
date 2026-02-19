import { flatten, isValiError } from "valibot";
import { initializeConfig, type LLMIntelConfigInput, type LLMIntelConfigOutput } from "./config";
import { getModels as getOpenRouterModels } from "./providers/openrouter";
import { getModelById as getOpenRouterModelById } from "./providers/openrouter";
import type { ModelData, ModelResult, ModelResultStatus, ModelsResult } from "./types/models";
import {
  calculateCost as _calculateCost,
  formatCost as _formatCost,
  formatCostResult as _formatCostResult,
} from "./calculator";
import type { CostCurrency, CostResult, FormattedCostResult, TokenInput } from "./calculator";
import type { ModelId } from "./generated/model-ids";

interface ModelMemoryCache {
  data: ModelData[];
  fetchedAt: Date;
  status: ModelResultStatus;
  source: ModelsResult["source"];
}

/**
 * Returns info for a single model by ID, including normalized pricing and token limits.
 * Selects the appropriate provider based on config. Returns null if the model is not found.
 * Throws if the fetch fails and no stale cache is available.
 */
export async function getModelInfo(
  modelId: ModelId,
  opts: LLMIntelConfigInput,
): Promise<ModelResult | null> {
  let config: LLMIntelConfigOutput;

  try {
    config = await initializeConfig(opts);
  } catch (err) {
    if (isValiError(err)) {
      throw new Error(
        `[LLMIntel] Invalid configuration:\n${JSON.stringify(flatten(err.issues), null, 2)}`,
        { cause: err },
      );
    }
    throw err;
  }

  switch (config.provider) {
    case "openrouter":
      return getOpenRouterModelById(modelId, config);
    default:
      throw new Error(`[LLMIntel] Unsupported provider: "${config.provider}"`);
  }
}

export class LLMIntel {
  private memoryCache: ModelMemoryCache | null = null;

  /** Constructor is private -- use LLMIntel.create() to ensure config is validated before use. */
  private constructor(private readonly config: LLMIntelConfigOutput) {}

  /**
   * Creates a validated LLMIntel client instance.
   * Config is initialized once here and reused across all subsequent calls.
   */
  static async create(opts: Partial<LLMIntelConfigInput> = {}): Promise<LLMIntel> {
    try {
      const config = await initializeConfig(opts);
      return new LLMIntel(config);
    } catch (err) {
      if (isValiError(err)) {
        throw new Error(
          `[LLMIntel] Invalid configuration:\n${JSON.stringify(flatten(err.issues), null, 2)}`,
          { cause: err },
        );
      }
      throw err;
    }
  }

  /**
   * Resolves the full model list, checking memory first then delegating to the
   * provider (which handles disk cache and network). Keeps memory cache in sync.
   */
  private async resolveModels(): Promise<ModelsResult> {
    const ttlMs = this.config.cacheTtl;

    // Memory hit — return immediately if still fresh
    if (this.memoryCache) {
      const age = Date.now() - this.memoryCache.fetchedAt.getTime();
      if (age < ttlMs) {
        return {
          data: this.memoryCache.data,
          status: this.memoryCache.status,
          fetchedAt: this.memoryCache.fetchedAt,
          source: this.memoryCache.source,
        };
      }
    }

    // Memory miss or stale — delegate to provider (handles disk + network)
    const result = await this.getProviderModels();

    // Update memory cache
    this.memoryCache = {
      data: result.data,
      fetchedAt: result.fetchedAt,
      status: result.status,
      source: result.source,
    };

    return result;
  }

  /** Delegates to the correct provider based on config. */
  private async getProviderModels(): Promise<ModelsResult> {
    switch (this.config.provider) {
      case "openrouter":
        return getOpenRouterModels(this.config);
      default:
        throw new Error(`[LLMIntel] Unsupported provider: "${this.config.provider}"`);
    }
  }

  /**
   * Returns the full list of available models from the configured provider.
   * Checks memory cache first, then disk cache, then network.
   */
  async getModels(): Promise<ModelsResult> {
    return this.resolveModels();
  }

  /**
   * Returns a single model by ID, including normalized pricing and token limits.
   * Resolves from memory where possible — avoids reloading the full model list.
   * Returns null if the model is not found.
   */
  async getModel(modelId: ModelId): Promise<ModelResult | null> {
    const resolved = await this.resolveModels();
    const model = resolved.data.find((m) => m.canonicalSlug === modelId);

    if (!model) return null;

    return {
      data: model,
      status: resolved.status,
      fetchedAt: resolved.fetchedAt,
      source: resolved.source,
    };
  }

  /**
   * Calculates the cost of a model invocation given token counts.
   * Pass a ModelData directly — use getModel() first to retrieve it.
   */
  calculateCost(
    model: ModelResult,
    tokens: TokenInput,
    currency: CostCurrency = "USD",
  ): CostResult {
    return _calculateCost(model.data, tokens, currency);
  }

  /**
   * Formats a BigNumber cost value as a human-readable currency string (e.g. "$5.12").
   */
  formatCost(amount: BigNumber, currency: CostCurrency = "USD"): string {
    return _formatCost(amount, currency);
  }

  /**
   * Formats all line items in a CostResult to human-readable currency strings.
   */
  formatCostResult(result: CostResult): FormattedCostResult {
    return _formatCostResult(result);
  }
}