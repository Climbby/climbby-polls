import { Link, useParams } from 'react-router'
import { Comments } from '../components/Comments'
import { PollResults } from '../components/PollResults'
import { SetupBanner } from '../components/SetupBanner'
import { VoteForm } from '../components/VoteForm'
import { useAddComment, useCastVote, usePoll, usePollComments } from '../hooks/usePoll'

export function PollPage() {
  const { slug = '' } = useParams()
  const { data: poll, isLoading, error } = usePoll(slug)
  const { data: comments = [] } = usePollComments(poll?.id)
  const castVote = useCastVote(slug)
  const addComment = useAddComment(poll?.id)

  if (isLoading) {
    return <p className="text-slate-500">Loading poll…</p>
  }

  if (error || !poll) {
    return (
      <div className="rounded-xl border border-slate-800 px-4 py-12 text-center">
        <p className="text-slate-400">Poll not found.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">
          Back to polls
        </Link>
      </div>
    )
  }

  const isActive = poll.status === 'active'
  const category = poll.poll_categories

  return (
    <div>
      <SetupBanner />

      <Link to="/" className="mb-6 inline-block text-sm text-slate-500 hover:text-indigo-300">
        ← All polls
      </Link>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {category && (
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
              {category.name}
            </span>
          )}
          <span
            className={[
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400',
            ].join(' ')}
          >
            {isActive ? 'Live' : 'Closed'}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{poll.title}</h1>
        {poll.description && <p className="mt-3 text-slate-400">{poll.description}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isActive ? 'Cast your vote' : 'Final results'}
          </h2>
          {isActive ? (
            <VoteForm
              options={poll.options}
              disabled={!isActive}
              isSubmitting={castVote.isPending}
              onVote={(optionId) => castVote.mutate(optionId)}
            />
          ) : (
            <PollResults results={poll.results} totalVotes={poll.total_votes} />
          )}
          {castVote.isError && (
            <p className="mt-3 text-sm text-red-400">Could not submit vote. Try again.</p>
          )}
          {castVote.isSuccess && (
            <p className="mt-3 text-sm text-emerald-400">Vote recorded — watch the results update live.</p>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Live results
          </h2>
          <PollResults results={poll.results} totalVotes={poll.total_votes} />
        </section>
      </div>

      {poll.allow_comments && (
        <section className="mt-10 border-t border-slate-800 pt-8">
          <Comments
            comments={comments}
            disabled={!isActive}
            isSubmitting={addComment.isPending}
            onSubmit={(authorName, body) => addComment.mutate({ authorName, body })}
          />
          {addComment.isError && (
            <p className="mt-2 text-sm text-red-400">Could not post comment.</p>
          )}
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Share this poll</p>
        <code className="mt-2 block break-all text-sm text-indigo-300">
          {window.location.origin}/polls/{poll.slug}
        </code>
      </section>
    </div>
  )
}
