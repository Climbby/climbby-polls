const STORAGE_KEY = 'climbby-polls:voter-token'
const ADMIN_KEY = 'climbby-polls:admin-secret'
const OWN_COMMENTS_KEY = 'climbby-polls:own-comment-ids'

export function getVoterToken(): string {
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, token)
  }
  return token
}

function getOwnCommentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(OWN_COMMENTS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function markOwnComment(commentId: string) {
  const ids = getOwnCommentIds()
  ids.add(commentId)
  localStorage.setItem(OWN_COMMENTS_KEY, JSON.stringify([...ids]))
}

export function isOwnComment(comment: { id: string; voter_token?: string | null }): boolean {
  const token = comment.voter_token
  if (token && token === getVoterToken()) return true
  return getOwnCommentIds().has(comment.id)
}

export function isAdminUnlocked(): boolean {
  return Boolean(getAdminSecret())
}

export function getAdminSecret(): string | null {
  return sessionStorage.getItem(ADMIN_KEY)
}

export function unlockAdmin(secret: string, expected: string): boolean {
  if (!expected || secret !== expected) return false
  sessionStorage.setItem(ADMIN_KEY, secret)
  return true
}

export function lockAdmin(): void {
  sessionStorage.removeItem(ADMIN_KEY)
}
