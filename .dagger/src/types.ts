import type { ModelData, ModelPricing, PricingValue } from "../../src/types/models"
export type { ModelData, ModelPricing, PricingValue };

// Pipeline-internal types
export interface MetaFile {
  dataUpdatedAt: string
  fetchedAt: string
  source: string
  etag?: string
}

export interface ModelDiff {
  added: ModelData[]
  removed: ModelData[]
  updated: Array<{
    id: string
    changes: Record<string, { before: unknown; after: unknown }>
  }>
}