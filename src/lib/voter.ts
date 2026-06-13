const STORAGE_KEY = 'climbby-polls:voter-token'

export function getVoterToken(): string {
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, token)
  }
  return token
}

export function isAdminUnlocked(): boolean {
  return sessionStorage.getItem('climbby-polls:admin') === '1'
}

export function unlockAdmin(secret: string, expected: string): boolean {
  if (!expected || secret !== expected) return false
  sessionStorage.setItem('climbby-polls:admin', '1')
  return true
}

export function lockAdmin(): void {
  sessionStorage.removeItem('climbby-polls:admin')
}
