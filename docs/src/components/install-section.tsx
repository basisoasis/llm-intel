import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyButton from './copy-button'

// ── Code strings ──────────────────────────────────────────────────────────────

const INSTALL_CODE = `npm install llm-intel`

const USAGE_CODE =
`import { LLMIntel } from 'llm-intel';

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
console.log(cost.warnings);      // []`

const RETURN_TYPE_CODE = 
`interface FormattedCostResult {
  inputCost:      string | null;
  outputCost:     string | null;
  cacheReadCost:  string | null;
  cacheWriteCost: string | null;
  imageCost:      string | null;
  requestCost:    string | null;
  totalCost:      string;
  currency:       CostCurrency;
  warnings:       string[];
}`

// ── Subcomponents ─────────────────────────────────────────────────────────────

interface CodeBlockProps {
  label: string
  copyText: string
  language: string
  code: string
}

function CodeBlock({ label, copyText, language, code }: CodeBlockProps) {
  return (
    <div className="bg-bg border border-border-2 rounded-app overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface-2 border-b border-border">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted">{label}</span>
        <CopyButton text={copyText} />
      </div>
      {/* Highlighted code */}
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '16px 18px',
          background: 'transparent',
          fontSize: '12.5px',
          lineHeight: '1.7',
        }}
        codeTagProps={{
          style: { fontFamily: 'var(--font-mono)' },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// ── Feature list ─────────────────────────────────────────────────────────────

const FEATURES: React.ReactNode[] = [
  'Provider-first client — instantiate once, query any model via OpenRouter and more',
  'Full cost breakdown: input, output, cache read/write, image, and per-request fees',
  <>Typed <code className="text-[11px] text-accent bg-surface-3 px-1 py-px rounded-sm">FormattedCostResult</code> with currency and warnings</>,
  'Prompt cache pricing supported — see real savings from cache hits',
  'TypeScript-first with full type definitions, zero dependencies',
]

// ── Section ───────────────────────────────────────────────────────────────────

export default function InstallSection() {
  return (
    <section id="install" className="border-t border-b border-border bg-surface">
      <div className="max-w-[1200px] mx-auto px-12 py-14 grid grid-cols-2 gap-16 items-start">

        {/* Left — copy + features */}
        <div>
          <h2 className="font-sans text-[22px] font-semibold text-text-bright tracking-tight mb-2.5">
            Drop-in pricing for your stack.
          </h2>
          <p className="font-sans text-[14px] font-light text-text-dim leading-relaxed mb-5">
            One import. Automatic model resolution. Returns exact per-token costs
            in real time — no hardcoded tables, no stale data.
          </p>
          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 font-sans text-[13px] text-text">
                <span className="text-accent text-[10px] mt-[3px] shrink-0">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — code blocks */}
        <div className="flex flex-col gap-2.5">
          <CodeBlock
            label="Install"
            copyText={INSTALL_CODE}
            language="bash"
            code={INSTALL_CODE}
          />
          <CodeBlock
            label="Usage"
            copyText={USAGE_CODE}
            language="typescript"
            code={USAGE_CODE}
          />
          <CodeBlock
            label="Return Type"
            copyText={RETURN_TYPE_CODE}
            language="typescript"
            code={RETURN_TYPE_CODE}
          />
        </div>

      </div>
    </section>
  )
}