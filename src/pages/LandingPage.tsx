import { Link } from 'react-router'
import { SignInMenu } from '../components/auth/SignInMenu'
import { ClaimPageForm } from '../components/ClaimPageForm'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../hooks/useAuth'
import { useMyCreator } from '../hooks/useCreator'
import { isEmailUser } from '../lib/auth/helpers'
import { tenantRoutes } from '../lib/tenants/routes'

export function LandingPage() {
  const { user, signOut } = useAuth()
  const { data: existingCreator } = useMyCreator()
  const signedIn = isEmailUser(user)

  return (
    <div className="min-h-svh bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end px-4 py-3 md:px-6 md:py-4">
        <div className="pointer-events-auto flex items-center gap-2 md:gap-2.5">
          {signedIn && user ? (
            <>
              <span className="max-w-[12rem] truncate text-xs text-ink-muted sm:max-w-none md:text-sm">
                Signed in as <span className="font-medium text-ink">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="transition-interactive shrink-0 text-xs text-ink-muted hover:text-ink-secondary md:text-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <SignInMenu redirectPath="/" />
          )}
          <ThemeToggle />
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-8 pt-16 sm:px-6 md:max-w-3xl md:space-y-8 md:pb-12 md:pt-20 lg:max-w-4xl lg:px-8 lg:pb-14 lg:pt-24">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight underline decoration-accent/80 decoration-2 underline-offset-[0.2em] text-ink md:text-3xl">
            Polls
          </h1>
        </header>

        <div className="poll-block p-6 md:p-8">
          {existingCreator ? (
            <p className="text-center text-sm text-ink-secondary md:text-base">
              <Link
                to={tenantRoutes(existingCreator.slug).home}
                className="font-medium text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent"
              >
                View own page — /{existingCreator.slug}
              </Link>
            </p>
          ) : (
            <ClaimPageForm />
          )}
        </div>
      </main>
    </div>
  )
}
