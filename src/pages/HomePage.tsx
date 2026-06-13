import { useState } from 'react'
import { PollCard } from '../components/PollCard'
import { SetupBanner } from '../components/SetupBanner'
import { useCategories, usePolls } from '../hooks/usePolls'

export function HomePage() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>()
  const { data: categories = [] } = useCategories()
  const { data: polls = [], isLoading, error } = usePolls({ status: 'active', categorySlug })

  return (
    <div>
      <SetupBanner />

      <section className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-indigo-400">
          Climbby Polls
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          What should we decide together?
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Vote on live polls, watch results update in real time, and share the link anywhere —
          streams, Discord, socials.
        </p>
      </section>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategorySlug(undefined)}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition',
              !categorySlug
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white',
            ].join(' ')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategorySlug(cat.slug)}
              className={[
                'rounded-full px-3 py-1 text-sm font-medium transition',
                categorySlug === cat.slug
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-slate-500">Loading polls…</p>}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Could not load polls. Check your Supabase connection.
        </p>
      )}

      {!isLoading && !error && polls.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center text-slate-500">
          No active polls right now. Check back soon or create one in Admin.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
    </div>
  )
}
