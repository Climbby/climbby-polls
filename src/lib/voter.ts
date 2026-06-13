const STORAGE_KEY = 'climbby-polls:voter-token'
const ADMIN_KEY = 'climbby-polls:admin-secret'

export function getVoterToken(): string {
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, token)
  }
  return token
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
