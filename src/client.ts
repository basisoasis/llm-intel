import { parse, array, isValiError, flatten } from "valibot";
import { ModelDataSchema } from "./types/models";
import type { ModelData, ModelResult } from "./types/models";
import type { ModelId } from "./generated/model-ids";
import {
	calculateCost as _calculateCost,
	formatCost as _formatCost,
	formatCostResult as _formatCostResult,
} from "./calculator";
import type {
	CostCurrency,
	CostResult,
	FormattedCostResult,
	TokenInput,
} from "./calculator";

export interface LLMIntelClientOptions {
	/**
	 * Either a URL to fetch ModelsResult JSON from, or a pre-loaded ModelData array.
	 * Use the array form to hydrate the client statically (e.g. SSR, bundled data, tests).
	 */
	models: string | ModelData[];
	/**
	 * Cache TTL in milliseconds. Only applies when `models` is a URL.
	 */
	cacheTtl?: number | null | undefined;
}

interface ClientMemoryCache {
	data: ModelData[];
	fetchedAt: Date;
}

export class LLMIntelClient {
	private readonly options: LLMIntelClientOptions;
	private readonly cacheTtl: number | null | undefined;
	private memoryCache: ClientMemoryCache | null = null;

	constructor(opts: LLMIntelClientOptions) {
		if (Array.isArray(opts.models)) {
			const parsed = this.validateModelData(opts.models, "constructor");
			this.options = { ...opts, models: parsed };
		} else {
			this.options = opts;
		}

		this.cacheTtl = opts.cacheTtl;
	}

	private validateModelData(data: unknown, source: string): ModelData[] {
		try {
			const result = parse(array(ModelDataSchema), data);
			return result;
		} catch (err) {
			if (isValiError(err)) {
				throw new Error(
					`[LLMIntelClient] Invalid model data from ${source}:\n${JSON.stringify(flatten(err.issues), null, 2)}`,
					{ cause: err },
				);
			}
			throw err;
		}
	}

	private async resolveModels(): Promise<ModelData[]> {
		// Static array — already validated in constructor, return as-is
		if (Array.isArray(this.options.models)) {
			return this.options.models;
		}

		// URL path — check memory cache first
		if (this.memoryCache) {
			if (!this.cacheTtl) return this.memoryCache.data;
			const age = Date.now() - this.memoryCache.fetchedAt.getTime();
			if (age < this.cacheTtl) return this.memoryCache.data;
		}

		// Fetch and validate
		const url = this.options.models;
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(
				`[LLMIntelClient] Failed to fetch models from "${url}": HTTP ${res.status}`,
			);
		}

		const json = await res.json();

		// Accept either a raw ModelData[] or a ModelsResult envelope
		const payload = Array.isArray(json)
			? json
			: (json as Record<string, unknown>).data;
		const data = this.validateModelData(payload, `"${url}"`);

		this.memoryCache = { data, fetchedAt: new Date() };
		return data;
	}

	/**
	 * Returns the full list of available models.
	 */
	async getModels(): Promise<ModelData[]> {
		return this.resolveModels();
	}

	/**
	 * Returns a single model by ID.
	 * Returns null if the model is not found.
	 */
	async getModel(modelId: ModelId): Promise<ModelResult | null> {
		const models = await this.resolveModels();
		const model = models.find((m) => m.canonicalSlug === modelId);
		if (!model) return null;

		return {
			data: model,
			status: "cached",
			fetchedAt: this.memoryCache?.fetchedAt ?? new Date(),
			source: "openrouter",
		};
	}

	/**
	 * Calculates the cost of a model invocation given token counts.
	 * Pass a ModelResult directly — use getModel() first to retrieve it.
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
