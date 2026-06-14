import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { CreatePollForm } from '../components/admin/CreatePollForm'
import { PollSection } from '../components/PollSection'
import { SetupBanner } from '../components/SetupBanner'
import { Button } from '../components/ui/Button'
import { IconButton, PlusIcon } from '../components/ui/IconButton'
import { useCreatorBySlug, useMyCreator } from '../hooks/useCreator'
import { usePollFeed } from '../hooks/usePollFeed'
import { useAuth } from '../hooks/useAuth'
import { isValidTenantSlug, tenantRoutes } from '../lib/tenants/routes'

export function TenantPollsPage() {
  const { tenantSlug = '' } = useParams()
  const { hash } = useLocation()
  const normalizedSlug = tenantSlug.trim().toLowerCase()

  const {
    data: creator,
    isLoading: creatorLoading,
    error: creatorError,
  } = useCreatorBySlug(normalizedSlug)
  const { user } = useAuth()
  const { data: myCreator } = useMyCreator()

  const { activePolls, closedPolls, isLoading, error } = usePollFeed(creator?.id)
  const [openCommentsPollId, setOpenCommentsPollId] = useState<string | null>(null)
  const [showCreateDraft, setShowCreateDraft] = useState(false)

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

  if (creatorLoading) {
    return (
      <div className="space-y-6">
        <div className="poll-block h-12 animate-pulse" />
        <div className="poll-block h-40 animate-pulse md:h-48" />
      </div>
    )
  }

  if (creatorError || !creator) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">This polls page does not exist yet.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">
          Create your own page
        </Link>
      </div>
    )
  }

  const routes = tenantRoutes(creator.slug)
  const isOwner = Boolean(user && myCreator && myCreator.id === creator.id)
  const titlePrefix = creator.display_name.endsWith('s')
    ? `${creator.display_name}' `
    : `${creator.display_name}'s `

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {titlePrefix}
            <Link
              to="/"
              className="underline decoration-accent/80 decoration-2 underline-offset-[0.2em] transition-interactive hover:decoration-accent hover:text-accent"
            >
              Polls
            </Link>
          </h1>
          {isOwner && (
            <IconButton
              label={showCreateDraft ? 'Cancel new poll' : 'Create poll'}
              onClick={() => setShowCreateDraft((open) => !open)}
              className={showCreateDraft ? 'bg-surface-muted text-ink' : ''}
            >
              <PlusIcon />
            </IconButton>
          )}
        </div>
        {isOwner && (
          <Link to={routes.manage}>
            <Button variant="ghost" className="!px-3 !py-1.5 !text-xs">
              Manage
            </Button>
          </Link>
        )}
      </header>

      <SetupBanner />

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
          creatorSlug={creator.slug}
          commentsOpen={openCommentsPollId === poll.id}
          onToggleComments={() => toggleComments(poll.id)}
        />
      ))}

      {closedPolls.map((poll) => (
        <PollSection
          key={poll.id}
          poll={poll}
          creatorSlug={creator.slug}
          commentsOpen={openCommentsPollId === poll.id}
          onToggleComments={() => toggleComments(poll.id)}
        />
      ))}
    </div>
  )
}
