import Nav from "./nav";
import Hero from "./hero";
import InstallSection from "./install-section";
import DemoSection from "./demo-section";
import Footer from "./footer";
import { useQuery } from "@tanstack/react-query";
import type { ModelData } from "llmintel";
import { useMemo } from "react";
import { LLMIntelClient } from "llmintel/client";
import { getProviders } from "../lib/utils";

async function fetchModels(): Promise<ModelData[]> {
  const res = await fetch(`${import.meta.env.VITE_MODEL_URL}`);
  if (!res.ok) throw new Error("Failed to load model");
  const providers = await res.json();
  return providers.data;
}

export default function App() {
  const {
    data: models,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });

  const client = useMemo(
    () => (models ? new LLMIntelClient({ models }) : null),
    [models],
  );

  const { data: resolved } = useQuery({
    queryKey: ["resolvedModels"],
    queryFn: async () => {
      const m = await client!.getModels();
      const p = getProviders(m);
      return { models: m, providers: p } as const;
    },
    enabled: !!client,
  });

  return (
    <div className="min-h-screen bg-bg font-mono">
      <Nav />
      <main>
        <Hero
          modelsCount={resolved?.models?.length ?? 0}
          providersCount={resolved?.providers?.length ?? 0}
        />
        <InstallSection />
        <DemoSection
          client={client}
          models={resolved?.models}
          providers={resolved?.providers}
          isLoading={isLoading}
          isError={isError}
        />
      </main>
      <Footer />
    </div>
  );
}
