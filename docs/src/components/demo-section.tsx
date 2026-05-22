import type { LLMIntelClient, ModelData } from "llmintel/client";
import Estimator from "./demo/estimator";

interface DemoSectionProps {
  client: LLMIntelClient;
  models?: ModelData[];
  providers: string[];
  isLoading: boolean;
  isError: boolean;
}

export default function DemoSection({
  client,
  models,
  providers,
  isLoading,
  isError,
}: DemoSectionProps) {
  return (
    <section id="demo" className="max-w-[1200px] mx-auto px-12 py-14">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[10px] tracking-[0.16em] uppercase text-accent-dim mb-2">
          Live Demo
        </div>
        <div className="font-sans text-[20px] font-semibold text-text-bright tracking-tight">
          Try the cost estimator
        </div>
        <div className="font-sans text-[13px] text-text-dim mt-1.5">
          Select a provider and model, enter your token counts, and see the full
          breakdown live.
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center h-48 border border-border rounded-app bg-surface">
          <span className="text-[11px] text-muted tracking-wider uppercase animate-pulse">
            Loading models…
          </span>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center h-48 border border-danger/30 rounded-app bg-surface">
          <span className="text-[11px] text-danger tracking-wider uppercase">
            Failed to load models
          </span>
        </div>
      )}

      {models && (
        <Estimator client={client} models={models} providers={providers} />
      )}
    </section>
  );
}
