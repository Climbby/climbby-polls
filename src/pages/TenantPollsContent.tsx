import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { CreatePollForm } from '../components/admin/CreatePollForm'
import { PollSection } from '../components/PollSection'
import { useCreatorBySlug } from '../hooks/useCreator'
import { usePollFeed } from '../hooks/usePollFeed'
import type { Creator } from '../lib/types'
import { isValidTenantSlug } from '../lib/tenants/routes'

interface TenantPollsContentProps {
  slug: string
  hash?: string
  showCreateDraft: boolean
  setShowCreateDraft: (value: boolean | ((open: boolean) => boolean)) => void
  creator?: Creator | null
  isOwner: boolean
}

export function TenantPollsContent({
  slug,
  hash = '',
  showCreateDraft,
  setShowCreateDraft,
  creator,
  isOwner,
}: TenantPollsContentProps) {
  const normalizedSlug = slug.trim().toLowerCase()

  const {
    data: loadedCreator,
    isLoading: creatorLoading,
    error: creatorError,
  } = useCreatorBySlug(normalizedSlug)

  const resolvedCreator = creator ?? loadedCreator
  const { activePolls, closedPolls, isLoading, error } = usePollFeed(resolvedCreator?.id)
  const [openCommentsPollId, setOpenCommentsPollId] = useState<string | null>(null)

  function toggleComments(pollId: string) {
    setOpenCommentsPollId((current) => (current === pollId ? null : pollId))
  }

  useEffect(() => {
    if (!hash || isLoading || creatorLoading) return
    const id = hash.replace('#', '')
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [hash, isLoading, creatorLoading, activePolls.length, closedPolls.length])

  useEffect(() => {
    if (!showCreateDraft) return
    requestAnimationFrame(() => {
      document.getElementById('create-poll-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [showCreateDraft])

  if (!isValidTenantSlug(normalizedSlug)) {
    return <Navigate to="/" replace />
  }

  if (creatorLoading && !resolvedCreator) {
    return (
      <div className="space-y-6">
        <div className="poll-block h-40 animate-pulse md:h-48" />
      </div>
    )
  }

  if (creatorError || !resolvedCreator) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-ink-muted">This polls page does not exist yet.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">
          Create your own page
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {showCreateDraft && isOwner && (
        <CreatePollForm
          variant="creator"
          presentation="inline"
          onCancel={() => setShowCreateDraft(false)}
          onCreated={() => setShowCreateDraft(false)}
        />
      )}

      {isLoading &&
        Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="poll-block h-40 animate-pulse md:h-48" />
        ))}

      {error && <p className="text-sm text-danger">Could not load polls.</p>}

      {!isLoading &&
        !error &&
        !showCreateDraft &&
        activePolls.length === 0 &&
        closedPolls.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">No polls yet.</p>
        )}

      {!isLoading && !error && showCreateDraft && activePolls.length === 0 && closedPolls.length === 0 && (
        <p className="text-center text-sm text-ink-muted">Your first poll will appear below once published.</p>
      )}

      {activePolls.map((poll) => (
        <PollSection
          key={poll.id}
          poll={poll}
          creatorSlug={resolvedCreator.slug}
          commentsOpen={openCommentsPollId === poll.id}
          onToggleComments={() => toggleComments(poll.id)}
        />
      ))}

      {closedPolls.map((poll) => (
        <PollSection
          key={poll.id}
          poll={poll}
          creatorSlug={resolvedCreator.slug}
          commentsOpen={openCommentsPollId === poll.id}
          onToggleComments={() => toggleComments(poll.id)}
        />
      ))}
    </div>
  )
}
