import { Outlet } from 'react-router'
import { ThemeToggle } from './ThemeToggle'

export function Layout() {
  return (
    <div className="min-h-svh bg-canvas text-ink">
      <ThemeToggle />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
