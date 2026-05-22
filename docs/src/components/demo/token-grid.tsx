import { useMemo } from "react";
import type { TokenInput, ModelResult, ModelData } from "llm-intel";
import type { LLMIntelClient } from "llm-intel/client";
import TokenField from "./token-field";

interface TokenGridProps {
  model: ModelData;
  tokens: TokenInput;
  client: LLMIntelClient;
  onChange: (tokens: TokenInput) => void;
}

export default function TokenGrid({
  model,
  tokens,
  client,
  onChange,
}: TokenGridProps) {
  const pricing = model.pricing;

  const modelResult: ModelResult = {
    data: model,
    status: "cached",
    source: "openrouter",
    fetchedAt: new Date(),
  };

  const fieldCosts = useMemo(() => {
    const fields = [
      "inputTokens",
      "outputTokens",
      "cacheReadTokens",
      "cacheWriteTokens",
    ] as const;
    return Object.fromEntries(
      fields.map((field) => {
        if (!tokens[field]) return [field, null];
        const result = client.calculateCost(modelResult, {
          [field]: tokens[field],
        });
        return [field, client.formatCostResult(result).totalCost];
      }),
    );
  }, [tokens, model]);

  function update(field: keyof TokenInput, value: number | undefined) {
    onChange({ ...tokens, [field]: value });
  }

  return (
    <div className="col-span-4 grid grid-cols-subgrid mt-3 pt-3 border-t border-border">
      <TokenField
        label="Input"
        value={tokens.inputTokens}
        supported={true}
        cost={fieldCosts.inputTokens}
        onChange={(v) => update("inputTokens", v)}
      />
      <TokenField
        label="Output"
        value={tokens.outputTokens}
        supported={true}
        cost={fieldCosts.outputTokens}
        onChange={(v) => update("outputTokens", v)}
      />
      <TokenField
        label="Cache Read"
        value={tokens.cacheReadTokens}
        supported={pricing.cacheRead !== null}
        cost={fieldCosts.cacheReadTokens}
        onChange={(v) => update("cacheReadTokens", v)}
      />
      <TokenField
        label="Cache Write"
        value={tokens.cacheWriteTokens}
        supported={pricing.cacheWrite !== null}
        cost={fieldCosts.cacheWriteTokens}
        onChange={(v) => update("cacheWriteTokens", v)}
      />
    </div>
  );
}
