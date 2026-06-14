import type { User } from '@supabase/supabase-js'

const AUTH_REDIRECT_KEY = 'climbby-polls:auth-redirect'
const PENDING_CLAIM_KEY = 'climbby-polls:pending-claim'

export interface PendingClaim {
  displayName: string
  slug: string
}

export function authCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`
}

export function setAuthRedirect(path: string) {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path)
}

export function consumeAuthRedirect(fallback = '/'): string {
  const path = sessionStorage.getItem(AUTH_REDIRECT_KEY) || fallback
  sessionStorage.removeItem(AUTH_REDIRECT_KEY)
  return path
}

export function savePendingClaim(claim: PendingClaim) {
  sessionStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify(claim))
}

export function readPendingClaim(): PendingClaim | null {
  const raw = sessionStorage.getItem(PENDING_CLAIM_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingClaim
    if (!parsed.displayName || !parsed.slug) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingClaim() {
  sessionStorage.removeItem(PENDING_CLAIM_KEY)
}

export function isEmailUser(user: User | null | undefined): boolean {
  return Boolean(user?.email && !user.is_anonymous)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
