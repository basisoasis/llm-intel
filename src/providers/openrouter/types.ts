// Raw model pricing as returned by OpenRouter
// All values are USD per token (not per million)
// More info: https://openrouter.ai/docs/guides/overview/models#pricing-object
export interface OpenRouterPricing {
  prompt: string;       // input tokens
  completion: string;   // output tokens
  image?: string;
  request?: string;
  input_cache_read?: string;
  input_cache_write?: string;
}

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  name: string;
  description?: string;
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number | null;
    is_moderated?: boolean;
  };
  pricing: OpenRouterPricing;
  architecture?: {
    tokenizer?: string;
    instruct_type?: string;
    modality?: string;
  };
  supported_parameters?: string[];
}