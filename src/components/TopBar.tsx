import { useAuth } from '../hooks/useAuth'
import { isEmailUser } from '../lib/auth/helpers'
import { AuthorNameInput } from './AuthorNameInput'
import { SignedInMenu } from './auth/SignedInMenu'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  const { user } = useAuth()
  const signedIn = isEmailUser(user)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end px-4 py-3 md:px-6 md:py-4">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-2.5">
        {signedIn ? <SignedInMenu /> : <AuthorNameInput />}
        <ThemeToggle />
      </div>
    </header>
  )
}
