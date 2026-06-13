import { useState } from 'react'
import { Link } from 'react-router'
import {
  useAdminComments,
  useAdminPolls,
  useDeleteComment,
  useSetPollStatus,
} from '../../hooks/useAdmin'
import type { AdminPollRow } from '../../lib/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

function PollCommentsModeration({ pollId }: { pollId: string }) {
  const { data: comments = [] } = useAdminComments(pollId)
  const deleteComment = useDeleteComment()

  if (comments.length === 0) return null

  return (
    <div className="mt-4 space-y-2 border-t border-line pt-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start justify-between gap-3 text-sm">
          <div>
            <p className="font-medium text-ink">{comment.author_name}</p>
            <p className="text-ink-secondary">{comment.body}</p>
          </div>
          <button
            type="button"
            disabled={deleteComment.isPending}
            onClick={() => deleteComment.mutate(comment.id)}
            className="text-xs text-danger"
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
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-muted">
            {poll.status} · /polls/{poll.slug} · {poll.vote_count} votes
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{poll.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(poll.status === 'draft' || poll.status === 'closed') && (
            <Button
              variant="secondary"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ pollId: poll.id, status: 'active' })}
              className="!px-3 !py-1.5 !text-xs"
            >
              Publish
            </Button>
          )}
          {poll.status === 'active' && (
            <>
              <Button
                variant="secondary"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ pollId: poll.id, status: 'closed' })}
                className="!px-3 !py-1.5 !text-xs"
              >
                Close
              </Button>
              <Button
                variant="ghost"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ pollId: poll.id, status: 'draft' })}
                className="!px-3 !py-1.5 !text-xs"
              >
                Unpublish
              </Button>
            </>
          )}
          <Link to={`/polls/${poll.slug}`} className="inline-flex items-center px-3 py-1.5 text-xs text-accent">
            View
          </Link>
          {poll.comment_count > 0 && (
            <Button variant="ghost" onClick={() => setExpanded((v) => !v)} className="!px-3 !py-1.5 !text-xs">
              {expanded ? 'Hide' : 'Comments'}
            </Button>
          )}
        </div>
      </div>
      {expanded && <PollCommentsModeration pollId={poll.id} />}
    </Card>
  )
}

export function PollManageList() {
  const { data: polls = [], isLoading, error } = useAdminPolls()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="poll-block h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-danger">Could not load polls.</p>
  }

  if (polls.length === 0) {
    return <p className="text-sm text-ink-muted">No polls yet.</p>
  }

  return (
    <div className="space-y-3">
      {polls.map((poll) => (
        <PollRow key={poll.id} poll={poll} />
      ))}
    </div>
  )
}
