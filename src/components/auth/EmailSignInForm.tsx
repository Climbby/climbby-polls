import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { isValidEmail } from '../../lib/auth/helpers'
import { formatAuthError, getOtpCooldownRemaining, markOtpSent } from '../../lib/auth/errors'

interface EmailSignInFormProps {
  redirectPath?: string
  submitLabel?: string
  sentMessage?: string
  mode?: 'sign-in' | 'link'
  className?: string
}

export function EmailSignInForm({
  redirectPath = '/',
  submitLabel,
  sentMessage,
  mode = 'sign-in',
  className = '',
}: EmailSignInFormProps) {
  const { signInWithEmail, linkEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const label =
    submitLabel ??
    (mode === 'link' ? 'Send confirmation link' : 'Send sign-in link')

  useEffect(() => {
    if (!isValidEmail(email)) {
      setCooldownSeconds(0)
      return
    }

    function tick() {
      setCooldownSeconds(getOtpCooldownRemaining(email))
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email) || isSubmitting || cooldownSeconds > 0) return

    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'link') {
        await linkEmail(email, redirectPath)
      } else {
        await signInWithEmail(email, redirectPath)
      }
      markOtpSent(email)
      setSent(true)
      setCooldownSeconds(getOtpCooldownRemaining(email))
    } catch (err) {
      setError(formatAuthError((err as Error).message || 'Could not send email.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className={className}>
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-secondary">
          {sentMessage ??
            `Check ${email.trim()} for a link. It expires in a few minutes.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={['space-y-3', className].join(' ')}>
      <div>
        <label htmlFor="auth-email" className="field-label">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field-input"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" fullWidth disabled={!isValidEmail(email) || isSubmitting || cooldownSeconds > 0}>
        {isSubmitting
          ? 'Sending…'
          : cooldownSeconds > 0
            ? `Wait ${cooldownSeconds}s`
            : label}
      </Button>
    </form>
  )
}
