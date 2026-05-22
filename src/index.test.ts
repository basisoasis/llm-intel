import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BigNumber } from "bignumber.js";
import { LLMIntel } from "./index";
import type { ModelData, ModelsResult } from "./types/models";

// --- Mocks ---

vi.mock("./providers/openrouter", () => ({
  getModels: vi.fn(),
  getModelById: vi.fn(),
}));

vi.mock("./config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./config")>();
  return {
    ...actual,
    initializeConfig: vi.fn().mockResolvedValue({
      provider: "openrouter",
      cacheDir: "/tmp/.cache",
      cacheTtl: 86_400_000,
      openRouterApiKey: undefined,
    }),
  };
});

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

const mockModelsResult = (
  models: ModelData[],
  status = "fresh",
): ModelsResult => ({
  source: "openrouter",
  status: status as ModelsResult["status"],
  data: models,
  fetchedAt: new Date(), // always fresh relative to now
});

// --- Helpers ---

const getOpenRouterMock = async () => {
  const mod = await import("./providers/openrouter");
  return {
    getModels: vi.mocked(mod.getModels),
    getModelById: vi.mocked(mod.getModelById),
  };
};

// --- Tests ---

describe("LLMIntel", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- create() ---

  describe("create()", () => {
    it("creates an instance with valid config", async () => {
      const intel = await LLMIntel.create();
      expect(intel).toBeInstanceOf(LLMIntel);
    });

    it("throws a formatted error on invalid config", async () => {
      const { initializeConfig } = await import("./config");
      vi.mocked(initializeConfig).mockRejectedValueOnce(
        new Error("Invalid configuration"),
      );
      await expect(LLMIntel.create()).rejects.toThrow();
    });
  });

  // --- getModels() ---

  describe("getModels()", () => {
    it("returns models from the provider", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel, anotherModel]));

      const intel = await LLMIntel.create();
      const result = await intel.getModels();

      expect(result.data).toHaveLength(2);
      expect(result.source).toBe("openrouter");
      expect(result.status).toBe("fresh");
      expect(getModels).toHaveBeenCalledOnce();
    });

    it("returns memory cache on second call without re-fetching provider", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      await intel.getModels();
      await intel.getModels();

      expect(getModels).toHaveBeenCalledOnce();
    });

    it("re-fetches after TTL expires", async () => {
      vi.useFakeTimers();

      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const { initializeConfig } = await import("./config");
      vi.mocked(initializeConfig).mockResolvedValueOnce({
        provider: "openrouter",
        cacheDir: "/tmp/.cache",
        cacheTtl: 1000,
        openRouterApiKey: undefined,
      });

      const intel = await LLMIntel.create();
      await intel.getModels();
      vi.advanceTimersByTime(1001);
      await intel.getModels();

      expect(getModels).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("preserves status from provider result", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(
        mockModelsResult([validModel], "stale-fallback"),
      );

      const intel = await LLMIntel.create();
      const result = await intel.getModels();

      expect(result.status).toBe("stale-fallback");
    });
  });

  // --- getModel() ---

  describe("getModel()", () => {
    it("returns a matching model by canonicalSlug", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel, anotherModel]));

      const intel = await LLMIntel.create();
      const result = await intel.getModel("~openai/gpt-4o" as any);

      expect(result).not.toBeNull();
      expect(result!.data.name).toBe("GPT-4o");
    });

    it("returns null for an unknown model ID", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      const result = await intel.getModel("~unknown/model" as any);

      expect(result).toBeNull();
    });

    it("carries source and status from the resolved models", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel], "cached"));

      const intel = await LLMIntel.create();
      const result = await intel.getModel("~openai/gpt-4o" as any);

      expect(result!.status).toBe("cached");
      expect(result!.source).toBe("openrouter");
    });

    it("does not re-fetch the provider when model is already in memory cache", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      await intel.getModels(); // populate cache
      await intel.getModel("~openai/gpt-4o" as any);

      expect(getModels).toHaveBeenCalledOnce();
    });
  });

  // --- calculateCost() ---

  describe("calculateCost()", () => {
    it("calculates cost for input and output tokens", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      const model = await intel.getModel("~openai/gpt-4o" as any);
      const result = intel.calculateCost(model!, {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });

      expect(BigNumber.isBigNumber(result.totalCost)).toBe(true);
      expect(result.totalCost.isGreaterThan(0)).toBe(true);
      expect(result.currency).toBe("USD");
    });

    it("returns null costs for unprovided token types", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      const model = await intel.getModel("~openai/gpt-4o" as any);
      const result = intel.calculateCost(model!, { inputTokens: 1_000_000 });

      expect(result.outputCost).toBeNull();
      expect(result.cacheReadCost).toBeNull();
    });
  });

  // --- formatCost() ---

  describe("formatCost()", () => {
    it("formats a BigNumber as a USD string", async () => {
      const intel = await LLMIntel.create();
      const formatted = intel.formatCost(new BigNumber("5.1234"));
      expect(formatted).toMatch(/^\$/);
    });
  });

  // --- formatCostResult() ---

  describe("formatCostResult()", () => {
    it("formats all line items in a CostResult", async () => {
      const { getModels } = await getOpenRouterMock();
      getModels.mockResolvedValue(mockModelsResult([validModel]));

      const intel = await LLMIntel.create();
      const model = await intel.getModel("~openai/gpt-4o" as any);
      const costResult = intel.calculateCost(model!, {
        inputTokens: 500_000,
        outputTokens: 500_000,
      });
      const formatted = intel.formatCostResult(costResult);

      expect(typeof formatted.totalCost).toBe("string");
      expect(formatted.totalCost).toMatch(/^\$/);
      expect(formatted.currency).toBe("USD");
    });
  });
});
