import { Link } from 'react-router'
import { PollCard } from '../components/PollCard'
import { SetupBanner } from '../components/SetupBanner'
import { usePolls } from '../hooks/usePolls'

export function ArchivePage() {
  const { data: polls = [], isLoading, error } = usePolls({ status: 'closed' })

  return (
    <div>
      <SetupBanner />

      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Archive</h1>
        <p className="mt-2 text-slate-400">Finished polls and their final results.</p>
      </section>

      {isLoading && <p className="text-slate-500">Loading archive…</p>}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Could not load archive.
        </p>
      )}

      {!isLoading && !error && polls.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center">
          <p className="text-slate-500">No closed polls yet.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-indigo-400 hover:text-indigo-300">
            View active polls
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
    </div>
  )
}
