import { Link } from 'react-router'
import { IconButton, PlusIcon } from '../ui/IconButton'
import type { HomeTenantTransition } from '../../hooks/useHomeTenantTransition'

interface PollsTitleProps {
  transition: HomeTenantTransition
  isTenant: boolean
  titlePrefix?: string
  showPlus?: boolean
  showCreateDraft?: boolean
  revealKey?: string
  onToggleCreateDraft?: () => void
}

export function PollsTitle({
  transition,
  isTenant,
  titlePrefix = '',
  showPlus = false,
  showCreateDraft = false,
  revealKey = 'tenant-reveal-0',
  onToggleCreateDraft,
}: PollsTitleProps) {
  const showPrefix = isTenant || transition === 'to-home'
  const prefixWrapClass = [
    'polls-title-prefix-wrap',
    transition === 'to-tenant' ? 'polls-title-prefix-wrap--enter' : '',
    transition === 'to-home' ? 'polls-title-prefix-wrap--exit' : '',
    isTenant && transition === 'idle' ? 'polls-title-prefix-wrap--shown' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const plusClass = [
    'polls-title-plus',
    transition === 'to-tenant' ? 'polls-tenant-reveal--enter' : '',
    transition === 'to-home' ? 'polls-tenant-reveal--exit' : '',
    isTenant && transition === 'idle' ? 'polls-tenant-reveal--shown' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      <h1 className="flex min-w-0 items-baseline text-2xl font-semibold tracking-tight text-ink md:text-3xl">
        {showPrefix && titlePrefix && (
          <span className={prefixWrapClass}>
            <span className="polls-title-prefix-inner">{titlePrefix}</span>
          </span>
        )}
        {isTenant ? (
          <Link
            to="/"
            className="polls-title-word relative z-10 shrink-0 underline decoration-accent/80 decoration-2 underline-offset-[0.2em] transition-interactive hover:decoration-accent hover:text-accent"
          >
            Polls
          </Link>
        ) : (
          <span className="polls-title-word shrink-0 underline decoration-accent/80 decoration-2 underline-offset-[0.2em] text-ink">
            Polls
          </span>
        )}
      </h1>
      {showPlus && (
        <div key={revealKey} className={plusClass}>
          {onToggleCreateDraft ? (
            <IconButton
              label={showCreateDraft ? 'Cancel new poll' : 'Create poll'}
              onClick={onToggleCreateDraft}
              className={showCreateDraft ? 'bg-surface-muted text-ink' : ''}
            >
              <PlusIcon />
            </IconButton>
          ) : (
            <span
              className="inline-flex h-9 w-9 shrink-0 md:h-10 md:w-10"
              aria-hidden
            />
          )}
        </div>
      )}
    </div>
  )
}
