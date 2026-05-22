import { LLMIntelClient } from "llmintel/client";
import type { ModelData } from "llmintel/client";
import type { Card } from "../../types/ui";
import ModelSelector from "./model-selector";
import TokenGrid from "./token-grid";

interface EstimatorCardProps {
  card: Card;
  index: number;
  models: ModelData[];
  providers: string[];
  client: LLMIntelClient;
  onRemove: () => void;
  onChange: (patch: Partial<Omit<Card, "id">>) => void;
}

export default function EstimatorCard({
  card,
  index,
  models,
  providers,
  client,
  onRemove,
  onChange,
}: EstimatorCardProps) {
  return (
    <div className="relative bg-surface border border-border rounded-app p-4 hover:border-border-2 transition-colors shadow-card">
      {/* Card index */}
      <span className="absolute top-3 left-3.5 text-[9px] text-muted tracking-[0.1em]">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full text-muted hover:text-danger hover:border hover:border-danger transition-colors text-[11px]"
      >
        ✕
      </button>

      {/* Shared 4-col grid so ModelSelector and TokenGrid columns align */}
      <div className="grid grid-cols-4 gap-2 pt-4">
        <ModelSelector
          models={models}
          providers={providers}
          selected={card.model}
          onSelect={(model) => onChange({ model, tokens: {} })}
        />

        {card.model && (
          <TokenGrid
            model={card.model}
            tokens={card.tokens}
            client={client}
            onChange={(tokens) => onChange({ tokens })}
          />
        )}
      </div>
    </div>
  );
}
