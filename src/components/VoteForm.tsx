import { useState } from 'react'
import type { PollOption } from '../lib/types'

interface VoteFormProps {
  options: PollOption[]
  disabled?: boolean
  isSubmitting?: boolean
  onVote: (optionId: string) => void
}

export function VoteForm({ options, disabled, isSubmitting, onVote }: VoteFormProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || isSubmitting}
            onClick={() => setSelected(option.id)}
            className={[
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
              isSelected
                ? 'border-indigo-400 bg-indigo-500/10 text-white'
                : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-600',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <span
              className={[
                'h-4 w-4 shrink-0 rounded-full border-2',
                isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600',
              ].join(' ')}
            />
            <span className="font-medium">{option.label}</span>
          </button>
        )
      })}

      <button
        type="button"
        disabled={!selected || disabled || isSubmitting}
        onClick={() => selected && onVote(selected)}
        className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : disabled ? 'Poll closed' : 'Cast vote'}
      </button>
    </div>
  )
}
