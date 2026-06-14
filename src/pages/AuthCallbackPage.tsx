import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { useAuth } from '../hooks/useAuth'
import { consumeAuthRedirect } from '../lib/auth/helpers'
import { supabase } from '../lib/supabase'

function waitForAuthSession(client: NonNullable<typeof supabase>, timeoutMs = 8000): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false

    const finish = (session: Session | null) => {
      if (settled) return
      settled = true
      subscription.subscription.unsubscribe()
      clearTimeout(timer)
      resolve(session)
    }

    const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish(session)
      }
    })

    void client.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(session)
    })

    const timer = setTimeout(() => finish(null), timeoutMs)
  })
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false

    async function completeSignIn() {
      const client = supabase
      if (!client) return

      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message)
          return
        }
      }

      const resolvedSession = await waitForAuthSession(client)
      if (cancelled) return

      if (resolvedSession) {
        navigate(consumeAuthRedirect('/'), { replace: true })
        return
      }

      setError('Sign-in link expired or already used. Request a new link and try again.')
    }

    void completeSignIn()

    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!session || window.location.pathname !== '/auth/callback') return
    navigate(consumeAuthRedirect('/'), { replace: true })
  }, [session, navigate])

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas px-4">
        <div className="poll-block max-w-md p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-accent">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <p className="text-sm text-ink-secondary">Signing you in…</p>
    </div>
  )
}
