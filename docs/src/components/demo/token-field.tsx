import { NumericFormat } from "react-number-format";

interface TokenFieldProps {
  label: string;
  value: number | undefined;
  supported: boolean;
  cost: string | null;
  onChange: (value: number | undefined) => void;
}

export default function TokenField({
  label,
  value,
  supported,
  cost,
  onChange,
}: TokenFieldProps) {
  return (
    <div
      className={`flex flex-col gap-1.5 ${!supported ? "opacity-40 pointer-events-none" : ""}`}
    >
      <label className="text-[10px] tracking-[0.1em] uppercase text-text-dim font-medium">
        {label}
      </label>

      <NumericFormat
        value={value ?? ""}
        onValueChange={({ floatValue }) => onChange(floatValue)}
        thousandSeparator
        allowNegative={false}
        decimalScale={0}
        placeholder="tokens"
        disabled={!supported}
        className="bg-surface-2 border border-border-2 text-text-bright font-mono text-[12px] px-2.5 py-[7px] rounded-app w-full focus:border-accent-dim focus:shadow-focus outline-none transition-colors appearance-none"
      />

      <div className="flex items-baseline justify-between bg-bg border border-border rounded-app px-2.5 py-1.5 min-h-[28px]">
        <span className="text-[8px] tracking-[0.1em] uppercase text-muted">
          cost
        </span>
        <span
          className={`text-[11px] font-semibold ${cost ? "text-accent" : "text-border-2"}`}
        >
          {cost ?? "—"}
        </span>
      </div>
    </div>
  );
}
