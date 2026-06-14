import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { authCallbackUrl, setAuthRedirect } from './helpers'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, redirectPath = '/') {
    if (!supabase) throw new Error('Supabase is not configured')

    setAuthRedirect(redirectPath)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authCallbackUrl(),
        shouldCreateUser: true,
      },
    })

    if (error) throw error
  }

  async function linkEmail(email: string, redirectPath = '/') {
    if (!supabase) throw new Error('Supabase is not configured')

    setAuthRedirect(redirectPath)

    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
    })

    if (error) throw error
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signInWithEmail,
        linkEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
