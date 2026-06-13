import { Link } from 'react-router'
import type { Poll } from '../lib/types'

interface PollCardProps {
  poll: Poll
}

export function PollCard({ poll }: PollCardProps) {
  const category = poll.poll_categories

  return (
    <Link
      to={`/polls/${poll.slug}`}
      className="group block rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-indigo-500/40 hover:bg-slate-900"
    >
      <div className="mb-3 flex items-center gap-2">
        {category && (
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
            {category.name}
          </span>
        )}
        <span
          className={[
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            poll.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-700/50 text-slate-400',
          ].join(' ')}
        >
          {poll.status === 'active' ? 'Live' : 'Closed'}
        </span>
      </div>

      <h2 className="text-lg font-semibold text-white group-hover:text-indigo-200">
        {poll.title}
      </h2>
      {poll.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{poll.description}</p>
      )}
    </Link>
  )
}
