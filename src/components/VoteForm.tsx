import type { PollOption } from '../lib/types'

interface VoteFormProps {
  options: PollOption[]
  disabled?: boolean
  submittingOptionId?: string | null
  votedOptionId?: string | null
  onVote: (optionId: string) => void
}

export function VoteForm({
  options,
  disabled,
  submittingOptionId,
  votedOptionId,
  onVote,
}: VoteFormProps) {
  if (votedOptionId) return null

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSubmitting = submittingOptionId === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || Boolean(submittingOptionId)}
            onClick={() => onVote(option.id)}
            className={[
              'w-full rounded-md border border-line bg-surface px-3.5 py-3 text-left text-sm font-medium text-ink transition',
              'hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
              isSubmitting ? 'opacity-60' : '',
            ].join(' ')}
          >
            {isSubmitting ? '…' : option.label}
          </button>
        )
      })}
    </div>
  )
}
