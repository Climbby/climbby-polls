import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { isValidTenantSlug } from '../lib/tenants/routes'

export type HomeTenantTransition = 'idle' | 'to-tenant' | 'to-home'
export type PollsContentView = 'home' | 'tenant'

/** Matches --polls-page-content-exit-ms in index.css */
const CONTENT_EXIT_MS = 600
/** Matches --polls-page-content-enter-delay-home in index.css */
const HOME_ENTER_DELAY_MS = 280
/** Matches --polls-page-content-enter-ms in index.css */
const HOME_ENTER_MS = 960
/** Matches --polls-page-title-ms (prefix exit on to-home) */
const TITLE_EXIT_MS = 1400
/** Gap after exit animations before View Own Page appears */
const VIEW_OWN_PAGE_SHOW_GAP_MS = 50
/** When tenant + header exits finish — don't wait for home content enter */
const VIEW_OWN_PAGE_SHOW_MS = TITLE_EXIT_MS + VIEW_OWN_PAGE_SHOW_GAP_MS
/** Home content enter completes (phase idle) */
const TO_HOME_ANIMATIONS_END_MS = CONTENT_EXIT_MS + HOME_ENTER_DELAY_MS + HOME_ENTER_MS
/** title (120+1400) + gap (60) + content enter (960) */
const TRANSITION_TO_TENANT_MS = 2600

export const HOME_TENANT_CONTENT_EXIT_MS = CONTENT_EXIT_MS

export function isTenantHomePath(pathname: string): boolean {
  const slug = pathname.split('/').filter(Boolean)[0]
  if (!slug) return false
  return pathname === `/${slug}` && isValidTenantSlug(slug)
}

function tenantSlugFromPath(pathname: string): string | null {
  if (!isTenantHomePath(pathname)) return null
  return pathname.split('/').filter(Boolean)[0] ?? null
}

function contentViewForPath(pathname: string): PollsContentView {
  return isTenantHomePath(pathname) ? 'tenant' : 'home'
}

export interface HomeTenantTransitionState {
  phase: HomeTenantTransition
  contentView: PollsContentView
  tenantSlug: string | null
  revealGeneration: number
  viewOwnPageEnter: boolean
  pendingViewOwnReturn: boolean
}

export function useHomeTenantTransition(): HomeTenantTransitionState {
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)
  const [phase, setPhase] = useState<HomeTenantTransition>('idle')
  const [contentView, setContentView] = useState<PollsContentView>(() =>
    contentViewForPath(location.pathname),
  )
  const [tenantSlug, setTenantSlug] = useState<string | null>(() =>
    tenantSlugFromPath(location.pathname),
  )
  const [revealGeneration, setRevealGeneration] = useState(0)
  const [viewOwnPageEnter, setViewOwnPageEnter] = useState(false)
  const [pendingViewOwnReturn, setPendingViewOwnReturn] = useState(false)

  useEffect(() => {
    const from = previousPathRef.current
    const to = location.pathname
    previousPathRef.current = to

    let timer: number | undefined
    let viewOwnTimer: number | undefined
    let idleTimer: number | undefined

    if (from === '/' && isTenantHomePath(to)) {
      setPhase('to-tenant')
      setContentView('tenant')
      setTenantSlug(tenantSlugFromPath(to))
      setRevealGeneration((generation) => generation + 1)
      setViewOwnPageEnter(false)
      setPendingViewOwnReturn(false)
      timer = window.setTimeout(() => setPhase('idle'), TRANSITION_TO_TENANT_MS)
    } else if (isTenantHomePath(from) && to === '/') {
      setPhase('to-home')
      setContentView('tenant')
      setTenantSlug(tenantSlugFromPath(from))
      setViewOwnPageEnter(false)
      setPendingViewOwnReturn(true)
      const switchTimer = window.setTimeout(() => {
        setContentView('home')
        setTenantSlug(null)
      }, CONTENT_EXIT_MS)
      idleTimer = window.setTimeout(() => setPhase('idle'), TO_HOME_ANIMATIONS_END_MS)
      viewOwnTimer = window.setTimeout(() => {
        setViewOwnPageEnter(true)
        setPendingViewOwnReturn(false)
      }, VIEW_OWN_PAGE_SHOW_MS)
      return () => {
        window.clearTimeout(switchTimer)
        if (idleTimer !== undefined) window.clearTimeout(idleTimer)
        if (viewOwnTimer !== undefined) window.clearTimeout(viewOwnTimer)
      }
    } else {
      setPhase('idle')
      setContentView(contentViewForPath(to))
      setTenantSlug(tenantSlugFromPath(to))
      setViewOwnPageEnter(false)
      setPendingViewOwnReturn(false)
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [location.pathname])

  return { phase, contentView, tenantSlug, revealGeneration, viewOwnPageEnter, pendingViewOwnReturn }
}
