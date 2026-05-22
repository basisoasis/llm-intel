import type { LLMIntelClient, ModelResult } from "llmintel/client";
import NumberFlow from "@number-flow/react";
import type { Card, ScaleMultiplier } from "../../types/ui";
import { fmtTokens } from "../../lib/costs";
import LineItem from "./line-item";
import ScaleChips from "./scale-chips";

interface CostSummaryProps {
  cards: Card[];
  client: LLMIntelClient;
  scale: ScaleMultiplier;
  onScaleChange: (scale: ScaleMultiplier) => void;
}

export default function CostSummary({
  cards,
  client,
  scale,
  onScaleChange,
}: CostSummaryProps) {
  // Only cards with a model and at least one token value
  const active = cards.filter(
    (c) =>
      c.model && Object.values(c.tokens).some((v) => v !== undefined && v > 0),
  );

  // Compute formatted results for each active card
  const results = active.map((card) => {
    const modelResult: ModelResult = {
      data: card.model!,
      status: "cached",
      source: "openrouter",
      fetchedAt: new Date(),
    };
    const cost = client.calculateCost(modelResult, card.tokens);
    const formatted = client.formatCostResult(cost);
    const totalTokens =
      (card.tokens.inputTokens ?? 0) +
      (card.tokens.outputTokens ?? 0) +
      (card.tokens.cacheReadTokens ?? 0) +
      (card.tokens.cacheWriteTokens ?? 0);

    return { card, formatted, totalTokens, totalRaw: cost.totalCost };
  });

  // Grand total across all active cards, scaled
  const grandTotal = results.reduce(
    (sum, r) => sum + r.totalRaw.toNumber() * scale,
    0,
  );

  const totalTokens = results.reduce((sum, r) => sum + r.totalTokens, 0);

  return (
    <div className="w-[320px] shrink-0 flex flex-col bg-surface p-6 min-h-0">
      {/* Header — pinned */}
      <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted mb-5 shrink-0">
        // Cost Summary
      </div>

      {/* Line items — scrollable */}
      <div className="flex-1 overflow-y-scroll min-h-0 flex flex-col scrollbar-thin scrollbar-thumb-border-2 scrollbar-track-transparent scrollbar-thumb-rounded-none">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <span className="text-[20px] opacity-30">◻</span>
            <span className="text-[11px] text-muted tracking-wide">
              No estimates yet.
              <br />
              Add a model above.
            </span>
          </div>
        ) : (
          results.map(({ card, formatted, totalTokens }) => (
            <LineItem
              key={card.id}
              name={card.model!.name}
              provider={card.model!.canonicalSlug.split("/")[0]}
              totalTokens={totalTokens.toString()}
              cost={formatted.totalCost}
              scale={scale}
            />
          ))
        )}
      </div>

      {/* Totals */}
      <div className="mt-5 pt-4 border-t border-border-2 flex flex-col gap-1">
        <div className="flex justify-between items-center py-1">
          <span className="text-[10px] tracking-[0.1em] uppercase text-text-dim">
            Entries
          </span>
          <span className="text-[12px] text-text font-medium">
            {active.length || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-[10px] tracking-[0.1em] uppercase text-text-dim">
            Total Tokens
          </span>
          <span className="text-[12px] text-text font-medium">
            {fmtTokens(totalTokens)}
          </span>
        </div>

        {/* Grand total */}
        <div className="flex justify-between items-center mt-3 p-3 bg-surface-2 border border-border-2 rounded-app">
          <span className="text-[10px] tracking-[0.14em] uppercase text-accent-dim font-medium">
            Total Cost
          </span>
          <span className="text-[20px] font-semibold text-accent tracking-tight">
            <NumberFlow
              value={grandTotal}
              format={{
                style: "currency",
                currency: "USD",
                trailingZeroDisplay: "stripIfInteger",
              }}
            />
          </span>
        </div>

        {/* Scale chips */}
        <ScaleChips value={scale} onChange={onScaleChange} />
      </div>
    </div>
  );
}
