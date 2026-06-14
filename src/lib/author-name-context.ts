import { createContext, useContext } from 'react'

const STORAGE_KEY = 'climbby-polls:author-name'

export function getStoredAuthorName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function setStoredAuthorName(name: string): void {
  if (name) localStorage.setItem(STORAGE_KEY, name)
  else localStorage.removeItem(STORAGE_KEY)
}

export interface AuthorNameContextValue {
  authorName: string
  setAuthorName: (name: string) => void
}

export const AuthorNameContext = createContext<AuthorNameContextValue | null>(null)

export function useAuthorName(): AuthorNameContextValue {
  const value = useContext(AuthorNameContext)
  if (!value) throw new Error('useAuthorName must be used within AuthorNameProvider')
  return value
}
