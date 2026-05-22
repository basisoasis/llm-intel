import { PackageManagerBlock } from "./demo/package-manager-block";
import { CodeBlock } from "./demo/code-block";

// ── Code strings ──────────────────────────────────────────────────────────────

const PACKAGE_NAME = `@basisoasis/llm-intel`;

const USAGE_CODE = `import { LLMIntel } from '${PACKAGE_NAME}';

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
`;

const CLIENT_USAGE_CODE = `import { LLMIntelClient } from "${PACKAGE_NAME}/client";

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
`;

// ── Feature list ─────────────────────────────────────────────────────────────

const FEATURES: React.ReactNode[] = [
  "One client, any model: instantiate once, query across OpenRouter",
  "Full cost breakdown: input, output, cache read/write, image, and per-request fees",
  "TypeScript-first: full type definitions included",
];

// ── Section ───────────────────────────────────────────────────────────────────

export default function InstallSection() {
  return (
    <section
      id="install"
      className="border-t border-b border-border bg-surface"
    >
      <div className="max-w-[1200px] mx-auto px-12 py-14 flex flex-col gap-8">
        {/* Top — copy + features + install, full width */}
        <div className="grid grid-cols-2 gap-16 items-start">
          {/* Left — copy + features */}
          <div>
            <h2 className="font-sans text-[22px] font-semibold text-text-bright tracking-tight mb-2.5">
              Drop-in pricing for your stack.
            </h2>
            <p className="font-sans text-[14px] font-light text-text-dim leading-relaxed mb-5">
              One import. Pass in a model ID, get back current pricing. Run it
              on the server, or use the lightweight client in the browser. No
              hardcoded tables, no stale data.
            </p>
            <ul className="flex flex-col gap-2">
              {FEATURES.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 font-sans text-[13px] text-text"
                >
                  <span className="text-accent text-[10px] mt-[3px] shrink-0">
                    ▸
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — install block */}
          <div>
            <PackageManagerBlock
              label="Install"
              commands={{
                bun: `bun add ${PACKAGE_NAME}`,
                pnpm: `pnpm add ${PACKAGE_NAME}`,
                yarn: `yarn add ${PACKAGE_NAME}`,
                npm: `npm install ${PACKAGE_NAME}`,
              }}
            />
          </div>
        </div>

        {/* Bottom — server + client code blocks, full width */}
        <div className="grid grid-cols-2 gap-2.5">
          <CodeBlock
            label="Server"
            copyText={USAGE_CODE}
            language="typescript"
            code={USAGE_CODE}
          />
          <CodeBlock
            label="Client"
            copyText={CLIENT_USAGE_CODE}
            language="typescript"
            code={CLIENT_USAGE_CODE}
          />
        </div>
      </div>
    </section>
  );
}
