import { useState } from 'react'
import { Link } from 'react-router'
import {
  useAdminComments,
  useAdminPolls,
  useDeleteComment,
  useSetPollStatus,
} from '../../hooks/useAdmin'
import type { AdminPollRow, PollStatus } from '../../lib/types'

const STATUS_STYLES: Record<PollStatus, string> = {
  draft: 'bg-slate-700/50 text-slate-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  closed: 'bg-amber-500/10 text-amber-400',
}

function PollCommentsModeration({ pollId }: { pollId: string }) {
  const { data: comments = [] } = useAdminComments(pollId)
  const deleteComment = useDeleteComment()

  if (comments.length === 0) return null

  return (
    <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Comments</p>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex items-start justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2"
        >
          <div>
            <p className="text-xs font-medium text-indigo-300">{comment.author_name}</p>
            <p className="text-sm text-slate-400">{comment.body}</p>
          </div>
          <button
            type="button"
            disabled={deleteComment.isPending}
            onClick={() => deleteComment.mutate(comment.id)}
            className="shrink-0 text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

function PollRow({ poll }: { poll: AdminPollRow }) {
  const setStatus = useSetPollStatus()
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[poll.status]}`}>
              {poll.status}
            </span>
            {poll.category_name && (
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-300">
                {poll.category_name}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white">{poll.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            /polls/{poll.slug} · {poll.vote_count} votes · {poll.comment_count} comments
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(poll.status === 'draft' || poll.status === 'closed') && (
            <button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ pollId: poll.id, status: 'active' })}
              className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25"
            >
              Publish
            </button>
          )}
          {poll.status === 'active' && (
            <button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ pollId: poll.id, status: 'closed' })}
              className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/25"
            >
              Close
            </button>
          )}
          {poll.status === 'active' && (
            <button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ pollId: poll.id, status: 'draft' })}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Unpublish
            </button>
          )}
          <Link
            to={`/polls/${poll.slug}`}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300"
          >
            View
          </Link>
          {poll.comment_count > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              {expanded ? 'Hide comments' : 'Moderate'}
            </button>
          )}
        </div>
      </div>

      {expanded && <PollCommentsModeration pollId={poll.id} />}
      {setStatus.isError && (
        <p className="mt-2 text-xs text-red-400">Status update failed.</p>
      )}
    </article>
  )
}

export function PollManageList() {
  const { data: polls = [], isLoading, error } = useAdminPolls()

  if (isLoading) return <p className="text-slate-500">Loading polls…</p>
  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Could not load polls. Make sure you ran the admin migration and synced the admin secret in Supabase.
      </p>
    )
  }

  if (polls.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-slate-500">
        No polls yet. Create one above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {polls.map((poll) => (
        <PollRow key={poll.id} poll={poll} />
      ))}
    </div>
  )
}
