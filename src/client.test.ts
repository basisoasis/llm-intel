import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber } from "bignumber.js";
import { LLMIntelClient } from "./client";
import type { ModelData } from "./types/models";

// --- Fixtures ---

const validModel: ModelData = {
  id: "openai/gpt-4o",
  canonicalSlug: "~openai/gpt-4o",
  name: "GPT-4o",
  contextLength: 128000,
  maxOutputTokens: 4096,
  pricing: {
    input: { amount: new BigNumber("5"), unit: "per_million_tokens" },
    output: { amount: new BigNumber("15"), unit: "per_million_tokens" },
    cacheRead: null,
    cacheWrite: null,
    image: null,
    request: null,
  },
};

const anotherModel: ModelData = {
  id: "anthropic/claude-3-5-sonnet",
  canonicalSlug: "~anthropic/claude-3-5-sonnet",
  name: "Claude 3.5 Sonnet",
  contextLength: 200000,
  maxOutputTokens: 8192,
  pricing: {
    input: { amount: new BigNumber("3"), unit: "per_million_tokens" },
    output: { amount: new BigNumber("15"), unit: "per_million_tokens" },
    cacheRead: { amount: new BigNumber("0.3"), unit: "per_million_tokens" },
    cacheWrite: { amount: new BigNumber("3.75"), unit: "per_million_tokens" },
    image: null,
    request: null,
  },
};

const validModelsArray: ModelData[] = [validModel, anotherModel];

const mockFetchResponse = (body: unknown, status = 200) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
};

// --- Tests ---

