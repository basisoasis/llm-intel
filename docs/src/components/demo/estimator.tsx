import { useState } from 'react'
import type { ModelData } from 'llmintel'
import type { Card, ScaleMultiplier } from '../../types/ui';
import { getProviders } from '../../lib/utils'
import EstimatorCard from './estimator-card'
import CostSummary from './cost-summary'

interface EstimatorProps {
  models: ModelData[]
}

let nextId = 1

function makeCard(): Card {
  return {
    id:     nextId++,
    model:  null,
    tokens: {},
  }
}

export default function Estimator({ models }: EstimatorProps) {
  const [cards, setCards]   = useState<Card[]>(() => [makeCard()])
  const [scale, setScale]   = useState<ScaleMultiplier>(1)

  const providers = getProviders(models)

  // ── Card handlers ──────────────────────────────────────────────────────────

  function addCard() {
    setCards(prev => [...prev, makeCard()])
  }

  function removeCard(id: number) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  function updateCard(id: number, patch: Partial<Omit<Card, 'id'>>) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex border border-border-2 rounded-app overflow-hidden shadow-shell">

      {/* Left — card list */}
      <div className="flex-1 bg-bg p-6 border-r border-border">

        {/* Section label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted">
            Model Selections
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {cards.map((card, idx) => (
            <EstimatorCard
              key={card.id}
              card={card}
              index={idx}
              models={models}
              providers={providers}
              onRemove={() => removeCard(card.id)}
              onChange={patch => updateCard(card.id, patch)}
            />
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={addCard}
          className="mt-3 w-full border border-dashed border-border-2 text-text-dim hover:border-accent-dim hover:text-accent hover:bg-accent-soft text-[11px] tracking-[0.1em] uppercase py-3 rounded-app transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-[15px] leading-none text-accent-dim">+</span>
          Add Model Estimate
        </button>

      </div>

      {/* Right — summary */}
      <CostSummary
        cards={cards}
        models={models}
        scale={scale}
        onScaleChange={setScale}
      />

    </div>
  )
}