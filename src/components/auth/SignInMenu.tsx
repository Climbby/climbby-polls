import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { formatAuthError, getOtpCooldownRemaining, markOtpSent } from '../../lib/auth/errors'
import { isValidEmail } from '../../lib/auth/helpers'

interface SignInMenuProps {
  redirectPath?: string
}

export function SignInMenu({ redirectPath = '/' }: SignInMenuProps) {
  const { signInWithEmail } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !isValidEmail(email)) {
      setCooldownSeconds(0)
      return
    }

    function tick() {
      setCooldownSeconds(getOtpCooldownRemaining(email))
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [open, email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email) || isSubmitting || cooldownSeconds > 0) return

    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmail(email, redirectPath)
      markOtpSent(email)
      setSent(true)
      setCooldownSeconds(getOtpCooldownRemaining(email))
    } catch (err) {
      setError(formatAuthError((err as Error).message || 'Could not send email.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="transition-interactive text-xs text-ink-secondary hover:text-ink md:text-sm"
      >
        Sign in
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-line bg-surface p-4 shadow-lg">
          {sent ? (
            <div className="space-y-2 text-sm text-ink-secondary">
              <p>
                Check <span className="font-medium text-ink">{email.trim()}</span> for your sign-in
                link.
              </p>
              <p className="text-xs text-ink-muted">Check spam if it doesn&apos;t arrive in a minute.</p>
              {cooldownSeconds > 0 ? (
                <p className="text-xs text-ink-muted">You can request another in {cooldownSeconds}s.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs font-medium text-accent hover:text-accent-strong"
                >
                  Send again
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label htmlFor="sign-in-email" className="field-label">
                  Email
                </label>
                <input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="field-input"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button
                type="submit"
                fullWidth
                disabled={!isValidEmail(email) || isSubmitting || cooldownSeconds > 0}
              >
                {isSubmitting
                  ? 'Sending…'
                  : cooldownSeconds > 0
                    ? `Wait ${cooldownSeconds}s`
                    : 'Send sign-in link'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
