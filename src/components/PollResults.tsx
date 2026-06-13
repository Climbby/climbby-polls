import type { PollResultRow } from '../lib/types'

interface PollResultsProps {
  results: PollResultRow[]
  totalVotes: number
  highlightOptionId?: string
}

export function PollResults({ results, totalVotes, highlightOptionId }: PollResultsProps) {
  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        No votes yet — be the first!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {results.map((row) => {
        const pct = totalVotes > 0 ? Math.round((row.vote_count / totalVotes) * 100) : 0
        const barColor = row.color ?? '#6366f1'
        const isHighlighted = highlightOptionId === row.option_id

        return (
          <div
            key={row.option_id}
            className={[
              'rounded-xl border px-4 py-3 transition',
              isHighlighted ? 'border-indigo-400/50 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/40',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-200">{row.label}</span>
              <span className="tabular-nums text-slate-400">
                {row.vote_count} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        )
      })}

      <p className="text-right text-xs text-slate-500">{totalVotes} total votes</p>
    </div>
  )
}
