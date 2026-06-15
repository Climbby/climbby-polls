import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { SetupBanner } from '../SetupBanner'
import { Button } from '../ui/Button'
import { AppTopBar } from './AppTopBar'
import { PollsTitle } from './PollsTitle'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../hooks/useAuth'
import { useCreatorBySlug, useMyCreator } from '../../hooks/useCreator'
import {
  isTenantHomePath,
  useHomeTenantTransition,
  type HomeTenantTransition,
  type PollsContentView,
} from '../../hooks/useHomeTenantTransition'
import { possessivePrefix } from '../../lib/possessive'
import type { Creator } from '../../lib/types'
import { tenantRoutes } from '../../lib/tenants/routes'
import { LandingContent } from '../../pages/LandingContent'
import { TenantPollsContent } from '../../pages/TenantPollsContent'

function slugFromPathname(pathname: string): string {
  if (!isTenantHomePath(pathname)) return ''
  return pathname.split('/').filter(Boolean)[0]?.trim().toLowerCase() ?? ''
}

function tenantRevealClass(
  transition: HomeTenantTransition,
  contentView: PollsContentView,
  role: 'polls' | 'chrome',
) {
  const onTenant = contentView === 'tenant'
  const entering = transition === 'to-tenant' && onTenant
  const exiting = transition === 'to-home' && (role === 'polls' ? onTenant : true)
  const shown = onTenant && transition === 'idle'

  return [
    'polls-tenant-reveal',
    entering ? 'polls-tenant-reveal--enter' : '',
    exiting ? 'polls-tenant-reveal--exit' : '',
    shown && !entering ? 'polls-tenant-reveal--shown' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function PollsShell() {
  const location = useLocation()
  const { phase: transition, contentView, tenantSlug, revealGeneration, viewOwnPageEnter, pendingViewOwnReturn } =
    useHomeTenantTransition()
  const { user } = useAuth()
  const { data: myCreator } = useMyCreator()
  const isHome = location.pathname === '/'
  const activeTenantSlug = (tenantSlug ?? slugFromPathname(location.pathname)).trim().toLowerCase()
  const isEnteringTenant = transition === 'to-tenant' && contentView === 'tenant'

  const { data: creator } = useCreatorBySlug(
    contentView === 'tenant' && activeTenantSlug ? activeTenantSlug : undefined,
  )
  const [showCreateDraft, setShowCreateDraft] = useState(false)

  const ownsActivePage = Boolean(
    user && myCreator && activeTenantSlug && myCreator.slug === activeTenantSlug,
  )
  const enteringOwnPage = Boolean(
    isEnteringTenant &&
      user &&
      activeTenantSlug &&
      (!myCreator || myCreator.slug === activeTenantSlug),
  )
  const isOwner = Boolean(
    ownsActivePage &&
      (contentView === 'tenant' || transition === 'to-home') &&
      (!creator || myCreator!.id === creator.id),
  )
  const routes = activeTenantSlug ? tenantRoutes(activeTenantSlug) : null
  const titleIsTenant = contentView === 'tenant'

  const titlePrefix = useMemo(() => {
    if (contentView !== 'tenant') return ''
    if (creator) return possessivePrefix(creator.display_name)
    if (myCreator && myCreator.slug === activeTenantSlug) {
      return possessivePrefix(myCreator.display_name)
    }
    return ''
  }, [contentView, creator, myCreator, activeTenantSlug])

  const documentTitle = useMemo(() => {
    if (contentView === 'home') return 'Polls'
    if (titlePrefix) return `${titlePrefix}Polls`
    return 'Polls'
  }, [contentView, titlePrefix])

  useDocumentTitle(documentTitle)

  useEffect(() => {
    if (contentView !== 'tenant') setShowCreateDraft(false)
  }, [contentView])

  const showViewOwnPage =
    transition === 'to-tenant' ||
    viewOwnPageEnter ||
    (isHome && transition === 'idle' && !pendingViewOwnReturn)
  const showOwnerChrome = Boolean(
    user &&
      activeTenantSlug &&
      (contentView === 'tenant' || transition === 'to-home') &&
      (ownsActivePage || enteringOwnPage),
  )

  const pollsRevealClass = tenantRevealClass(transition, contentView, 'polls')
  const chromeRevealClass = tenantRevealClass(transition, contentView, 'chrome')
  const revealKey = `tenant-reveal-${revealGeneration}`

  const homeContentClass = [
    'polls-page-content',
    'polls-page-content--home',
    transition === 'to-home' && contentView === 'home' ? 'polls-page-content--enter-home' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="min-h-svh bg-canvas text-ink"
      data-page={contentView}
      data-transition={transition}
    >
      <AppTopBar
        transition={transition}
        showViewOwnPage={showViewOwnPage}
        viewOwnPageEnter={viewOwnPageEnter}
      />

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-8 pt-16 sm:px-6 md:max-w-3xl md:space-y-8 md:pb-12 md:pt-20 lg:max-w-4xl lg:px-8 lg:pb-14 lg:pt-24">
        <SetupBanner />

        <header className="flex flex-wrap items-start justify-between gap-4">
          <PollsTitle
            transition={transition}
            isTenant={titleIsTenant}
            titlePrefix={titlePrefix}
            showPlus={showOwnerChrome}
            showCreateDraft={showCreateDraft}
            revealKey={revealKey}
            onToggleCreateDraft={
              showOwnerChrome ? () => setShowCreateDraft((open) => !open) : undefined
            }
          />
          {showOwnerChrome && routes && (
            <Link
              key={revealKey}
              to={routes.manage}
              className={chromeRevealClass}
            >
              <Button variant="ghost" className="!px-3 !py-1.5 !text-xs">
                Manage
              </Button>
            </Link>
          )}
        </header>

        {contentView === 'home' ? (
          <div className={homeContentClass}>
            <LandingContent />
          </div>
        ) : activeTenantSlug ? (
          <div key={revealKey} className={pollsRevealClass}>
            <TenantPollsContent
              slug={activeTenantSlug}
              hash={location.hash}
              showCreateDraft={showCreateDraft}
              setShowCreateDraft={setShowCreateDraft}
              creator={creator}
              isOwner={isOwner}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}

export interface PollsShellOutletContext {
  showCreateDraft: boolean
  setShowCreateDraft: (value: boolean | ((open: boolean) => boolean)) => void
  creator: Creator | null | undefined
  isOwner: boolean
}
