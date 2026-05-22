import { useState, useMemo } from "react";
import { type ModelData, LLMIntelClient } from "llmintel/client";
import type { Card, ScaleMultiplier } from "../../types/ui";
import { getProviders } from "../../lib/utils";
import EstimatorCard from "./estimator-card";
import CostSummary from "./cost-summary";

interface EstimatorProps {
	client: LLMIntelClient;
	models: ModelData[];
	providers: string[];
}

let nextId = 1;

function makeCard(): Card {
	return {
		id: nextId++,
		model: null,
		tokens: {},
	};
}

export default function Estimator({
	client,
	models,
	providers,
}: EstimatorProps) {
	const [cards, setCards] = useState<Card[]>(() => [makeCard()]);
	const [scale, setScale] = useState<ScaleMultiplier>(1);

	// ── Card handlers ──────────────────────────────────────────────────────────

	function addCard() {
		setCards((prev) => [...prev, makeCard()]);
	}

	function removeCard(id: number) {
		setCards((prev) => prev.filter((c) => c.id !== id));
	}

	function updateCard(id: number, patch: Partial<Omit<Card, "id">>) {
		setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="flex border border-border-2 rounded-app overflow-hidden shadow-shell h-[740px]">
			{/* Left — card list */}
			<div className="flex-1 bg-bg p-6 border-r border-border flex flex-col min-h-0">
				{/* Section label */}
				<div className="flex items-center gap-2 mb-4 shrink-0">
					<span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted">
						Model Selections
					</span>
					<div className="flex-1 h-px bg-border" />
				</div>

				{/* Cards — scrollable */}
				<div className="flex flex-col gap-3 overflow-y-scroll min-h-0 flex-1 scrollbar-thin scrollbar-thumb-border-2 scrollbar-track-transparent scrollbar-thumb-rounded-none">
					{cards.map((card, idx) => (
						<EstimatorCard
							key={card.id}
							card={card}
							index={idx}
							models={models}
							providers={providers ?? []}
							client={client}
							onRemove={() => removeCard(card.id)}
							onChange={(patch) => updateCard(card.id, patch)}
						/>
					))}
				</div>

				{/* Add button */}
				<button
					onClick={addCard}
					className="mt-3 shrink-0 w-full border border-dashed border-border-2 text-text-dim hover:border-accent-dim hover:text-accent hover:bg-accent-soft text-[11px] tracking-[0.1em] uppercase py-3 rounded-app transition-colors flex items-center justify-center gap-2"
				>
					<span className="text-[15px] leading-none text-accent-dim">+</span>
					Add Model Estimate
				</button>
			</div>

			{/* Right — summary */}
			<CostSummary
				cards={cards}
				client={client}
				scale={scale}
				onScaleChange={setScale}
			/>
		</div>
	);
}
