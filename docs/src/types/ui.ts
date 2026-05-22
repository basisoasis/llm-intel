import type { ModelData, TokenInput } from "llm-intel";

// ── Estimator card ────────────────────────────────────────────────────────────
// Represents one row in the estimator. model is null until ReactQuery resolves.

export interface Card {
  id: number;
  model: ModelData | null;
  tokens: TokenInput;
}

// ── Scale multiplier ──────────────────────────────────────────────────────────
// Used in CostSummary to project costs at volume.

export type ScaleMultiplier = 1 | 100 | 1_000 | 10_000;
