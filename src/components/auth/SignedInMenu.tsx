import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useMyCreator } from '../../hooks/useCreator'
import { isEmailUser } from '../../lib/auth/helpers'
import { useAuthorName } from '../../lib/author-name-context'

export function resolveSignedInLabel(
  authorName: string,
  creatorDisplayName?: string,
  email?: string | null,
): string {
  if (creatorDisplayName?.trim()) return creatorDisplayName.trim()
  if (authorName.trim()) return authorName.trim()
  if (email) return email.split('@')[0] ?? 'Account'
  return 'Account'
}

export function SignedInMenu() {
  const { user, signOut } = useAuth()
  const { authorName, setAuthorName } = useAuthorName()
  const { data: creator } = useMyCreator()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const label = resolveSignedInLabel(authorName, creator?.display_name, user?.email)

  useEffect(() => {
    if (!isEmailUser(user) || !user?.email) return

    const nextName = resolveSignedInLabel('', creator?.display_name, user.email)
    if (nextName !== 'Account' && nextName !== authorName) {
      setAuthorName(nextName)
    }
  }, [user, creator?.display_name, authorName, setAuthorName])

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

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'transition-interactive max-w-[10rem] truncate rounded-md border px-2 py-1 text-xs font-medium sm:max-w-[12rem] md:max-w-none md:text-sm',
          open
            ? 'border-[color-mix(in_srgb,var(--accent)_30%,var(--line))] bg-surface-muted text-ink'
            : 'border-line bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink',
        ].join(' ')}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1.5 min-w-max rounded-md border border-line bg-surface py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="transition-interactive whitespace-nowrap px-3 py-1.5 text-left text-xs text-danger hover:bg-surface-muted md:text-sm"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
