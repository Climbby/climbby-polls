import { useAuth } from '../hooks/useAuth'
import { AuthorNameInput } from './AuthorNameInput'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  const { user, signOut } = useAuth()

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end px-4 py-3 md:px-6 md:py-4">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-2.5">
        <AuthorNameInput />
        {user && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="transition-interactive shrink-0 text-xs text-ink-muted hover:text-ink-secondary md:text-sm"
          >
            Sign out
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
