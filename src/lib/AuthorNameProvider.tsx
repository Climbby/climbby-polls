import { useState, type ReactNode } from 'react'
import { AuthorNameContext, getStoredAuthorName, setStoredAuthorName } from './author-name-context'

export function AuthorNameProvider({ children }: { children: ReactNode }) {
  const [authorName, setAuthorNameState] = useState(getStoredAuthorName)

  function setAuthorName(name: string) {
    setStoredAuthorName(name)
    setAuthorNameState(name)
  }

  return (
    <AuthorNameContext.Provider value={{ authorName, setAuthorName }}>
      {children}
    </AuthorNameContext.Provider>
  )
}
