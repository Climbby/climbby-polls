import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from './ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useClaimCreatorPage, useSlugAvailability } from '../hooks/useCreator'
import { useAuthorName } from '../lib/author-name-context'
import {
  clearPendingClaim,
  isEmailUser,
  readPendingClaim,
  savePendingClaim,
} from '../lib/auth/helpers'
import { slugify } from '../lib/slug'
import { isValidTenantSlug, tenantRoutes } from '../lib/tenants/routes'

export function ClaimPageForm() {
  const navigate = useNavigate()
  const { authorName, setAuthorName } = useAuthorName()
  const { user } = useAuth()
  const claimCreator = useClaimCreatorPage()
  const completingClaim = useRef(false)

  const [name, setName] = useState(authorName)
  const [pageSlug, setPageSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  const signedIn = isEmailUser(user)

  const normalizedSlug = pageSlug.trim().toLowerCase()
  const slugValid = isValidTenantSlug(normalizedSlug)
  const { data: slugAvailable, isFetching: checkingSlug } = useSlugAvailability(
    slugValid ? normalizedSlug : '',
  )

  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      setPageSlug(slugify(value))
    }
  }

  const slugMessage = useMemo(() => {
    if (!normalizedSlug) return null
    if (!slugValid) return 'Use 2–64 lowercase letters, numbers, or hyphens.'
    if (checkingSlug) return 'Checking availability…'
    if (slugAvailable === false) return 'That page URL is taken.'
    if (slugAvailable === true) return 'Available.'
    return null
  }, [normalizedSlug, slugValid, checkingSlug, slugAvailable])

  const formValid =
    name.trim().length >= 2 && slugValid && slugAvailable === true && !claimCreator.isPending

  async function runClaim(displayName: string, slug: string) {
    setAuthorName(displayName)
    await claimCreator.mutateAsync({ slug, displayName })
    clearPendingClaim()
    navigate(tenantRoutes(slug).manage)
  }

  useEffect(() => {
    if (!signedIn || completingClaim.current) return

    const pending = readPendingClaim()
    if (!pending) return

    completingClaim.current = true

    void runClaim(pending.displayName, pending.slug).catch((error) => {
      completingClaim.current = false
      setSubmitError((error as Error).message || 'Could not create your page.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when email session arrives
  }, [user, signedIn])

  useEffect(() => {
    if (signedIn) setNeedsSignIn(false)
  }, [signedIn])

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid) return

    setSubmitError(null)
    const trimmedName = name.trim()

    if (!signedIn) {
      savePendingClaim({ displayName: trimmedName, slug: normalizedSlug })
      setNeedsSignIn(true)
      return
    }

    try {
      await runClaim(trimmedName, normalizedSlug)
    } catch (error) {
      setSubmitError((error as Error).message || 'Could not create your page.')
    }
  }

  return (
    <form onSubmit={(e) => void handleClaim(e)} className="space-y-4">
      <div>
        <label htmlFor="claim-name" className="field-label">
          Your name
        </label>
        <input
          id="claim-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="How should we call you?"
          maxLength={40}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="claim-slug" className="field-label">
          Page URL
        </label>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span>/</span>
          <input
            id="claim-slug"
            type="text"
            value={pageSlug}
            onChange={(e) => {
              setSlugEdited(true)
              setPageSlug(slugify(e.target.value))
            }}
            placeholder="your-name"
            maxLength={64}
            className="field-input flex-1"
          />
        </div>
        {slugMessage && (
          <p
            className={[
              'mt-1 text-xs',
              slugAvailable === true ? 'text-success' : 'text-ink-muted',
            ].join(' ')}
          >
            {slugMessage}
          </p>
        )}
      </div>

      {needsSignIn && !signedIn && (
        <p className="text-sm text-ink-secondary">
          Sign in with the button above to finish creating your page.
        </p>
      )}

      {(submitError || claimCreator.isError) && (
        <p className="text-sm text-danger">
          {submitError || (claimCreator.error as Error).message}
        </p>
      )}

      <Button type="submit" fullWidth disabled={!formValid || claimCreator.isPending}>
        {claimCreator.isPending ? 'Creating…' : 'Create your page — €0.99'}
      </Button>
    </form>
  )
}
