declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LLM_INTEL_PROVIDER?: ModelInfoProvider;
      LLM_INTEL_CACHE_DIR?: string;
      LLM_INTEL_CACHE_TTL?: string;
      LLM_INTEL_OPEN_ROUTER_API_KEY?: string;
    }
  }
}

export {};
