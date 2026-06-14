import type { PollOption, PollResultRow } from '../lib/types'

interface PollOptionsProps {
  options: PollOption[]
  results: PollResultRow[]
  totalVotes: number
  showResults: boolean
  allowVoteChange?: boolean
  disabled?: boolean
  submittingOptionId?: string | null
  highlightOptionId?: string
  onVote?: (optionId: string) => void
}

const optionShellClass =
  'relative overflow-hidden rounded-md border border-line md:rounded-lg'

const optionInnerClass =
  'relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm md:px-5 md:py-3 md:text-base'

const voteButtonClass =
  'transition-interactive w-full cursor-pointer rounded-md border border-line bg-surface px-4 py-2.5 text-left text-sm font-medium text-ink md:rounded-lg md:px-5 md:py-3 md:text-base hover:border-[color-mix(in_srgb,var(--ink)_12%,var(--line))] hover:bg-surface-muted active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50'

export function PollOptions({
  options,
  results,
  totalVotes,
  showResults,
  allowVoteChange = false,
  disabled,
  submittingOptionId,
  highlightOptionId,
  onVote,
}: PollOptionsProps) {
  const resultByOption = new Map(results.map((row) => [row.option_id, row]))

  return (
    <div className="space-y-2 md:space-y-2.5">
      {options.map((option) => {
        const row = resultByOption.get(option.id)
        const pct =
          showResults && totalVotes > 0
            ? Math.round(((row?.vote_count ?? 0) / totalVotes) * 100)
            : 0
        const isHighlighted = highlightOptionId === option.id
        const isSubmitting = submittingOptionId === option.id
        const canChangeThisOption =
          allowVoteChange && onVote && !disabled && !isSubmitting && !isHighlighted

        if (showResults) {
          const shellClass = [
            optionShellClass,
            isHighlighted ? 'border-[color-mix(in_srgb,var(--poll-fill)_35%,var(--line))]' : '',
            canChangeThisOption
              ? 'cursor-pointer hover:border-[color-mix(in_srgb,var(--ink)_12%,var(--line))]'
              : '',
            isSubmitting ? 'opacity-60' : '',
          ].join(' ')

          const bar = (
            <>
              <div
                className="poll-option-fill absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isHighlighted
                    ? 'color-mix(in srgb, var(--poll-fill-strong) 38%, var(--surface-muted))'
                    : 'color-mix(in srgb, var(--poll-fill) 22%, var(--surface-muted))',
                }}
              />
              <div className={optionInnerClass}>
                <span className="font-medium text-ink">{option.label}</span>
                <span className="shrink-0 tabular-nums font-medium text-ink">
                  {isSubmitting ? '…' : `${pct}%`}
                </span>
              </div>
            </>
          )

          if (canChangeThisOption) {
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onVote(option.id)}
                className={[shellClass, 'relative w-full text-left'].join(' ')}
              >
                {bar}
              </button>
            )
          }

          return (
            <div key={option.id} className={shellClass}>
              {bar}
            </div>
          )
        }

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || Boolean(submittingOptionId)}
            onClick={() => onVote?.(option.id)}
            className={[voteButtonClass, isSubmitting ? 'opacity-60' : ''].join(' ')}
          >
            {isSubmitting ? '…' : option.label}
          </button>
        )
      })}
    </div>
  )
}
