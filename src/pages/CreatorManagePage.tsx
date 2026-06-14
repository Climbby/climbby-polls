import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { CreatePollForm } from '../components/admin/CreatePollForm'
import { PollManageList } from '../components/admin/PollManageList'
import { EmailSignInForm } from '../components/auth/EmailSignInForm'
import { LinkEmailBanner } from '../components/auth/LinkEmailBanner'
import { CreatorDashboardStats } from '../components/creator/CreatorDashboardStats'
import { SetupBanner } from '../components/SetupBanner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useMyCreator } from '../hooks/useCreator'
import { isValidTenantSlug, tenantRoutes } from '../lib/tenants/routes'

type ManageTab = 'create' | 'manage'

export function CreatorManagePage() {
  const { tenantSlug = '' } = useParams()
  const normalizedSlug = tenantSlug.trim().toLowerCase()
  const { user, isLoading: authLoading } = useAuth()
  const { data: creator, isLoading: creatorLoading, error } = useMyCreator()
  const [tab, setTab] = useState<ManageTab>('create')
  const [createdMessage, setCreatedMessage] = useState<string | null>(null)

  if (!isValidTenantSlug(normalizedSlug)) {
    return <Navigate to="/" replace />
  }

  const managePath = tenantRoutes(normalizedSlug).manage

  if (authLoading || creatorLoading) {
    return (
      <div className="space-y-4">
        <div className="poll-block h-10 animate-pulse" />
        <div className="poll-block h-32 animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-ink">Manage your page</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Sign in with email to create and manage polls on this page.
        </p>
        <EmailSignInForm redirectPath={managePath} className="mt-4" />
      </Card>
    )
  }

  if (error) {
    return <p className="text-sm text-danger">Could not load your page.</p>
  }

  if (!creator) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-ink">No page yet</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          No polls page is linked to {user.email}. Create one or sign in with a different email.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">
          Create your page
        </Link>
      </Card>
    )
  }

  if (creator.slug !== normalizedSlug) {
    return <Navigate to={tenantRoutes(creator.slug).manage} replace />
  }

  const routes = tenantRoutes(creator.slug)
  const showLinkEmail = Boolean(user.is_anonymous)

  return (
    <div>
      <SetupBanner />

      {showLinkEmail && <LinkEmailBanner redirectPath={managePath} />}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Manage</h1>
          <p className="text-sm text-ink-secondary">
            {creator.display_name} ·{' '}
            <Link to={routes.home} className="text-accent">
              /{creator.slug}
            </Link>
          </p>
          <p className="mt-1 text-xs text-ink-muted">{user.email}</p>
        </div>
        <Link to={routes.home}>
          <Button variant="ghost">View page</Button>
        </Link>
      </div>

      <div className="mb-6">
        <CreatorDashboardStats dashboard={creator} />
      </div>

      <div className="mb-6 flex gap-1 border-b border-line">
        {(['create', 'manage'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              'border-b-2 px-3 py-2 text-sm font-medium transition',
              tab === value
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-muted hover:text-ink-secondary',
            ].join(' ')}
          >
            {value === 'create' ? 'Create' : 'Manage'}
          </button>
        ))}
      </div>

      {createdMessage && <p className="mb-4 text-sm text-success">{createdMessage}</p>}

      {tab === 'create' ? (
        <CreatePollForm
          variant="creator"
          onCreated={() => {
            setCreatedMessage('Poll created — it is live on your page.')
            setTab('manage')
          }}
        />
      ) : (
        <PollManageList variant="creator" tenantSlug={creator.slug} />
      )}
    </div>
  )
}
