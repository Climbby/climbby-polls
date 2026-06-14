import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAddComment, useCastVote, usePollComments, useUserVote } from '../hooks/usePoll'
import { useMyCreator } from '../hooks/useCreator'
import { usePollResults } from '../hooks/usePollResults'
import { useUnseenCommentCount } from '../hooks/useUnseenComments'
import { markCommentsSeen } from '../lib/comment-seen'
import { formatPollStarted } from '../lib/time'
import type { ResultTimeframe } from '../lib/poll-results'
import type { PollWithDetails } from '../lib/types'
import { Comments } from './Comments'
import { PollOptions } from './PollOptions'
import { TimeframePills } from './TimeframePills'
import { CommentIcon, IconButton } from './ui/IconButton'

interface PollSectionProps {
  poll: PollWithDetails
  creatorSlug: string
  showComments?: boolean
  commentsOpen?: boolean
  onToggleComments?: () => void
}

export function PollSection({
  poll,
  creatorSlug,
  showComments = true,
  commentsOpen: commentsOpenProp,
  onToggleComments,
}: PollSectionProps) {
  const queryClient = useQueryClient()
  const isActive = poll.status === 'active'
  const { data: myCreator } = useMyCreator()
  const isCreatorAuthor = Boolean(myCreator && myCreator.id === poll.creator_id)
  const castVote = useCastVote(creatorSlug, poll.slug, poll.id)
  const addComment = useAddComment(poll.id)
  const { data: savedVoteOptionId } = useUserVote(poll.id)
  const [internalCommentsOpen, setInternalCommentsOpen] = useState(false)
  const [timeframe, setTimeframe] = useState<ResultTimeframe>('alltime')

  const isCommentsControlled = onToggleComments !== undefined
  const commentsOpen = isCommentsControlled ? Boolean(commentsOpenProp) : internalCommentsOpen

  const trackUnseen = isCreatorAuthor && poll.allow_comments && !commentsOpen
  const { data: unseenCount = 0 } = useUnseenCommentCount(poll.id, trackUnseen)

  useEffect(() => {
    if (!commentsOpen || !isCreatorAuthor || !poll.allow_comments) return

    markCommentsSeen(poll.id)
    void queryClient.invalidateQueries({ queryKey: ['unseen-comments', poll.id] })
  }, [commentsOpen, isCreatorAuthor, poll.allow_comments, poll.id, queryClient])

  function handleToggleComments() {
    if (isCommentsControlled) {
      onToggleComments()
      return
    }
    setInternalCommentsOpen((open) => !open)
  }

  const votedOptionId = savedVoteOptionId ?? null

  const { data: filtered } = usePollResults(
    poll.id,
    poll.options,
    poll.results,
    timeframe,
  )

  const { data: comments = [] } = usePollComments(
    showComments && poll.allow_comments && commentsOpen ? poll.id : undefined,
  )

  const results = filtered?.results ?? poll.results
  const totalVotes = filtered?.totalVotes ?? poll.total_votes
  const hasVoted = votedOptionId !== null
  const showResults = hasVoted || !isActive
  const allowVoteChange = isActive && hasVoted
  const submittingOptionId = castVote.isPending ? (castVote.variables ?? null) : null

  function handleVote(optionId: string) {
    if (optionId === votedOptionId) return
    castVote.mutate(optionId)
  }

  return (
    <article id={poll.slug} className="poll-block scroll-mt-6 p-4 sm:p-5 md:p-6 lg:p-7">
      <header className="mb-3 flex items-start justify-between gap-3 md:mb-4 md:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-ink sm:text-lg md:text-xl md:leading-tight">
            {poll.title}
          </h2>
          <p className="mt-1 text-xs text-ink-muted md:text-sm">
            Started {formatPollStarted(poll.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <TimeframePills value={timeframe} onChange={setTimeframe} />
          {showComments && poll.allow_comments && (
            <IconButton
              label="Comments"
              badge={isCreatorAuthor ? unseenCount : undefined}
              onClick={handleToggleComments}
              className={[
                'transition-interactive shrink-0',
                commentsOpen ? 'bg-surface-muted text-ink' : '',
              ].join(' ')}
            >
              <CommentIcon />
            </IconButton>
          )}
        </div>
      </header>

      <PollOptions
        options={poll.options}
        results={results}
        totalVotes={totalVotes}
        showResults={showResults}
        allowVoteChange={allowVoteChange}
        disabled={!isActive}
        submittingOptionId={submittingOptionId}
        highlightOptionId={votedOptionId ?? undefined}
        onVote={isActive ? handleVote : undefined}
      />

      {isActive && castVote.isError && (
        <p className="mt-2 text-sm text-danger">{(castVote.error as Error).message || 'Could not save vote.'}</p>
      )}

      {showComments && poll.allow_comments && commentsOpen && (
        <div className="mt-4 border-t border-line pt-4 md:mt-5 md:pt-5">
          <Comments
            comments={comments}
            options={poll.options}
            disabled={!isActive}
            isSubmitting={addComment.isPending}
            votedOptionId={votedOptionId}
            isCreatorAuthor={isCreatorAuthor}
            onSubmit={(authorName, body, optionId, isCreator) =>
              addComment.mutate({ authorName, body, optionId, isCreator })
            }
          />
          {addComment.isError && (
            <p className="mt-2 text-sm text-danger">Could not post comment.</p>
          )}
        </div>
      )}
    </article>
  )
}
