import type { ScaleMultiplier } from "../../types/ui";

const SCALES: { label: string; value: ScaleMultiplier }[] = [
  { label: "×1", value: 1 },
  { label: "×100", value: 100 },
  { label: "×1K", value: 1_000 },
  { label: "×10K", value: 10_000 },
];

interface ScaleChipsProps {
  value: ScaleMultiplier;
  onChange: (scale: ScaleMultiplier) => void;
}

export default function ScaleChips({ value, onChange }: ScaleChipsProps) {
  return (
    <div className="mt-3 p-2.5 bg-bg border border-border rounded-app">
      <div className="text-[9px] tracking-[0.1em] uppercase text-muted mb-2">
        Scale Projection
      </div>
      <div className="flex gap-1.5">
        {SCALES.map(({ label, value: v }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`
              flex-1 text-[10px] tracking-[0.06em] py-1 rounded-sm border transition-colors
              ${
                value === v
                  ? "border-accent-dim text-accent bg-accent-soft"
                  : "border-border-2 text-text-dim hover:border-accent-dim hover:text-accent"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
