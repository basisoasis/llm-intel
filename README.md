<img src="./docs/public/favicon.svg" width="48" />

# llm-intel

Model intelligence for every LLM.

**llm-intel** sources model metadata and pricing from [OpenRouter](https://openrouter.ai), so you can look up capabilities and calculate token costs without maintaining your own data tables.

## Features

- Look up any model's capabilities, context window, and pricing by ID
- Calculate token costs with exact precision (powered by `bignumber.js`)
- Two purpose-built APIs: a **server client** (fetches from OpenRouter) and a **browser client** (reads pre-fetched JSON)
- Three-tier caching: memory -> disk -> network
- Full TypeScript support with generated `ModelId` types

## Installation

```bash
# npm
npm install @basisoasis/llm-intel

# pnpm
pnpm add @basisoasis/llm-intel

# yarn
yarn add @basisoasis/llm-intel

# bun
bun add @basisoasis/llm-intel
```

## Usage

### Server (`LLMIntel`)

Use this in Node.js / server-side environments. It fetches model data from OpenRouter, with disk and memory caching built in.

```typescript
import { LLMIntel } from "@basisoasis/llm-intel";

// Instantiate a provider client
const client = await LLMIntel.create({ provider: 'openrouter' });

// Resolve a model by ID
const model = await client.getModel(
  'anthropic/claude-4.6-sonnet-20260217'
);

if (!model) throw new Error('Model not found!');

const cost = client.calculateCost(model, {
  inputTokens: 20_000,
  outputTokens: 1700,
});

console.log(client.formatCostResult(cost));
/* {
  inputCost: "$0.06",
  outputCost: "$0.03",
  cacheReadCost: null,
  cacheWriteCost: null,
  imageCost: null,
  requestCost: null,
  totalCost: "$0.09",
  currency: "USD",
  warnings: [],
} */
```

### Standalone function

For one-off lookups without instantiating a client:

```typescript
import { getModelInfo } from "@basisoasis/llm-intel";

const result = await getModelInfo("anthropic/claude-3-5-sonnet", {
  provider: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

### Browser / SPA (`LLMIntelClient`)

Use this when you already have the model JSON (e.g. fetched server-side and passed to a SPA, or bundled at build time). No API key required.

```typescript
import { LLMIntelClient } from "@basisoasis/llm-intel/client";

// Hydrate from a URL your server exposes
const client = new LLMIntelClient({
  models: "/api/models", // returns ModelsResult JSON
  cacheTtl: 5 * 60 * 1000, // 5 minutes
});

// Or hydrate statically from a pre-loaded array
const client = new LLMIntelClient({ models: modelDataArray });

const model = await client.getModel("google/gemini-2.5-pro");
if (!model) throw new Error('Model not found!');

const cost = client.calculateCost(model, {
  inputTokens: 2000,
  outputTokens: 800,
});

console.log(client.formatCost(cost.inputCost));  // $0.0025
console.log(client.formatCost(cost.outputCost)); // $0.008
console.log(client.formatCost(cost.totalCost));  // $0.01
```

## API Reference

### `LLMIntel` (server)

| Method                                           | Description                                                    |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `LLMIntel.create(opts)`                          | Creates a validated client instance. Validates config upfront. |
| `client.getModels()`                             | Returns all available models (`ModelsResult`).                 |
| `client.getModel(modelId)`                       | Returns a single model by ID, or `null` if not found.          |
| `client.calculateCost(model, tokens, currency?)` | Calculates prompt/completion/total cost.                       |
| `client.formatCost(amount, currency?)`           | Formats a `BigNumber` as a currency string (e.g. `"$5.12"`).   |
| `client.formatCostResult(result)`                | Formats all line items in a `CostResult` to strings.           |

### `LLMIntelClient` (browser)

Same `getModel`, `getModels`, `calculateCost`, `formatCost`, and `formatCostResult` methods. Takes either a URL or a pre-loaded `ModelData[]` array.

### `getModelInfo(modelId, opts)` (standalone)

Fetches a single model without creating a client. Useful for serverless functions or scripts.

## Caching

`LLMIntel` uses a three-tier cache:

1. **Memory:** fastest; per-instance, invalidated by TTL
2. **Disk:** survives process restarts
3. **Network:** fetches fresh data from OpenRouter

Configure the TTL via `cacheTtl` in milliseconds (default: `86_400_000` — 24 hours).

`LLMIntelClient` uses memory caching only (no disk access in the browser).

## Configuration

All options are optional — the library falls back to environment variables and then built-in defaults.

```typescript
LLMIntel.create({
  provider: "openrouter",
  openRouterApiKey: process.env.LLM_INTEL_OPEN_ROUTER_API_KEY,
  cacheTtl: 86_400_000,
  cacheDir: ".cache",
});
```

| Option             | Env var                         | Default                 | Description                                                             |
| ------------------ | ------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `provider`         | `LLM_INTEL_PROVIDER`            | `"openrouter"`          | Data source to use. See [Providers](#providers).                        |
| `openRouterApiKey` | `LLM_INTEL_OPEN_ROUTER_API_KEY` | —                       | Your OpenRouter API key. Required when using the `openrouter` provider. |
| `cacheTtl`         | `LLM_INTEL_CACHE_TTL`           | `86_400_000` (24 hours) | How long cached model data is considered fresh, in milliseconds.        |
| `cacheDir`         | `LLM_INTEL_CACHE_DIR`           | `{cwd}/.cache`          | Directory used for disk caching.                                        |

## Providers

Currently, **OpenRouter** is the only supported provider. The library has been designed with a provider abstraction layer, so support for additional data sources can be added in the future without breaking changes to the public API.

| Provider   | Status       |
| ---------- | ------------ |
| OpenRouter | ✅ Supported |
| Others     | 🗓 Planned   |

## License

MIT
