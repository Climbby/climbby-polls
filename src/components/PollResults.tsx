import type { PollResultRow } from '../lib/types'

interface PollResultsProps {
  results: PollResultRow[]
  totalVotes: number
  highlightOptionId?: string
}

export function PollResults({ results, totalVotes, highlightOptionId }: PollResultsProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-2.5">
      {results.map((row) => {
        const pct = totalVotes > 0 ? Math.round((row.vote_count / totalVotes) * 100) : 0
        const barColor = row.color ?? 'var(--accent)'
        const isHighlighted = highlightOptionId === row.option_id

        return (
          <div key={row.option_id} className={isHighlighted ? 'rounded-md bg-accent-soft p-2' : ''}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="text-ink">{row.label}</span>
              <span className="tabular-nums text-ink-muted">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
