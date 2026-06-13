import { useState } from 'react'
import { useAddComment, useCastVote, usePollComments } from '../hooks/usePoll'
import { formatPollTimeframe } from '../lib/time'
import type { PollWithDetails } from '../lib/types'
import { Comments } from './Comments'
import { PollResults } from './PollResults'
import { VoteForm } from './VoteForm'
import { CommentIcon, IconButton } from './ui/IconButton'

interface PollSectionProps {
  poll: PollWithDetails
  showComments?: boolean
}

export function PollSection({ poll, showComments = true }: PollSectionProps) {
  const isActive = poll.status === 'active'
  const castVote = useCastVote(poll.slug)
  const addComment = useAddComment(poll.id)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const { data: comments = [] } = usePollComments(
    showComments && poll.allow_comments && commentsOpen ? poll.id : undefined,
  )

  const hasVoted = votedOptionId !== null

  function handleVote(optionId: string) {
    setSubmittingOptionId(optionId)
    castVote.mutate(optionId, {
      onSuccess: () => setVotedOptionId(optionId),
      onSettled: () => setSubmittingOptionId(null),
    })
  }

  return (
    <article id={poll.slug} className="poll-block scroll-mt-6 p-5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs text-ink-muted">{formatPollTimeframe(poll)}</p>
          <h2 className="text-lg font-semibold leading-snug text-ink sm:text-xl">{poll.title}</h2>
          {poll.description && (
            <p className="mt-2 text-sm text-ink-secondary">{poll.description}</p>
          )}
        </div>
        {showComments && poll.allow_comments && (
          <IconButton
            label="Comments"
            onClick={() => setCommentsOpen((open) => !open)}
            className={commentsOpen ? 'bg-surface-muted text-ink' : ''}
          >
            <CommentIcon />
          </IconButton>
        )}
      </header>

      {isActive && !hasVoted && (
        <section className="mb-4">
          <VoteForm
            options={poll.options}
            disabled={!isActive}
            submittingOptionId={submittingOptionId}
            votedOptionId={votedOptionId}
            onVote={handleVote}
          />
          {castVote.isError && (
            <p className="mt-2 text-sm text-danger">Could not save vote.</p>
          )}
        </section>
      )}

      <PollResults
        results={poll.results}
        totalVotes={poll.total_votes}
        highlightOptionId={votedOptionId ?? undefined}
      />

      {showComments && poll.allow_comments && commentsOpen && (
        <div className="mt-4 border-t border-line pt-4">
          <Comments
            comments={comments}
            disabled={!isActive}
            isSubmitting={addComment.isPending}
            onSubmit={(authorName, body) => addComment.mutate({ authorName, body })}
          />
          {addComment.isError && (
            <p className="mt-2 text-sm text-danger">Could not post comment.</p>
          )}
        </div>
      )}
    </article>
  )
}
