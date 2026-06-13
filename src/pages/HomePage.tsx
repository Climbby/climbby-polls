import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { PollSection } from '../components/PollSection'
import { SetupBanner } from '../components/SetupBanner'
import { usePollFeed } from '../hooks/usePollFeed'

export function HomePage() {
  const { hash } = useLocation()
  const { activePolls, closedPolls, isLoading, error } = usePollFeed()

  useEffect(() => {
    if (!hash || isLoading) return
    const id = hash.replace('#', '')
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [hash, isLoading, activePolls.length, closedPolls.length])

  return (
    <div className="space-y-6">
      <SetupBanner />

      {isLoading &&
        Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="poll-block h-40 animate-pulse" />
        ))}

      {error && <p className="text-sm text-danger">Could not load polls.</p>}

      {!isLoading && !error && activePolls.length === 0 && closedPolls.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-muted">No polls yet.</p>
      )}

      {activePolls.map((poll) => (
        <PollSection key={poll.id} poll={poll} />
      ))}

      {closedPolls.map((poll) => (
        <PollSection key={poll.id} poll={poll} showComments={false} />
      ))}
    </div>
  )
}
