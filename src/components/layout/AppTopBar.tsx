import { Link } from 'react-router'
import { SignInMenu } from '../auth/SignInMenu'
import { SignedInMenu } from '../auth/SignedInMenu'
import { ThemeToggle } from '../ThemeToggle'
import { useAuth } from '../../hooks/useAuth'
import { useMyCreator } from '../../hooks/useCreator'
import type { HomeTenantTransition } from '../../hooks/useHomeTenantTransition'
import { isEmailUser } from '../../lib/auth/helpers'
import { tenantRoutes } from '../../lib/tenants/routes'

interface AppTopBarProps {
  transition: HomeTenantTransition
  showViewOwnPage: boolean
  viewOwnPageEnter?: boolean
}

export function AppTopBar({
  transition,
  showViewOwnPage,
  viewOwnPageEnter = false,
}: AppTopBarProps) {
  const { user } = useAuth()
  const { data: existingCreator } = useMyCreator()
  const signedIn = isEmailUser(user)

  const viewOwnPageVisible = Boolean(existingCreator && showViewOwnPage)
  const viewOwnPageClass = [
    'view-own-page-link',
    transition === 'to-tenant' ? 'view-own-page-link--exit' : '',
    viewOwnPageEnter ? 'view-own-page-link--enter' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end px-4 py-3 md:px-6 md:py-4">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
        {viewOwnPageVisible && (
          <Link
            to={tenantRoutes(existingCreator!.slug).home}
            className={[
              viewOwnPageClass,
              'transition-interactive shrink-0 whitespace-nowrap text-[11px] font-normal text-ink-muted',
              'underline decoration-1 underline-offset-[0.15em]',
              'decoration-[color-mix(in_srgb,var(--accent)_45%,transparent)]',
              'hover:text-accent hover:decoration-[var(--accent)]',
              'sm:text-xs md:text-sm',
            ].join(' ')}
          >
            View Own Page
          </Link>
        )}
        <div
          className={[
            'flex items-center gap-2 md:gap-2.5',
            viewOwnPageVisible ? 'border-l border-line pl-3 md:pl-3.5' : '',
          ].join(' ')}
        >
          {signedIn && user ? <SignedInMenu /> : <SignInMenu redirectPath="/" />}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
