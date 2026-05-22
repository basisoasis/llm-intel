import { useState, useEffect } from "react";
import type { ModelData } from "llmintel/client";
import { getProvider, filterByProvider } from "../../lib/utils";

interface ModelSelectorProps {
  models: ModelData[];
  providers: string[];
  selected: ModelData | null;
  onSelect: (model: ModelData) => void;
}

export default function ModelSelector({
  models,
  providers,
  selected,
  onSelect,
}: ModelSelectorProps) {
  const [provider, setProvider] = useState<string>(
    selected ? getProvider(selected) : (providers[0] ?? ""),
  );

  // Keep provider in sync if selected changes externally
  useEffect(() => {
    if (selected) setProvider(getProvider(selected));
  }, [selected]);

  const filteredModels = filterByProvider(models, provider);

  function handleProviderChange(p: string) {
    setProvider(p);
    // Reset selection — previous model may not exist under new provider
    const first = filterByProvider(models, p)[0];
    if (first) onSelect(first);
  }

  function handleModelChange(id: string) {
    const model = models.find((m) => m.id === id);
    if (model) onSelect(model);
  }

  return (
    // col-span-4 + subgrid: inherit the parent's 4 equal columns
    <div className="col-span-4 grid grid-cols-subgrid gap-x-2 items-end">
      {/* Provider — 1 col */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-[0.1em] uppercase text-text-dim font-medium">
          Provider
        </label>
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="bg-surface-2 border border-border-2 text-text-bright font-mono text-[12px] px-2.5 py-[7px] pr-7 rounded-app w-full focus:border-accent-dim focus:shadow-focus outline-none transition-colors appearance-none"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Model — 2 cols */}
      <div className="col-span-2 flex flex-col gap-1.5">
        <label className="text-[10px] tracking-[0.1em] uppercase text-text-dim font-medium">
          Model <span className="text-accent">*</span>
        </label>
        <select
          value={selected?.id ?? ""}
          onChange={(e) => handleModelChange(e.target.value)}
          className="bg-surface-2 border border-border-2 text-text-bright font-mono text-[12px] px-2.5 py-[7px] pr-7 rounded-app w-full focus:border-accent-dim focus:shadow-focus outline-none transition-colors appearance-none"
        >
          {!selected && (
            <option value="" disabled>
              Select a model
            </option>
          )}
          {filteredModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Context Window — 1 col */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-[0.1em] uppercase text-text-dim font-medium">
          Context Window
        </label>
        <div className="flex items-center gap-2 bg-surface-3 border border-border px-2.5 py-[7px] rounded-app">
          <span className="text-[12px] text-text-bright font-medium">
            {selected ? selected.contextLength.toLocaleString() : "—"}
          </span>
          <span className="text-[9px] text-muted">tokens</span>
        </div>
      </div>
    </div>
  );
}
