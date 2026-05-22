import { fmtTokens } from "../../lib/costs";

interface LineItemProps {
  name: string;
  provider: string;
  totalTokens: string;
  cost: string;
  scale: number;
}

export default function LineItem({
  name,
  provider,
  totalTokens,
  cost,
  scale,
}: LineItemProps) {
  return (
    <div className="py-2.5 border-b border-border flex flex-col gap-1 animate-slide-in">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-text font-medium truncate max-w-[170px]">
          {name}
        </span>
        <span className="text-[12px] text-accent font-semibold shrink-0">
          {scale > 1 ? `${cost} ×${scale.toLocaleString()}` : cost}
        </span>
      </div>
      <span className="text-[10px] text-muted">
        {fmtTokens(parseInt(totalTokens, 10))} tokens · {provider}
      </span>
    </div>
  );
}