describe("LLMIntelClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // --- Constructor ---

  describe("constructor", () => {
    it("accepts a valid ModelData array", () => {
      expect(
        () => new LLMIntelClient({ models: validModelsArray }),
      ).not.toThrow();
    });

    it("throws on invalid ModelData array", () => {
      const invalid = [{ id: 123, canonicalSlug: true }];
      expect(
        () => new LLMIntelClient({ models: invalid as unknown as ModelData[] }),
      ).toThrowError("[LLMIntelClient] Invalid model data from constructor");
    });

    it("accepts a URL without throwing", () => {
      expect(
        () => new LLMIntelClient({ models: "https://example.com/models" }),
      ).not.toThrow();
    });

    it("does not fetch during construction when given a URL", () => {
      const fetchSpy = vi.spyOn(global, "fetch");
      new LLMIntelClient({ models: "https://example.com/models" });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // --- getModels ---

  describe("getModels()", () => {
    it("returns models from a static array", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const models = await client.getModels();
      expect(models).toHaveLength(2);
      expect(models[0]?.canonicalSlug).toBe("~openai/gpt-4o");
    });

    it("fetches and returns models from a URL (raw array response)", async () => {
      mockFetchResponse(validModelsArray);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      const models = await client.getModels();
      expect(models).toHaveLength(2);
      expect(fetch).toHaveBeenCalledOnce();
    });

    it("fetches and returns models from a URL (ModelsResult envelope response)", async () => {
      mockFetchResponse({
        data: validModelsArray,
        status: "fresh",
        source: "openrouter",
        fetchedAt: new Date(),
      });
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      const models = await client.getModels();
      expect(models).toHaveLength(2);
    });

    it("throws on non-ok fetch response", async () => {
      mockFetchResponse(null, 500);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      await expect(client.getModels()).rejects.toThrow(
        '[LLMIntelClient] Failed to fetch models from "https://example.com/models": HTTP 500',
      );
    });

    it("throws when fetched JSON fails validation", async () => {
      mockFetchResponse([{ id: 123, bad: true }]);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      await expect(client.getModels()).rejects.toThrow(
        "[LLMIntelClient] Invalid model data",
      );
    });

    it("deserializes BigNumber amounts from numeric JSON values", async () => {
      const serialized = validModelsArray.map((m) => ({
        ...m,
        pricing: {
          ...m.pricing,
          input: {
            ...m.pricing.input,
            amount: m.pricing.input.amount.toNumber(),
          },
          output: {
            ...m.pricing.output,
            amount: m.pricing.output.amount.toNumber(),
          },
        },
      }));
      mockFetchResponse(serialized);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      const models = await client.getModels();
      expect(BigNumber.isBigNumber(models[0]?.pricing.input.amount)).toBe(true);
    });
  });

  // --- Caching ---

  describe("caching", () => {
    it("returns memory cache on second call without re-fetching", async () => {
      mockFetchResponse(validModelsArray);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
      });
      await client.getModels();
      await client.getModels();
      expect(fetch).toHaveBeenCalledOnce();
    });

    it("re-fetches after TTL expires", async () => {
      vi.useFakeTimers();
      mockFetchResponse(validModelsArray);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
        cacheTtl: 1000,
      });
      await client.getModels();
      vi.advanceTimersByTime(1001);
      await client.getModels();
      expect(fetch).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("does not re-fetch when cacheTtl is null", async () => {
      vi.useFakeTimers();
      mockFetchResponse(validModelsArray);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
        cacheTtl: null,
      });
      await client.getModels();
      vi.advanceTimersByTime(999999999);
      await client.getModels();
      expect(fetch).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });

    it("does not re-fetch when cacheTtl is undefined", async () => {
      vi.useFakeTimers();
      mockFetchResponse(validModelsArray);
      const client = new LLMIntelClient({
        models: "https://example.com/models",
        cacheTtl: undefined,
      });
      await client.getModels();
      vi.advanceTimersByTime(999999999);
      await client.getModels();
      expect(fetch).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });
  });

  // --- getModel ---

  describe("getModel()", () => {
    it("returns a matching model by canonicalSlug", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const result = await client.getModel("~openai/gpt-4o" as any);
      expect(result).not.toBeNull();
      expect(result?.data.name).toBe("GPT-4o");
    });

    it("returns null for an unknown model ID", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const result = await client.getModel("~unknown/model" as any);
      expect(result).toBeNull();
    });

    it("returns status 'cached' and source 'openrouter'", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const result = await client.getModel("~openai/gpt-4o" as any);
      expect(result?.status).toBe("cached");
      expect(result?.source).toBe("openrouter");
    });
  });

  // --- calculateCost ---

  describe("calculateCost()", () => {
    it("calculates cost for input and output tokens", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const model = await client.getModel("~openai/gpt-4o" as any);
      const result = client.calculateCost(model!, {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(BigNumber.isBigNumber(result.totalCost)).toBe(true);
      expect(result.totalCost.isEqualTo(new BigNumber("20"))).toBe(true);
      expect(result.inputCost?.isEqualTo(new BigNumber("5"))).toBe(true);
      expect(result.outputCost?.isEqualTo(new BigNumber("15"))).toBe(true);
      expect(result.currency).toBe("USD");
      expect(result.warnings).toHaveLength(0);
    });

    it("returns null costs for unprovided token types", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const model = await client.getModel("~openai/gpt-4o" as any);
      const result = client.calculateCost(model!, { inputTokens: 1_000_000 });
      expect(result.inputCost?.isEqualTo(new BigNumber("5"))).toBe(true);
      expect(result.outputCost).toBeNull();
      expect(result.cacheReadCost).toBeNull();
      expect(result.cacheWriteCost).toBeNull();
      expect(result.totalCost.isEqualTo(new BigNumber("5"))).toBe(true);
    });

    it("warns when cache tokens are passed to a model without cache pricing", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const model = await client.getModel("~openai/gpt-4o" as any); // no cacheRead/cacheWrite
      const result = client.calculateCost(model!, {
        cacheReadTokens: 1_000_000,
      });
      expect(result.cacheReadCost).toBeNull();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/does not support cache read pricing/);
    });

    it("calculates cache costs for models that support it", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const model = await client.getModel(
        "~anthropic/claude-3-5-sonnet" as any,
      );
      const result = client.calculateCost(model!, {
        cacheReadTokens: 1_000_000,
        cacheWriteTokens: 1_000_000,
      });
      expect(result.cacheReadCost?.isEqualTo(new BigNumber("0.3"))).toBe(true);
      expect(result.cacheWriteCost?.isEqualTo(new BigNumber("3.75"))).toBe(
        true,
      );
    });
  });

  // --- formatCost ---

  describe("formatCost()", () => {
    it("formats a BigNumber as a USD string", () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const formatted = client.formatCost(new BigNumber("5.1234"));
      expect(formatted).toMatch(/^\$/);
    });
  });

  // --- formatCostResult ---

  describe("formatCostResult()", () => {
    it("formats all line items in a CostResult", async () => {
      const client = new LLMIntelClient({ models: validModelsArray });
      const model = await client.getModel("~openai/gpt-4o" as any);
      const costResult = client.calculateCost(model!, {
        inputTokens: 500_000,
        outputTokens: 500_000,
      });
      const formatted = client.formatCostResult(costResult);
      expect(typeof formatted.totalCost).toBe("string");
      expect(formatted.totalCost).toMatch(/^\$/);
    });
  });
});
