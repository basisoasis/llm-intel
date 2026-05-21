import type { ModelData, TokenInput } from 'llmintel'
import type { Card } from '../../types/ui'
import ModelSelector from './ModelSelector'
import TokenGrid from './TokenGrid'

interface EstimatorCardProps {
  card:      Card
  index:     number
  models:    ModelData[]
  providers: string[]
  onRemove:  () => void
  onChange:  (patch: Partial<Omit<Card, 'id'>>) => void
}

export default function EstimatorCard({
  card,
  index,
  models,
  providers,
  onRemove,
  onChange,
}: EstimatorCardProps) {
  return (
    <div className="relative bg-surface border border-border rounded-app p-4 hover:border-border-2 transition-colors shadow-card">

      {/* Card index */}
      <span className="absolute top-3 left-3.5 text-[9px] text-muted tracking-[0.1em]">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full text-muted hover:text-danger hover:border hover:border-danger transition-colors text-[11px]"
      >
        ✕
      </button>

      {/* Model selector */}
      <div className="pt-1">
        <ModelSelector
          models={models}
          providers={providers}
          selected={card.model}
          onSelect={model => onChange({ model, tokens: {} })}
        />
      </div>

      {/* Token grid — only shown once a model is selected */}
      {card.model && (
        <TokenGrid
          model={card.model}
          tokens={card.tokens}
          onChange={tokens => onChange({ tokens })}
        />
      )}

    </div>
  )
}