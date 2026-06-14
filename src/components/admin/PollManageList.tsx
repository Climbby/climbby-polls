import { useState } from 'react'
import {
  useAdminComments,
  useAdminDeletePoll,
  useAdminPolls,
  useDeleteComment,
  useSetPollStatus,
} from '../../hooks/useAdmin'
import {
  useCreatorComments,
  useCreatorDeleteComment,
  useCreatorDeletePoll,
  useCreatorPolls,
  useCreatorSetPollStatus,
} from '../../hooks/useCreatorManage'
import type { AdminPollRow, PollComment } from '../../lib/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CommentIcon, IconButton, TrashIcon } from '../ui/IconButton'

function CommentList({
  comments,
  isLoading,
  isError,
  onDelete,
  isDeleting,
}: {
  comments: PollComment[] | undefined
  isLoading: boolean
  isError: boolean
  onDelete: (commentId: string) => void
  isDeleting: boolean
}) {
  if (isLoading) {
    return (
      <div className="mt-4 border-t border-line pt-4">
        <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="mt-4 border-t border-line pt-4 text-sm text-danger">Could not load comments.</p>
    )
  }

  if (!comments?.length) {
    return <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">No comments yet.</p>
  }

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
            disabled={isDeleting}
            onClick={() => onDelete(comment.id)}
            className="text-xs text-danger"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

function CreatorPollComments({ pollId }: { pollId: string }) {
  const { data: comments, isLoading, isError } = useCreatorComments(pollId)
  const deleteComment = useCreatorDeleteComment()

  return (
    <CommentList
      comments={comments}
      isLoading={isLoading}
      isError={isError}
      onDelete={(id) => deleteComment.mutate(id)}
      isDeleting={deleteComment.isPending}
    />
  )
}

function AdminPollComments({ pollId }: { pollId: string }) {
  const { data: comments, isLoading, isError } = useAdminComments(pollId)
  const deleteComment = useDeleteComment()

  return (
    <CommentList
      comments={comments}
      isLoading={isLoading}
      isError={isError}
      onDelete={(id) => deleteComment.mutate(id)}
      isDeleting={deleteComment.isPending}
    />
  )
}

function PollCommentsModeration({
  pollId,
  variant,
}: {
  pollId: string
  variant: 'admin' | 'creator'
}) {
  if (variant === 'creator') {
    return <CreatorPollComments pollId={pollId} />
  }
  return <AdminPollComments pollId={pollId} />
}

function PollRow({
  poll,
  variant,
  tenantSlug,
  commentsOpen,
  onToggleComments,
}: {
  poll: AdminPollRow
  variant: 'admin' | 'creator'
  tenantSlug: string
  commentsOpen: boolean
  onToggleComments: () => void
}) {
  const adminSetStatus = useSetPollStatus()
  const creatorSetStatus = useCreatorSetPollStatus()
  const adminDeletePoll = useAdminDeletePoll()
  const creatorDeletePoll = useCreatorDeletePoll()
  const setStatus = variant === 'creator' ? creatorSetStatus : adminSetStatus
  const deletePoll = variant === 'creator' ? creatorDeletePoll : adminDeletePoll

  function handleDelete() {
    if (!window.confirm(`Delete "${poll.title}"? This cannot be undone.`)) return
    deletePoll.mutate(poll.id)
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-muted">
            {poll.status}
            {variant === 'admin' ? ` · /${tenantSlug}/polls/${poll.slug}` : ''} · {poll.vote_count}{' '}
            votes
            {poll.comment_count > 0 ? ` · ${poll.comment_count} comments` : ''}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{poll.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {poll.allow_comments && (
              <IconButton
                label={poll.comment_count > 0 ? `Comments (${poll.comment_count})` : 'Comments'}
                onClick={onToggleComments}
                className={commentsOpen ? 'bg-surface-muted text-ink' : ''}
              >
                <CommentIcon />
              </IconButton>
            )}
            <IconButton
              label="Delete poll"
              onClick={handleDelete}
              disabled={deletePoll.isPending}
              className="text-ink-muted hover:text-danger"
            >
              <TrashIcon />
            </IconButton>
          </div>
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
            <Button
              variant="secondary"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ pollId: poll.id, status: 'closed' })}
              className="!px-3 !py-1.5 !text-xs"
            >
              Close votes
            </Button>
          )}
        </div>
      </div>
      {commentsOpen && <PollCommentsModeration pollId={poll.id} variant={variant} />}
    </Card>
  )
}

export function PollManageList({
  variant = 'admin',
  tenantSlug = 'climbby',
}: {
  variant?: 'admin' | 'creator'
  tenantSlug?: string
}) {
  const adminPolls = useAdminPolls()
  const creatorPolls = useCreatorPolls()
  const { data: polls = [], isLoading, error } = variant === 'creator' ? creatorPolls : adminPolls
  const [openCommentsPollId, setOpenCommentsPollId] = useState<string | null>(null)

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
        <PollRow
          key={poll.id}
          poll={poll}
          variant={variant}
          tenantSlug={tenantSlug}
          commentsOpen={openCommentsPollId === poll.id}
          onToggleComments={() =>
            setOpenCommentsPollId((current) => (current === poll.id ? null : poll.id))
          }
        />
      ))}
    </div>
  )
}
