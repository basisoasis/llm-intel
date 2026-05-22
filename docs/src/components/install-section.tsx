import { PackageManagerBlock } from "./demo/package-manager-block";
import { CodeBlock } from "./demo/code-block";

// ── Code strings ──────────────────────────────────────────────────────────────

const PACKAGE_NAME = `basisoasis/llm-intel`;

const USAGE_CODE = `import { LLMIntel } from 'llm-intel';

// Instantiate a provider client
const client = await LLMIntel.create({ provider: 'openrouter' });

// Resolve a model by ID
const model = await client.getModel(
  'anthropic/claude-4.6-sonnet-20260217'
);
if (!model) throw new Error('Model not found!');

// Calculate cost across all token types
const cost = await model.getCost({
  inputTokens:      100_000,
  outputTokens:     100_000,
  cacheReadTokens:   10_000,
  cacheWriteTokens: 100_000,
});

console.log(cost.totalCost);     // "USD 1.8300"
console.log(cost.cacheReadCost); // "USD 0.0100"
console.log(cost.warnings);      // []`;

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
      <div className="max-w-[1200px] mx-auto px-12 py-14 grid grid-cols-2 gap-16 items-start">
        {/* Left — copy + features */}
        <div>
          <h2 className="font-sans text-[22px] font-semibold text-text-bright tracking-tight mb-2.5">
            Drop-in pricing for your stack.
          </h2>
          <p className="font-sans text-[14px] font-light text-text-dim leading-relaxed mb-5">
            One import. Pass in a model ID, get back current pricing. No
            hardcoded tables, no stale data.
          </p>
          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 font-sans text-[13px] text-text"
              >
                <span className="text-accent text-[10px] mt-[3px] shrink-0">
                  ▸
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — code blocks */}
        <div className="flex flex-col gap-2.5">
          <PackageManagerBlock
            label="Install"
            commands={{
              bun: `bun add ${PACKAGE_NAME}`,
              pnpm: `pnpm add ${PACKAGE_NAME}`,
              yarn: `yarn add ${PACKAGE_NAME}`,
              npm: `npm install ${PACKAGE_NAME}`,
            }}
          />

          <CodeBlock
            label="Usage"
            copyText={USAGE_CODE}
            language="typescript"
            code={USAGE_CODE}
          />
        </div>
      </div>
    </section>
  );
}
