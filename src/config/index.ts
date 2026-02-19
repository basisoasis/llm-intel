import { join, normalize } from "node:path";
import { mkdir } from "node:fs/promises";
import {
  string,
  number,
  nonEmpty,
  pipeAsync,
  transform,
  transformAsync,
  ValiError,
  objectAsync,
  parseAsync,
  picklist,
  optional,
} from "valibot";
import type { InferInput, InferOutput } from "valibot";

const MODEL_INFO_PROVIDERS = ["openrouter"] as const;
export type ModelInfoProvider = (typeof MODEL_INFO_PROVIDERS)[number];

const ProviderSchema = picklist(
  MODEL_INFO_PROVIDERS,
  `Provider must be one of: ${MODEL_INFO_PROVIDERS.join(", ")}`,
);

const PathSchema = pipeAsync(
  string(),
  nonEmpty("Path must not be empty"),
  transform((p) => normalize(p)),
  transformAsync(async (p) => {
    try {
      await mkdir(p, { recursive: true });
      return p;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new ValiError([
        {
          kind: "validation",
          type: "custom",
          input: p,
          expected: null,
          received: `"${p}"`,
          message: `Failed to create cache directory: ${message}`,
        },
      ]);
    }
  }),
);

export const LLMIntelConfigSchema = objectAsync({
  provider: ProviderSchema,
  cacheDir: PathSchema,
  cacheTtl: number(),
  openRouterApiKey: optional(string()),
});

export type LLMIntelConfigInput = InferInput<typeof LLMIntelConfigSchema>;
export type LLMIntelConfigOutput = InferOutput<typeof LLMIntelConfigSchema>;

export function initializeConfig(
  opts: Partial<LLMIntelConfigInput> = {},
): Promise<LLMIntelConfigOutput> {
  const config: LLMIntelConfigInput = {
    provider: opts.provider || process.env.LLM_INTEL_PROVIDER,
    cacheDir: opts.cacheDir || process.env.LLM_INTEL_CACHE_DIR || join(process.cwd(), ".cache"),
    cacheTtl: opts.cacheTtl || parseInt(process.env.LLM_INTEL_CACHE_TTL ?? '', 10) || 86_400_000,
    openRouterApiKey: opts.openRouterApiKey ?? process.env.LLM_INTEL_OPEN_ROUTER_API_KEY,
  };
  return parseAsync(LLMIntelConfigSchema, config);
}
